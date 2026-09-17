import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { submitContactInquiry, listContactInquiries } from "../controllers/supportController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import { ContactInquirySchema, SuccessResponseSchema } from "../schemas/index.ts";

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
  responses: {
    200: {
      description: "Inquiries list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

support.use("/inquiries", optionalAuth);
support.openapi(submitContactRoute, submitContactInquiry as any);
support.openapi(listInquiriesRoute, listContactInquiries as any);

export default support;
