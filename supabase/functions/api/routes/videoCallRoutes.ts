import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  generateAgoraToken,
  initiateVideoCall,
  getIncomingCall,
  respondToCall,
  getCallStatus,
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

const initiateCallRoute = createRoute({
  method: "post",
  path: "/initiate",
  tags: ["Video Calls"],
  summary: "Initiate an outgoing 1-on-1 video call and ring the recipient",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            caseId: z.string().openapi({ example: "c_102" }),
            withName: z.string().openapi({ example: "Adv. Rajesh Kumar" }),
            callerId: z.string().optional().openapi({ example: "u_001" }),
            callerName: z.string().optional().openapi({ example: "John Doe" }),
            receiverId: z.string().optional().openapi({ example: "l_001" }),
            role: z.enum(["citizen", "lawyer"]).default("citizen"),
            channelName: z.string().optional().openapi({ example: "case_c_102" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Call initiated with ringing status",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getIncomingCallRoute = createRoute({
  method: "get",
  path: "/incoming",
  tags: ["Video Calls"],
  summary: "Check for active ringing incoming calls for current participant",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      caseId: z.string().optional().openapi({ example: "c_102" }),
      userId: z.string().optional().openapi({ example: "l_001" }),
    }),
  },
  responses: {
    200: {
      description: "Incoming call data or null",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const respondCallRoute = createRoute({
  method: "post",
  path: "/respond",
  tags: ["Video Calls"],
  summary: "Accept, decline, or cancel an active video call invitation",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            callId: z.string().openapi({ example: "vc_1720000000" }),
            action: z.enum(["accepted", "declined", "cancelled", "missed", "completed"]),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Call status updated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCallStatusRoute = createRoute({
  method: "get",
  path: "/status/:id",
  tags: ["Video Calls"],
  summary: "Get current status of a call session",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "vc_1720000000" }),
    }),
  },
  responses: {
    200: {
      description: "Call status data",
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
videoCall.openapi(initiateCallRoute, initiateVideoCall as any);
videoCall.openapi(getIncomingCallRoute, getIncomingCall as any);
videoCall.openapi(respondCallRoute, respondToCall as any);
videoCall.openapi(getCallStatusRoute, getCallStatus as any);
videoCall.openapi(logSessionRoute, logCallSession as any);
videoCall.openapi(listCallsRoute, getCallHistory as any);
videoCall.openapi(getCallHistoryRootRoute, getCallHistory as any);
videoCall.openapi(getCallHistoryRoute, getCallHistory as any);

export default videoCall;
