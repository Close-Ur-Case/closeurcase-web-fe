import type { Context } from "hono";
import { CaseService } from "../services/caseService.ts";
import { db } from "../config/db.ts";
import { caseHearings } from "../models/hearings.ts";
import { caseNotes } from "../models/notes.ts";
import { eq } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function createCase(c: Context) {
  const body = await c.req.json();
  const result = await CaseService.createCase(body);
  return ApiResponse.created(c, result, "Case created successfully");
}

export async function listCases(c: Context) {
  const citizenId = c.req.query("citizenId");
  const lawyerId = c.req.query("lawyerId");
  const status = c.req.query("status");
  const category = c.req.query("category");
  const cnr = c.req.query("cnr");
  const search = c.req.query("search");
  const limit = Number(c.req.query("limit") || "50");
  const offset = Number(c.req.query("offset") || "0");

  const result = await CaseService.listCases({
    citizenId,
    lawyerId,
    status,
    category,
    cnr,
    search,
    limit,
    offset,
  });
  return ApiResponse.success(c, result, "Cases retrieved successfully");
}

export async function getCaseById(c: Context) {
  const id = c.req.param("id")!;
  const result = await CaseService.getCaseById(id);
  return ApiResponse.success(c, result, "Case retrieved successfully");
}

export async function getCaseByCnr(c: Context) {
  const cnr = c.req.param("cnr")!;
  const result = await CaseService.getCaseByCnr(cnr);
  return ApiResponse.success(c, result, `Case with CNR '${cnr}' retrieved successfully`);
}

export async function updateCaseStatus(c: Context) {
  const id = c.req.param("id")!;
  const { status, note } = await c.req.json();
  const result = await CaseService.updateCaseStatus(id, status, note);
  return ApiResponse.success(c, result, `Case status updated to ${status}`);
}

export async function assignLawyer(c: Context) {
  const id = c.req.param("id")!;
  const { lawyerId, lawyerName } = await c.req.json();
  const result = await CaseService.assignLawyer(id, lawyerId, lawyerName);
  return ApiResponse.success(c, result, "Lawyer assigned to case successfully");
}

export async function addHearing(c: Context) {
  const id = c.req.param("id")!;
  const { judge, businessOnDate, hearingDate, time, purposeOfListing } = await c.req.json();

  const hearingId = `h_${Date.now()}`;
  const [created] = await db
    .insert(caseHearings)
    .values({
      id: hearingId,
      caseId: id,
      judge: judge || "",
      businessOnDate,
      hearingDate: hearingDate || null,
      time: time || null,
      purposeOfListing,
    })
    .returning();

  return ApiResponse.created(c, created, "Hearing added successfully");
}

export async function addCaseNote(c: Context) {
  const id = c.req.param("id")!;
  const { text, author } = await c.req.json();

  const noteId = `note_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const [created] = await db
    .insert(caseNotes)
    .values({
      id: noteId,
      caseId: id,
      text,
      author: author || "You",
      createdAt: nowIso,
    })
    .returning();

  return ApiResponse.created(c, created, "Case note added successfully");
}
