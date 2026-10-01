import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { summarizeCase } from "../controllers/aiController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import { SummarizeCaseSchema, SummarizeCaseResponseSchema } from "../schemas/index.ts";

const summarization = new OpenAPIHono();
summarization.use(optionalAuth);

export const summarizeCaseRoute = createRoute({
  method: "post",
  path: "/summarize-case",
  tags: ["AI Summarization"],
  summary: "AI Legal Case Summarization",
  description:
    "Analyzes case details and document attachments by calling external AI engine at Deno.env.get('AI_BASE_URL')/summarization/summarize-case. Returns an executive legal summary and bulleted key points.",
  request: {
    body: {
      required: true,
      description: "Case text and optional document URLs for summarization",
      content: {
        "application/json": {
          schema: SummarizeCaseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Case successfully summarized by AI engine",
      content: {
        "application/json": {
          schema: SummarizeCaseResponseSchema,
        },
      },
    },
  },
});

export const rootSummarizeCaseRoute = createRoute({
  method: "post",
  path: "/summarization/summarize-case",
  tags: ["AI Summarization"],
  summary: "AI Legal Case Summarization (Root endpoint)",
  description:
    "Direct root endpoint for AI case summarization calling Deno.env.get('AI_BASE_URL')/summarization/summarize-case.",
  request: {
    body: {
      required: true,
      description: "Case text and optional document URLs for summarization",
      content: {
        "application/json": {
          schema: SummarizeCaseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Case successfully summarized by AI engine",
      content: {
        "application/json": {
          schema: SummarizeCaseResponseSchema,
        },
      },
    },
  },
});

summarization.openapi(summarizeCaseRoute, summarizeCase as any);
summarization.openapi(rootSummarizeCaseRoute, summarizeCase as any);

export default summarization;
