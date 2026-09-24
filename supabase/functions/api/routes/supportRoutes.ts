import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { submitContactInquiry, listContactInquiries, updateInquiryStatus } from "../controllers/supportController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import { ContactInquirySchema, UpdateInquiryStatusSchema, SuccessResponseSchema } from "../schemas/index.ts";

const support = new OpenAPIHono();

const submitContactRoute = createRoute({
  method: "post",
  path: "/contact",
  tags: ["Support"],
  summary: "Submit public contact inquiry or support request",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ContactInquirySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Inquiry submitted",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const listInquiriesRoute = createRoute({
  method: "get",
  path: "/inquiries",
  tags: ["Support"],
  summary: "List customer contact inquiries (Admin)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.enum(["New", "In Progress", "In Review", "Resolved", "Closed", "Archived"]).optional().openapi({ example: "New" }),
    }),
  },
  responses: {
    200: {
      description: "Inquiries list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const updateInquiryRoute = createRoute({
  method: "patch",
  path: "/inquiries/:id",
  tags: ["Support"],
  summary: "Update customer inquiry status (Admin)",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "inq_1789980000000" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateInquiryStatusSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Inquiry status updated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

support.use("/inquiries", optionalAuth);
support.use("/inquiries/*", optionalAuth);
support.openapi(submitContactRoute, submitContactInquiry as any);
support.openapi(listInquiriesRoute, listContactInquiries as any);
support.openapi(updateInquiryRoute, updateInquiryStatus as any);

export default support;
