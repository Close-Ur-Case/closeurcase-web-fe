import { z } from "@hono/zod-openapi";

export const EcourtsHearingItemSchema = z
  .object({
    time: z.string().optional().openapi({ example: "11:00 AM" }),
    judge: z.string().openapi({ example: "Chairman, MACT Visakhapatnam" }),
    hearingDate: z.string().openapi({ example: "2026-04-09" }),
    businessOnDate: z.string().openapi({ example: "2026-03-08" }),
    purposeOfListing: z.string().openapi({ example: "Evidence of claimant recorded; matter posted for cross-examination." }),
  })
  .openapi("EcourtsHearingItem");

export const EcourtsInterimOrderSchema = z
  .object({
    orderUrl: z.string().openapi({ example: "order-cs51677-1.pdf" }),
    orderDate: z.string().openapi({ example: "2026-04-09" }),
    description: z.string().openapi({ example: "Interim order directing insurer to deposit 50% of the assessed compensation amount." }),
  })
  .openapi("EcourtsInterimOrder");

export const EcourtsTaggedMatterSchema = z
  .object({
    type: z.string().openapi({ example: "Connected Matter" }),
    caseNumber: z.string().openapi({ example: "MVOP/443/2026" }),
  })
  .openapi("EcourtsTaggedMatter");

export const EcourtsCaseDocketSchema = z
  .object({
    cnr: z.string().regex(/^[A-Za-z0-9]{16}$/).openapi({ example: "APVK020004422026" }),
    judges: z.array(z.string()).openapi({ example: ["Chairman, MACT Visakhapatnam", "Member, MACT Visakhapatnam"] }),
    iaCount: z.number().openapi({ example: 2 }),
    purpose: z.string().openapi({ example: "EVIDENCE" }),
    caseType: z.string().openapi({ example: "MVOP" }),
    courtName: z.string().openapi({ example: "Motor Accidents Claims Tribunal, Visakhapatnam" }),
    hasOrders: z.boolean().openapi({ example: true }),
    caseNumber: z.string().openapi({ example: "MVOP/442/2026" }),
    caseStatus: z.string().openapi({ example: "PENDING" }),
    filingDate: z.string().openapi({ example: "2026-03-08" }),
    orderCount: z.number().openapi({ example: 2 }),
    caseTypeRaw: z.string().openapi({ example: "Motor Vehicle Original Petition" }),
    petitioners: z.array(z.string()).openapi({ example: ["K. Padma Rao"] }),
    respondents: z.array(z.string()).openapi({
      example: [
        "Andhra Pradesh State Road Transport Corporation",
        "United India Insurance Co. Ltd. (Insurer)",
      ],
    }),
    hasJudgments: z.boolean().openapi({ example: false }),
    hearingCount: z.number().openapi({ example: 4 }),
    interimOrders: z.array(EcourtsInterimOrderSchema),
    judgmentCount: z.number().openapi({ example: 0 }),
    taggedMatters: z.array(EcourtsTaggedMatterSchema),
    judgmentOrders: z.array(z.any()).openapi({ example: [] }),
    contestedStatus: z.string().openapi({ example: "CONTESTED" }),
    interimOrderCount: z.number().openapi({ example: 2 }),
    petitionerAdvocates: z.array(z.string()).openapi({ example: ["Swathi Reddy"] }),
    respondentAdvocates: z.array(z.string()).openapi({
      example: ["APSRTC Legal Cell", "Panel Counsel, United India Insurance"],
    }),
    caseCategoryFacetPath: z.string().openapi({ example: "Civil Law/Motor Accident Claims" }),
    historyOfCaseHearings: z.array(EcourtsHearingItemSchema),
  })
  .openapi("EcourtsCaseDocket");

export const EcourtsCnrParamSchema = z.object({
  cnr: z
    .string()
    .min(16, "CNR must be exactly 16 alphanumeric characters")
    .max(16, "CNR must be exactly 16 alphanumeric characters")
    .regex(/^[A-Za-z0-9]{16}$/, "CNR must consist of 16 alphanumeric characters (e.g. APVK020004422026)")
    .openapi({
      param: {
        name: "cnr",
        in: "path",
        required: true,
      },
      example: "APVK020004422026",
      description: "16-digit Indian eCourts Case Number Record (CNR)",
    }),
});

export const EcourtsQuerySchema = z.object({
  raw: z
    .enum(["true", "false"])
    .optional()
    .openapi({
      description: "Return raw JSON object directly without standard API envelope",
      example: "true",
    }),
  delayMs: z
    .string()
    .optional()
    .openapi({
      description: "Simulate network latency in milliseconds (0-2000)",
      example: "200",
    }),
});
