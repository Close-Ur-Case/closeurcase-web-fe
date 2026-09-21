/**
 * React Query hooks for Lawyers & Moderation
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lawyerService } from "@/services/lawyerService";
import type {
  UpdateLawyerProfilePayload,
  ToggleAvailabilityPayload,
  UpdateBankDetailsPayload,
  ModerateLawyerPayload,
  LawyerQueryParams,
} from "@/types/api";

export function useLawyersQuery(params?: LawyerQueryParams) {
  return useQuery({
    queryKey: ["lawyers", params],
    queryFn: () => lawyerService.getLawyers(params),
    staleTime: 30 * 1000,
  });
}

export function useLawyerQuery(id?: string) {
  return useQuery({
    queryKey: ["lawyers", "detail", id],
    queryFn: () => lawyerService.getLawyerById(id!),
    enabled: Boolean(id),
  });
}

export function useModerateLawyerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModerateLawyerPayload }) =>
      lawyerService.moderateLawyer(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["lawyers", "detail", variables.id] });
    },
  });
}

export function useUpdateLawyerProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLawyerProfilePayload }) =>
      lawyerService.updateProfile(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["lawyers", "detail", variables.id] });
    },
  });
}

export function useToggleAvailabilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      availability,
    }: {
      id: string;
      availability: ToggleAvailabilityPayload["availability"];
    }) => lawyerService.toggleAvailability(id, availability),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["lawyers", "detail", variables.id] });
    },
  });
}

export function useUpdateBankDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBankDetailsPayload }) =>
      lawyerService.updateBankDetails(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lawyers"] });
      queryClient.invalidateQueries({ queryKey: ["lawyers", "detail", variables.id] });
    },
  });
}

export function useLawyerLanguagesQuery(id?: string) {
  return useQuery({
    queryKey: ["lawyers", "languages", id],
    queryFn: () => lawyerService.getLanguages(id!),
    enabled: Boolean(id),
  });
}

export function useSyncLawyerLanguagesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, languages }: { id: string; languages: string[] }) =>
      lawyerService.setLanguages(id, languages),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lawyers", "languages", variables.id] });
    },
  });
}
