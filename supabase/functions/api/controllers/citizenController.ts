import type { Context } from "hono";
import { db } from "../config/db.ts";
import { citizens } from "../models/users.ts";
import { subscriptions } from "../models/subscriptions.ts";
import { eq, desc } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getCitizens(c: Context) {
  const result = await db.select().from(citizens).orderBy(desc(citizens.joinedAt));
  return ApiResponse.success(c, result, "Citizens retrieved successfully");
}

export async function getCitizenById(c: Context) {
  const id = c.req.param("id")!;
  const [citizen] = await db.select().from(citizens).where(eq(citizens.id, id));

  if (!citizen) throw ApiError.notFound(`Citizen '${id}' not found`);

  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.citizenId, id))
    .orderBy(desc(subscriptions.startedAt));

  return ApiResponse.success(c, { ...citizen, subscriptions: subs }, "Citizen profile retrieved");
}

export async function updateCitizenProfile(c: Context) {
  const id = c.req.param("id")!;

  const patch = await c.req.json();

  const [updated] = await db
    .update(citizens)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(citizens.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Citizen '${id}' not found`);
  return ApiResponse.success(c, updated, "Citizen profile updated successfully");
}

export async function getMySubscriptions(c: Context) {
  const citizenId = c.req.param("citizenId") || c.req.query("citizenId");
  let query = db.select().from(subscriptions);
  if (citizenId) {
    query = query.where(eq(subscriptions.citizenId, citizenId)) as any;
  }
  const result = await query.orderBy(desc(subscriptions.startedAt));
  return ApiResponse.success(c, result, "Subscriptions retrieved successfully");
}

export async function getMe(c: Context) {
  const user = c.get("user");
  const userId = user?.id;

  let citizen = null;
  if (userId) {
    const [found] = await db.select().from(citizens).where(eq(citizens.userId, userId));
    citizen = found;
  }
  if (!citizen) {
    // Fallback to first active citizen for local demo/testing
    const [first] = await db.select().from(citizens).limit(1);
    citizen = first;
  }

  if (!citizen) throw ApiError.notFound("Citizen profile not found");
  return ApiResponse.success(c, citizen, "Citizen profile retrieved");
}

export async function updateMe(c: Context) {
  const user = c.get("user");
  const userId = user?.id;
  const patch = await c.req.json();

  let citizenId = null;
  if (userId) {
    const [found] = await db.select().from(citizens).where(eq(citizens.userId, userId));
    if (found) citizenId = found.id;
  }
  if (!citizenId) {
    const [first] = await db.select().from(citizens).limit(1);
    if (first) citizenId = first.id;
  }

  if (!citizenId) throw ApiError.notFound("Citizen profile not found");

  const [updated] = await db
    .update(citizens)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(citizens.id, citizenId))
    .returning();

  return ApiResponse.success(c, updated, "Profile updated successfully");
}

