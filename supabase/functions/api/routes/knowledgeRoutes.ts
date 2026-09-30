import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getKnowledgeBase,
  getKnowledgeItemById,
  addKnowledgeItem,
  deleteKnowledgeItem,
} from "../controllers/knowledgeController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import { SuccessResponseSchema } from "../schemas/index.ts";

const knowledge = new OpenAPIHono();

const getKnowledgeBaseRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Knowledge Base"],
  summary: "Browse legal knowledge base articles & documents (Global or Personal)",
  description: "Retrieve knowledge items. Items are linked to case_categories. Scope can be filtered to global or personal.",
  middleware: [optionalAuth],
  request: {
    query: z.object({
      category: z.string().optional().openapi({ example: "cat_1", description: "Filter by category ID (e.g. cat_1) or category name from case_categories" }),
      scope: z.enum(["global", "personal", "all"]).optional().openapi({ example: "global", description: "Filter by 'global' (admin-curated) or 'personal' (lawyer My Docs)" }),
      lawyerId: z.string().optional().openapi({ example: "l_001" }),
      search: z.string().optional().openapi({ example: "BNS" }),
    }),
  },
  responses: {
    200: {
      description: "Knowledge base articles list",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getKnowledgeItemByIdRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["Knowledge Base"],
  summary: "Get specific knowledge article by ID",
  middleware: [optionalAuth],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "kb_101" }),
    }),
  },
  responses: {
    200: {
      description: "Knowledge article details",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const addKnowledgeItemRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Knowledge Base"],
  summary: "Add new knowledge article (Global for Admin, Personal for Lawyer)",
  description: "Upload and index a knowledge document. Category is linked to case_categories table.",
  middleware: [optionalAuth],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().openapi({ example: "Bharatiya Nyaya Sanhita (BNS) 2023" }),
            category: z.string().default("cat_1").openapi({ example: "cat_1", description: "Category ID from case_categories (e.g. cat_1, cat_2). Category name is also accepted and normalized." }),
            categoryId: z.string().optional().openapi({ example: "cat_1", description: "Alternative explicit category ID referencing case_categories" }),
            size: z.string().optional().openapi({ example: "2.4 MB" }),
            fileName: z.string().optional().openapi({ example: "bns-2023.pdf" }),
            fileMimeType: z.string().optional().openapi({ example: "application/pdf" }),
            fileUrl: z.string().optional().openapi({ example: "https://closeurcase.app/docs/bns-2023.pdf" }),
            scope: z.enum(["global", "personal"]).optional().openapi({ example: "global" }),
            lawyerId: z.string().optional().openapi({ example: "l_001" }),
            uploadedBy: z.string().optional().openapi({ example: "admin" }),
            content: z.string().optional().openapi({ example: "Document text or summary" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Article created",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const deleteKnowledgeItemRoute = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["Knowledge Base"],
  summary: "Delete knowledge article (Admin for global, Lawyer for own personal)",
  middleware: [optionalAuth],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "kb_101" }),
    }),
  },
  responses: {
    200: {
      description: "Article deleted",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

knowledge.openapi(getKnowledgeBaseRoute, getKnowledgeBase as any);
knowledge.openapi(getKnowledgeItemByIdRoute, getKnowledgeItemById as any);
knowledge.openapi(addKnowledgeItemRoute, addKnowledgeItem as any);
knowledge.openapi(deleteKnowledgeItemRoute, deleteKnowledgeItem as any);

export default knowledge;
