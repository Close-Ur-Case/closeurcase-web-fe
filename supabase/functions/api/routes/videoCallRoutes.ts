import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  generateAgoraToken,
  logCallSession,
  getCallHistory,
} from "../controllers/videoCallController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import {
  GenerateAgoraTokenSchema,
  LogCallSessionSchema,
  SuccessResponseSchema,
} from "../schemas/index.ts";

const videoCall = new OpenAPIHono();
videoCall.use(optionalAuth);

const generateTokenRoute = createRoute({
  method: "post",
  path: "/token",
  tags: ["Video Calls"],
  summary: "Generate secure Agora RTC authentication token for client-advocate call",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: GenerateAgoraTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "RTC token generated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const logSessionRoute = createRoute({
  method: "post",
  path: "/log",
  tags: ["Video Calls"],
  summary: "Log completed consultation video call duration and metadata",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LogCallSessionSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Call logged",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCallHistoryRoute = createRoute({
  method: "get",
  path: "/history/:caseId",
  tags: ["Video Calls"],
  summary: "Get consultation call records for a case",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      caseId: z.string().openapi({ example: "c_102" }),
    }),
  },
  responses: {
    200: {
      description: "Call history list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const listCallsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Video Calls"],
  summary: "Get consultation call records list",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      caseId: z.string().optional().openapi({ example: "c_101" }),
    }),
  },
  responses: {
    200: {
      description: "Call history list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCallHistoryRootRoute = createRoute({
  method: "get",
  path: "/history",
  tags: ["Video Calls"],
  summary: "Get consultation call records list (alias)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      caseId: z.string().optional().openapi({ example: "c_101" }),
    }),
  },
  responses: {
    200: {
      description: "Call history list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

videoCall.openapi(generateTokenRoute, generateAgoraToken as any);
videoCall.openapi(logSessionRoute, logCallSession as any);
videoCall.openapi(listCallsRoute, getCallHistory as any);
videoCall.openapi(getCallHistoryRootRoute, getCallHistory as any);
videoCall.openapi(getCallHistoryRoute, getCallHistory as any);

export default videoCall;
