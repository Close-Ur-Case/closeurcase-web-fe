import type { Context } from "hono";
import { db } from "../config/db.ts";
import { subscriptions, subscriptionPlans } from "../models/subscriptions.ts";
import { eq, desc } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getSubscriptionPlans(c: Context) {
  const plans = await db.select().from(subscriptionPlans);
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

  if (!citizenId || !planId || !amount) {
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
