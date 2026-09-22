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

/**
 * `PaymentService.completePayment` consumes more than the three Razorpay fields:
 * it needs `grossAmount` (a NOT NULL column, and the basis for the platform /
 * advocate split) plus the party and plan details it writes onto the receipt.
 * Those were previously undeclared — the controller reads the raw body, so they
 * arrived anyway, but the published contract didn't say so and any move to
 * `c.req.valid("json")` would have silently dropped them.
 */
export const VerifyPaymentSchema = z
  .object({
    razorpayOrderId: z.string().openapi({ example: "order_Qz891283719" }),
    razorpayPaymentId: z.string().openapi({ example: "pay_Qz891928371" }),
    razorpaySignature: z.string().openapi({ example: "9ef2837182937189271928" }),

    source: z
      .enum(["commission", "subscription"])
      .default("commission")
      .openapi({ description: "Subscription payments go to the platform in full" }),
    grossAmount: z
      .number()
      .positive()
      .openapi({ example: 999, description: "Total paid by the citizen, in INR" }),

    citizenId: z.string().optional().openapi({ example: "u_001" }),
    citizenName: z.string().optional(),
    lawyerId: z.string().optional().openapi({ example: "l_001" }),
    lawyerName: z.string().optional(),
    caseId: z.string().optional().openapi({ example: "CUC-20260831154512" }),
    caseTitle: z.string().optional(),

    planId: z.string().optional().openapi({ example: "monthly" }),
    planLabel: z.string().optional().openapi({ example: "Monthly Plan" }),
  })
  .openapi("VerifyPaymentRequest");
