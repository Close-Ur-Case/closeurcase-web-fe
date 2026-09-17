import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { uploadFile, getSignedUrl } from "../controllers/storageController.ts";
import { authenticateUser } from "../middlewares/auth.ts";
import { SuccessResponseSchema } from "../schemas/index.ts";

const storage = new OpenAPIHono();
storage.use(authenticateUser);

const uploadFileRoute = createRoute({
  method: "post",
  path: "/upload",
  tags: ["Storage"],
  summary: "Upload case legal documents, petition PDFs, and evidence files",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.string().openapi({ format: "binary" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "File uploaded to Supabase Storage",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getSignedUrlRoute = createRoute({
  method: "get",
  path: "/signed-url",
  tags: ["Storage"],
  summary: "Get time-limited secure signed download URL for private case document",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      path: z.string().openapi({ example: "cases/c_101/petition.pdf" }),
    }),
  },
  responses: {
    200: {
      description: "Signed download URL",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

storage.openapi(uploadFileRoute, uploadFile as any);
storage.openapi(getSignedUrlRoute, getSignedUrl as any);

export default storage;
