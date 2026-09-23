import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
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
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(() => getProfilePhoto(role));
  const [error, setError] = useState("");

  useEffect(() => subscribeToStore(() => setPhotoUrl(getProfilePhoto(role))), [role]);

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

    try {
      const res = await storageService.uploadFile(file, {
        bucket: "profile-photos",
        folder: role,
      });
      if (res?.fileUrl) {
        setProfilePhoto(role, res.fileUrl);
        return;
      }
    } catch {
      // Graceful fallback to Data URL below
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setProfilePhoto(role, reader.result);
    };
    reader.readAsDataURL(file);
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
        <UserAvatar
          name={name}
          photoUrl={photoUrl ?? defaultPhotoUrl}
          size="lg"
          role={role}
          status={status}
        />
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Camera className="h-3.5 w-3.5" />
              {photoUrl ? "Change photo" : "Upload photo"}
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={() => clearProfilePhoto(role)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
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
      <UserAvatar name={name} photoUrl={photoUrl ?? defaultPhotoUrl} size="lg" role={role} />
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Camera className="h-3.5 w-3.5" />
            {photoUrl ? "Change photo" : "Upload photo"}
          </button>
          {photoUrl && (
            <button
              type="button"
              onClick={() => clearProfilePhoto(role)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">JPG or PNG, up to 5MB.</p>
        {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
      </div>
      {fileInput}
    </div>
  );
}
