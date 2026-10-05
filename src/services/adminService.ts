/**
 * Admin Service Layer
 * Connects to /api/v1/admin endpoints for platform analytics, metrics, and admin operations.
 */

import { apiClient } from "./apiClient";
import type { AdminDashboardStats, AdminProfileRecord, UpdateAdminMePayload } from "@/types/api";
export const adminService = {
  /**
   * Fetch aggregate platform statistics, analytics, and financial metrics directly from DB API
   */
  async getDashboardStats(params?: { from?: string; to?: string }): Promise<AdminDashboardStats> {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiClient.get<AdminDashboardStats>(`/admin/dashboard-stats${qs}`);
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
