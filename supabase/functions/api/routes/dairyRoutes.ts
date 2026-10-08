import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { client } from "../config/db.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";
import {
  ListDairyNotesQuerySchema,
  CreateDairyNoteSchema,
  UpdateDairyNoteSchema,
  DairyIdParamSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
} from "../schemas/index.ts";

const dairy = new OpenAPIHono();

// ── GET /v1/dairy ────────────────────────────────────────────────────────────
const listDairyNotesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Daily Diary"],
  summary: "List daily diary notes with filters",
  description:
    "Retrieve date-based daily notes for a user, with optional filters by calendar date (YYYY-MM-DD) or linked case docket ID.",
  request: {
    query: ListDairyNotesQuerySchema,
  },
  responses: {
    200: {
      description: "List of dairy notes retrieved successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

dairy.openapi(listDairyNotesRoute, async (c) => {
  const userId = c.req.query("userId");
  const date = c.req.query("date"); // YYYY-MM-DD
  const caseId = c.req.query("caseId");

  let query =
    "SELECT id, user_id, to_char(entry_date, 'YYYY-MM-DD') as entry_date, notes, category, case_id, is_completed, created_at, updated_at FROM public.dairy WHERE 1=1";
  const params: any[] = [];

  if (userId) {
    params.push(userId);
    query += ` AND user_id = $${params.length}`;
  }
  if (date) {
    params.push(date);
    query += ` AND entry_date = $${params.length}`;
  }
  if (caseId) {
    params.push(caseId);
    query += ` AND case_id = $${params.length}`;
  }

  query += " ORDER BY created_at DESC";

  const rows = await client.unsafe(query, params);
  return ApiResponse.success(c, rows, "Dairy notes retrieved successfully");
});

// ── POST /v1/dairy ───────────────────────────────────────────────────────────
const createDairyNoteRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Daily Diary"],
  summary: "Create a new daily diary note",
  description:
    "Record daily note remarks, date, category preset chip, and optional case docket link.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateDairyNoteSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Daily note created successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    400: {
      description: "Validation error or missing required fields",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

dairy.openapi(createDairyNoteRoute, async (c) => {
  const body = await c.req.json();
  const { userId, entryDate, notes, isCompleted, is_completed, category, caseId, case_id } = body;

  if (!userId || !notes || !notes.trim()) {
    throw ApiError.badRequest("userId and notes are required");
  }

  const dateVal = entryDate || new Date().toISOString().slice(0, 10);
  const completedVal = Boolean(isCompleted ?? is_completed ?? false);
  const categoryVal = category && String(category).trim() ? String(category).trim() : null;
  const linkedCaseId =
    (caseId || case_id) && String(caseId || case_id).trim()
      ? String(caseId || case_id).trim()
      : null;

  const [row] = await client.unsafe(
    `
    INSERT INTO public.dairy (user_id, entry_date, notes, category, case_id, is_completed)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, user_id, to_char(entry_date, 'YYYY-MM-DD') as entry_date, notes, category, case_id, is_completed, created_at, updated_at
  `,
    [userId, dateVal, notes.trim(), categoryVal, linkedCaseId, completedVal],
  );

  return ApiResponse.created(c, row, "Dairy note created successfully");
});

// ── PATCH /v1/dairy/:id ──────────────────────────────────────────────────────
const updateDairyNoteRoute = createRoute({
  method: "patch",
  path: "/:id",
  tags: ["Daily Diary"],
  summary: "Update daily diary note",
  description:
    "Update note remarks, target date, category preset, linked case docket, or completion status.",
  request: {
    params: DairyIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateDairyNoteSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Daily note updated successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    400: {
      description: "Nothing to update or invalid parameters",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Daily note not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

dairy.openapi(updateDairyNoteRoute, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { is_completed, isCompleted, notes, entry_date, entryDate, category, caseId, case_id } =
    body;

  const sets: string[] = [];
  const params: any[] = [];

  const completed = is_completed !== undefined ? is_completed : isCompleted;
  if (typeof completed === "boolean") {
    params.push(completed);
    sets.push(`is_completed = $${params.length}`);
  }
  if (typeof notes === "string") {
    params.push(notes.trim());
    sets.push(`notes = $${params.length}`);
  }
  const dateVal = entry_date || entryDate;
  if (typeof dateVal === "string" && dateVal.trim()) {
    params.push(dateVal.trim());
    sets.push(`entry_date = $${params.length}`);
  }
  if (category !== undefined) {
    const catVal = category && String(category).trim() ? String(category).trim() : null;
    params.push(catVal);
    sets.push(`category = $${params.length}`);
  }
  const cid = case_id !== undefined ? case_id : caseId;
  if (cid !== undefined) {
    const cVal = cid && String(cid).trim() ? String(cid).trim() : null;
    params.push(cVal);
    sets.push(`case_id = $${params.length}`);
  }

  if (sets.length === 0) {
    throw ApiError.badRequest("Nothing to update");
  }

  params.push(id);
  const query = `
    UPDATE public.dairy
    SET ${sets.join(", ")}, updated_at = now()
    WHERE id = $${params.length}
    RETURNING id, user_id, to_char(entry_date, 'YYYY-MM-DD') as entry_date, notes, category, case_id, is_completed, created_at, updated_at
  `;

  const [updated] = await client.unsafe(query, params);
  if (!updated) {
    throw ApiError.notFound("Dairy note not found");
  }

  return ApiResponse.success(c, updated, "Dairy note updated successfully");
});

// ── DELETE /v1/dairy/:id ─────────────────────────────────────────────────────
const deleteDairyNoteRoute = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["Daily Diary"],
  summary: "Delete daily diary note",
  description: "Permanently delete a daily diary note by ID.",
  request: {
    params: DairyIdParamSchema,
  },
  responses: {
    200: {
      description: "Daily note deleted successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

dairy.openapi(deleteDairyNoteRoute, async (c) => {
  const { id } = c.req.param();
  await client.unsafe("DELETE FROM public.dairy WHERE id = $1", [id]);
  return ApiResponse.success(c, { id }, "Dairy note deleted successfully");
});

export default dairy;
