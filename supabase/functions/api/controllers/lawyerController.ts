import type { Context } from "hono";
import { db } from "../config/db.ts";
import { lawyers } from "../models/users.ts";
import { lawyerRatings } from "../models/ratings.ts";
import { lawyerDocuments } from "../models/documents.ts";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";
import { LawyerLanguageService } from "../services/lawyerLanguageService.ts";
import { LawyerCategoryService } from "../services/lawyerCategoryService.ts";

export async function getLawyers(c: Context) {
  const city = c.req.query("city");
  const area = c.req.query("area");
  const category = c.req.query("category");
  const status = c.req.query("status");
  const search = c.req.query("search");
  const language = c.req.query("language");
  const practiceArea = c.req.query("practiceArea");
  const specialization = c.req.query("specialization");
  const legalService = c.req.query("legalService");
  const matchMode = (c.req.query("matchMode") || "all").toLowerCase();
  const limit = Number(c.req.query("limit") || "50");
  const offset = Number(c.req.query("offset") || "0");

  let query = db.select().from(lawyers);
  const conditions = [];

  if (city) conditions.push(ilike(lawyers.city, `%${city}%`));
  if (area) conditions.push(ilike(lawyers.area, `%${area}%`));
  if (category) conditions.push(eq(lawyers.category, category));
  if (status) conditions.push(eq(lawyers.status, status));

  // Taxonomy filters: practiceArea, specialization, legalService
  const taxonomyConditions = [];

  if (practiceArea) {
    const rawAreas = practiceArea.split(",").map((s) => s.trim()).filter(Boolean);
    if (rawAreas.length > 0) {
      const { ids, terms } = await LawyerCategoryService.resolveCategoryQuery(rawAreas);
      const conds = [];
      for (const id of ids) {
        conds.push(sql`${lawyers.practiceAreas}::jsonb ? ${id}`);
      }
      for (const term of terms) {
        conds.push(sql`(${lawyers.practiceAreas}::jsonb ? ${term} OR ${lawyers.practiceAreas}::text ILIKE ${'%' + term + '%'})`);
      }
      if (conds.length > 0) {
        taxonomyConditions.push(or(...conds));
      }
    }
  }

  if (specialization) {
    const rawSpecs = specialization.split(",").map((s) => s.trim()).filter(Boolean);
    if (rawSpecs.length > 0) {
      const { ids, terms } = await LawyerCategoryService.resolveSpecializationQuery(rawSpecs);
      const conds = [];
      for (const id of ids) {
        conds.push(sql`${lawyers.specializations}::jsonb ? ${id}`);
      }
      for (const term of terms) {
        conds.push(sql`(${lawyers.specializations}::jsonb ? ${term} OR ${lawyers.specializations}::text ILIKE ${'%' + term + '%'})`);
      }
      if (conds.length > 0) {
        taxonomyConditions.push(or(...conds));
      }
    }
  }

  if (legalService) {
    const rawServices = legalService.split(",").map((s) => s.trim()).filter(Boolean);
    if (rawServices.length > 0) {
      const { ids, terms } = await LawyerCategoryService.resolveLegalServiceQuery(rawServices);
      const conds = [];
      for (const id of ids) {
        conds.push(sql`${lawyers.legalServices}::jsonb ? ${id}`);
      }
      for (const term of terms) {
        conds.push(sql`(${lawyers.legalServices}::jsonb ? ${term} OR ${lawyers.legalServices}::text ILIKE ${'%' + term + '%'})`);
      }
      if (conds.length > 0) {
        taxonomyConditions.push(or(...conds));
      }
    }
  }

  if (taxonomyConditions.length > 0) {
    if (matchMode === "any") {
      conditions.push(or(...taxonomyConditions));
    } else {
      // Default: "all" mode requires matching all provided taxonomy criteria
      conditions.push(and(...taxonomyConditions));
    }
  }

  if (language) {
    const { languageIds } = await LawyerLanguageService.resolveLanguageIds([language]);
    const targetId = languageIds[0] || language;
    conditions.push(
      sql`(${lawyers.languages}::jsonb ? ${targetId} OR ${lawyers.languages}::jsonb ? ${language})`
    );
  }

  if (search) {
    const { categoryIds, specializationIds, serviceIds } =
      await LawyerCategoryService.findTaxonomyIdsForKeyword(search);

    const searchConds = [
      ilike(lawyers.name, `%${search}%`),
      ilike(lawyers.bio, `%${search}%`),
      ilike(lawyers.barId, `%${search}%`),
      ilike(lawyers.city, `%${search}%`),
      sql`${lawyers.practiceAreas}::text ILIKE ${'%' + search + '%'}`,
      sql`${lawyers.specializations}::text ILIKE ${'%' + search + '%'}`,
      sql`${lawyers.legalServices}::text ILIKE ${'%' + search + '%'}`,
    ];

    for (const catId of categoryIds) {
      searchConds.push(sql`${lawyers.practiceAreas}::jsonb ? ${catId}`);
    }
    for (const specId of specializationIds) {
      searchConds.push(sql`${lawyers.specializations}::jsonb ? ${specId}`);
    }
    for (const srvId of serviceIds) {
      searchConds.push(sql`${lawyers.legalServices}::jsonb ? ${srvId}`);
    }

    conditions.push(or(...searchConds));
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

  const [ratings, documents, languagesDetails, categoriesDetails] = await Promise.all([
    db.select().from(lawyerRatings).where(eq(lawyerRatings.lawyerId, id)),
    db.select().from(lawyerDocuments).where(eq(lawyerDocuments.lawyerId, id)),
    LawyerLanguageService.getLanguagesForLawyer(id),
    LawyerCategoryService.getCategoriesForLawyer(
      (lawyer.practiceAreas || []) as string[],
      (lawyer.specializations || []) as string[],
      (lawyer.legalServices || []) as string[]
    ),
  ]);

  return ApiResponse.success(
    c,
    { ...lawyer, languagesDetails, categoriesDetails, ratings, documents },
    "Lawyer profile retrieved"
  );
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

  // If practice areas, specializations, or legal services are updated, validate against master categories
  if (patch.practiceAreas !== undefined || patch.specializations !== undefined || patch.legalServices !== undefined) {
    const [current] = await db.select().from(lawyers).where(eq(lawyers.id, id));
    if (!current) throw ApiError.notFound(`Lawyer '${id}' not found`);

    const inputPracticeAreas = patch.practiceAreas !== undefined ? patch.practiceAreas : current.practiceAreas;
    const inputSpecializations = patch.specializations !== undefined ? patch.specializations : current.specializations;
    const inputLegalServices = patch.legalServices !== undefined ? patch.legalServices : current.legalServices;

    const normalized = await LawyerCategoryService.validateAndNormalize(
      inputPracticeAreas,
      inputSpecializations,
      inputLegalServices
    );

    if (patch.practiceAreas !== undefined) patch.practiceAreas = normalized.practiceAreas;
    if (patch.specializations !== undefined) patch.specializations = normalized.specializations;
    if (patch.legalServices !== undefined) patch.legalServices = normalized.legalServices;
    if (!patch.category && normalized.primaryCategory) {
      patch.category = normalized.primaryCategory;
    }
  }

  const [updated] = await db
    .update(lawyers)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(lawyers.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Lawyer '${id}' not found`);

  const [languagesDetails, categoriesDetails] = await Promise.all([
    LawyerLanguageService.getLanguagesForLawyer(id),
    LawyerCategoryService.getCategoriesForLawyer(
      (updated.practiceAreas || []) as string[],
      (updated.specializations || []) as string[],
      (updated.legalServices || []) as string[]
    ),
  ]);

  return ApiResponse.success(
    c,
    { ...updated, languagesDetails, categoriesDetails },
    "Lawyer profile updated successfully"
  );
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

