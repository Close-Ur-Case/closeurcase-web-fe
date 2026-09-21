/**
 * React Query hooks for Super Admin Platform Analytics & Control
 */

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import type { AdminDashboardStats } from "@/types/api";

export function useAdminDashboardStatsQuery() {
  return useQuery<AdminDashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => adminService.getDashboardStats(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
