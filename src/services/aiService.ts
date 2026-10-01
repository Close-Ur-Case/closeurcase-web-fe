/**
 * AI Legal Assistant Service
 * Connects to /api/v1/ai endpoints for Q&A, counter-arguments, case analysis, and document summarization.
 */

import { apiClient } from "./apiClient";
import type {
  GenerateCounterPayload,
  GenerateCounterResponse,
  CaseQAPayload,
  CaseQAResponse,
  SummarizeDocPayload,
  SummarizeDocResponse,
  SummarizeCasePayload,
  SummarizeCaseResponse,
  LegalQAPayload,
  LegalQAResponse,
  CaseAnalysisPayload,
  CaseAnalysisResponse,
} from "@/types/api";

export const aiService = {
  /**
   * AI Case Summarization endpoint
   * Calls /summarization/summarize-case which calls Deno.env.get("AI_BASE_URL")/summarization/summarize-case
   * POST payload: { urls: string[], case_text: string }
   * Response: { status_code: 200, message: string, data: { summary: string, key_points: string[] } }
   */
  async summarizeCase(payload: SummarizeCasePayload): Promise<SummarizeCaseResponse> {
    return apiClient.post<SummarizeCaseResponse>("/summarization/summarize-case", payload);
  },
  /**
   * Ask AI general legal questions powered by Indian statutes, BNSS/BNS, and knowledge base
   */
  async legalQA(payload: LegalQAPayload): Promise<LegalQAResponse> {
    return apiClient.post<LegalQAResponse>("/ai/legal-qa", payload);
  },

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

  /**
   * Summarize legal document (alias)
   */
  async summarize(payload: SummarizeDocPayload): Promise<SummarizeDocResponse> {
    return apiClient.post<SummarizeDocResponse>("/ai/summarize", payload);
  },

  /**
   * Comprehensive statutory analysis of case docket, strengths, risks, precedents & timeline
   */
  async caseAnalysis(payload: CaseAnalysisPayload): Promise<CaseAnalysisResponse> {
    return apiClient.post<CaseAnalysisResponse>("/ai/case-analysis", payload);
  },
};
