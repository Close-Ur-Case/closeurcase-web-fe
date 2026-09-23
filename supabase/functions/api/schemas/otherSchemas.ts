import { z } from "@hono/zod-openapi";

export const GenerateAgoraTokenSchema = z
  .object({
    channelName: z.string().openapi({ example: "consult_case_102" }),
    role: z.enum(["publisher", "subscriber"]).optional().openapi({ example: "publisher" }),
    uid: z.number().optional().openapi({ example: 12345 }),
  })
  .openapi("GenerateAgoraTokenRequest");

export const LogCallSessionSchema = z
  .object({
    caseId: z.string().openapi({ example: "c_102" }),
    durationSeconds: z.number().optional().default(0).openapi({ example: 900 }),
    callerId: z.string().optional().openapi({ example: "u_001" }),
    receiverId: z.string().optional().openapi({ example: "l_001" }),
    withName: z.string().optional().openapi({ example: "Adv. Rajesh Kumar" }),
    channelName: z.string().optional().openapi({ example: "consult_case_102" }),
    role: z.string().optional().openapi({ example: "citizen" }),
    status: z.string().optional().openapi({ example: "completed" }),
  })
  .openapi("LogCallSessionRequest");

export const GenerateCounterSchema = z
  .object({
    argument: z.string().optional().openapi({ example: "Petitioner claims adverse possession of property since 2010 without payment of municipal tax." }),
    argumentText: z.string().optional().openapi({ example: "Petitioner claims adverse possession of property since 2010 without payment of municipal tax." }),
    caseId: z.string().optional().openapi({ example: "c_102" }),
    caseCategory: z.string().optional().openapi({ example: "Property Law" }),
    jurisdiction: z.string().optional().openapi({ example: "Telangana High Court" }),
  })
  .openapi("GenerateCounterRequest");

export const CaseQASchema = z
  .object({
    caseId: z.string().openapi({ example: "c_102" }),
    question: z.string().openapi({ example: "What was the judge's remark in the last interim injunction hearing?" }),
  })
  .openapi("CaseQARequest");

export const LegalQASchema = z
  .object({
    question: z.string().min(1).openapi({ example: "How do I file an FIR for online financial fraud?" }),
    context: z.string().optional().openapi({ example: "Telangana state jurisdiction" }),
    category: z.string().optional().openapi({ example: "Cyber Crime" }),
  })
  .openapi("LegalQARequest");

export const SummarizeDocSchema = z
  .object({
    documentText: z.string().optional().openapi({ example: "THIS LEASE DEED made this 12th day of January 2024..." }),
    documentTitle: z.string().optional().openapi({ example: "Commercial Lease Deed" }),
    focusArea: z.string().optional().openapi({ example: "Termination & Penalty Clauses" }),
  })
  .openapi("SummarizeDocRequest");

export const CaseAnalysisSchema = z
  .object({
    caseId: z.string().optional().openapi({ example: "CS-34410" }),
    briefText: z.string().optional().openapi({ example: "Title verification and civil partition dispute regarding ancestral agricultural property." }),
  })
  .openapi("CaseAnalysisRequest");

export const ContactInquirySchema = z
  .object({
    name: z.string().openapi({ example: "Ramesh Gupta" }),
    email: z.string().email().openapi({ example: "ramesh@example.com" }),
    phone: z.string().optional().openapi({ example: "+919876543210" }),
    category: z.string().optional().openapi({ example: "general" }),
    subject: z.string().optional().openapi({ example: "Platform consultation query" }),
    message: z.string().openapi({ example: "Need support uploading case docket evidence." }),
  })
  .openapi("ContactInquiryRequest");

export const UpdateInquiryStatusSchema = z
  .object({
    status: z.enum(["New", "In Progress", "In Review", "Resolved", "Closed", "Archived"]).openapi({ example: "In Progress" }),
  })
  .openapi("UpdateInquiryStatusRequest");

/**
 * `userId`/`role` are deliberately NOT part of this contract — they come from
 * the authenticated session (`c.get("user")`), not the request body. This
 * used to declare `{ token, deviceType }` while the controller actually read
 * `{ userId, role, deviceToken, deviceType }` from the body: two different
 * shapes that happened to coexist because nothing ever called this endpoint
 * to notice. Even if fixed to match the controller's old shape, trusting a
 * client-supplied `userId` would let any caller register a device token
 * under someone else's account — their future notifications would then push
 * to the attacker's device instead of (or as well as) the real owner's.
 */
export const RegisterFcmTokenSchema = z
  .object({
    deviceToken: z.string().min(1).openapi({ example: "fcm_token_device_abc123" }),
    deviceType: z.enum(["web", "android", "ios"]).optional().openapi({ example: "web" }),
  })
  .openapi("RegisterFcmTokenRequest");

export const TaxonomyItemSchema = z
  .object({
    name: z.string().openapi({ example: "Cyber Crime & IT Law" }),
    code: z.string().optional().openapi({ example: "CYBER" }),
    description: z.string().optional().openapi({ example: "Offenses under the IT Act 2000" }),
    stateId: z.string().optional().openapi({ example: "TS" }),
  })
  .openapi("TaxonomyItemRequest");
