import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getCategories,
  getSpecializations,
  getLegalServices,
  getCities,
  getDistricts,
  getCourts,
  getLanguages,
  getStates,
  getCourtLevels,
  createTaxonomyItem,
  updateTaxonomyItem,
  deleteTaxonomyItem,
} from "../controllers/masterDataController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import { TaxonomyItemSchema, SuccessResponseSchema } from "../schemas/index.ts";

const masterData = new OpenAPIHono();
masterData.use(optionalAuth);

const getCategoriesRoute = createRoute({
  method: "get",
  path: "/categories",
  tags: ["Master Data"],
  summary: "Get legal practice areas & categories (with nested specializations & legal services)",
  responses: {
    200: {
      description: "Categories list with subCategories tree",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getSpecializationsRoute = createRoute({
  method: "get",
  path: "/specializations",
  tags: ["Master Data"],
  summary: "Get specializations / sub-categories (optionally filtered by categoryId)",
  request: {
    query: z.object({
      categoryId: z.string().optional().openapi({ example: "cat_1", description: "Filter by category ID" }),
    }),
  },
  responses: {
    200: {
      description: "List of specializations",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getLegalServicesRoute = createRoute({
  method: "get",
  path: "/legal-services",
  tags: ["Master Data"],
  summary: "Get individual legal services catalog (optionally filtered by specializationId or categoryId)",
  request: {
    query: z.object({
      categoryId: z.string().optional().openapi({ example: "cat_1", description: "Filter by category ID" }),
      specializationId: z.string().optional().openapi({ example: "spec_1_1", description: "Filter by specialization ID" }),
    }),
  },
  responses: {
    200: {
      description: "List of legal services",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCitiesRoute = createRoute({
  method: "get",
  path: "/cities",
  tags: ["Master Data"],
  summary: "Get supported Indian cities & tiers",
  responses: {
    200: {
      description: "Cities list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getDistrictsRoute = createRoute({
  method: "get",
  path: "/districts",
  tags: ["Master Data"],
  summary: "Get Indian districts",
  responses: {
    200: {
      description: "Districts list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCourtsRoute = createRoute({
  method: "get",
  path: "/courts",
  tags: ["Master Data"],
  summary: "Get Indian High Courts, District Courts, Tribunals & Supreme Court",
  responses: {
    200: {
      description: "Courts list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getLanguagesRoute = createRoute({
  method: "get",
  path: "/languages",
  tags: ["Master Data"],
  summary: "Get supported consultation languages (English, Hindi, Telugu, etc.)",
  responses: {
    200: {
      description: "Languages list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getStatesRoute = createRoute({
  method: "get",
  path: "/states",
  tags: ["Master Data"],
  summary: "Get Indian states and union territories",
  responses: {
    200: {
      description: "States list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getCourtLevelsRoute = createRoute({
  method: "get",
  path: "/court-levels",
  tags: ["Master Data"],
  summary: "Get court hierarchy tiers (Supreme Court, High Court, District, Taluka)",
  responses: {
    200: {
      description: "Court levels list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const createTaxonomyRoute = createRoute({
  method: "post",
  path: "/:type",
  tags: ["Master Data"],
  summary: "Admin add new taxonomy record (categories, cities, courts, etc.)",
  request: {
    params: z.object({
      type: z.enum(["categories", "cities", "districts", "courts", "states", "court-levels", "languages"]),
    }),
    body: {
      content: {
        "application/json": {
          schema: TaxonomyItemSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Taxonomy item created",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const updateTaxonomyRoute = createRoute({
  method: "put",
  path: "/:type/:id",
  tags: ["Master Data"],
  summary: "Admin update taxonomy item",
  request: {
    params: z.object({
      type: z.string(),
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: TaxonomyItemSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Taxonomy item updated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const deleteTaxonomyRoute = createRoute({
  method: "delete",
  path: "/:type/:id",
  tags: ["Master Data"],
  summary: "Admin delete taxonomy item",
  request: {
    params: z.object({
      type: z.string(),
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Taxonomy item deleted",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

masterData.openapi(getCategoriesRoute, getCategories as any);
masterData.openapi(getSpecializationsRoute, getSpecializations as any);
masterData.openapi(getLegalServicesRoute, getLegalServices as any);
masterData.openapi(getCitiesRoute, getCities as any);
masterData.openapi(getDistrictsRoute, getDistricts as any);
masterData.openapi(getCourtsRoute, getCourts as any);
masterData.openapi(getLanguagesRoute, getLanguages as any);
masterData.openapi(getStatesRoute, getStates as any);
masterData.openapi(getCourtLevelsRoute, getCourtLevels as any);
masterData.openapi(createTaxonomyRoute, createTaxonomyItem as any);
masterData.openapi(updateTaxonomyRoute, updateTaxonomyItem as any);
masterData.openapi(deleteTaxonomyRoute, deleteTaxonomyItem as any);

export default masterData;
