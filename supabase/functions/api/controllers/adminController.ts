import type { Context } from "hono";
import { db } from "../config/db.ts";
import {
  citizens,
  lawyers,
  casesUser,
  payments,
  withdrawalRequests,
  adminProfiles,
} from "../models/index.ts";
import { eq, ne, sql } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getDashboardStats(c: Context) {
  const [totalCitizens] = await db.select({ count: sql<number>`count(*)::int` }).from(citizens);
  const [totalLawyers] = await db.select({ count: sql<number>`count(*)::int` }).from(lawyers);
  const [pendingLawyers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lawyers)
    .where(eq(lawyers.status, "Pending"));
  const [totalCases] = await db.select({ count: sql<number>`count(*)::int` }).from(casesUser);
  const [activeCases] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(casesUser)
    .where(ne(casesUser.caseStatus, "rejected"));

  const [revenueResult] = await db
    .select({
      totalGross: sql<number>`coalesce(sum(gross_amount), 0)::int`,
      totalPlatform: sql<number>`coalesce(sum(platform_amount), 0)::int`,
    })
    .from(payments);

  const [pendingWithdrawals] = await db
    .select({
      count: sql<number>`count(*)::int`,
      amount: sql<number>`coalesce(sum(amount), 0)::int`,
    })
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.status, "Pending"));

  return ApiResponse.success(
    c,
    {
      citizens: { total: totalCitizens?.count || 0 },
      lawyers: {
        total: totalLawyers?.count || 0,
        pendingApproval: pendingLawyers?.count || 0,
      },
      cases: {
        total: totalCases?.count || 0,
        active: activeCases?.count || 0,
      },
      revenue: {
        totalVolume: revenueResult?.totalGross || 0,
        platformCommission: revenueResult?.totalPlatform || 0,
      },
      withdrawals: {
        pendingCount: pendingWithdrawals?.count || 0,
        pendingAmount: pendingWithdrawals?.amount || 0,
      },
    },
    "Dashboard statistics retrieved successfully",
  );
}

/**
 * Get the signed-in admin's own profile.
 *
 * Unlike citizens (auto-provisioned on first OTP verify) and lawyers
 * (created at registration), nothing creates an `admin_profiles` row when an
 * admin first signs in — `loginAdmin` just falls back to a plain object when
 * none exists. So a missing row here is the normal state for an admin who has
 * never saved their profile, not an error.
 *
 * This must NOT reuse citizen/lawyer `getMe`'s "fall back to the first row"
 * convention: `admin_profiles` holds one privileged superadmin identity, not
 * a directory of peer accounts. An earlier version of this endpoint did fall
 * back that way, which meant ANY authenticated user — a citizen or lawyer
 * token, any role — who had no admin_profiles row of their own got back the
 * platform's real admin identity (name, email, phone) instead of an empty
 * default. Verified live: a lawyer's token returned "Platform Super Admin" /
 * admin@closeurcase.app. The role check below, and falling back to the
 * caller's own email (mirroring `loginAdmin`'s fallback shape) rather than
 * someone else's saved row, are both required to close that.
 */
export async function getAdminMe(c: Context) {
  const user = c.get("user");
  if (!user || user.role !== "admin") {
    throw ApiError.forbidden("Admin session required");
  }

  const [profile] = await db.select().from(adminProfiles).where(eq(adminProfiles.userId, user.id));

  if (!profile) {
    return ApiResponse.success(
      c,
      { name: "Platform Ops", email: user.email || "", phone: "", city: "" },
      "No saved admin profile yet",
    );
  }

  return ApiResponse.success(c, profile, "Admin profile retrieved");
}

/**
 * Update (or create, on first save) the signed-in admin's own profile.
 * Same role check as `getAdminMe` — see that function's comment.
 */
export async function updateAdminMe(c: Context) {
  const user = c.get("user");
  if (!user || user.role !== "admin") {
    throw ApiError.forbidden("Admin session required");
  }
  const userId = user.id;

  const patch = await c.req.json();
  const [existing] = await db.select().from(adminProfiles).where(eq(adminProfiles.userId, userId));

  if (existing) {
    const [updated] = await db
      .update(adminProfiles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(adminProfiles.id, existing.id))
      .returning();
    return ApiResponse.success(c, updated, "Admin profile updated successfully");
  }

  const [created] = await db
    .insert(adminProfiles)
    .values({
      id: `a_${Date.now()}`,
      userId,
      name: patch.name || "Platform Ops",
      email: patch.email || user?.email || "",
      phone: patch.phone,
      city: patch.city,
      currentLocation: patch.currentLocation,
      avatarUrl: patch.avatarUrl,
    })
    .returning();
  return ApiResponse.success(c, created, "Admin profile created successfully");
}
