import { agoraConfig } from "../config/agora.ts";
import { buildAgoraRtcToken, RtcRole } from "../utils/agoraTokenBuilder.ts";
import { db } from "../config/db.ts";
import { videoCalls } from "../models/videoCalls.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "../utils/apiError.ts";

export class AgoraService {
  static generateToken({ channelName, uid = 0, role = "publisher", expireSeconds = 3600 }: any) {
    if (!channelName) throw ApiError.badRequest("channelName is required");

    const rtcRole = role === "subscriber" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    if (!agoraConfig.appId || agoraConfig.appId.includes("placeholder")) {
      return {
        appId: agoraConfig.appId || "mock_agora_app_id",
        channelName,
        uid,
        token: `mock_agora_token_${Date.now()}_${channelName}`,
        expiresIn: expireSeconds,
      };
    }

    const token = buildAgoraRtcToken({
      appId: agoraConfig.appId,
      appCertificate: agoraConfig.appCertificate,
      channelName,
      uid,
      role: rtcRole,
      expireSeconds,
    });

    return {
      appId: agoraConfig.appId,
      channelName,
      uid,
      token,
      expiresIn: expireSeconds,
    };
  }

  static async logCall({ caseId, channelName, withName, callerId, receiverId, role = "citizen", status = "completed", durationSeconds }: any) {
    const id = `vc_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const [record] = await db
      .insert(videoCalls)
      .values({
        id,
        caseId,
        channelName: channelName || `case_${caseId}`,
        withName: withName || "Consultation Participant",
        callerId: callerId || null,
        receiverId: receiverId || null,
        role,
        at: nowIso,
        durationSeconds: durationSeconds || 0,
        status,
      })
      .returning();

    return record;
  }

  static async getCallHistory(caseId?: string) {
    if (caseId) {
      return db.select().from(videoCalls).where(eq(videoCalls.caseId, caseId));
    }
    return db.select().from(videoCalls).limit(50);
  }
}
