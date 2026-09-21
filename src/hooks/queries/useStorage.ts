/**
 * React Query hooks for Supabase Storage
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { storageService } from "@/services/storageService";
import type { UploadFileOptions, UploadFileResponse } from "@/types/api";

export function useUploadFileMutation() {
  return useMutation<UploadFileResponse, Error, { file: File; options?: UploadFileOptions }>({
    mutationFn: ({ file, options }) => storageService.uploadFile(file, options),
  });
}

export function useSignedUrlQuery(filePath?: string, bucket?: string, expiresIn?: number) {
  return useQuery({
    queryKey: ["storage-signed-url", bucket, filePath, expiresIn],
    queryFn: () => (filePath ? storageService.getSignedUrl(filePath, bucket, expiresIn) : ""),
    enabled: Boolean(filePath),
    staleTime: 10 * 60 * 1000,
  });
}
