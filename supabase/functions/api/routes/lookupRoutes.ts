import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { getLookups } from "../controllers/caseController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import { ListLookupsQuerySchema, SuccessResponseSchema } from "../schemas/index.ts";

const lookupRouter = new OpenAPIHono();
lookupRouter.use(optionalAuth);

const getProjectLookupsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Project Lookups"],
  summary: "Get centralized project lookup items (optionally filtered by category)",
  request: {
    query: ListLookupsQuerySchema,
  },
  responses: {
    200: {
      description: "List of lookup items",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

lookupRouter.openapi(getProjectLookupsRoute, getLookups as any);

export default lookupRouter;
