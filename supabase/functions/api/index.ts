import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import { swaggerDocument } from "./config/swagger.ts";
import apiRoutes from "./routes/index.ts";
import { handleHonoError, handleNotFound } from "./middlewares/errorHandler.ts";
import { DbInitService } from "./services/dbInitService.ts";

const app = new Hono();

// Global Logger and CORS
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["authorization", "content-type", "x-client-info", "apikey", "x-razorpay-signature"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["content-length"],
    maxAge: 600,
  })
);

// Inner router to support both local root paths and Supabase Edge Function /api prefix
const mainRouter = new Hono();

// Swagger Documentation UI
mainRouter.get("/api-docs", swaggerUI({ url: "./swagger.json" }) as any);
mainRouter.get("/swagger.json", (c) => c.json(swaggerDocument));

// Root Health & Information
mainRouter.get("/", (c) => {
  return c.json({
    service: "CloseUrCase Supabase Edge Function API",
    version: "1.0.0",
    runtime: "Deno / Supabase Edge",
    docs: "/api-docs",
    health: "/health",
  });
});

mainRouter.get("/health", (c) => {
  return c.json({
    status: "operational",
    runtime: "Supabase Edge Runtime",
    timestamp: new Date().toISOString(),
  });
});

// Database Auto-Initialization & Seeding Endpoint (1st run setup)
mainRouter.all("/init-db", async (c) => {
  try {
    const result = await DbInitService.initializeDatabase();
    return c.json(result, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Mount V1 and base API routes
mainRouter.route("/v1", apiRoutes);
mainRouter.route("/", apiRoutes);

// Mount mainRouter on BOTH "/" (local development) and "/api" (Supabase Edge Function production gateway)
app.route("/api", mainRouter);
app.route("/", mainRouter);

// Error & 404 Handlers
app.notFound(handleNotFound);
app.onError(handleHonoError);

// Deno.serve serves the Hono app natively on Supabase Edge Functions
Deno.serve(app.fetch);
