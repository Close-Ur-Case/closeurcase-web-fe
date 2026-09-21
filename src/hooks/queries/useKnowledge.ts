/**
 * React Query hooks for Legal Knowledge Base
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { knowledgeService } from "@/services/knowledgeService";
import type {
  KnowledgeBaseItem,
  CreateKnowledgeItemPayload,
  KnowledgeQueryParams,
} from "@/types/api";

export function useKnowledgeQuery(params?: KnowledgeQueryParams) {
  return useQuery({
    queryKey: ["knowledge", params],
    queryFn: () => knowledgeService.getKnowledgeItems(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddKnowledgeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateKnowledgeItemPayload) => knowledgeService.addKnowledgeItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });
}

export function useDeleteKnowledgeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => knowledgeService.deleteKnowledgeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });
}
