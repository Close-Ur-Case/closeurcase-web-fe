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
    try {
      return await apiClient.get<ApiChatMessage[]>(`/cases/${caseId}/messages`);
    } catch {
      return await apiClient.get<ApiChatMessage[]>(`/cases/user/${caseId}/messages`);
    }
  },

  /**
   * Send a message or media attachment in case consultation chat
   */
  async sendMessage(caseId: string, payload: SendChatMessagePayload): Promise<ApiChatMessage> {
    try {
      return await apiClient.post<ApiChatMessage>(`/cases/${caseId}/messages`, payload);
    } catch {
      return await apiClient.post<ApiChatMessage>(`/cases/user/${caseId}/messages`, payload);
    }
  },

  /**
   * Mark messages as read by current participant
   */
  async markRead(caseId: string, role?: "citizen" | "lawyer"): Promise<{ count: number }> {
    try {
      return await apiClient.patch<{ count: number }>(`/cases/${caseId}/messages/read`, role ? { role } : {});
    } catch {
      return await apiClient.patch<{ count: number }>(`/cases/user/${caseId}/messages/read`, role ? { role } : {});
    }
  },
};
