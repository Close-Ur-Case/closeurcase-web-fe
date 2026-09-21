/**
 * Real-time Case Chat Service
 * Connects to /api/v1/cases/:id/messages endpoints
 */

import { apiClient } from "./apiClient";
import type { ApiChatMessage, SendChatMessagePayload } from "@/types/api";

export const chatService = {
  /**
   * Get all consultation chat messages for a case
   */
  async getMessages(caseId: string): Promise<ApiChatMessage[]> {
    return apiClient.get<ApiChatMessage[]>(`/cases/${caseId}/messages`);
  },

  /**
   * Send a message or media attachment in case consultation chat
   */
  async sendMessage(caseId: string, payload: SendChatMessagePayload): Promise<ApiChatMessage> {
    return apiClient.post<ApiChatMessage>(`/cases/${caseId}/messages`, payload);
  },

  /**
   * Mark messages as read by current participant
   */
  async markRead(caseId: string): Promise<{ count: number }> {
    return apiClient.patch<{ count: number }>(`/cases/${caseId}/messages/read`);
  },
};
