import { OpenAPIHono } from "@hono/zod-openapi";
import authRoutes from "./authRoutes.ts";
import citizenRoutes from "./citizenRoutes.ts";
import lawyerRoutes from "./lawyerRoutes.ts";
import caseRoutes from "./caseRoutes.ts";
import paymentRoutes from "./paymentRoutes.ts";
import withdrawalRoutes from "./withdrawalRoutes.ts";
import videoCallRoutes from "./videoCallRoutes.ts";
import notificationRoutes from "./notificationRoutes.ts";
import storageRoutes from "./storageRoutes.ts";
import knowledgeRoutes from "./knowledgeRoutes.ts";
import masterDataRoutes from "./masterDataRoutes.ts";
import supportRoutes from "./supportRoutes.ts";
import aiRoutes from "./aiRoutes.ts";
import adminRoutes from "./adminRoutes.ts";
import subscriptionRoutes from "./subscriptionRoutes.ts";
import emailTemplateRoutes from "./emailTemplateRoutes.ts";
import { ApiResponse } from "../utils/apiResponse.ts";

const api = new OpenAPIHono();

api.get("/health", (c) => {
  return ApiResponse.success(
    c,
    {
      status: "operational",
      runtime: "Supabase Edge Function (Deno)",
      framework: "Hono + @hono/zod-openapi",
      timestamp: new Date().toISOString(),
      service: "CloseUrCase Edge API",
    },
    "Edge function is healthy"
  );
});

api.route("/auth", authRoutes);
api.route("/citizens", citizenRoutes);
api.route("/lawyers", lawyerRoutes);
api.route("/cases", caseRoutes);
api.route("/payments", paymentRoutes);
api.route("/withdrawals", withdrawalRoutes);
api.route("/video-calls", videoCallRoutes);
api.route("/notifications", notificationRoutes);
api.route("/storage", storageRoutes);
api.route("/knowledge", knowledgeRoutes);
api.route("/master-data", masterDataRoutes);
api.route("/support", supportRoutes);
api.route("/ai", aiRoutes);
api.route("/admin", adminRoutes);
api.route("/subscriptions", subscriptionRoutes);
api.route("/email-templates", emailTemplateRoutes);

export default api;
