import type { Context } from "hono";
import { db } from "../config/db.ts";
import { chatMessages } from "../models/chat.ts";
import { eq, and } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getCaseMessages(c: Context) {
  const caseId = c.req.param("id")!;
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.caseId, caseId))
    .orderBy(chatMessages.createdAt);

  return ApiResponse.success(c, messages, "Chat messages retrieved successfully");
}

export async function sendCaseMessage(c: Context) {
  const caseId = c.req.param("id")!;
  const body = await c.req.json();
  const {
    text,
    sender,
    senderName,
    attachmentType,
    attachmentName,
    attachmentUrl,
    attachmentSize,
    audioDuration,
  } = body;

  if (!sender || !senderName) {
    throw ApiError.badRequest("Sender role and senderName are required");
  }

  const messageId = `msg_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const [created] = await db
    .insert(chatMessages)
    .values({
      id: messageId,
      caseId,
      sender,
      senderName,
      text: text || null,
      attachmentType: attachmentType || null,
      attachmentName: attachmentName || null,
      attachmentUrl: attachmentUrl || null,
      attachmentSize: attachmentSize || null,
      audioDuration: audioDuration || null,
      read: false,
      at: nowIso,
    })
    .returning();

  return ApiResponse.created(c, created, "Message sent successfully");
}

export async function markCaseMessagesRead(c: Context) {
  const caseId = c.req.param("id")!;
  const user = c.get("user");
  const readerRole = user?.role || "citizen";
  const oppositeSender = readerRole === "lawyer" ? "citizen" : "lawyer";

  const updated = await db
    .update(chatMessages)
    .set({ read: true })
    .where(and(eq(chatMessages.caseId, caseId), eq(chatMessages.sender, oppositeSender)))
    .returning();

  return ApiResponse.success(c, { count: updated.length }, "Messages marked as read");
}
