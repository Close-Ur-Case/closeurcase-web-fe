/**
 * React Query hooks for Citizen Subscriptions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscriptionService";
import type { CreateSubscriptionPayload } from "@/types/api";

export function useSubscriptionPlansQuery() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => subscriptionService.getPlans(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCitizenSubscriptionsQuery(citizenId?: string) {
  return useQuery({
    queryKey: ["citizen-subscriptions", citizenId],
    queryFn: () => subscriptionService.listSubscriptions(citizenId),
    staleTime: 60 * 1000,
  });
}

export function useCreateSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) =>
      subscriptionService.createSubscription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["citizens"] });
    },
  });
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionService.cancelSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizen-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["citizens"] });
    },
  });
}
