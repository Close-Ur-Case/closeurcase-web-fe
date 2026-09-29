import type { Context } from "hono";
import { db } from "../config/db.ts";
import { knowledgeItems } from "../models/knowledgeBase.ts";
import { eq, desc, and, or, ilike, isNull } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getKnowledgeBase(c: Context) {
  const user = c.get("user");
  const category = c.req.query("category");
  const type = c.req.query("type");
  const scope = c.req.query("scope"); // "global" | "personal" | "all"
  const lawyerId = c.req.query("lawyerId") || user?.lawyerId;
  const search = c.req.query("search");

  const conditions: any[] = [];

  if (category && category !== "All") {
    conditions.push(ilike(knowledgeItems.category, category));
  }
  if (type && type !== "All") {
    conditions.push(ilike(knowledgeItems.type, type));
  }
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(knowledgeItems.title, term),
        ilike(knowledgeItems.category, term),
        ilike(knowledgeItems.type, term),
        ilike(knowledgeItems.fileName, term)
      )
    );
  }

  if (scope === "global") {
    conditions.push(or(eq(knowledgeItems.scope, "global"), isNull(knowledgeItems.scope)));
  } else if (scope === "personal") {
    const targetLawyerId = lawyerId || user?.lawyerId || user?.id;
    if (targetLawyerId) {
      conditions.push(
        and(
          eq(knowledgeItems.scope, "personal"),
          or(
            eq(knowledgeItems.lawyerId, targetLawyerId),
            user?.id ? eq(knowledgeItems.uploadedBy, user.id) : undefined
          )
        )
      );
    } else {
      return ApiResponse.success(c, [], "No lawyer identified for personal documents");
    }
  } else {
    // If no scope specified:
    const isAdmin = user?.role === "admin" || user?.role === "superadmin";
    if (!isAdmin) {
      const targetLawyerId = lawyerId || user?.lawyerId || user?.id;
      if (targetLawyerId) {
        conditions.push(
          or(
            eq(knowledgeItems.scope, "global"),
            isNull(knowledgeItems.scope),
            and(
              eq(knowledgeItems.scope, "personal"),
              or(
                eq(knowledgeItems.lawyerId, targetLawyerId),
                user?.id ? eq(knowledgeItems.uploadedBy, user.id) : undefined
              )
            )
          )
        );
      } else {
        conditions.push(or(eq(knowledgeItems.scope, "global"), isNull(knowledgeItems.scope)));
      }
    }
  }

  let query = db.select().from(knowledgeItems);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

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
  const user = c.get("user");
  const body = await c.req.json();
  const { title, type, category, size, fileUrl, fileName, fileMimeType, scope, lawyerId, uploadedBy } = body;

  if (!title) {
    throw ApiError.badRequest("title is required");
  }

  const isLawyerUser = user?.role === "lawyer";
  const isAdmin = user?.role === "admin" || user?.role === "superadmin" || uploadedBy === "admin";

  let targetScope: "global" | "personal" = "global";
  if (isLawyerUser) {
    // Authenticated lawyer accounts can only upload personal documents to their own My Docs
    targetScope = "personal";
  } else if (scope === "personal" || lawyerId) {
    targetScope = "personal";
  } else if (scope === "global" || isAdmin) {
    targetScope = "global";
  }

  const targetLawyerId =
    targetScope === "personal" ? lawyerId || user?.lawyerId || user?.id || null : null;
  const targetUploadedBy =
    uploadedBy || user?.id || (targetScope === "global" ? "admin" : targetLawyerId || "system");

  const id = `kb_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const [created] = await db
    .insert(knowledgeItems)
    .values({
      id,
      title: title.trim(),
      type: type || (targetScope === "global" ? "Act" : "Personal Document"),
      category: category || "General",
      size: size || "1 MB",
      fileUrl: fileUrl || null,
      fileName: fileName || title,
      fileMimeType: fileMimeType || "application/pdf",
      scope: targetScope,
      uploadedBy: targetUploadedBy,
      lawyerId: targetLawyerId,
      uploadedAt: nowIso,
    })
    .returning();

  return ApiResponse.created(c, created, "Knowledge item added successfully");
}

export async function deleteKnowledgeItem(c: Context) {
  const user = c.get("user");
  const id = c.req.param("id")!;

  const [item] = await db.select().from(knowledgeItems).where(eq(knowledgeItems.id, id));
  if (!item) {
    throw ApiError.notFound(`Knowledge item '${id}' not found`);
  }

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  if (user && !isAdmin) {
    const currentLawyerId = user?.lawyerId || user?.id;
    const isOwner =
      item.scope === "personal" &&
      (item.lawyerId === currentLawyerId || (user?.id && item.uploadedBy === user.id));
    if (!isOwner) {
      throw ApiError.forbidden("You can only delete your own personal documents");
    }
  }

  await db.delete(knowledgeItems).where(eq(knowledgeItems.id, id));
  return ApiResponse.success(c, null, "Knowledge item deleted successfully");
}

