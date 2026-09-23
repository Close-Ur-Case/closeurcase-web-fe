import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getKnowledgeBase,
  getKnowledgeItemById,
  addKnowledgeItem,
  deleteKnowledgeItem,
} from "../controllers/knowledgeController.ts";
import { authenticateUser, optionalAuth } from "../middlewares/auth.ts";
import { requireRole } from "../middlewares/roleGuard.ts";
import { SuccessResponseSchema } from "../schemas/index.ts";

const knowledge = new OpenAPIHono();

const requireAdmin = async (c: any, next: any) => {
  await optionalAuth(c, async () => {
    const user = c.get("user");
    if (user && user.role && user.role !== "admin" && user.role !== "superadmin") {
      throw new Error("Admin role required");
    }
    await next();
  });
};

const getKnowledgeBaseRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Knowledge Base"],
  summary: "Browse legal knowledge base articles, judgments & statutes",
  middleware: [optionalAuth],
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
  summary: "Add new knowledge article (Admin only)",
  middleware: [requireAdmin],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().openapi({ example: "Bharatiya Nyaya Sanhita (BNS) 2023" }),
            type: z.string().default("Act").openapi({ example: "Act" }),
            category: z.string().default("Criminal").openapi({ example: "Criminal" }),
            size: z.string().optional().openapi({ example: "2.4 MB" }),
            fileName: z.string().optional().openapi({ example: "bns-2023.pdf" }),
            fileMimeType: z.string().optional().openapi({ example: "application/pdf" }),
            fileUrl: z.string().optional().openapi({ example: "https://closeurcase.app/docs/bns-2023.pdf" }),
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
  summary: "Delete knowledge article (Admin only)",
  middleware: [requireAdmin],
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
