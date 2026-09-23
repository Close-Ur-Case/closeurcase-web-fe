import { z } from "@hono/zod-openapi";

export const CreateWithdrawalSchema = z
  .object({
    lawyerId: z.string().openapi({ example: "l_001" }),
    amount: z.number().openapi({ example: 2500, description: "Payout amount in INR" }),
    lawyerName: z.string().optional().openapi({ example: "Adv. Rajesh Kumar" }),
    bankName: z.string().optional().openapi({ example: "HDFC Bank" }),
    accountNumber: z.string().optional().openapi({ example: "50100234567890" }),
    ifscCode: z.string().optional().openapi({ example: "HDFC0001234" }),
    notes: z.string().optional().openapi({ example: "Consultation payout request" }),
  })
  .openapi("CreateWithdrawalRequest");

export const RejectWithdrawalSchema = z
  .object({
    rejectionReason: z.string().openapi({ example: "Bank account details mismatch" }),
  })
  .openapi("RejectWithdrawalRequest");
