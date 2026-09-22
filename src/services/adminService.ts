/**
 * Admin Service Layer
 * Connects to /api/v1/admin endpoints for platform analytics, metrics, and admin operations.
 */

import { apiClient } from "./apiClient";
import type { AdminDashboardStats, AdminProfileRecord, UpdateAdminMePayload } from "@/types/api";
import {
  getCitizens,
  getLawyers,
  getCases,
  getPayments,
  getWithdrawalRequests,
} from "@/data/appStore";

export const adminService = {
  /**
   * Fetch aggregate platform statistics and financial metrics
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const stats = await apiClient.get<AdminDashboardStats>("/admin/dashboard-stats");
      if (stats && typeof stats === "object" && "citizens" in stats) {
        return stats;
      }
      return this.getLocalFallbackStats();
    } catch (err) {
      console.warn("[AdminService] Live dashboard-stats fallback to local store:", err);
      return this.getLocalFallbackStats();
    }
  },

  /**
   * Compute fallback statistics directly from local appStore
   */
  getLocalFallbackStats(): AdminDashboardStats {
    const citizens = getCitizens();
    const lawyers = getLawyers();
    const cases = getCases();
    const payments = getPayments();
    const withdrawals = getWithdrawalRequests();

    // `Payment` carries grossAmount/platformAmount — the old `amount`/`platformFee`
    // names don't exist on the type, so these totals silently came out as zero.
    const totalGross = payments.reduce((acc, p) => acc + (p.grossAmount || 0), 0);
    const totalPlatform = payments.reduce((acc, p) => acc + (p.platformAmount || 0), 0);
    const pendingWithdrawals = withdrawals.filter((w) => w.status === "Pending");
    const pendingAmount = pendingWithdrawals.reduce((acc, w) => acc + (w.amount || 0), 0);

    return {
      citizens: { total: citizens.length },
      lawyers: {
        total: lawyers.length,
        pendingApproval: lawyers.filter((l) => l.status === "Pending").length,
      },
      cases: {
        total: cases.length,
        active: cases.filter((c) => c.status !== "Resolved" && c.status !== "Closed").length,
      },
      revenue: {
        totalVolume: totalGross,
        platformCommission: totalPlatform,
      },
      withdrawals: {
        pendingCount: pendingWithdrawals.length,
        pendingAmount,
      },
    };
  },

  /**
   * Get the signed-in admin's own profile
   */
  async getMe<T = AdminProfileRecord>(): Promise<T> {
    return apiClient.get<T>("/admin/me");
  },

  /**
   * Update (or create, on first save) the signed-in admin's own profile
   */
  async updateMe<T = AdminProfileRecord>(payload: UpdateAdminMePayload): Promise<T> {
    return apiClient.patch<T>("/admin/me", payload);
  },
};
