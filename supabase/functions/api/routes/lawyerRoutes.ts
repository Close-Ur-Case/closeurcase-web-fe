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
  getLawyerLanguages,
  setLawyerLanguages,
} from "../controllers/lawyerController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import {
  UpdateLawyerProfileSchema,
  ToggleAvailabilitySchema,
  UpdateBankDetailsSchema,
  ModerateLawyerSchema,
  SubmitRatingSchema,
  SyncLawyerLanguagesSchema,
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
      search: z.string().optional().openapi({ description: "Search keyword matching name, bio, barId, practiceAreas, specializations, or legalServices" }),
      city: z.string().optional().openapi({ example: "Hyderabad" }),
      area: z.string().optional().openapi({ example: "Banjara Hills" }),
      category: z.string().optional().openapi({ example: "Criminal Defense" }),
      status: z.string().optional().openapi({ example: "Approved", description: "Filter by registration verification status ('Approved', 'Pending', 'Rejected', 'Suspended')" }),
      availabilityStatus: z.string().optional().openapi({ example: "Online", description: "Filter by presence status ('Online', 'Offline', 'Busy')" }),
      availability_status: z.string().optional().openapi({ example: "Online", description: "Alias for availabilityStatus" }),
      practiceArea: z.string().optional().openapi({ example: "cat_1", description: "Filter by practice area ID (e.g. 'cat_1') or category name/code (comma-separated for multiple, e.g. 'cat_1,cat_6')" }),
      specialization: z.string().optional().openapi({ example: "spec_1_1", description: "Filter by specialization ID (e.g. 'spec_1_1') or name (comma-separated for multiple, e.g. 'spec_1_1,spec_1_2')" }),
      legalService: z.string().optional().openapi({ example: "srv_1_1_1", description: "Filter by legal service ID (e.g. 'srv_1_1_1') or name (comma-separated for multiple, e.g. 'srv_1_1_1,srv_1_1_2')" }),
      matchMode: z.enum(["all", "any"]).optional().openapi({ example: "all", description: "Taxonomy match mode: 'all' (default) requires matching all provided criteria, 'any' matches if any criteria matches" }),
      language: z.string().optional().openapi({ example: "Telugu", description: "Filter advocates by language name, code, or ID" }),
      limit: z.string().optional().openapi({ example: "50" }),
      offset: z.string().optional().openapi({ example: "0" }),
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
  security: [{ bearerAuth: [] }],
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
  security: [{ bearerAuth: [] }],
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
  security: [{ bearerAuth: [] }],
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
  security: [{ bearerAuth: [] }],
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
  security: [{ bearerAuth: [] }],
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
  security: [{ bearerAuth: [] }],
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

const getLawyerLanguagesRoute = createRoute({
  method: "get",
  path: "/:id/languages",
  tags: ["Lawyers"],
  summary: "Get languages linked to advocate from master data table",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "l_001", description: "Lawyer ID" }),
    }),
  },
  responses: {
    200: {
      description: "List of master data languages linked to this advocate",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const setLawyerLanguagesRoute = createRoute({
  method: "put",
  path: "/:id/languages",
  tags: ["Lawyers"],
  summary: "Synchronize advocate linked languages with master data table",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "l_001", description: "Lawyer ID" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: SyncLawyerLanguagesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Languages linked and synchronized successfully",
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
lawyer.openapi(getLawyerLanguagesRoute, getLawyerLanguages as any);
lawyer.openapi(setLawyerLanguagesRoute, setLawyerLanguages as any);

export default lawyer;
