/**
 * React Query hooks for Payments
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/services/paymentService";
import type { CreatePaymentOrderPayload, VerifyPaymentPayload } from "@/types/api";

export function usePaymentsQuery(lawyerId?: string) {
  return useQuery({
    queryKey: ["payments", lawyerId],
    queryFn: () => paymentService.getPayments(lawyerId),
    staleTime: 30 * 1000,
  });
}

export function useCreateOrderMutation() {
  return useMutation({
    mutationFn: (payload: CreatePaymentOrderPayload) => paymentService.createOrder(payload),
  });
}

export function useVerifyPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerifyPaymentPayload) => paymentService.verifyPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}
