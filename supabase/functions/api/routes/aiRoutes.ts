import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  generateCounterArgument,
  caseQA,
  summarizeDocument,
} from "../controllers/aiController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import {
  GenerateCounterSchema,
  CaseQASchema,
  SummarizeDocSchema,
  SuccessResponseSchema,
} from "../schemas/index.ts";

const ai = new OpenAPIHono();
ai.use(optionalAuth);

const generateCounterRoute = createRoute({
  method: "post",
  path: "/generate-counter",
  tags: ["AI Assistant"],
  summary: "Generate statutory & precedent-backed legal counter-argument",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GenerateCounterSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Counter-argument with legal authorities and statutory provisions returned",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const caseQARoute = createRoute({
  method: "post",
  path: "/case-qa",
  tags: ["AI Assistant"],
  summary: "Ask AI questions regarding case docket, orders, and hearings timeline",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CaseQASchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Contextual legal answer returned",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const summarizeDocumentRoute = createRoute({
  method: "post",
  path: "/summarize-document",
  tags: ["AI Assistant"],
  summary: "Generate executive summary, key clauses, and liability risks of legal document",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SummarizeDocSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Executive summary and extracted risks returned",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

ai.openapi(generateCounterRoute, generateCounterArgument as any);
ai.openapi(caseQARoute, caseQA as any);
ai.openapi(summarizeDocumentRoute, summarizeDocument as any);

export default ai;
