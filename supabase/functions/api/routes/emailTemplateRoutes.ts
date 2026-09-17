import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { renderCitizenOtpEmail } from "../email-templates/index.ts";

const emailTemplates = new OpenAPIHono();

const previewCitizenOtpRoute = createRoute({
  method: "get",
  path: "/preview/citizen-otp",
  tags: ["Email Templates"],
  summary: "Preview rendered Citizen OTP email template in HTML (No Magic Links)",
  request: {
    query: z.object({
      token: z.string().optional().openapi({ example: "849201" }),
      name: z.string().optional().openapi({ example: "Vijay Sariyam" }),
    }),
  },
  responses: {
    200: {
      description: "Rendered HTML email template",
    },
  },
});

const previewConfirmSignupRoute = createRoute({
  method: "get",
  path: "/preview/confirm-signup",
  tags: ["Email Templates"],
  summary: "Preview rendered Confirm Signup email template in HTML (No Magic Links)",
  request: {
    query: z.object({
      token: z.string().optional().openapi({ example: "849201" }),
      name: z.string().optional().openapi({ example: "Vijay Sariyam" }),
    }),
  },
  responses: {
    200: {
      description: "Rendered HTML email template",
    },
  },
});

emailTemplates.openapi(previewCitizenOtpRoute, (c: any) => {
  const token = c.req.query("token") || "849201";
  const name = c.req.query("name") || "Vijay Sariyam";
  const html = renderCitizenOtpEmail({
    token,
    name,
    expiryMinutes: 10,
  });
  return c.html(html);
});

emailTemplates.openapi(previewConfirmSignupRoute, (c: any) => {
  const token = c.req.query("token") || "849201";
  const name = c.req.query("name") || "Vijay Sariyam";
  const html = renderCitizenOtpEmail({
    token,
    name,
    expiryMinutes: 10,
  });
  return c.html(html);
});

export default emailTemplates;
