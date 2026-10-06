import { z } from "@hono/zod-openapi";

export const CaseDocumentItemSchema = z
  .object({
    id: z.string().optional(),
    caseId: z.string().optional(),
    uploaderId: z.string().nullable().optional(),
    uploadedBy: z.enum(["citizen", "lawyer"]).optional().openapi({ example: "citizen" }),
    name: z.string().openapi({ example: "sale_deed.pdf" }),
    fileUrl: z.string().openapi({ example: "https://closeurcase.app/docs/sale_deed.pdf" }),
    size: z.string().nullable().optional().openapi({ example: "1.2 MB" }),
    fileMimeType: z.string().nullable().optional().openapi({ example: "application/pdf" }),
    uploadedAt: z.string().optional().openapi({ example: "2026-08-31T15:45:12.000Z" }),
    isAffidavit: z.boolean().optional().default(false).openapi({ example: false, description: "Whether this document is a sworn legal affidavit" }),
  })
  .openapi("CaseDocumentItem");

export const CaseDocumentSchema = z
  .object({
    id: z.string().openapi({ example: "doc_1727600000000_1" }),
    caseId: z.string().openapi({ example: "CUC-20260831154512" }),
    uploaderId: z.string().nullable().optional().openapi({ example: "u_001" }),
    uploadedBy: z.enum(["citizen", "lawyer"]).openapi({ example: "citizen" }),
    name: z.string().openapi({ example: "sale_deed.pdf" }),
    fileUrl: z.string().openapi({ example: "https://closeurcase.app/docs/sale_deed.pdf" }),
    size: z.string().nullable().optional().openapi({ example: "1.2 MB" }),
    fileMimeType: z.string().nullable().optional().openapi({ example: "application/pdf" }),
    uploadedAt: z.string().optional().openapi({ example: "2026-08-31T15:45:12.000Z" }),
    isAffidavit: z.boolean().default(false).openapi({ example: false, description: "Whether this document is a sworn legal affidavit" }),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .openapi("CaseDocument");

export const CreateUserCaseSchema = z
  .object({
    id: z.string().optional().openapi({ example: "CUC-20260831154512" }),
    citizenId: z.string().optional().openapi({ example: "u_001" }),
    lawyerId: z.string().optional().openapi({ example: "l_001" }),
    caseType: z.string().openapi({ example: "new", description: "Case type from case_types lookup: new, pending, closed" }),
    cnr: z.string().optional().transform((v) => (v ? v.trim().toUpperCase() : undefined)).openapi({ example: "DLND020047882015" }),
    petitioner: z.string().optional().openapi({ example: "Sai Teja Reddy" }),
    respondent: z.string().optional().openapi({ example: "ABC Developers Pvt Ltd" }),
    title: z.string().optional().openapi({ example: "Property Handover Dispute" }),
    description: z.string().min(1).openapi({ example: "Builder delay in handover under RERA Section 18." }),
    documents: z
      .array(CaseDocumentItemSchema)
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
    stage: z.string().optional().openapi({ example: "accepted" }),
    status: z.string().optional().openapi({ example: "Accepted by Lawyer" }),
    rejectionReason: z.string().optional().openapi({ example: "Conflict of interest with opposing party." }),
    generatedCnr: z.string().nullable().optional().transform((v) => (v ? v.trim().toUpperCase() : v === null ? null : undefined)).openapi({ example: "TSHC010022112026" }),
  })
  .passthrough()
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
    cnr: z.string().nullable().optional().transform((v) => (v ? v.trim().toUpperCase() : v === null ? null : undefined)).openapi({ example: "DLND020047882015" }),
    caseType: z.string().optional().openapi({ example: "new" }),
    practiceArea: z.string().optional().openapi({ example: "cat_1" }),
    specialization: z.string().optional().openapi({ example: "spec_1_1" }),
    isEmergency: z.boolean().optional(),
    status: z.string().optional().openapi({ example: "Accepted by Lawyer", description: "Case status or filter status label" }),
    caseStatus: z.string().optional().openapi({ example: "Accepted by Lawyer", description: "Case status or filter status label" }),
    documents: z.array(z.any()).optional(),
    timeline: z.array(z.any()).optional(),
    notes: z.array(z.any()).optional(),
  })
  .passthrough()
  .openapi("UpdateUserCaseRequest");


