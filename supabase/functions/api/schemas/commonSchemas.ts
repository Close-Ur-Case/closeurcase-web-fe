import { z } from "@hono/zod-openapi";

export const SuccessResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().optional().openapi({ example: "Operation completed successfully" }),
    data: z.any().optional(),
  })
  .openapi("SuccessResponse");

export const ErrorResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: false }),
    statusCode: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Invalid request payload" }),
    error: z.string().optional().openapi({ example: "Bad Request" }),
  })
  .openapi("ErrorResponse");
