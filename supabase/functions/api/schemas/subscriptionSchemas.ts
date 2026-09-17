import { z } from "@hono/zod-openapi";

export const CreateSubscriptionSchema = z
  .object({
    citizenId: z.string().openapi({ example: "u_001" }),
    planId: z.enum(["free", "monthly", "yearly"]).openapi({ example: "monthly" }),
    amount: z.number().openapi({ example: 499 }),
  })
  .openapi("CreateSubscriptionRequest");
