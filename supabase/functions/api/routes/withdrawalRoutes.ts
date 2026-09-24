import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  requestWithdrawal,
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getWithdrawalSummary,
} from "../controllers/withdrawalController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import {
  CreateWithdrawalSchema,
  RejectWithdrawalSchema,
  SuccessResponseSchema,
} from "../schemas/index.ts";

const withdrawal = new OpenAPIHono();
withdrawal.use(optionalAuth);

const listWithdrawalsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Withdrawals"],
  summary: "List lawyer payout settlement requests",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      lawyerId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Payout requests list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const requestWithdrawalRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Withdrawals"],
  summary: "Submit lawyer earnings withdrawal request",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateWithdrawalSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Withdrawal requested",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getWithdrawalSummaryRoute = createRoute({
  method: "get",
  path: "/summary",
  tags: ["Withdrawals"],
  summary: "Get lawyer earnings balance, pending payouts and lifetime withdrawals",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      lawyerId: z.string().openapi({ example: "l_001" }),
    }),
  },
  responses: {
    200: {
      description: "Financial summary",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const approveWithdrawalRoute = createRoute({
  method: "patch",
  path: "/:id/approve",
  tags: ["Withdrawals"],
  summary: "Admin approve lawyer earnings withdrawal",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "w_101" }),
    }),
  },
  responses: {
    200: {
      description: "Payout approved",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const rejectWithdrawalRoute = createRoute({
  method: "patch",
  path: "/:id/reject",
  tags: ["Withdrawals"],
  summary: "Admin reject lawyer earnings withdrawal with reason",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "w_101" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: RejectWithdrawalSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Payout rejected",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

withdrawal.openapi(listWithdrawalsRoute, listWithdrawals as any);
withdrawal.openapi(requestWithdrawalRoute, requestWithdrawal as any);
withdrawal.openapi(getWithdrawalSummaryRoute, getWithdrawalSummary as any);
withdrawal.openapi(approveWithdrawalRoute, approveWithdrawal as any);
withdrawal.openapi(rejectWithdrawalRoute, rejectWithdrawal as any);

export default withdrawal;
