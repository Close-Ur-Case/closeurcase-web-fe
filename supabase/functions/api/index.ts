import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import apiRoutes from "./routes/index.ts";
import { handleHonoError, handleNotFound } from "./middlewares/errorHandler.ts";
import { DbInitService } from "./services/dbInitService.ts";

const app = new OpenAPIHono();

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
const mainRouter = new OpenAPIHono();

// Mount standard V1 API routes
mainRouter.route("/v1", apiRoutes);

// Dynamic OpenAPI Documentation generated directly in-memory from Zod schemas
mainRouter.doc("/swagger.json", {
  openapi: "3.0.0",
  info: {
    title: "CloseUrCase Supabase Edge API",
    version: "1.0.0",
    description:
      "Production-ready REST API for CloseUrCase Platform running natively on Deno and Supabase Edge Functions with Zod + @hono/zod-openapi.",
  },
  servers: [
    {
      url: "http://localhost:8000",
      description: "Local Development Server",
    },
    {
      url: "https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api",
      description: "Supabase Cloud Edge Function (Production)",
    },
  ],
});

mainRouter.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "CloseUrCase Supabase Edge API",
    version: "1.0.0",
  },
});

// Swagger UI Documentation viewer
mainRouter.get("/api-docs", swaggerUI({ url: "./swagger.json" }) as any);

// Root Health & Information
mainRouter.get("/", (c) => {
  return c.json({
    service: "CloseUrCase Supabase Edge Function API",
    version: "1.0.0",
    runtime: "Deno / Supabase Edge with Zod + @hono/zod-openapi",
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

// Mount mainRouter on root, /api, and /functions/v1/api (for seamless local and cloud compatibility)
app.route("/functions/v1/api", mainRouter);
app.route("/api", mainRouter);
app.route("/", mainRouter);

// Error & 404 Handlers
app.notFound(handleNotFound);
app.onError(handleHonoError);

// Deno.serve serves the Hono app natively on Supabase Edge Functions
Deno.serve(app.fetch);
