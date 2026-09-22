import { useState } from "react";

const STORAGE_KEY = "CloseUrCase.permissions.acknowledged";

function readAcknowledged(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Gates the login/signup screens behind a one-time (per browser session)
 * native-permissions prompt for camera, microphone, location, and notifications. */
export function usePermissionsGate() {
  const [acknowledged, setAcknowledged] = useState(readAcknowledged);

  const markAcknowledged = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // sessionStorage unavailable (e.g. private mode) — fall back to in-memory only.
    }
    setAcknowledged(true);
  };

  return [acknowledged, markAcknowledged] as const;
}
