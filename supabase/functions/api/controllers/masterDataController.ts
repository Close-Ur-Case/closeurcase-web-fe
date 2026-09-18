import type { Context } from "hono";
import { db } from "../config/db.ts";
import {
  caseCategories,
  caseSpecializations,
  legalServices,
  cities,
  districts,
  courts,
  states,
  courtLevels,
  languages,
} from "../models/masterData.ts";
import { eq, and } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getCategories(c: Context) {
  const [cats, specs, srvs] = await Promise.all([
    db.select().from(caseCategories),
    db.select().from(caseSpecializations).orderBy(caseSpecializations.displayOrder),
    db.select().from(legalServices).orderBy(legalServices.displayOrder),
  ]);

  // Group legal services by specializationId
  const servicesBySpec = new Map<string, any[]>();
  for (const s of srvs) {
    const list = servicesBySpec.get(s.specializationId) || [];
    list.push({
      id: s.id,
      specializationId: s.specializationId,
      categoryId: s.categoryId,
      name: s.name,
      description: s.description,
      estimatedDays: s.estimatedDays,
      baseFee: s.baseFee,
      requiredDocuments: s.requiredDocuments,
      active: s.active,
      displayOrder: s.displayOrder,
    });
    servicesBySpec.set(s.specializationId, list);
  }

  // Group specializations by categoryId
  const specsByCat = new Map<string, any[]>();
  for (const sp of specs) {
    const list = specsByCat.get(sp.categoryId) || [];
    list.push({
      id: sp.id,
      categoryId: sp.categoryId,
      name: sp.name,
      description: sp.description,
      active: sp.active,
      displayOrder: sp.displayOrder,
      services: servicesBySpec.get(sp.id) || [],
    });
    specsByCat.set(sp.categoryId, list);
  }

  const enriched = cats.map((cat) => ({
    ...cat,
    subCategories: specsByCat.get(cat.id) || cat.subCategories || [],
  }));

  return ApiResponse.success(c, enriched, "Categories retrieved successfully");
}

export async function getSpecializations(c: Context) {
  const categoryId = c.req.query("categoryId");
  let query = db.select().from(caseSpecializations);
  if (categoryId) {
    query = query.where(eq(caseSpecializations.categoryId, categoryId)) as any;
  }
  const data = await query.orderBy(caseSpecializations.displayOrder);
  return ApiResponse.success(c, data, "Specializations retrieved successfully");
}

export async function getLegalServices(c: Context) {
  const categoryId = c.req.query("categoryId");
  const specializationId = c.req.query("specializationId");
  let query = db.select().from(legalServices);
  const conditions = [];
  if (categoryId) conditions.push(eq(legalServices.categoryId, categoryId));
  if (specializationId) conditions.push(eq(legalServices.specializationId, specializationId));
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  const data = await query.orderBy(legalServices.displayOrder);
  return ApiResponse.success(c, data, "Legal services retrieved successfully");
}

export async function getCities(c: Context) {
  const data = await db.select().from(cities);
  return ApiResponse.success(c, data, "Cities retrieved successfully");
}

export async function getCourts(c: Context) {
  const data = await db.select().from(courts);
  return ApiResponse.success(c, data, "Courts retrieved successfully");
}

export async function getLanguages(c: Context) {
  const data = await db.select().from(languages);
  return ApiResponse.success(c, data, "Languages retrieved successfully");
}

export async function getStates(c: Context) {
  const data = await db.select().from(states);
  return ApiResponse.success(c, data, "States retrieved successfully");
}

export async function getCourtLevels(c: Context) {
  const data = await db.select().from(courtLevels);
  return ApiResponse.success(c, data, "Court levels retrieved successfully");
}

export async function getDistricts(c: Context) {
  const stateId = c.req.query("state_id") || c.req.query("stateId");
  if (stateId) {
    const data = await db.select().from(districts).where(eq(districts.stateId, stateId));
    return ApiResponse.success(c, data, `Districts for state '${stateId}' retrieved successfully`);
  }
  const data = await db.select().from(districts);
  return ApiResponse.success(c, data, "Districts retrieved successfully");
}

const tableMap: Record<string, any> = {
  categories: caseCategories,
  specializations: caseSpecializations,
  "legal-services": legalServices,
  cities,
  districts,
  courts,
  states,
  "court-levels": courtLevels,
  languages,
};

export async function createTaxonomyItem(c: Context) {
  const type = c.req.param("type") || "";
  const targetTable = tableMap[type];
  if (!targetTable) throw ApiError.badRequest(`Unknown taxonomy type '${type}'`);

  const body = await c.req.json();
  const id = body.id || `${type}_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const [created] = await db
    .insert(targetTable)
    .values({ ...body, id, updatedAt: nowIso })
    .returning();

  return ApiResponse.created(c, created, `${type} item created successfully`);
}

export async function updateTaxonomyItem(c: Context) {
  const type = c.req.param("type") || "";
  const id = c.req.param("id")!;
  const targetTable = tableMap[type];
  if (!targetTable) throw ApiError.badRequest(`Unknown taxonomy type '${type}'`);

  const body = await c.req.json();
  const nowIso = new Date().toISOString();

  const [updated] = await db
    .update(targetTable)
    .set({ ...body, updatedAt: nowIso })
    .where(eq(targetTable.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`${type} item '${id}' not found`);
  return ApiResponse.success(c, updated, `${type} item updated successfully`);
}

export async function deleteTaxonomyItem(c: Context) {
  const type = c.req.param("type") || "";
  const id = c.req.param("id")!;
  const targetTable = tableMap[type];
  if (!targetTable) throw ApiError.badRequest(`Unknown taxonomy type '${type}'`);

  await db.delete(targetTable).where(eq(targetTable.id, id));
  return ApiResponse.success(c, { id }, `${type} item deleted successfully`);
}
