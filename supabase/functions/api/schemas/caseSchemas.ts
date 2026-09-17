import { z } from "@hono/zod-openapi";

export const CreateCaseSchema = z
  .object({
    title: z.string().openapi({ example: "Commercial Lease Agreement Breach" }),
    caseType: z.string().optional().openapi({ example: "Civil" }),
    category: z.string().openapi({ example: "Corporate & Commercial" }),
    courtName: z.string().optional().openapi({ example: "City Civil Court Mumbai" }),
    caseNumber: z.string().optional().openapi({ example: "CC/4521/2026" }),
    cnrNumber: z.string().optional().openapi({ example: "MHTC010045212026" }),
    description: z.string().openapi({ example: "Dispute over unreturned security deposit and lease termination terms." }),
    claimAmount: z.number().optional().openapi({ example: 500000 }),
    priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional().openapi({ example: "High" }),
    city: z.string().optional().openapi({ example: "Mumbai" }),
    isEmergency: z.boolean().optional().openapi({ example: false }),
    courtLevel: z.string().optional().openapi({ example: "District Court" }),
    state: z.string().optional().openapi({ example: "Maharashtra" }),
  })
  .openapi("CreateCaseRequest");

export const UpdateCaseStatusSchema = z
  .object({
    status: z.enum(["Draft", "Filed", "In Progress", "Hearing Scheduled", "Order Reserved", "Disposed", "Closed"]).openapi({ example: "In Progress" }),
  })
  .openapi("UpdateCaseStatusRequest");

export const AssignLawyerSchema = z
  .object({
    lawyerId: z.string().openapi({ example: "l_001" }),
  })
  .openapi("AssignLawyerRequest");

export const AddHearingSchema = z
  .object({
    hearingDate: z.string().openapi({ example: "2026-10-15T10:30:00Z" }),
    purpose: z.string().openapi({ example: "Admission & Interim Injunction Hearing" }),
    judge: z.string().optional().openapi({ example: "Hon. Justice P. K. Sharma" }),
    courtRoom: z.string().optional().openapi({ example: "Court Hall 4" }),
    summary: z.string().optional().openapi({ example: "Arguments concluded on maintainability." }),
    nextDate: z.string().optional().openapi({ example: "2026-11-02T10:30:00Z" }),
  })
  .openapi("AddHearingRequest");

export const AddCaseNoteSchema = z
  .object({
    content: z.string().openapi({ example: "Opposite counsel filed counter-affidavit today. Verified Annexure C." }),
    isConfidential: z.boolean().optional().openapi({ example: true }),
  })
  .openapi("AddCaseNoteRequest");

export const SendChatMessageSchema = z
  .object({
    sender: z.enum(["citizen", "lawyer"]).optional().openapi({ example: "citizen" }),
    senderId: z.string().optional().openapi({ example: "u_001" }),
    senderRole: z.enum(["citizen", "lawyer"]).optional().openapi({ example: "citizen" }),
    senderName: z.string().optional().openapi({ example: "Sai Teja Reddy" }),
    message: z.string().openapi({ example: "Advocate sir, I have uploaded the signed vakalatnama." }),
    attachmentUrl: z.string().optional().openapi({ example: "https://zxsizwzjktorqjlzzchg.supabase.co/storage/v1/object/public/case-documents/doc_1.pdf" }),
    attachmentType: z.string().optional().openapi({ example: "application/pdf" }),
    attachmentName: z.string().optional().openapi({ example: "vakalatnama_signed.pdf" }),
  })
  .openapi("SendChatMessageRequest");
