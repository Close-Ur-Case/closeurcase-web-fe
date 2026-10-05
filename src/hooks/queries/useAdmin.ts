/**
 * React Query hooks for Super Admin Platform Analytics & Control
 */

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import type { AdminDashboardStats } from "@/types/api";

export function useAdminDashboardStatsQuery(params?: { from?: string; to?: string }) {
  return useQuery<AdminDashboardStats>({
    queryKey: ["admin-dashboard-stats", params?.from, params?.to],
    queryFn: () => adminService.getDashboardStats(params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
