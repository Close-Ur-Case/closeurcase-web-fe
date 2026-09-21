/**
 * Video Consultation Call Service
 * Connects to /api/v1/video-calls endpoints for RTC token generation and call logging.
 */

import { apiClient } from "./apiClient";
import type {
  AgoraTokenPayload,
  AgoraTokenResponse,
  LogCallPayload,
  VideoCallRecord,
} from "@/types/api";

export const videoCallService = {
  /**
   * Request Agora RTC token for secure client-advocate video call room
   */
  async generateToken(payload: AgoraTokenPayload): Promise<AgoraTokenResponse> {
    return apiClient.post<AgoraTokenResponse>("/video-calls/token", payload);
  },

  /**
   * Log completed or cancelled video consultation session
   */
  async logCall(payload: LogCallPayload): Promise<VideoCallRecord> {
    return apiClient.post<VideoCallRecord>("/video-calls/log", payload);
  },

  /**
   * Get video consultation call history
   */
  async getCallHistory(caseId?: string): Promise<VideoCallRecord[]> {
    const path = caseId ? `/video-calls/history/${caseId}` : "/video-calls/history";
    return apiClient.get<VideoCallRecord[]>(path);
  },
};
