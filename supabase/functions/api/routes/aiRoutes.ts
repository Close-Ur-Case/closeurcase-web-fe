import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  generateCounterArgument,
  caseQA,
  summarizeDocument,
  legalQA,
  caseAnalysis,
} from "../controllers/aiController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import {
  GenerateCounterSchema,
  CaseQASchema,
  SummarizeDocSchema,
  CaseAnalysisSchema,
  LegalQASchema,
  SuccessResponseSchema,
} from "../schemas/index.ts";

const ai = new OpenAPIHono();
ai.use(optionalAuth);

const generateCounterRoute = createRoute({
  method: "post",
  path: "/generate-counter",
  tags: ["AI Assistant"],
  summary: "Generate statutory & precedent-backed legal counter-argument",
  security: [{ bearerAuth: [] }],
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
  security: [{ bearerAuth: [] }],
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
  security: [{ bearerAuth: [] }],
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

const summarizeRoute = createRoute({
  method: "post",
  path: "/summarize",
  tags: ["AI Assistant"],
  summary: "Generate executive summary and extracted risks of legal document (alias)",
  security: [{ bearerAuth: [] }],
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

const caseAnalysisRoute = createRoute({
  method: "post",
  path: "/case-analysis",
  tags: ["AI Assistant"],
  summary: "Comprehensive AI statutory analysis of case docket, strengths, risks, precedents & timeline",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CaseAnalysisSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Case analysis report with strengths, risks, precedents, and timeline",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const legalQARoute = createRoute({
  method: "post",
  path: "/legal-qa",
  tags: ["AI Assistant"],
  summary: "Ask AI general legal questions powered by Indian statutes, BNSS/BNS, and knowledge base",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LegalQASchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Statutory legal answer, citations, and follow-ups returned",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const qaRoute = createRoute({
  method: "post",
  path: "/qa",
  tags: ["AI Assistant"],
  summary: "Ask AI general legal questions (alias)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LegalQASchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Statutory legal answer, citations, and follow-ups returned",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

ai.openapi(generateCounterRoute, generateCounterArgument as any);
ai.openapi(caseQARoute, caseQA as any);
ai.openapi(summarizeDocumentRoute, summarizeDocument as any);
ai.openapi(summarizeRoute, summarizeDocument as any);
ai.openapi(caseAnalysisRoute, caseAnalysis as any);
ai.openapi(legalQARoute, legalQA as any);
ai.openapi(qaRoute, legalQA as any);

export default ai;
