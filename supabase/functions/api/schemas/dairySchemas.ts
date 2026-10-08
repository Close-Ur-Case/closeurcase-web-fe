import { z } from "@hono/zod-openapi";

export const DairyNoteResponseSchema = z
  .object({
    id: z.string().openapi({ example: "3a6ba699-752a-4c90-8f05-61c7aa40fbac" }),
    user_id: z.string().openapi({ example: "usr_102" }),
    entry_date: z.string().openapi({ example: "2026-10-08" }),
    notes: z.string().openapi({ example: "Received certified copy of bail order from court registry." }),
    category: z.string().nullable().optional().openapi({ example: "Court Hearing" }),
    case_id: z.string().nullable().optional().openapi({ example: "CUC-20260831154512" }),
    is_completed: z.boolean().openapi({ example: false }),
    created_at: z.string().openapi({ example: "2026-10-08T10:47:39.773Z" }),
    updated_at: z.string().openapi({ example: "2026-10-08T10:47:39.773Z" }),
  })
  .openapi("DairyNoteResponse");

export const ListDairyNotesQuerySchema = z
  .object({
    userId: z.string().optional().openapi({ example: "usr_102", description: "Filter notes by user ID" }),
    date: z.string().optional().openapi({ example: "2026-10-08", description: "Filter notes by date (YYYY-MM-DD)" }),
    caseId: z.string().optional().openapi({ example: "CUC-20260831154512", description: "Filter notes linked to case ID" }),
  })
  .openapi("ListDairyNotesQuery");

export const CreateDairyNoteSchema = z
  .object({
    userId: z.string().min(1).openapi({ example: "usr_102", description: "Owner user ID of the daily note" }),
    entryDate: z.string().optional().openapi({ example: "2026-10-08", description: "Note target date (YYYY-MM-DD), defaults to today" }),
    notes: z.string().min(1).openapi({ example: "Conferenced with client regarding upcoming trial date.", description: "Note remarks and body" }),
    category: z.string().nullable().optional().openapi({ example: "Client Follow-up", description: "Optional category preset chip" }),
    caseId: z.string().nullable().optional().openapi({ example: "CUC-20260831154512", description: "Linked case docket ID" }),
    case_id: z.string().nullable().optional().openapi({ example: "CUC-20260831154512", description: "Alias for caseId" }),
    isCompleted: z.boolean().optional().openapi({ example: false, description: "Whether task is completed" }),
    is_completed: z.boolean().optional().openapi({ example: false, description: "Alias for isCompleted" }),
  })
  .openapi("CreateDairyNoteRequest");

export const UpdateDairyNoteSchema = z
  .object({
    notes: z.string().optional().openapi({ example: "Updated remarks after hearing was adjourned to next Monday." }),
    entryDate: z.string().optional().openapi({ example: "2026-10-08" }),
    entry_date: z.string().optional().openapi({ example: "2026-10-08" }),
    category: z.string().nullable().optional().openapi({ example: "Legal Research" }),
    caseId: z.string().nullable().optional().openapi({ example: "CUC-20260831154512" }),
    case_id: z.string().nullable().optional().openapi({ example: "CUC-20260831154512" }),
    isCompleted: z.boolean().optional().openapi({ example: true }),
    is_completed: z.boolean().optional().openapi({ example: true }),
  })
  .openapi("UpdateDairyNoteRequest");

export const DairyIdParamSchema = z
  .object({
    id: z.string().openapi({ example: "3a6ba699-752a-4c90-8f05-61c7aa40fbac", description: "Dairy note unique ID" }),
  })
  .openapi("DairyIdParam");
