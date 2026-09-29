import type { Context } from "hono";
import { db } from "../config/db.ts";
import { subscriptions, subscriptionPlans } from "../models/subscriptions.ts";
import { citizens } from "../models/users.ts";
import { eq, desc } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getSubscriptionPlans(c: Context) {
  let plans = await db.select().from(subscriptionPlans);
  const hasDaily = plans.some((p) => p.id === "daily");
  if (!hasDaily) {
    try {
      const [newDaily] = await db
        .insert(subscriptionPlans)
        .values({
          id: "daily",
          label: "Daily Pass",
          price: 1,
          cadence: "/day",
          badge: "₹1 / Day",
          audience: "For instant legal advice",
          description: "Affordable daily legal access — just ₹1 per day for priority assistance and case updates.",
          features: [
            "Active 24-hour priority dispatch",
            "Access to verified advocates",
            "Standard case docket tracking",
            "Pay-as-you-go micro plan",
          ],
          active: "true",
        })
        .returning();
      if (newDaily) {
        plans = [newDaily, ...plans];
      }
    } catch (e) {
      console.warn("Could not insert daily plan:", e);
    }
  }
  return ApiResponse.success(c, plans, "Subscription plans retrieved successfully");
}

export async function syncExpiredSubscriptions<
  T extends {
    id: string;
    status: string;
    startedAt?: string | null;
    expiresAt?: string | null;
    planId?: string | null;
  }
>(items: T[]): Promise<T[]> {
  const now = Date.now();
  const updatePromises: Promise<unknown>[] = [];

  const synced = items.map((sub) => {
    if (sub.status !== "Active") return sub;

    let isExpired = false;
    let computedExpiresAt = sub.expiresAt;

    if (sub.expiresAt) {
      const expTime = new Date(sub.expiresAt).getTime();
      if (!isNaN(expTime) && expTime <= now) {
        isExpired = true;
      }
    } else if (sub.startedAt) {
      const startTime = new Date(sub.startedAt).getTime();
      if (!isNaN(startTime)) {
        const plan = (sub.planId || "").toLowerCase();
        let durationMs = 30 * 86400000;
        if (plan === "daily") durationMs = 86400000;
        else if (plan === "monthly") durationMs = 30 * 86400000;
        else if (plan === "yearly") durationMs = 365 * 86400000;

        const expTime = startTime + durationMs;
        computedExpiresAt = new Date(expTime).toISOString();
        if (expTime <= now) {
          isExpired = true;
        }
      }
    }

    if (isExpired) {
      const updatedSub = {
        ...sub,
        status: "Expired",
        expiresAt: computedExpiresAt,
      };
      updatePromises.push(
        db
          .update(subscriptions)
          .set({ status: "Expired", expiresAt: computedExpiresAt })
          .where(eq(subscriptions.id, sub.id))
          .catch((err) => console.warn(`Failed to auto-expire subscription ${sub.id}:`, err)),
      );

      // Auto-set citizen account tier to bronze free tier
      if (sub.citizenId) {
        updatePromises.push(
          db
            .update(citizens)
            .set({ planTier: "bronze", updatedAt: new Date() })
            .where(eq(citizens.id, sub.citizenId))
            .catch((err) => console.warn(`Failed to reset citizen ${sub.citizenId} to bronze:`, err)),
        );
      }

      return updatedSub;
    }

    return sub;
  });

  if (updatePromises.length > 0) {
    await Promise.all(updatePromises);
  }

  return synced;
}

export async function listSubscriptions(c: Context) {
  const citizenId = c.req.query("citizenId");
  let query = db.select().from(subscriptions);
  if (citizenId) {
    query = query.where(eq(subscriptions.citizenId, citizenId)) as any;
  }
  const result = await query.orderBy(desc(subscriptions.startedAt));
  const synced = await syncExpiredSubscriptions(result);
  return ApiResponse.success(c, synced, "Subscriptions retrieved successfully");
}

export async function createSubscription(c: Context) {
  const { citizenId, planId, planLabel, amount, caseId, expiresAt } = await c.req.json();

  if (!citizenId || !planId || amount === undefined || amount === null) {
    throw ApiError.badRequest("citizenId, planId, and amount are required");
  }

  // A citizen can only have one active subscription at a time — expire any prior active
  await db
    .update(subscriptions)
    .set({ status: "Expired" })
    .where(eq(subscriptions.citizenId, citizenId));

  const id = `sub_${Date.now()}`;
  const now = new Date();
  const startIso = now.toISOString();

  let finalExpiresAt = expiresAt;
  if (!finalExpiresAt) {
    const exp = new Date(now);
    if (planId === "daily") exp.setDate(exp.getDate() + 1);
    else if (planId === "monthly") exp.setMonth(exp.getMonth() + 1);
    else if (planId === "yearly") exp.setFullYear(exp.getFullYear() + 1);
    else exp.setDate(exp.getDate() + 30);
    finalExpiresAt = exp.toISOString();
  }

  const [created] = await db
    .insert(subscriptions)
    .values({
      id,
      citizenId,
      planId,
      planLabel: planLabel || planId,
      amount: Number(amount),
      startedAt: startIso,
      expiresAt: finalExpiresAt,
      status: "Active",
      caseId: caseId || null,
    })
    .returning();

  // Update citizen account tier to match the active subscription
  let activeTier = "bronze";
  if (planId === "yearly" || planId === "gold") activeTier = "gold";
  else if (planId === "monthly" || planId === "silver") activeTier = "silver";
  else if (planId === "daily" || planId === "micropass") activeTier = "micropass";

  await db
    .update(citizens)
    .set({ planTier: activeTier, updatedAt: new Date() })
    .where(eq(citizens.id, citizenId))
    .catch((err) => console.warn(`Failed to update citizen ${citizenId} tier:`, err));

  return ApiResponse.created(c, created, "Subscription created successfully");
}

export async function cancelSubscription(c: Context) {
  const id = c.req.param("id")!;
  const [updated] = await db
    .update(subscriptions)
    .set({ status: "Cancelled" })
    .where(eq(subscriptions.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Subscription '${id}' not found`);

  // When cancelled, auto-set citizen account to bronze free tier
  if (updated.citizenId) {
    await db
      .update(citizens)
      .set({ planTier: "bronze", updatedAt: new Date() })
      .where(eq(citizens.id, updated.citizenId))
      .catch((err) => console.warn(`Failed to reset citizen ${updated.citizenId} to bronze:`, err));
  }

  return ApiResponse.success(c, updated, "Subscription cancelled successfully");
}
