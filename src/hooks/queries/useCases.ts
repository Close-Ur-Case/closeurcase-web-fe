/**
 * React Query hooks for Cases
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { caseService, type ListCasesParams } from "@/services/caseService";
import type {
  CreateUserCasePayload,
  UpdateLawyerCaseStagePayload,
  ImportCasePayload,
} from "@/types/api";

export function useCasesQuery(params?: ListCasesParams) {
  return useQuery({
    queryKey: ["cases", params],
    queryFn: () => caseService.listUserCases(params),
    staleTime: 30 * 1000,
  });
}

export function useCaseQuery(id: string) {
  return useQuery({
    queryKey: ["cases", "detail", id],
    queryFn: () => caseService.getUserCase(id),
    enabled: Boolean(id),
  });
}

export function useCreateCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserCasePayload) => caseService.createUserCase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useUpdateCaseStageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLawyerCaseStagePayload }) =>
      caseService.updateCaseStage(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["cases", "detail", variables.id] });
    },
  });
}

export function useImportCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ImportCasePayload) => caseService.importCase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}
