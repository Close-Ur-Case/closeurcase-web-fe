/**
 * Storage Service Layer
 * Handles uploading case documents, petitions, and evidence to Supabase Cloud Storage
 * with automatic local fallback if offline.
 */

import { apiClient } from "./apiClient";
import type { UploadFileResponse, SignedUrlResponse, UploadFileOptions } from "@/types/api";

export const storageService = {
  /**
   * Upload a legal document or evidence file to Supabase Storage
   */
  async uploadFile(file: File, options?: UploadFileOptions): Promise<UploadFileResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (options?.bucket) {
        formData.append("bucket", options.bucket);
      }
      if (options?.folder) {
        formData.append("folder", options.folder);
      }

      const res = await apiClient.post<UploadFileResponse>("/storage/upload", formData);
      if (res && res.fileUrl) {
        return res;
      }
      return await this.getLocalFallback(file, options);
    } catch (err) {
      console.warn("[StorageService] Cloud upload fallback to local:", err);
      return await this.getLocalFallback(file, options);
    }
  },

  /**
   * Get a time-limited signed URL for a private case document
   */
  async getSignedUrl(
    filePath: string,
    bucket: string = "case-documents",
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const res = await apiClient.get<SignedUrlResponse>("/storage/signed-url", {
        params: { filePath, bucket, expiresIn },
      });
      return res?.signedUrl || filePath;
    } catch (err) {
      console.warn("[StorageService] Signed URL fallback to raw path:", err);
      return filePath;
    }
  },

  /**
   * Reads a file as a base64 Data URL for fallback or offline usage
   */
  readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Creates a local fallback upload response
   */
  async getLocalFallback(file: File, options?: UploadFileOptions): Promise<UploadFileResponse> {
    let dataUrl = "";
    try {
      dataUrl = await this.readFileAsDataUrl(file);
    } catch {
      dataUrl = "";
    }
    return {
      fileName: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      mimeType: file.type || "application/octet-stream",
      bucket: options?.bucket || "case-documents",
      filePath: `local_${Date.now()}_${file.name}`,
      fileUrl: dataUrl,
    };
  },
};
