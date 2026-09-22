import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getDashboardStats, getAdminMe, updateAdminMe } from "../controllers/adminController.ts";
import { optionalAuth, authenticateUser } from "../middlewares/auth.ts";
import { SuccessResponseSchema } from "../schemas/index.ts";

const admin = new OpenAPIHono();
admin.use(optionalAuth);
// `/me` needs a real identity to know whose profile to read/write — updating
// falls back to "the first admin_profiles row" otherwise, which is fine for
// `dashboard-stats` (read-only aggregates) but not for a per-admin write.
admin.use("/me", authenticateUser);

const getDashboardStatsRoute = createRoute({
  method: "get",
  path: "/dashboard-stats",
  tags: ["Admin"],
  summary: "Get superadmin platform overview metrics & financials",
  description: "Returns aggregated metrics including total cases, active lawyers, citizen count, monthly revenue, pending verifications, and settlement balances.",
  responses: {
    200: {
      description: "Overview analytics and financial metrics",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getAdminMeRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["Admin"],
  summary: "Get the signed-in admin's own profile",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current admin profile",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const updateAdminMeRoute = createRoute({
  method: "patch",
  path: "/me",
  tags: ["Admin"],
  summary: "Update (or create, on first save) the signed-in admin's own profile",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().optional().openapi({ example: "Platform Ops" }),
            email: z.string().email().optional().openapi({ example: "ops@closeur.legal" }),
            phone: z.string().optional().openapi({ example: "+91 90000 11122" }),
            city: z.string().optional().openapi({ example: "Hyderabad" }),
            currentLocation: z.string().optional().openapi({ example: "Hyderabad, Telangana" }),
            avatarUrl: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Admin profile saved",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

admin.openapi(getDashboardStatsRoute, getDashboardStats as any);
admin.openapi(getAdminMeRoute, getAdminMe as any);
admin.openapi(updateAdminMeRoute, updateAdminMe as any);

export default admin;
