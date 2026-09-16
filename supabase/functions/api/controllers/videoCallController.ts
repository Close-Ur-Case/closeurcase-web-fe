import type { Context } from "hono";
import { AgoraService } from "../services/agoraService.ts";
import { ApiResponse } from "../utils/apiResponse.ts";

export async function generateAgoraToken(c: Context) {
  const body = await c.req.json();
  const tokenData = AgoraService.generateToken(body);
  return ApiResponse.success(c, tokenData, "Agora RTC token generated successfully");
}

export async function logCallSession(c: Context) {
  const body = await c.req.json();
  const record = await AgoraService.logCall(body);
  return ApiResponse.created(c, record, "Video call logged successfully");
}

export async function getCallHistory(c: Context) {
  const caseId = c.req.param("caseId");
  const history = await AgoraService.getCallHistory(caseId);
  return ApiResponse.success(c, history, "Call history retrieved successfully");
}
