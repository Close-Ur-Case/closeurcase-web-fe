import type { Context } from "hono";
import { StorageService } from "../services/storageService.ts";
import { env } from "../config/env.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function uploadFile(c: Context) {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw ApiError.badRequest("No file uploaded. Send file under form field 'file'");
  }

  const bucket = (formData.get("bucket") as string) || env.STORAGE.CASE_DOCUMENTS;
  const folder = formData.get("folder") ? `${formData.get("folder")}/` : "";
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${folder}${timestamp}_${sanitizedName}`;

  const arrayBuffer = await file.arrayBuffer();
  const result = await StorageService.uploadFile({
    bucket,
    filePath,
    fileBuffer: new Uint8Array(arrayBuffer),
    mimeType: file.type,
  });

  return ApiResponse.created(
    c,
    {
      fileName: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      mimeType: file.type,
      bucket,
      filePath: result.path,
      fileUrl: result.url,
    },
    "File uploaded to Supabase Storage successfully",
  );
}

export async function getSignedUrl(c: Context) {
  const bucket = c.req.query("bucket") || env.STORAGE.CASE_DOCUMENTS;
  const filePath = c.req.query("filePath") || c.req.query("path");
  const expiresIn = Number(c.req.query("expiresIn") || "3600");

  if (!filePath) {
    throw ApiError.badRequest("filePath or path is a required query parameter");
  }

  const signedUrl = await StorageService.getSignedUrl({ bucket, filePath, expiresIn });
  return ApiResponse.success(c, { signedUrl }, "Signed URL generated successfully");
}
