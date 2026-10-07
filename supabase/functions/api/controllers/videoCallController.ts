import type { Context } from "hono";
import { AgoraService } from "../services/agoraService.ts";
import { ApiResponse } from "../utils/apiResponse.ts";

export async function generateAgoraToken(c: Context) {
  const body = await c.req.json();
  const tokenData = AgoraService.generateToken(body);
  return ApiResponse.success(c, tokenData, "Agora RTC token generated successfully");
}

export async function initiateVideoCall(c: Context) {
  const body = await c.req.json();
  const user = c.get("user");
  const callerId = body.callerId || user?.id || null;
  const callerName = body.callerName || user?.fullName || user?.name || null;

  const record = await AgoraService.initiateCall({
    ...body,
    callerId,
    callerName,
  });
  return ApiResponse.created(c, record, "Video call initiated successfully");
}

export async function getIncomingCall(c: Context) {
  const user = c.get("user");
  const caseId = c.req.query("caseId");
  const userId = user?.id || c.req.query("userId");

  const incoming = await AgoraService.getIncomingCall({
    userId,
    caseId,
  });
  return ApiResponse.success(c, incoming, "Incoming call status retrieved");
}

export async function respondToCall(c: Context) {
  const body = await c.req.json();
  const record = await AgoraService.respondCall(body);
  return ApiResponse.success(c, record, `Call ${body.action || "updated"} successfully`);
}

export async function getCallStatus(c: Context) {
  const callId = c.req.param("id");
  const record = await AgoraService.getCallStatus(callId);
  return ApiResponse.success(c, record, "Call status retrieved");
}

export async function logCallSession(c: Context) {
  const body = await c.req.json();
  const record = await AgoraService.logCall(body);
  return ApiResponse.created(c, record, "Video call logged successfully");
}

export async function getCallHistory(c: Context) {
  const caseId = c.req.param("caseId") || c.req.query("caseId");
  const history = await AgoraService.getCallHistory(caseId);
  return ApiResponse.success(c, history, "Call history retrieved successfully");
}
