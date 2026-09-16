import type { Context } from "hono";
import { db } from "../config/db.ts";
import { lawyers } from "../models/users.ts";
import { lawyerRatings } from "../models/ratings.ts";
import { lawyerDocuments } from "../models/documents.ts";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getLawyers(c: Context) {
  const city = c.req.query("city");
  const area = c.req.query("area");
  const category = c.req.query("category");
  const status = c.req.query("status");
  const search = c.req.query("search");
  const limit = Number(c.req.query("limit") || "50");
  const offset = Number(c.req.query("offset") || "0");

  let query = db.select().from(lawyers);
  const conditions = [];

  if (city) conditions.push(ilike(lawyers.city, `%${city}%`));
  if (area) conditions.push(ilike(lawyers.area, `%${area}%`));
  if (category) conditions.push(eq(lawyers.category, category));
  if (status) conditions.push(eq(lawyers.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(lawyers.name, `%${search}%`),
        ilike(lawyers.bio, `%${search}%`),
        ilike(lawyers.barId, `%${search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const results = await query.orderBy(desc(lawyers.rating)).limit(limit).offset(offset);
  return ApiResponse.success(c, results, "Lawyers retrieved successfully");
}

export async function getLawyerById(c: Context) {
  const id = c.req.param("id")!;
  const [lawyer] = await db.select().from(lawyers).where(eq(lawyers.id, id));

  if (!lawyer) throw ApiError.notFound(`Lawyer '${id}' not found`);

  const ratings = await db.select().from(lawyerRatings).where(eq(lawyerRatings.lawyerId, id));
  const documents = await db.select().from(lawyerDocuments).where(eq(lawyerDocuments.lawyerId, id));

  return ApiResponse.success(c, { ...lawyer, ratings, documents }, "Lawyer profile retrieved");
}

export async function updateLawyerStatus(c: Context) {
  const id = c.req.param("id")!;
  const { status } = await c.req.json();

  const [updated] = await db
    .update(lawyers)
    .set({ status, updatedAt: new Date() })
    .where(eq(lawyers.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Lawyer '${id}' not found`);
  return ApiResponse.success(c, updated, `Lawyer status updated to ${status}`);
}

export async function updateLawyerProfile(c: Context) {
  const id = c.req.param("id")!;

  const patch = await c.req.json();

  const [updated] = await db
    .update(lawyers)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(lawyers.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Lawyer '${id}' not found`);
  return ApiResponse.success(c, updated, "Lawyer profile updated successfully");
}

export async function submitRating(c: Context) {
  const { lawyerId, caseId, citizenId, citizenName, rating, review } = await c.req.json();

  const ratingId = `lr_${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  const [ratingRecord] = await db
    .insert(lawyerRatings)
    .values({
      id: ratingId,
      lawyerId,
      caseId,
      citizenId: citizenId || null,
      citizenName: citizenName || "Citizen User",
      rating: Number(rating),
      review: review || "",
      createdAt: today,
    })
    .returning();

  return ApiResponse.created(c, ratingRecord, "Lawyer rating submitted successfully");
}

export async function toggleAvailability(c: Context) {
  const id = c.req.param("id")!;
  const { availabilityStatus } = await c.req.json();

  const [updated] = await db
    .update(lawyers)
    .set({
      availabilityStatus: availabilityStatus || "Online",
      updatedAt: new Date(),
    })
    .where(eq(lawyers.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Lawyer '${id}' not found`);
  return ApiResponse.success(c, updated, `Lawyer is now ${availabilityStatus}`);
}

export async function updateBankDetails(c: Context) {
  const id = c.req.param("id")!;
  const { bankName, accountNumber, ifscCode } = await c.req.json();

  const [updated] = await db
    .update(lawyers)
    .set({
      bankName,
      accountNumber,
      ifscCode,
      updatedAt: new Date(),
    })
    .where(eq(lawyers.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Lawyer '${id}' not found`);
  return ApiResponse.success(c, updated, "Bank details saved successfully");
}

export async function moderateLawyer(c: Context) {
  const id = c.req.param("id")!;
  const { status } = await c.req.json();

  if (!["Approved", "Rejected", "Suspended", "Pending"].includes(status)) {
    throw ApiError.badRequest("Invalid moderation status");
  }

  const [updated] = await db
    .update(lawyers)
    .set({ status, updatedAt: new Date() })
    .where(eq(lawyers.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Lawyer '${id}' not found`);
  return ApiResponse.success(c, updated, `Lawyer moderation status updated to ${status}`);
}

