/**
 * React Query hooks for AI Legal Assistant & Case Insights
 */

import { useMutation } from "@tanstack/react-query";
import { aiService } from "@/services/aiService";
import type { GenerateCounterPayload, CaseQAPayload, SummarizeDocPayload } from "@/types/api";

export function useGenerateCounterMutation() {
  return useMutation({
    mutationFn: (payload: GenerateCounterPayload) => aiService.generateCounter(payload),
  });
}

export function useCaseQAMutation() {
  return useMutation({
    mutationFn: (payload: CaseQAPayload) => aiService.caseQA(payload),
  });
}

export function useSummarizeDocMutation() {
  return useMutation({
    mutationFn: (payload: SummarizeDocPayload) => aiService.summarizeDocument(payload),
  });
}
