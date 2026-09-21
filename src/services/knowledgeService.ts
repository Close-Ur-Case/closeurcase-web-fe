/**
 * Knowledge Base Service Layer
 * Connects to /api/v1/knowledge endpoints for statutes, judgments, acts, and precedent queries.
 */

import { apiClient } from "./apiClient";
import type {
  KnowledgeBaseItem,
  CreateKnowledgeItemPayload,
  KnowledgeQueryParams,
} from "@/types/api";

export const knowledgeService = {
  /**
   * Browse legal knowledge base articles, judgments, rules & acts
   */
  async getKnowledgeItems<T = KnowledgeBaseItem>(params?: KnowledgeQueryParams): Promise<T[]> {
    return apiClient.get<T[]>("/knowledge", {
      params: params as Record<string, string | number | boolean | undefined | null>,
    });
  },

  /**
   * Add new knowledge article
   */
  async addKnowledgeItem<T = KnowledgeBaseItem>(payload: CreateKnowledgeItemPayload): Promise<T> {
    return apiClient.post<T>("/knowledge", payload);
  },

  /**
   * Delete knowledge article by ID
   */
  async deleteKnowledgeItem<T = void>(id: string): Promise<T> {
    return apiClient.delete<T>(`/knowledge/${id}`);
  },
};
