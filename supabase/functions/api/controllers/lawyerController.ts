import type { Context } from "hono";
import { db } from "../config/db.ts";
import { lawyers } from "../models/users.ts";
import { lawyerRatings } from "../models/ratings.ts";
import { lawyerDocuments } from "../models/documents.ts";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";
import { LawyerLanguageService } from "../services/lawyerLanguageService.ts";

export async function getLawyers(c: Context) {
  const city = c.req.query("city");
  const area = c.req.query("area");
  const category = c.req.query("category");
  const status = c.req.query("status");
  const search = c.req.query("search");
  const language = c.req.query("language");
  const practiceArea = c.req.query("practiceArea");
  const limit = Number(c.req.query("limit") || "50");
  const offset = Number(c.req.query("offset") || "0");

  let query = db.select().from(lawyers);
  const conditions = [];

  if (city) conditions.push(ilike(lawyers.city, `%${city}%`));
  if (area) conditions.push(ilike(lawyers.area, `%${area}%`));
  if (category) conditions.push(eq(lawyers.category, category));
  if (status) conditions.push(eq(lawyers.status, status));
  if (practiceArea) {
    conditions.push(
      sql`(${lawyers.practiceAreas}::jsonb ? ${practiceArea} OR ${lawyers.practiceAreas}::text ILIKE ${'%' + practiceArea + '%'})`
    );
  }
  if (language) {
    const { languageIds } = await LawyerLanguageService.resolveLanguageIds([language]);
    const targetId = languageIds[0] || language;
    conditions.push(
      sql`(${lawyers.languages}::jsonb ? ${targetId} OR ${lawyers.languages}::jsonb ? ${language})`
    );
  }
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

  const [ratings, documents, languagesDetails] = await Promise.all([
    db.select().from(lawyerRatings).where(eq(lawyerRatings.lawyerId, id)),
    db.select().from(lawyerDocuments).where(eq(lawyerDocuments.lawyerId, id)),
    LawyerLanguageService.getLanguagesForLawyer(id),
  ]);

  return ApiResponse.success(c, { ...lawyer, languagesDetails, ratings, documents }, "Lawyer profile retrieved");
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

  // If languages are being updated, resolve to language IDs
  if (patch.languages && Array.isArray(patch.languages)) {
    const { languageIds } = await LawyerLanguageService.resolveLanguageIds(patch.languages);
    patch.languages = languageIds;
  }

  // If practice areas are being updated, ensure array of strings
  if (patch.practiceAreas && Array.isArray(patch.practiceAreas)) {
    patch.practiceAreas = patch.practiceAreas
      .map((pa: any) => (typeof pa === "string" ? pa.trim() : String(pa?.name || "").trim()))
      .filter(Boolean);
  }

  const [updated] = await db
    .update(lawyers)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(lawyers.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Lawyer '${id}' not found`);

  const languagesDetails = await LawyerLanguageService.getLanguagesForLawyer(id);
  return ApiResponse.success(c, { ...updated, languagesDetails }, "Lawyer profile updated successfully");
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

export async function getLawyerLanguages(c: Context) {
  const id = c.req.param("id")!;
  const [lawyer] = await db.select().from(lawyers).where(eq(lawyers.id, id));
  if (!lawyer) throw ApiError.notFound(`Lawyer '${id}' not found`);

  const linkedLanguages = await LawyerLanguageService.getLanguagesForLawyer(id);
  return ApiResponse.success(c, linkedLanguages, "Lawyer languages retrieved successfully");
}

export async function setLawyerLanguages(c: Context) {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const inputLanguages = body.languages;

  if (!Array.isArray(inputLanguages)) {
    throw ApiError.badRequest("languages must be an array of language names, codes, or IDs");
  }

  const [lawyer] = await db.select().from(lawyers).where(eq(lawyers.id, id));
  if (!lawyer) throw ApiError.notFound(`Lawyer '${id}' not found`);

  const result = await LawyerLanguageService.syncLawyerLanguages(id, inputLanguages);
  return ApiResponse.success(c, result, "Lawyer languages synchronized successfully");
}

