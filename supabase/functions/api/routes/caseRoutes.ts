import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getLookups,
  getCaseTypes,
  getLawyerCaseStages,
  importCase,
  getImportedCase,
  listImportedCases,
  createUserCase,
  getUserCase,
  listUserCases,
  updateLawyerStage,
  assignLawyer,
  updateUserCase,
  deleteUserCase,
} from "../controllers/caseController.ts";
import {
  getCaseMessages,
  sendCaseMessage,
  markCaseMessagesRead,
} from "../controllers/chatController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import {
  CreateUserCaseSchema,
  UpdateUserCaseSchema,
  UpdateLawyerCaseStageSchema,
  ImportCaseSchema,
  AssignLawyerSchema,
  SendChatMessageSchema,
  ListLookupsQuerySchema,
  SuccessResponseSchema,
} from "../schemas/index.ts";

const caseRouter = new OpenAPIHono();
caseRouter.use(optionalAuth);

// ============================================================================
// Lookup Endpoints
// ============================================================================

const getLookupsRoute = createRoute({
  method: "get",
  path: "/lookups",
  tags: ["Cases - Lookups"],
  summary: "Get lookups filtered by optional category (case_type, lawyer_casestage)",
  request: {
    query: ListLookupsQuerySchema,
  },
  responses: {
    200: {
      description: "List of lookups",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCaseTypesRoute = createRoute({
  method: "get",
  path: "/types",
  tags: ["Cases - Lookups"],
  summary: "Get case types lookup list (sorted by sort_order)",
  responses: {
    200: {
      description: "List of case types (new, pending, closed)",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getLawyerCaseStagesRoute = createRoute({
  method: "get",
  path: "/stages",
  tags: ["Cases - Lookups"],
  summary: "Get lawyer case stages lookup list (sorted by sort_order)",
  responses: {
    200: {
      description: "List of lawyer stages (submitted, accepted, filinginprogress, cnrgenerated, rejected)",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

// ============================================================================
// 1. Cases Imported Endpoints (eCourts View-Only)
// ============================================================================

const importCaseRoute = createRoute({
  method: "post",
  path: "/imported/import",
  tags: ["Cases - Imported"],
  summary: "Import or sync case from eCourts API by CNR number",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ImportCaseSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Case imported successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getImportedCaseRoute = createRoute({
  method: "get",
  path: "/imported/:cnr",
  tags: ["Cases - Imported"],
  summary: "View imported eCourts case docket (strictly view-only)",
  request: {
    params: z.object({
      cnr: z.string().openapi({ example: "DLND020047882015" }),
    }),
  },
  responses: {
    200: {
      description: "Imported case docket strictly following case_structure.json",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const listImportedCasesRoute = createRoute({
  method: "get",
  path: "/imported",
  tags: ["Cases - Imported"],
  summary: "List imported eCourts cases",
  request: {
    query: z.object({
      search: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "List of imported cases",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

// ============================================================================
// 2. Cases User Endpoints (Booking & Representation)
// ============================================================================

const listUserCasesRoute = createRoute({
  method: "get",
  path: "/user",
  tags: ["Cases - User"],
  summary: "List user cases with filters",
  request: {
    query: z.object({
      citizenId: z.string().optional(),
      lawyerId: z.string().optional(),
      status: z.string().optional(),
      caseType: z.string().optional(),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "List of user cases",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const createUserCaseRoute = createRoute({
  method: "post",
  path: "/user",
  tags: ["Cases - User"],
  summary: "Book a lawyer & submit case details and documents",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserCaseSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Case created and advocate booked successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getUserCaseRoute = createRoute({
  method: "get",
  path: "/user/:id",
  tags: ["Cases - User"],
  summary: "Get user case docket by ID",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "CUC-20260831154512" }),
    }),
  },
  responses: {
    200: {
      description: "User case docket details",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const updateLawyerStageRoute = createRoute({
  method: "patch",
  path: "/user/:id/stage",
  tags: ["Cases - User"],
  summary: "Lawyer updates case stage from lawyer_casestages lookup",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "CUC-20260831154512" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateLawyerCaseStageSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Case stage updated successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const updateUserCaseRoute = createRoute({
  method: "patch",
  path: "/user/:id",
  tags: ["Cases - User"],
  summary: "Update user case fields (title, CNR, details, notes)",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "CUC-20260831154512" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateUserCaseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Case updated successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const deleteUserCaseRoute = createRoute({
  method: "delete",
  path: "/user/:id",
  tags: ["Cases - User"],
  summary: "Delete user case docket permanently",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "CUC-20260831154512" }),
    }),
  },
  responses: {
    200: {
      description: "Case deleted successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

// Root aliases for backward compatibility
const listRootCasesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Cases - User"],
  summary: "List cases (alias for /user)",
  responses: { 200: { description: "List of cases", content: { "application/json": { schema: SuccessResponseSchema } } } },
});

const createRootCaseRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Cases - User"],
  summary: "Create case (alias for /user)",
  request: { body: { content: { "application/json": { schema: CreateUserCaseSchema } } } },
  responses: { 201: { description: "Case created", content: { "application/json": { schema: SuccessResponseSchema } } } },
});

const getRootCaseRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Cases - User"],
  summary: "Get case by ID (alias for /user/:id)",
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Case docket", content: { "application/json": { schema: SuccessResponseSchema } } } },
});

const updateRootCaseRoute = createRoute({
  method: "patch",
  path: "/:id",
  tags: ["Cases - User"],
  summary: "Update case (alias for /user/:id)",
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: UpdateUserCaseSchema } } },
  },
  responses: { 200: { description: "Case updated", content: { "application/json": { schema: SuccessResponseSchema } } } },
});

const deleteRootCaseRoute = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["Cases - User"],
  summary: "Delete case (alias for /user/:id)",
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Case deleted", content: { "application/json": { schema: SuccessResponseSchema } } } },
});

const updateRootCaseStatusRoute = createRoute({
  method: "patch",
  path: "/:id/status",
  tags: ["Cases - User"],
  summary: "Update stage / status (alias for /user/:id/stage)",
  request: { params: z.object({ id: z.string() }), body: { content: { "application/json": { schema: UpdateLawyerCaseStageSchema } } } },
  responses: { 200: { description: "Status updated", content: { "application/json": { schema: SuccessResponseSchema } } } },
});

const assignLawyerRoute = createRoute({
  method: "patch",
  path: "/:id/assign-lawyer",
  tags: ["Cases - User"],
  summary: "Assign advocate to case docket",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "CUC-20260831154512" }),
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

// Chat Endpoints
const getCaseMessagesRoute = createRoute({
  method: "get",
  path: "/:id/messages",
  tags: ["Chat"],
  summary: "Get consultation chat messages for a user case",
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Chat messages", content: { "application/json": { schema: SuccessResponseSchema } } } },
});

const sendCaseMessageRoute = createRoute({
  method: "post",
  path: "/:id/messages",
  tags: ["Chat"],
  summary: "Send message in case chat",
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: SendChatMessageSchema } } },
  },
  responses: { 201: { description: "Message sent", content: { "application/json": { schema: SuccessResponseSchema } } } },
});

const markCaseMessagesReadRoute = createRoute({
  method: "patch",
  path: "/:id/messages/read",
  tags: ["Chat"],
  summary: "Mark messages as read",
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Messages read", content: { "application/json": { schema: SuccessResponseSchema } } } },
});

// Register routes
caseRouter.openapi(getLookupsRoute, getLookups as any);
caseRouter.openapi(getCaseTypesRoute, getCaseTypes as any);
caseRouter.openapi(getLawyerCaseStagesRoute, getLawyerCaseStages as any);

caseRouter.openapi(importCaseRoute, importCase as any);
caseRouter.openapi(getImportedCaseRoute, getImportedCase as any);
caseRouter.openapi(listImportedCasesRoute, listImportedCases as any);

caseRouter.openapi(listUserCasesRoute, listUserCases as any);
caseRouter.openapi(createUserCaseRoute, createUserCase as any);
caseRouter.openapi(getUserCaseRoute, getUserCase as any);
caseRouter.openapi(updateLawyerStageRoute, updateLawyerStage as any);
caseRouter.openapi(updateUserCaseRoute, updateUserCase as any);
caseRouter.openapi(deleteUserCaseRoute, deleteUserCase as any);

caseRouter.openapi(listRootCasesRoute, listUserCases as any);
caseRouter.openapi(createRootCaseRoute, createUserCase as any);
caseRouter.openapi(getRootCaseRoute, getUserCase as any);
caseRouter.openapi(updateRootCaseStatusRoute, updateLawyerStage as any);
caseRouter.openapi(updateRootCaseRoute, updateUserCase as any);
caseRouter.openapi(deleteRootCaseRoute, deleteUserCase as any);
caseRouter.openapi(assignLawyerRoute, assignLawyer as any);

caseRouter.openapi(getCaseMessagesRoute, getCaseMessages as any);
caseRouter.openapi(sendCaseMessageRoute, sendCaseMessage as any);
caseRouter.openapi(markCaseMessagesReadRoute, markCaseMessagesRead as any);

export default caseRouter;
