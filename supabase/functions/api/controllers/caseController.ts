import type { Context } from "hono";
import { CaseService } from "../services/caseService.ts";
import { ApiResponse } from "../utils/apiResponse.ts";

// ============================================================================
// Lookup Controllers
// ============================================================================

export async function getLookups(c: Context) {
  const category = c.req.query("category");
  const result = await CaseService.listLookups(category);
  return ApiResponse.success(c, result, "Lookups retrieved successfully");
}

export async function getCaseTypes(c: Context) {
  const result = await CaseService.listCaseTypes();
  return ApiResponse.success(c, result, "Case types retrieved successfully");
}

export async function getLawyerCaseStages(c: Context) {
  const result = await CaseService.listStages();
  return ApiResponse.success(c, result, "Lawyer case stages retrieved successfully");
}

// ============================================================================
// 1. Cases Imported (eCourts View-Only)
// ============================================================================

export async function importCase(c: Context) {
  const body = await c.req.json().catch(() => ({}));
  const cnr = body.cnr || body.caseDetails?.cnr || c.req.param("cnr");
  const result = await CaseService.importFromEcourts(cnr, body);
  return ApiResponse.created(c, result, `Case with CNR '${cnr}' imported successfully`);
}

export async function getImportedCase(c: Context) {
  const cnr = c.req.param("cnr")!;
  const result = await CaseService.getImportedCase(cnr);
  return ApiResponse.success(c, result, `Imported court case '${cnr}' retrieved successfully`);
}

export async function listImportedCases(c: Context) {
  const search = c.req.query("search");
  const limit = Number(c.req.query("limit") || "20");
  const offset = Number(c.req.query("offset") || "0");

  const result = await CaseService.listImportedCases({ search, limit, offset });
  return ApiResponse.success(c, result, "Imported cases retrieved successfully");
}

// ============================================================================
// 2. Cases User (Booking & Management)
// ============================================================================

export async function createUserCase(c: Context) {
  const body = await c.req.json();
  const user = c.get("user");
  if (user && !body.citizenId) {
    body.citizenId = user.id;
  }
  const result = await CaseService.createUserCase(body);
  return ApiResponse.created(c, result, "Case created and advocate booked successfully");
}

export async function getUserCase(c: Context) {
  const id = c.req.param("id")!;
  const result = await CaseService.getUserCaseById(id);
  return ApiResponse.success(c, result, "Case retrieved successfully");
}

export async function listUserCases(c: Context) {
  const citizenId = c.req.query("citizenId");
  const lawyerId = c.req.query("lawyerId");
  const status = c.req.query("status");
  const caseType = c.req.query("caseType");
  const search = c.req.query("search");
  const limit = Number(c.req.query("limit") || "50");
  const offset = Number(c.req.query("offset") || "0");

  const result = await CaseService.listUserCases({
    citizenId,
    lawyerId,
    status,
    caseType,
    search,
    limit,
    offset,
  });
  return ApiResponse.success(c, result, "Cases retrieved successfully");
}

export async function updateLawyerStage(c: Context) {
  const id = c.req.param("id")!;
  const user = c.get("user");
  const body = await c.req.json();

  const stage = body.stage || body.status;
  const result = await CaseService.updateLawyerStage(id, user?.id || null, {
    stage,
    rejectionReason: body.rejectionReason,
    generatedCnr: body.generatedCnr,
  });

  return ApiResponse.success(c, result, `Case stage updated to '${stage}'`);
}

export async function assignLawyer(c: Context) {
  const id = c.req.param("id")!;
  const { lawyerId } = await c.req.json();
  const result = await CaseService.assignLawyer(id, lawyerId);
  return ApiResponse.success(c, result, "Lawyer assigned to case successfully");
}

// Backward compatibility exports
export const createCase = createUserCase;
export const listCases = listUserCases;
export const getCaseById = getUserCase;
export const getCaseByCnr = getImportedCase;
export const updateCaseStatus = updateLawyerStage;
