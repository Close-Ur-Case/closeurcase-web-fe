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
    durationSeconds: z.number().openapi({ example: 900 }),
    callerId: z.string().optional().openapi({ example: "u_001" }),
    receiverId: z.string().optional().openapi({ example: "l_001" }),
  })
  .openapi("LogCallSessionRequest");

export const GenerateCounterSchema = z
  .object({
    argument: z.string().openapi({ example: "Petitioner claims adverse possession of property since 2010 without payment of municipal tax." }),
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

export const SummarizeDocSchema = z
  .object({
    documentText: z.string().openapi({ example: "THIS LEASE DEED made this 12th day of January 2024..." }),
    focusArea: z.string().optional().openapi({ example: "Termination & Penalty Clauses" }),
  })
  .openapi("SummarizeDocRequest");

export const ContactInquirySchema = z
  .object({
    name: z.string().openapi({ example: "Ramesh Gupta" }),
    email: z.string().email().openapi({ example: "ramesh@example.com" }),
    phone: z.string().optional().openapi({ example: "+919876543210" }),
    subject: z.string().optional().openapi({ example: "Platform consultation query" }),
    message: z.string().openapi({ example: "Need support uploading case docket evidence." }),
  })
  .openapi("ContactInquiryRequest");

export const RegisterFcmTokenSchema = z
  .object({
    token: z.string().openapi({ example: "fcm_token_device_abc123" }),
    deviceType: z.string().optional().openapi({ example: "web" }),
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
