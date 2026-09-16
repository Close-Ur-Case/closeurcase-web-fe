import type { Context } from "hono";
import { db } from "../config/db.ts";
import { citizens, lawyers, cases, payments, withdrawalRequests } from "../models/index.ts";
import { eq, sql } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";

export async function getDashboardStats(c: Context) {
  const [totalCitizens] = await db.select({ count: sql<number>`count(*)::int` }).from(citizens);
  const [totalLawyers] = await db.select({ count: sql<number>`count(*)::int` }).from(lawyers);
  const [pendingLawyers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lawyers)
    .where(eq(lawyers.status, "Pending"));
  const [totalCases] = await db.select({ count: sql<number>`count(*)::int` }).from(cases);
  const [activeCases] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cases)
    .where(eq(cases.status, "Active"));

  const [revenueResult] = await db
    .select({
      totalGross: sql<number>`coalesce(sum(gross_amount), 0)::int`,
      totalPlatform: sql<number>`coalesce(sum(platform_amount), 0)::int`,
    })
    .from(payments);

  const [pendingWithdrawals] = await db
    .select({ count: sql<number>`count(*)::int`, amount: sql<number>`coalesce(sum(amount), 0)::int` })
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
        pendingWithdrawalsCount: pendingWithdrawals?.count || 0,
        pendingWithdrawalsAmount: pendingWithdrawals?.amount || 0,
      },
    },
    "Admin dashboard metrics retrieved successfully"
  );
}
