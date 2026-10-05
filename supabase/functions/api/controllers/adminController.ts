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
import { eq, ne, and, isNull, sql, desc } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

const PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
];

function normalizeCategoryName(cat: string | null | undefined): string {
  if (!cat) return "Other";
  const lower = cat.toLowerCase().trim();
  if (lower === "cat_1" || lower.includes("crim")) return "Criminal Defense";
  if (lower === "cat_2" || lower.includes("corp")) return "Corporate Law";
  if (lower === "cat_3" || lower.includes("fam") || lower.includes("matrimon")) return "Family Law";
  if (lower === "cat_4" || lower.includes("bank") || lower.includes("finan")) return "Banking & Finance";
  if (lower === "cat_5" || lower.includes("cons")) return "Consumer Law";
  if (lower === "cat_6" || lower.includes("high") || lower.includes("hcrt")) return "Higher Courts";
  if (lower === "cat_7" || lower.includes("intl") || lower.includes("internat")) return "International Law";
  if (lower === "cat_8" || lower.includes("lab") || lower === "civil") return "Labour & Civil Matters";
  if (lower === "cat_9" || lower.includes("prop")) return "Property Law";
  if (lower === "cat_10" || lower.includes("cyb")) return "Cyber";
  if (lower === "cat_11" || lower.includes("tax")) return "Tax";
  if (lower === "cat_12" || lower.includes("env")) return "Environmental";
  return cat;
}

function normalizeStatusName(s: string | null | undefined): string {
  if (!s) return "Submitted";
  const lower = s.toLowerCase().trim();
  if (lower === "submitted" || lower === "new") return "Submitted";
  if (lower === "accepted" || lower === "assigned") return "Assigned";
  if (lower === "filinginprogress" || lower === "in progress" || lower === "inprogress") return "In Progress";
  if (lower === "cnrgenerated" || lower === "under review" || lower === "under_review") return "Under Review";
  if (lower === "awaiting documents" || lower === "pending_docs") return "Awaiting Documents";
  if (lower === "resolved" || lower === "closed" || lower === "disposed") return "Resolved";
  return s;
}

const statusColors: Record<string, string> = {
  "Submitted": "#3b82f6",
  "Assigned": "#6366f1",
  "Under Review": "#8b5cf6",
  "In Progress": "#f59e0b",
  "Awaiting Documents": "#ef4444",
  "Resolved": "#10b981",
};

export async function getDashboardStats(c: Context) {
  const [totalCitizens] = await db.select({ count: sql<number>`count(*)::int` }).from(citizens);
  const [totalLawyers] = await db.select({ count: sql<number>`count(*)::int` }).from(lawyers);
  const [approvedLawyers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lawyers)
    .where(eq(lawyers.status, "Approved"));
  const [pendingLawyers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lawyers)
    .where(eq(lawyers.status, "Pending"));
  const [suspendedLawyers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lawyers)
    .where(eq(lawyers.status, "Suspended"));
  const [rejectedLawyers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lawyers)
    .where(eq(lawyers.status, "Rejected"));

  const [totalCases] = await db.select({ count: sql<number>`count(*)::int` }).from(casesUser);
  const [activeCases] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(casesUser)
    .where(and(ne(casesUser.caseStatus, "rejected"), ne(casesUser.caseStatus, "closed"), ne(casesUser.caseStatus, "resolved")));

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

  // Date range filters for Daily Registrations
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultFrom = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const fromParam = c.req.query("from") || defaultFrom;
  const toParam = c.req.query("to") || todayStr;

  const cRegRows = await db.execute(sql`
    SELECT coalesce(nullif(joined_at, ''), to_char(created_at, 'YYYY-MM-DD')) as reg_date, count(*)::int as count 
    FROM citizens 
    WHERE coalesce(nullif(joined_at, ''), to_char(created_at, 'YYYY-MM-DD')) >= ${fromParam}
      AND coalesce(nullif(joined_at, ''), to_char(created_at, 'YYYY-MM-DD')) <= ${toParam}
    GROUP BY 1
  `);

  const lRegRows = await db.execute(sql`
    SELECT coalesce(nullif(joined_at, ''), to_char(created_at, 'YYYY-MM-DD')) as reg_date, count(*)::int as count 
    FROM lawyers 
    WHERE coalesce(nullif(joined_at, ''), to_char(created_at, 'YYYY-MM-DD')) >= ${fromParam}
      AND coalesce(nullif(joined_at, ''), to_char(created_at, 'YYYY-MM-DD')) <= ${toParam}
    GROUP BY 1
  `);

  const cMap = new Map<string, number>();
  for (const r of cRegRows as any[]) cMap.set(r.reg_date, Number(r.count));
  const lMap = new Map<string, number>();
  for (const r of lRegRows as any[]) lMap.set(r.reg_date, Number(r.count));

  const dailyRegistrations: Array<{
    date: string;
    label: string;
    citizens: number;
    lawyers: number;
  }> = [];

  const [sY, sM, sD] = fromParam.split("-").map(Number);
  const [eY, eM, eD] = toParam.split("-").map(Number);
  const startDate = new Date(Date.UTC(sY, sM - 1, sD));
  const endDate = new Date(Date.UTC(eY, eM - 1, eD));

  for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    dailyRegistrations.push({
      date: iso,
      label,
      citizens: cMap.get(iso) || 0,
      lawyers: lMap.get(iso) || 0,
    });
  }

  // Unassigned Emergency Cases awaiting advocate assignment
  const emergencyCases = await db
    .select({
      id: casesUser.id,
      title: casesUser.petitioner,
      citizenName: sql<string>`coalesce(${citizens.name}, ${casesUser.petitioner}, 'Citizen')`,
      createdAt: casesUser.createdAt,
    })
    .from(casesUser)
    .leftJoin(citizens, eq(casesUser.citizenId, citizens.id))
    .where(
      and(
        eq(casesUser.isEmergency, true),
        isNull(casesUser.lawyerId),
        ne(casesUser.caseStatus, "rejected"),
        ne(casesUser.caseStatus, "closed"),
        ne(casesUser.caseStatus, "resolved"),
      ),
    )
    .orderBy(desc(casesUser.createdAt))
    .limit(10);

  // Pending Lawyer Approvals
  const pendingLawyerList = await db
    .select({
      id: lawyers.id,
      name: lawyers.name,
      category: lawyers.category,
      joinedAt: lawyers.joinedAt,
    })
    .from(lawyers)
    .where(eq(lawyers.status, "Pending"))
    .orderBy(desc(lawyers.createdAt))
    .limit(10);

  // Category and Lawyer Domain Distribution
  const allCasePractices = await db.select({ practiceArea: casesUser.practiceArea }).from(casesUser);
  const allLawyerCategories = await db.select({ category: lawyers.category }).from(lawyers);

  const categoryCaseMap = new Map<string, number>();
  for (const c of allCasePractices) {
    const k = normalizeCategoryName(c.practiceArea);
    categoryCaseMap.set(k, (categoryCaseMap.get(k) || 0) + 1);
  }

  const categoryLawyerMap = new Map<string, number>();
  for (const l of allLawyerCategories) {
    const k = normalizeCategoryName(l.category);
    categoryLawyerMap.set(k, (categoryLawyerMap.get(k) || 0) + 1);
  }

  const allCategoryNames = Array.from(
    new Set([...categoryCaseMap.keys(), ...categoryLawyerMap.keys()]),
  );

  const totalCasesCount = totalCases?.count || 0;

  const categoryStats = allCategoryNames
    .map((name, i) => {
      const count = categoryCaseMap.get(name) || 0;
      const lawyerCount = categoryLawyerMap.get(name) || 0;
      const percentage = totalCasesCount > 0 ? Math.round((count / totalCasesCount) * 100) : 0;
      return {
        category: name,
        count,
        lawyerCount,
        percentage,
        color: PALETTE[i % PALETTE.length],
      };
    })
    .sort((a, b) => b.count - a.count);

  // Case Pipeline Status Breakdown
  const allCaseStatuses = await db.select({ status: casesUser.caseStatus }).from(casesUser);
  const statusCounts = new Map<string, number>();
  for (const c of allCaseStatuses) {
    const k = normalizeStatusName(c.status);
    statusCounts.set(k, (statusCounts.get(k) || 0) + 1);
  }

  const pipelineStatuses = [
    "Submitted",
    "Assigned",
    "Under Review",
    "In Progress",
    "Awaiting Documents",
    "Resolved",
  ];

  const statusStats = pipelineStatuses.map((st) => {
    const count = statusCounts.get(st) || 0;
    const percentage = totalCasesCount > 0 ? Math.round((count / totalCasesCount) * 100) : 0;
    return {
      status: st,
      count,
      percentage,
      color: statusColors[st] || "#6366f1",
    };
  });

  return ApiResponse.success(
    c,
    {
      citizens: { total: totalCitizens?.count || 0 },
      lawyers: {
        total: totalLawyers?.count || 0,
        approved: approvedLawyers?.count || 0,
        pendingApproval: pendingLawyers?.count || 0,
        suspended: suspendedLawyers?.count || 0,
        rejected: rejectedLawyers?.count || 0,
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
      dailyRegistrations,
      unassignedEmergencyCases: emergencyCases,
      pendingLawyers: pendingLawyerList.map((l) => ({
        ...l,
        category: normalizeCategoryName(l.category),
      })),
      categoryStats,
      statusStats,
      lawyerStatusBreakdown: {
        approved: approvedLawyers?.count || 0,
        pending: pendingLawyers?.count || 0,
        suspended: suspendedLawyers?.count || 0,
        rejected: rejectedLawyers?.count || 0,
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
