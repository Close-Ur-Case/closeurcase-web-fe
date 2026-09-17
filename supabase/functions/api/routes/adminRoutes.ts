import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { getDashboardStats } from "../controllers/adminController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import { SuccessResponseSchema } from "../schemas/index.ts";

const admin = new OpenAPIHono();
admin.use(optionalAuth);

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

admin.openapi(getDashboardStatsRoute, getDashboardStats as any);

export default admin;
