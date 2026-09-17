import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getLawyers,
  getLawyerById,
  updateLawyerStatus,
  updateLawyerProfile,
  submitRating,
  toggleAvailability,
  updateBankDetails,
  moderateLawyer,
} from "../controllers/lawyerController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import {
  UpdateLawyerProfileSchema,
  ToggleAvailabilitySchema,
  UpdateBankDetailsSchema,
  ModerateLawyerSchema,
  SubmitRatingSchema,
  SuccessResponseSchema,
} from "../schemas/index.ts";

const lawyer = new OpenAPIHono();
lawyer.use(optionalAuth);

const getLawyersRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Lawyers"],
  summary: "Search & browse verified lawyers directory",
  request: {
    query: z.object({
      search: z.string().optional(),
      city: z.string().optional(),
      practiceArea: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "List of verified advocates",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getLawyerByIdRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Lawyers"],
  summary: "Get lawyer public profile, badges, ratings & fee structure",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "l_001" }),
    }),
  },
  responses: {
    200: {
      description: "Advocate profile details",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const updateLawyerProfileRoute = createRoute({
  method: "patch",
  path: "/:id",
  tags: ["Lawyers"],
  summary: "Update advocate profile details",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "l_001" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateLawyerProfileSchema,
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

const updateLawyerStatusRoute = createRoute({
  method: "patch",
  path: "/:id/status",
  tags: ["Lawyers"],
  summary: "Update lawyer active/inactive status",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "l_001" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.enum(["Active", "Inactive", "Busy"]).openapi({ example: "Active" }),
          }),
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

const moderateLawyerRoute = createRoute({
  method: "patch",
  path: "/:id/moderate",
  tags: ["Admin"],
  summary: "Superadmin approve or reject advocate verification credentials",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "l_001" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: ModerateLawyerSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Moderation status updated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const toggleAvailabilityRoute = createRoute({
  method: "patch",
  path: "/:id/availability",
  tags: ["Lawyers"],
  summary: "Toggle online availability for instant consultation calls",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "l_001" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: ToggleAvailabilitySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Availability toggled",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const updateBankDetailsRoute = createRoute({
  method: "patch",
  path: "/:id/bank-details",
  tags: ["Lawyers"],
  summary: "Save advocate bank account details for settlement payouts",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "l_001" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateBankDetailsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Bank details updated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const submitRatingRoute = createRoute({
  method: "post",
  path: "/:id/ratings",
  tags: ["Lawyers"],
  summary: "Submit citizen review and star rating for completed consultation",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "l_001" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: SubmitRatingSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Rating submitted",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

lawyer.openapi(getLawyersRoute, getLawyers as any);
lawyer.openapi(getLawyerByIdRoute, getLawyerById as any);
lawyer.openapi(updateLawyerProfileRoute, updateLawyerProfile as any);
lawyer.openapi(updateLawyerStatusRoute, updateLawyerStatus as any);
lawyer.openapi(moderateLawyerRoute, moderateLawyer as any);
lawyer.openapi(toggleAvailabilityRoute, toggleAvailability as any);
lawyer.openapi(updateBankDetailsRoute, updateBankDetails as any);
lawyer.openapi(submitRatingRoute, submitRating as any);

export default lawyer;
