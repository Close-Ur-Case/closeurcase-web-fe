import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  createCase,
  listCases,
  getCaseById,
  getCaseByCnr,
  updateCaseStatus,
  assignLawyer,
  addHearing,
  addCaseNote,
} from "../controllers/caseController.ts";
import {
  getCaseMessages,
  sendCaseMessage,
  markCaseMessagesRead,
} from "../controllers/chatController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import {
  CreateCaseSchema,
  UpdateCaseStatusSchema,
  AssignLawyerSchema,
  AddHearingSchema,
  AddCaseNoteSchema,
  SendChatMessageSchema,
  SuccessResponseSchema,
} from "../schemas/index.ts";

const caseRouter = new OpenAPIHono();
caseRouter.use(optionalAuth);

const listCasesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Cases"],
  summary: "List legal cases with filters",
  request: {
    query: z.object({
      citizenId: z.string().optional(),
      lawyerId: z.string().optional(),
      status: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "List of cases",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const createCaseRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Cases"],
  summary: "File a new legal case docket",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCaseSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Case created successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCaseByCnrRoute = createRoute({
  method: "get",
  path: "/cnr/:cnr",
  tags: ["Cases"],
  summary: "Lookup case by Indian court 16-digit CNR number",
  request: {
    params: z.object({
      cnr: z.string().openapi({ example: "TSHC010023452024" }),
    }),
  },
  responses: {
    200: {
      description: "Case docket details",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCaseByIdRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Cases"],
  summary: "Get complete case docket, timeline & notes",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "c_101" }),
    }),
  },
  responses: {
    200: {
      description: "Full case docket",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const updateCaseStatusRoute = createRoute({
  method: "patch",
  path: "/:id/status",
  tags: ["Cases"],
  summary: "Update case status",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "c_101" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateCaseStatusSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Status updated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const assignLawyerRoute = createRoute({
  method: "patch",
  path: "/:id/assign-lawyer",
  tags: ["Cases"],
  summary: "Assign advocate to case docket",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "c_101" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: AssignLawyerSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Lawyer assigned",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const addHearingRoute = createRoute({
  method: "post",
  path: "/:id/hearings",
  tags: ["Cases"],
  summary: "Schedule or record a court hearing date",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "c_101" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: AddHearingSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Hearing created",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const addCaseNoteRoute = createRoute({
  method: "post",
  path: "/:id/notes",
  tags: ["Cases"],
  summary: "Add confidential internal case note",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "c_101" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: AddCaseNoteSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Note added",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCaseMessagesRoute = createRoute({
  method: "get",
  path: "/:id/messages",
  tags: ["Chat"],
  summary: "Get consultation chat messages for a case",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "c_101" }),
    }),
  },
  responses: {
    200: {
      description: "List of chat messages",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const sendCaseMessageRoute = createRoute({
  method: "post",
  path: "/:id/messages",
  tags: ["Chat"],
  summary: "Send text message or file attachment in case chat",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "c_101" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: SendChatMessageSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Message sent",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const markCaseMessagesReadRoute = createRoute({
  method: "patch",
  path: "/:id/messages/read",
  tags: ["Chat"],
  summary: "Mark consultation chat messages as read",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "c_101" }),
    }),
  },
  responses: {
    200: {
      description: "Messages marked as read",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

caseRouter.openapi(listCasesRoute, listCases as any);
caseRouter.openapi(createCaseRoute, createCase as any);
caseRouter.openapi(getCaseByCnrRoute, getCaseByCnr as any);
caseRouter.openapi(getCaseByIdRoute, getCaseById as any);
caseRouter.openapi(updateCaseStatusRoute, updateCaseStatus as any);
caseRouter.openapi(assignLawyerRoute, assignLawyer as any);
caseRouter.openapi(addHearingRoute, addHearing as any);
caseRouter.openapi(addCaseNoteRoute, addCaseNote as any);
caseRouter.openapi(getCaseMessagesRoute, getCaseMessages as any);
caseRouter.openapi(sendCaseMessageRoute, sendCaseMessage as any);
caseRouter.openapi(markCaseMessagesReadRoute, markCaseMessagesRead as any);

export default caseRouter;
