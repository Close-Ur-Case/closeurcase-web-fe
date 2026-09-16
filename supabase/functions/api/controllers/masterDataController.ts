import type { Context } from "hono";
import { db } from "../config/db.ts";
import {
  caseCategories,
  cities,
  districts,
  courts,
  states,
  courtLevels,
  languages,
} from "../models/masterData.ts";
import { eq } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function getCategories(c: Context) {
  const data = await db.select().from(caseCategories);
  return ApiResponse.success(c, data, "Categories retrieved successfully");
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
  const data = await db.select().from(districts);
  return ApiResponse.success(c, data, "Districts retrieved successfully");
}

const tableMap: Record<string, any> = {
  categories: caseCategories,
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


