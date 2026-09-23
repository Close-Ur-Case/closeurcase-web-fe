import type { Context } from "hono";
import { db } from "../config/db.ts";
import { knowledgeItems } from "../models/knowledgeBase.ts";
import { eq, desc } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getKnowledgeBase(c: Context) {
  const category = c.req.query("category");
  const type = c.req.query("type");
  let query = db.select().from(knowledgeItems);

  if (category) query = query.where(eq(knowledgeItems.category, category)) as any;
  if (type) query = query.where(eq(knowledgeItems.type, type)) as any;

  const items = await query.orderBy(desc(knowledgeItems.uploadedAt));
  return ApiResponse.success(c, items, "Knowledge items retrieved successfully");
}

export async function getKnowledgeItemById(c: Context) {
  const id = c.req.param("id")!;
  const [item] = await db.select().from(knowledgeItems).where(eq(knowledgeItems.id, id));
  if (!item) {
    throw ApiError.notFound(`Knowledge item '${id}' not found`);
  }
  return ApiResponse.success(c, item, "Knowledge item retrieved successfully");
}

export async function addKnowledgeItem(c: Context) {
  const { title, type, category, size, fileUrl, fileName, fileMimeType } = await c.req.json();
  if (!title || !type || !category) {
    throw ApiError.badRequest("title, type, and category are required");
  }

  const id = `kb_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const [created] = await db
    .insert(knowledgeItems)
    .values({
      id,
      title,
      type,
      category,
      size: size || "1 MB",
      fileUrl: fileUrl || null,
      fileName: fileName || title,
      fileMimeType: fileMimeType || "application/pdf",
      uploadedAt: nowIso,
    })
    .returning();

  return ApiResponse.created(c, created, "Knowledge item added successfully");
}

export async function deleteKnowledgeItem(c: Context) {
  const id = c.req.param("id")!;
  await db.delete(knowledgeItems).where(eq(knowledgeItems.id, id));
  return ApiResponse.success(c, null, "Knowledge item deleted successfully");
}

