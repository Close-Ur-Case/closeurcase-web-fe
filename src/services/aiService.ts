/**
 * AI Legal Assistant Service
 * Connects to /api/v1/ai endpoints for Q&A, counter-arguments, and document summarization.
 */

import { apiClient } from "./apiClient";
import type {
  GenerateCounterPayload,
  GenerateCounterResponse,
  CaseQAPayload,
  CaseQAResponse,
  SummarizeDocPayload,
  SummarizeDocResponse,
} from "@/types/api";

export const aiService = {
  /**
   * Generate statutory & precedent-backed legal counter-argument
   */
  async generateCounter(payload: GenerateCounterPayload): Promise<GenerateCounterResponse> {
    return apiClient.post<GenerateCounterResponse>("/ai/generate-counter", payload);
  },

  /**
   * Ask AI questions regarding case docket, orders, and hearings timeline
   */
  async caseQA(payload: CaseQAPayload): Promise<CaseQAResponse> {
    return apiClient.post<CaseQAResponse>("/ai/case-qa", payload);
  },

  /**
   * Generate executive summary, key clauses, and liability risks of a legal document
   */
  async summarizeDocument(payload: SummarizeDocPayload): Promise<SummarizeDocResponse> {
    return apiClient.post<SummarizeDocResponse>("/ai/summarize-document", payload);
  },
};
