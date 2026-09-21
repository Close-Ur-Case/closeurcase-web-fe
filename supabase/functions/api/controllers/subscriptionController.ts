import type { Context } from "hono";
import { db } from "../config/db.ts";
import { subscriptions, subscriptionPlans } from "../models/subscriptions.ts";
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

export async function listSubscriptions(c: Context) {
  const citizenId = c.req.query("citizenId");
  let query = db.select().from(subscriptions);
  if (citizenId) {
    query = query.where(eq(subscriptions.citizenId, citizenId)) as any;
  }
  const result = await query.orderBy(desc(subscriptions.startedAt));
  return ApiResponse.success(c, result, "Subscriptions retrieved successfully");
}

export async function createSubscription(c: Context) {
  const { citizenId, planId, planLabel, amount, caseId, expiresAt } = await c.req.json();

  if (!citizenId || !planId || amount === undefined || amount === null) {
    throw ApiError.badRequest("citizenId, planId, and amount are required");
  }

  const id = `sub_${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  const [created] = await db
    .insert(subscriptions)
    .values({
      id,
      citizenId,
      planId,
      planLabel: planLabel || planId,
      amount: Number(amount),
      startedAt: today,
      expiresAt: expiresAt || null,
      status: "Active",
      caseId: caseId || null,
    })
    .returning();

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
  return ApiResponse.success(c, updated, "Subscription cancelled successfully");
}
