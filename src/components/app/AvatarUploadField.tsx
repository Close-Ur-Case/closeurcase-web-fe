import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/app/UserAvatar";
import {
  getProfilePhoto,
  setProfilePhoto,
  clearProfilePhoto,
  subscribeToStore,
} from "@/data/appStore";
import type { UserRole } from "@/types";
import type { LawyerPresence } from "@/lib/statusColors";
import { storageService } from "@/services/storageService";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function AvatarUploadField({
  role,
  name,
  defaultPhotoUrl,
  centered = false,
  status,
  onPhotoChange,
}: {
  role: UserRole;
  name: string;
  /** Lawyer presence indicator, forwarded to the avatar (see UserAvatar). */
  status?: LawyerPresence;
  /** Shown until the user uploads their own photo — overrides the generic
   * name-hashed avatar fallback for seed profiles where that hash picks a
   * mismatched photo. */
  defaultPhotoUrl?: string;
  /** Stacks the avatar above the upload/remove controls, centered — used in
   * the profile page's sidebar column so the block reads as an intentional
   * vertical unit instead of a short horizontal strip floating above empty
   * space. */
  centered?: boolean;
  onPhotoChange?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(() => getProfilePhoto(role) || defaultPhotoUrl);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setPhotoUrl(getProfilePhoto(role) || defaultPhotoUrl);
    return subscribeToStore(() => setPhotoUrl(getProfilePhoto(role) || defaultPhotoUrl));
  }, [role, defaultPhotoUrl]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Image must be under 5MB.");
      return;
    }
    setError("");
    setIsUploading(true);

    // Instant local preview so user gets immediate visual feedback
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      const res = await storageService.uploadFile(file, {
        bucket: "avatars",
        folder: role,
      });
      if (res?.fileUrl) {
        setProfilePhoto(role, res.fileUrl);
        setPhotoUrl(res.fileUrl);
        onPhotoChange?.(res.fileUrl);
        setIsUploading(false);
        return;
      }
    } catch (uploadErr) {
      console.warn("[AvatarUploadField] Cloud upload warning:", uploadErr);
    }

    // Fallback to local Data URL
    if (typeof reader.result === "string") {
      setProfilePhoto(role, reader.result);
      setPhotoUrl(reader.result);
      onPhotoChange?.(reader.result);
    }
    setIsUploading(false);
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = "";
      }}
    />
  );

  if (centered) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative inline-block">
          <UserAvatar
            name={name}
            photoUrl={photoUrl ?? defaultPhotoUrl}
            size="lg"
            role={role}
            status={status}
          />
          {photoUrl && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                clearProfilePhoto(role);
                setPhotoUrl(undefined);
                onPhotoChange?.("");
              }}
              className="absolute -top-1.5 -right-1.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-destructive shadow-xs transition-all hover:scale-105 hover:bg-destructive hover:text-destructive-foreground focus:outline-hidden focus:ring-2 focus:ring-destructive/30 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Remove photo"
              aria-label="Remove photo"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-3.5 w-3.5" />
                  {photoUrl ? "Change photo" : "Upload photo"}
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">JPG or PNG, up to 5MB.</p>
          {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
        </div>
        {fileInput}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative inline-block">
        <UserAvatar name={name} photoUrl={photoUrl ?? defaultPhotoUrl} size="lg" role={role} />
        {photoUrl && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => {
              clearProfilePhoto(role);
              setPhotoUrl(undefined);
              onPhotoChange?.("");
            }}
            className="absolute -top-1.5 -right-1.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-destructive shadow-xs transition-all hover:scale-105 hover:bg-destructive hover:text-destructive-foreground focus:outline-hidden focus:ring-2 focus:ring-destructive/30 disabled:opacity-60 disabled:cursor-not-allowed"
            title="Remove photo"
            aria-label="Remove photo"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" />
                {photoUrl ? "Change photo" : "Upload photo"}
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">JPG or PNG, up to 5MB.</p>
        {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
      </div>
      {fileInput}
    </div>
  );
}
