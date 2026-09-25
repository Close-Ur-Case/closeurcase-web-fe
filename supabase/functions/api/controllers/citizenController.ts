import type { Context } from "hono";
import { db } from "../config/db.ts";
import { citizens } from "../models/users.ts";
import { subscriptions } from "../models/subscriptions.ts";
import { eq, desc, or, ilike } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getCitizens(c: Context) {
  const search = c.req.query("search")?.trim();
  let query = db.select().from(citizens);

  if (search) {
    const pattern = `%${search}%`;
    query = query.where(
      or(
        ilike(citizens.name, pattern),
        ilike(citizens.email, pattern),
        ilike(citizens.phone, pattern),
        ilike(citizens.city, pattern)
      )
    ) as any;
  }

  const result = await query.orderBy(desc(citizens.joinedAt));
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

async function findCitizenForUser(
  user: any,
  fallback?: { email?: string; phone?: string; id?: string }
): Promise<any | null> {
  const userId = user?.id || fallback?.id;
  const email = user?.email || fallback?.email;
  const phone = user?.phone || fallback?.phone;
  const citizenId = user?.citizenId || fallback?.id;

  // 1. Direct match on citizens.userId or citizens.id
  if (userId) {
    const [found] = await db
      .select()
      .from(citizens)
      .where(or(eq(citizens.userId, userId), eq(citizens.id, userId)));
    if (found) return found;
  }

  // 2. Match on citizenId if present
  if (citizenId && citizenId !== userId) {
    const [found] = await db
      .select()
      .from(citizens)
      .where(eq(citizens.id, citizenId));
    if (found) return found;
  }

  // 3. Match on email
  if (email && typeof email === "string" && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const [found] = await db
      .select()
      .from(citizens)
      .where(ilike(citizens.email, cleanEmail));
    if (found) return found;
  }

  // 4. Match on last 10 digits of phone
  if (phone && typeof phone === "string") {
    const cleanDigits = phone.replace(/\D/g, "").slice(-10);
    if (cleanDigits.length >= 10) {
      const all = await db.select().from(citizens);
      const found = all.find(
        (c) => c.phone && c.phone.replace(/\D/g, "").slice(-10) === cleanDigits
      );
      if (found) return found;
    }
  }

  return null;
}

export async function getMe(c: Context) {
  const user = c.get("user");
  const queryEmail = c.req.query("email");
  const queryPhone = c.req.query("phone");
  const queryId = c.req.query("id");

  let citizen = await findCitizenForUser(user, {
    email: queryEmail,
    phone: queryPhone,
    id: queryId,
  });

  if (!citizen) {
    // Fallback to first active citizen ordered by joinedAt desc
    const [first] = await db.select().from(citizens).orderBy(desc(citizens.joinedAt)).limit(1);
    citizen = first;
  }

  if (!citizen) throw ApiError.notFound("Citizen profile not found");
  return ApiResponse.success(c, citizen, "Citizen profile retrieved");
}

export async function updateMe(c: Context) {
  const user = c.get("user");
  const patch = await c.req.json();

  let citizen = await findCitizenForUser(user, {
    email: patch.email,
    phone: patch.phone,
    id: patch.citizenId,
  });

  if (!citizen) {
    const [first] = await db.select().from(citizens).orderBy(desc(citizens.joinedAt)).limit(1);
    citizen = first;
  }

  if (!citizen) throw ApiError.notFound("Citizen profile not found");
  const citizenId = citizen.id;

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (patch.name !== undefined || patch.fullName !== undefined) {
    updateData.name = patch.name || patch.fullName;
  }
  if (patch.city !== undefined) updateData.city = patch.city;
  if (patch.currentLocation !== undefined) updateData.currentLocation = patch.currentLocation;
  if (patch.phone !== undefined) updateData.phone = patch.phone;
  if (patch.email !== undefined) updateData.email = patch.email;
  if (patch.avatarUrl !== undefined) updateData.avatarUrl = patch.avatarUrl;
  if (patch.state !== undefined) updateData.state = patch.state;
  if (patch.address !== undefined) updateData.address = patch.address;

  if (!citizen.userId && user?.id) {
    updateData.userId = user.id;
  }

  const [updated] = await db
    .update(citizens)
    .set(updateData)
    .where(eq(citizens.id, citizenId))
    .returning();

  return ApiResponse.success(c, updated, "Profile updated successfully");
}

