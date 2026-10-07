import { agoraConfig } from "../config/agora.ts";
import { buildAgoraRtcToken, RtcRole } from "../utils/agoraTokenBuilder.ts";
import { db } from "../config/db.ts";
import { videoCalls } from "../models/videoCalls.ts";
import { eq, desc, and, gte } from "drizzle-orm";
import { ApiError } from "../utils/apiError.ts";

export class AgoraService {
  static generateToken({ channelName, uid = 0, role = "publisher", expireSeconds = 3600 }: any) {
    if (!channelName) throw ApiError.badRequest("channelName is required");

    const numericUid = Number(uid) || Math.floor(Math.random() * 900000) + 100000;
    const rtcRole = role === "subscriber" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    if (!agoraConfig.appId || agoraConfig.appId.includes("placeholder")) {
      return {
        appId: agoraConfig.appId || "mock_agora_app_id",
        channelName,
        uid: numericUid,
        token: `mock_agora_token_${Date.now()}_${channelName}`,
        expiresIn: expireSeconds,
      };
    }

    const token = buildAgoraRtcToken({
      appId: agoraConfig.appId,
      appCertificate: agoraConfig.appCertificate,
      channelName,
      uid: numericUid,
      role: rtcRole,
      expireSeconds,
    });

    return {
      appId: agoraConfig.appId,
      channelName,
      uid: numericUid,
      token,
      expiresIn: expireSeconds,
    };
  }

  static async initiateCall({
    caseId,
    channelName,
    withName,
    callerId,
    callerName,
    receiverId,
    role = "citizen",
  }: any) {
    if (!caseId) throw ApiError.badRequest("caseId is required");

    const id = `vc_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const [record] = await db
      .insert(videoCalls)
      .values({
        id,
        caseId,
        channelName: channelName || `case_${caseId}`,
        withName: withName || callerName || "Consultation Participant",
        callerId: callerId || null,
        receiverId: receiverId || null,
        role,
        at: nowIso,
        durationSeconds: 0,
        status: "ringing",
        notes: callerName ? `Caller: ${callerName}` : null,
      })
      .returning();

    return record;
  }

  static async getIncomingCall({ userId, caseId }: any) {
    const cutoff = new Date(Date.now() - 45 * 1000); // Calls ringing within the last 45 seconds

    const conditions = [
      eq(videoCalls.status, "ringing"),
      gte(videoCalls.createdAt, cutoff),
    ];

    if (caseId) {
      conditions.push(eq(videoCalls.caseId, caseId));
    }

    const calls = await db
      .select()
      .from(videoCalls)
      .where(and(...conditions))
      .orderBy(desc(videoCalls.createdAt))
      .limit(5);

    // If userId provided, filter out calls where current user was the caller
    const incoming = calls.find((c) => !userId || c.callerId !== userId) || null;
    return incoming;
  }

  static async respondCall({ callId, action }: any) {
    if (!callId) throw ApiError.badRequest("callId is required");
    const validActions = ["accepted", "declined", "cancelled", "missed", "completed"];
    if (!validActions.includes(action)) throw ApiError.badRequest("Invalid call action");

    const [record] = await db
      .update(videoCalls)
      .set({
        status: action,
        endedAt: action !== "accepted" ? new Date() : undefined,
      })
      .where(eq(videoCalls.id, callId))
      .returning();

    return record || null;
  }

  static async getCallStatus(callId: string) {
    if (!callId) throw ApiError.badRequest("callId is required");

    const [record] = await db
      .select()
      .from(videoCalls)
      .where(eq(videoCalls.id, callId))
      .limit(1);

    return record || null;
  }

  static async logCall({
    caseId,
    channelName,
    withName,
    callerId,
    receiverId,
    role = "citizen",
    status = "completed",
    durationSeconds = 0,
    endedAt,
    notes,
    recordingUrl,
  }: any) {
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
        endedAt: endedAt ? new Date(endedAt) : null,
        notes: notes || null,
        recordingUrl: recordingUrl || null,
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
