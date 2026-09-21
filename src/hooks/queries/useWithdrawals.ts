/**
 * React Query hooks for Withdrawals & Settlements
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { withdrawalService } from "@/services/withdrawalService";
import type { CreateWithdrawalPayload } from "@/types/api";

export function useWithdrawalsQuery(lawyerId?: string) {
  return useQuery({
    queryKey: ["withdrawals", lawyerId],
    queryFn: () => withdrawalService.listWithdrawals(lawyerId),
    staleTime: 30 * 1000,
  });
}

export function useWithdrawalSummaryQuery(lawyerId?: string) {
  return useQuery({
    queryKey: ["withdrawals", "summary", lawyerId],
    queryFn: () => withdrawalService.getSummary(lawyerId!),
    enabled: Boolean(lawyerId),
    staleTime: 30 * 1000,
  });
}

export function useRequestWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWithdrawalPayload) => withdrawalService.requestWithdrawal(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals", "summary", variables.lawyerId] });
    },
  });
}

export function useApproveWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => withdrawalService.approveWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useRejectWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      withdrawalService.rejectWithdrawal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}
