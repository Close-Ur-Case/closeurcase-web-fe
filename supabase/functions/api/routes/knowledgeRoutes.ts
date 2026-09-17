import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getKnowledgeBase,
  addKnowledgeItem,
  deleteKnowledgeItem,
} from "../controllers/knowledgeController.ts";
import { authenticateUser, optionalAuth } from "../middlewares/auth.ts";
import { requireRole } from "../middlewares/roleGuard.ts";
import { SuccessResponseSchema } from "../schemas/index.ts";

const knowledge = new OpenAPIHono();

const requireAdmin = async (c: any, next: any) => {
  await authenticateUser(c, async () => {
    await requireRole("admin")(c, next);
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
            title: z.string().openapi({ example: "Limitation Act: Article 65 Overview" }),
            content: z.string().openapi({ example: "Detailed precedent analysis..." }),
            category: z.string().optional().openapi({ example: "Property Law" }),
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
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string", example: "kb_101" },
    },
  ],
  responses: {
    200: {
      description: "Article deleted",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

knowledge.openapi(getKnowledgeBaseRoute, getKnowledgeBase as any);
knowledge.openapi(addKnowledgeItemRoute, addKnowledgeItem as any);
knowledge.openapi(deleteKnowledgeItemRoute, deleteKnowledgeItem as any);

export default knowledge;
