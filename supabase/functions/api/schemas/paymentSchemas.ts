import { z } from "@hono/zod-openapi";

export const CreatePaymentOrderSchema = z
  .object({
    amount: z.number().openapi({ example: 500, description: "Amount in INR" }),
    currency: z.string().default("INR").openapi({ example: "INR" }),
    caseId: z.string().optional().openapi({ example: "c_102" }),
    subscriptionId: z.string().optional().openapi({ example: "sub_301" }),
    notes: z.record(z.any()).optional(),
  })
  .openapi("CreatePaymentOrderRequest");

export const VerifyPaymentSchema = z
  .object({
    razorpayOrderId: z.string().openapi({ example: "order_Qz891283719" }),
    razorpayPaymentId: z.string().openapi({ example: "pay_Qz891928371" }),
    razorpaySignature: z.string().openapi({ example: "9ef2837182937189271928" }),
  })
  .openapi("VerifyPaymentRequest");
