import { z } from "@hono/zod-openapi";

export const CreateSubscriptionSchema = z
  .object({
    citizenId: z.string().openapi({ example: "u_001" }),
    planId: z.enum(["free", "daily", "monthly", "yearly"]).openapi({ example: "daily" }),
    amount: z.number().openapi({ example: 1 }),
    planLabel: z.string().optional().openapi({ example: "Daily Pass" }),
    expiresAt: z.string().optional().openapi({ example: "2026-09-22" }),
    caseId: z.string().optional().openapi({ example: "CUC-20260918120813" }),
  })
  .openapi("CreateSubscriptionRequest");
