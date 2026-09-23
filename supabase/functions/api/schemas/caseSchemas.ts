import { z } from "@hono/zod-openapi";

export const CreateUserCaseSchema = z
  .object({
    citizenId: z.string().optional().openapi({ example: "u_001" }),
    lawyerId: z.string().optional().openapi({ example: "l_001" }),
    caseType: z.string().openapi({ example: "new", description: "Case type from case_types lookup: new, pending, closed" }),
    cnr: z.string().optional().transform((v) => (v ? v.trim().toUpperCase() : undefined)).openapi({ example: "DLND020047882015" }),
    title: z.string().min(1).openapi({ example: "Property Handover Dispute" }),
    description: z.string().min(1).openapi({ example: "Builder delay in handover under RERA Section 18." }),
    documents: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string(),
          fileUrl: z.string(),
          size: z.string().optional(),
          fileMimeType: z.string().optional(),
          uploadedAt: z.string().optional(),
        })
      )
      .default([])
      .openapi({ example: [{ name: "sale_deed.pdf", fileUrl: "https://closeurcase.app/docs/sale_deed.pdf", size: "1.2 MB" }] }),
    practiceArea: z.string().min(1).openapi({ example: "cat_1" }),
    specialization: z.string().min(1).openapi({ example: "spec_1_1" }),
    legalServices: z.array(z.string()).default([]).openapi({ example: ["srv_1_1_1", "srv_1_1_2"] }),
    city: z.string().optional().openapi({ example: "Hyderabad" }),
    isEmergency: z.boolean().optional().default(false),
  })
  .openapi("CreateUserCaseRequest");

// Also export CreateCaseSchema alias for existing router bindings if needed
export const CreateCaseSchema = CreateUserCaseSchema;

export const UpdateLawyerCaseStageSchema = z
  .object({
    stage: z.enum(["accepted", "rejected", "filinginprogress", "cnrgenerated"]).openapi({ example: "accepted" }),
    rejectionReason: z.string().optional().openapi({ example: "Conflict of interest with opposing party." }),
    generatedCnr: z.string().optional().transform((v) => (v ? v.trim().toUpperCase() : undefined)).openapi({ example: "TSHC010022112026" }),
  })
  .openapi("UpdateLawyerCaseStageRequest");

export const UpdateCaseStatusSchema = UpdateLawyerCaseStageSchema;

export const ImportCaseSchema = z
  .object({
    cnr: z.string().optional().transform((v) => (v ? v.trim().toUpperCase() : undefined)).openapi({ example: "DLND020047882015" }),
    rawData: z.any().optional().openapi({ description: "Total success response from eCourts API" }),
  })
  .passthrough()
  .openapi("ImportCaseRequest");

export const AssignLawyerSchema = z
  .object({
    lawyerId: z.string().openapi({ example: "l_001" }),
  })
  .openapi("AssignLawyerRequest");

export const SendChatMessageSchema = z
  .object({
    sender: z.enum(["citizen", "lawyer"]).optional().openapi({ example: "citizen" }),
    senderId: z.string().optional().openapi({ example: "u_001" }),
    senderRole: z.enum(["citizen", "lawyer"]).optional().openapi({ example: "citizen" }),
    senderName: z.string().optional().openapi({ example: "Sai Teja Reddy" }),
    message: z.string().optional().openapi({ example: "Advocate sir, I have uploaded the signed documents." }),
    text: z.string().optional().openapi({ example: "Advocate sir, I have uploaded the signed documents." }),
    attachmentUrl: z.string().optional().openapi({ example: "https://closeurcase.app/docs/doc_1.pdf" }),
    attachmentType: z.string().optional().openapi({ example: "application/pdf" }),
    attachmentName: z.string().optional().openapi({ example: "vakalatnama.pdf" }),
    attachmentSize: z.string().optional().openapi({ example: "500 KB" }),
    audioDuration: z.number().optional().openapi({ example: 45 }),
  })
  .openapi("SendChatMessageRequest");

export const LookupItemSchema = z
  .object({
    id: z.string().openapi({ example: "new" }),
    category: z.string().openapi({ example: "case_type" }),
    label: z.string().openapi({ example: "New Case" }),
    description: z.string().nullable().optional().openapi({ example: "Brand new matter" }),
    sortOrder: z.number().openapi({ example: 1 }),
    createdAt: z.string().optional(),
  })
  .openapi("LookupItem");

export const ListLookupsQuerySchema = z.object({
  category: z.string().optional().openapi({ example: "case_type", description: "Filter by category: case_type, lawyer_casestage" }),
});

export const UpdateUserCaseSchema = z
  .object({
    title: z.string().optional().openapi({ example: "Updated Case Title" }),
    description: z.string().optional().openapi({ example: "Updated case description" }),
    cnr: z.string().optional().transform((v) => (v ? v.trim().toUpperCase() : undefined)).openapi({ example: "DLND020047882015" }),
    caseType: z.string().optional().openapi({ example: "new" }),
    practiceArea: z.string().optional().openapi({ example: "cat_1" }),
    specialization: z.string().optional().openapi({ example: "spec_1_1" }),
    isEmergency: z.boolean().optional(),
    status: z.string().optional(),
    caseStatus: z.string().optional(),
    documents: z.array(z.any()).optional(),
    timeline: z.array(z.any()).optional(),
    notes: z.array(z.any()).optional(),
  })
  .passthrough()
  .openapi("UpdateUserCaseRequest");


