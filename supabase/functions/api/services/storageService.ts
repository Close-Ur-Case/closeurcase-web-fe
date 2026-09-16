import { supabaseAdmin } from "../config/supabase.ts";
import { env } from "../config/env.ts";
import { ApiError } from "../utils/apiError.ts";

export class StorageService {
  static async uploadFile({ bucket, filePath, fileBuffer, mimeType }: {
    bucket: string;
    filePath: string;
    fileBuffer: Uint8Array | ArrayBuffer;
    mimeType?: string;
  }) {
    if (!bucket || !filePath || !fileBuffer) {
      throw ApiError.badRequest("bucket, filePath, and fileBuffer are required");
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType || "application/octet-stream",
        upsert: true,
      });

    if (error) {
      throw ApiError.badRequest(`Supabase Storage upload error: ${error.message}`);
    }

    const isPublic = bucket === env.STORAGE.AVATARS || bucket === env.STORAGE.KNOWLEDGE_BASE;
    if (isPublic) {
      const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
      return { path: data.path, url: publicData.publicUrl };
    }

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filePath, 7200);

    return {
      path: data.path,
      url: signedError ? data.path : signedData.signedUrl,
    };
  }

  static async getSignedUrl({ bucket, filePath, expiresIn = 3600 }: any) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw ApiError.badRequest(error.message);
    return data.signedUrl;
  }

  static async deleteFile({ bucket, filePath }: any) {
    const { data, error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);
    if (error) throw ApiError.badRequest(error.message);
    return data;
  }
}
