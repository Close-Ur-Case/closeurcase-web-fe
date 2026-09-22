import { useEffect, useState } from "react";
import { canInstallPwa, promptPwaInstall, subscribeToInstallPrompt } from "@/lib/pwaInstall";

/** Exposes the deferred `beforeinstallprompt` event so UI can offer a "Download now" button. */
export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(canInstallPwa());

  useEffect(() => subscribeToInstallPrompt(() => setCanInstall(canInstallPwa())), []);

  return { canInstall, promptInstall: promptPwaInstall };
}
