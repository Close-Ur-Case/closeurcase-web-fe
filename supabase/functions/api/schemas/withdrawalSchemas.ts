import { z } from "@hono/zod-openapi";

export const CreateWithdrawalSchema = z
  .object({
    lawyerId: z.string().openapi({ example: "l_001" }),
    amount: z.number().openapi({ example: 2500, description: "Payout amount in INR" }),
    notes: z.string().optional().openapi({ example: "Consultation payout request" }),
  })
  .openapi("CreateWithdrawalRequest");

export const RejectWithdrawalSchema = z
  .object({
    rejectionReason: z.string().openapi({ example: "Bank account details mismatch" }),
  })
  .openapi("RejectWithdrawalRequest");
