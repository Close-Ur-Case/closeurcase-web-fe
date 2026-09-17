import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getCitizens,
  getCitizenById,
  updateCitizenProfile,
  getMySubscriptions,
  getMe,
  updateMe,
} from "../controllers/citizenController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import { SuccessResponseSchema } from "../schemas/index.ts";

const citizen = new OpenAPIHono();
citizen.use(optionalAuth);

const getMeRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["Citizens"],
  summary: "Get logged-in citizen profile & preferences",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current citizen profile",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const updateMeRoute = createRoute({
  method: "patch",
  path: "/me",
  tags: ["Citizens"],
  summary: "Update logged-in citizen profile details",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            fullName: z.string().optional().openapi({ example: "Vijay Sariyam" }),
            city: z.string().optional().openapi({ example: "Hyderabad" }),
            state: z.string().optional().openapi({ example: "Telangana" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Profile updated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCitizensRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Citizens"],
  summary: "List citizens directory (Admin)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      search: z.string().optional(),
      page: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Paginated list of citizens",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCitizenByIdRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Citizens"],
  summary: "Get citizen profile by ID",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "u_001" }),
    }),
  },
  responses: {
    200: {
      description: "Citizen profile details",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const updateCitizenProfileRoute = createRoute({
  method: "patch",
  path: "/:id",
  tags: ["Citizens"],
  summary: "Update citizen profile by ID",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "u_001" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            fullName: z.string().optional(),
            phone: z.string().optional(),
            email: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Citizen updated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getMySubscriptionsRoute = createRoute({
  method: "get",
  path: "/:citizenId/subscriptions",
  tags: ["Subscriptions"],
  summary: "Get active subscription plan and usage for a citizen",
  request: {
    params: z.object({
      citizenId: z.string().openapi({ example: "u_001" }),
    }),
  },
  responses: {
    200: {
      description: "Active subscription details",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

citizen.openapi(getMeRoute, getMe as any);
citizen.openapi(updateMeRoute, updateMe as any);
citizen.openapi(getCitizensRoute, getCitizens as any);
citizen.openapi(getCitizenByIdRoute, getCitizenById as any);
citizen.openapi(updateCitizenProfileRoute, updateCitizenProfile as any);
citizen.openapi(getMySubscriptionsRoute, getMySubscriptions as any);

export default citizen;
