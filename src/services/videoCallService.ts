/**
 * Video Consultation Call Service
 * Connects to /api/v1/video-calls endpoints for RTC token generation,
 * real-time call invitations/ringing, and session logging.
 */

import { apiClient } from "./apiClient";
import type {
  AgoraTokenPayload,
  AgoraTokenResponse,
  LogCallPayload,
  VideoCallRecord,
  InitiateCallPayload,
  RespondCallPayload,
  IncomingCallInfo,
} from "@/types/api";

export const videoCallService = {
  /**
   * Request Agora RTC token for secure client-advocate video call room
   */
  async generateToken(payload: AgoraTokenPayload): Promise<AgoraTokenResponse> {
    return apiClient.post<AgoraTokenResponse>("/video-calls/token", payload);
  },

  /**
   * Initiate an outgoing 1-on-1 call (places recipient in ringing state)
   */
  async initiateCall(payload: InitiateCallPayload): Promise<IncomingCallInfo> {
    return apiClient.post<IncomingCallInfo>("/video-calls/initiate", payload);
  },

  /**
   * Check for active incoming calls ringing for the current participant
   */
  async getIncomingCall(params?: { caseId?: string; userId?: string }): Promise<IncomingCallInfo | null> {
    return apiClient.get<IncomingCallInfo | null>("/video-calls/incoming", {
      params: params as Record<string, string | number | boolean | undefined | null>,
    });
  },

  /**
   * Respond to an active call (accept, decline, or cancel)
   */
  async respondCall(payload: RespondCallPayload): Promise<IncomingCallInfo> {
    return apiClient.post<IncomingCallInfo>("/video-calls/respond", payload);
  },

  /**
   * Check the current state of a call (used by caller to see if callee accepted/declined)
   */
  async getCallStatus(callId: string): Promise<IncomingCallInfo | null> {
    return apiClient.get<IncomingCallInfo | null>(`/video-calls/status/${callId}`);
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

  /**
   * List all video calls
   */
  async listCalls(): Promise<VideoCallRecord[]> {
    return apiClient.get<VideoCallRecord[]>("/video-calls");
  },
};
