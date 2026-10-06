import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { getMockEcourtsCase } from "../controllers/ecourtsController.ts";
import {
  EcourtsCaseDocketSchema,
  EcourtsCnrParamSchema,
  EcourtsQuerySchema,
} from "../schemas/ecourtsSchemas.ts";
import { SuccessResponseSchema, ErrorResponseSchema } from "../schemas/commonSchemas.ts";

const ecourtsRouter = new OpenAPIHono();

const getMockCaseRoute = createRoute({
  method: "get",
  path: "/cases/{cnr}",
  tags: ["eCourts Mock API"],
  summary: "Generate deterministic fake eCourts case docket by 16-digit CNR (no DB)",
  description:
    "Generates realistic, standardized Indian eCourts case data on-the-fly based purely on the 16-character alphanumeric CNR without reading or writing to any database. Identical CNRs produce identical outputs.",
  request: {
    params: EcourtsCnrParamSchema,
    query: EcourtsQuerySchema,
  },
  responses: {
    200: {
      description: "eCourts docket generated successfully",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid CNR number or parameter error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const getMockCaseRootAliasRoute = createRoute({
  method: "get",
  path: "/{cnr}",
  tags: ["eCourts Mock API"],
  summary: "Alias: Generate fake eCourts case docket by 16-digit CNR",
  description: "Alias for /cases/{cnr}",
  request: {
    params: EcourtsCnrParamSchema,
    query: EcourtsQuerySchema,
  },
  responses: {
    200: {
      description: "eCourts docket generated successfully",
      content: {
        "application/json": {
          schema: SuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid CNR number",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

ecourtsRouter.openapi(getMockCaseRoute, getMockEcourtsCase as any);
ecourtsRouter.openapi(getMockCaseRootAliasRoute, getMockEcourtsCase as any);

export default ecourtsRouter;
