/**
 * React Query hooks for Citizens & Subscriptions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { citizenService } from "@/services/citizenService";
import type { UpdateCitizenMePayload, UpdateCitizenPayload } from "@/types/api";

export function useCitizenMeQuery() {
  return useQuery({
    queryKey: ["citizens", "me"],
    queryFn: () => citizenService.getMe(),
    staleTime: 60 * 1000,
  });
}

export function useUpdateCitizenMeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCitizenMePayload) => citizenService.updateMe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citizens", "me"] });
      queryClient.invalidateQueries({ queryKey: ["citizens"] });
    },
  });
}

export function useCitizensQuery(params?: { search?: string; page?: string }) {
  return useQuery({
    queryKey: ["citizens", params],
    queryFn: () => citizenService.getCitizens(params),
    staleTime: 30 * 1000,
  });
}

export function useCitizenDetailQuery(id?: string) {
  return useQuery({
    queryKey: ["citizens", "detail", id],
    queryFn: () => citizenService.getCitizenById(id!),
    enabled: Boolean(id),
  });
}

export function useUpdateCitizenMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCitizenPayload }) =>
      citizenService.updateCitizen(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["citizens"] });
      queryClient.invalidateQueries({ queryKey: ["citizens", "detail", variables.id] });
    },
  });
}

export function useCitizenSubscriptionsQuery(citizenId?: string) {
  return useQuery({
    queryKey: ["citizens", "subscriptions", citizenId],
    queryFn: () => citizenService.getSubscriptions(citizenId!),
    enabled: Boolean(citizenId),
  });
}
