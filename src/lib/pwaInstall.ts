interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Listener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

/** True once the browser is actually running the installed PWA (standalone display mode). */
export function isPwaInstalled() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** True once the browser has fired `beforeinstallprompt` and we're holding it for later. */
export function canInstallPwa() {
  return deferredPrompt !== null;
}

export function subscribeToInstallPrompt(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Shows the browser's native install prompt. Resolves false if there's nothing to show. */
export async function promptPwaInstall() {
  if (!deferredPrompt) return false;
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  notifyListeners();
  return choice.outcome === "accepted";
}

/** Used to skip the marketing landing page once the app is installed on a phone. */
export function isMobileStandalonePwa() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches && isPwaInstalled();
}
