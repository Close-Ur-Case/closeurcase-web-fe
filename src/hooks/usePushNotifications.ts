/**
 * Browser push notifications via Firebase Cloud Messaging.
 *
 * Supports desktop browsers, Android (Browser + PWA), and iOS (16.4+ installed PWA).
 * Handles token registration, foreground FCM events (video calls & updates),
 * and service worker message bridging for call accept actions.
 */

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/useAuth";
import { useRegisterFcmTokenMutation } from "@/hooks/queries/useNotifications";
import { getApiBaseUrl } from "@/services/apiClient";

function parseFirebaseConfig(): {
  apiKey?: string;
  projectId?: string;
  messagingSenderId?: string;
  appId?: string;
  authDomain?: string;
  storageBucket?: string;
  vapidKey?: string;
} {
  const jsonStr = import.meta.env.VITE_FIREBASE_CONFIG as string | undefined;
  if (jsonStr) {
    try {
      const parsed = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
      return {
        apiKey: parsed.apiKey || parsed.api_key,
        projectId: parsed.projectId || parsed.project_id,
        messagingSenderId: parsed.messagingSenderId || parsed.messaging_sender_id,
        appId: parsed.appId || parsed.app_id,
        authDomain: parsed.authDomain,
        storageBucket: parsed.storageBucket,
        vapidKey:
          parsed.vapidKey ||
          parsed.vapid_key ||
          (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined),
      };
    } catch (err) {
      console.warn("[usePushNotifications] Failed to parse VITE_FIREBASE_CONFIG JSON:", err);
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined,
  };
}

const FIREBASE_CONFIG = parseFirebaseConfig();
const VAPID_KEY = FIREBASE_CONFIG.vapidKey || (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined);

export function isFirebaseConfigured(): boolean {
  return (
    Boolean(FIREBASE_CONFIG.apiKey) &&
    Boolean(FIREBASE_CONFIG.projectId) &&
    Boolean(FIREBASE_CONFIG.messagingSenderId) &&
    Boolean(FIREBASE_CONFIG.appId)
  );
}

export function getPushPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export function detectDeviceType(): string {
  if (typeof window === "undefined") return "web";
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (isStandalone) {
    return isMobile ? "mobile_pwa" : "desktop_pwa";
  }
  return isMobile ? "mobile_web" : "web";
}

/**
 * Standalone helper to initialize Firebase Messaging and retrieve the FCM device token.
 * Can be called on public pages (like /citizen-lawyer-login) prior to or during authentication.
 */
export async function retrieveFcmDeviceToken(): Promise<{
  token: string | null;
  deviceType: string;
  error?: string;
}> {
  if (typeof window === "undefined") {
    return { token: null, deviceType: "web", error: "Window undefined" };
  }
  const devType = detectDeviceType();
  if (!isFirebaseConfigured()) {
    return { token: null, deviceType: devType, error: "Firebase configuration missing" };
  }
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    return { token: null, deviceType: devType, error: "Push notifications not supported in this browser" };
  }
  if (Notification.permission !== "granted") {
    return { token: null, deviceType: devType, error: `Permission is ${Notification.permission}` };
  }

  try {
    let registration: ServiceWorkerRegistration;
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) {
      registration = existing;
    } else {
      const params = new URLSearchParams({
        apiKey: FIREBASE_CONFIG.apiKey || "",
        projectId: FIREBASE_CONFIG.projectId || "",
        messagingSenderId: FIREBASE_CONFIG.messagingSenderId || "",
        appId: FIREBASE_CONFIG.appId || "",
        apiUrl: getApiBaseUrl(),
      });
      const swUrl = `/firebase-messaging-sw.js?${params.toString()}`;
      registration = await navigator.serviceWorker.register(swUrl, { scope: "/" });
    }

    let targetRegistration: ServiceWorkerRegistration = registration;
    try {
      const readyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const readyReg = await Promise.race([readyPromise, timeoutPromise]);
      if (readyReg) targetRegistration = readyReg;
    } catch {}

    if (!targetRegistration.active && (targetRegistration.installing || targetRegistration.waiting)) {
      const worker = targetRegistration.installing || targetRegistration.waiting;
      if (worker) {
        await new Promise<void>((resolve) => {
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated" || worker.state === "redundant") resolve();
          });
          setTimeout(resolve, 3000);
        });
      }
    }

    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");

    const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG as Record<string, string>);
    const messaging = getMessaging(app);

    const tokenOptions: { serviceWorkerRegistration: ServiceWorkerRegistration; vapidKey?: string } = {
      serviceWorkerRegistration: targetRegistration,
    };
    if (VAPID_KEY) {
      tokenOptions.vapidKey = VAPID_KEY;
    }

    console.log("[retrieveFcmDeviceToken] Requesting FCM token from Firebase...");
    const token = await getToken(messaging, tokenOptions);
    if (!token) {
      return { token: null, deviceType: devType, error: "Unable to obtain FCM registration token from Firebase" };
    }
    console.log("[retrieveFcmDeviceToken] Successfully retrieved FCM token:", token.slice(0, 30) + "...");
    return { token, deviceType: devType };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn("[retrieveFcmDeviceToken] Token retrieval failed:", err);
    return { token: null, deviceType: devType, error: msg };
  }
}

/** Registers this browser for push, once per signed-in session, and bridges
 * foreground push and service worker message events to the app context. */
export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const { mutateAsync: registerTokenAsync } = useRegisterFcmTokenMutation();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(getPushPermission);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    isFirebaseConfigured();

  const isSecure = typeof window === "undefined" ? true : window.isSecureContext;

  const registerPushToken = useCallback(async (): Promise<{ ok: boolean; token?: string; error?: string }> => {
    if (typeof window === "undefined") return { ok: false, error: "Window undefined" };
    if (!isFirebaseConfigured()) {
      const err = "Firebase configuration missing";
      setRegistrationError(err);
      return { ok: false, error: err };
    }
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      const err = "Push notifications are not supported in this browser context (ServiceWorker or Notification API unavailable).";
      setRegistrationError(err);
      return { ok: false, error: err };
    }
    if (window.isSecureContext === false) {
      const err = "Push notifications require a secure context (HTTPS or localhost). Current origin is insecure HTTP.";
      setRegistrationError(err);
      return { ok: false, error: err };
    }

    try {
      setIsRegistering(true);
      setRegistrationError(null);

      // Check or request permission
      let perm = Notification.permission;
      if (perm !== "granted") {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }
      if (perm !== "granted") {
        setIsRegistering(false);
        const err = `Notification permission: ${perm}`;
        setRegistrationError(err);
        return { ok: false, error: err };
      }

      const res = await retrieveFcmDeviceToken();
      if (!res.token) {
        throw new Error(res.error || "Unable to obtain FCM registration token from Firebase");
      }
      const token = res.token;
      const devType = res.deviceType;

      console.log(`[usePushNotifications] Registering token for deviceType=${devType}...`);
      await registerTokenAsync({ deviceToken: token, deviceType: devType });
      console.log("[usePushNotifications] Token registered in database successfully!");

      setDeviceToken(token);
      setIsRegistering(false);

      const { initializeApp, getApps } = await import("firebase/app");
      const { getMessaging, onMessage } = await import("firebase/messaging");
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG as Record<string, string>);
      const messaging = getMessaging(app);

      // Foreground Message Listener
      onMessage(messaging, (payload) => {
        const data = payload?.data;
        if (!data) return;

        if (data.type === "incoming_call") {
          window.dispatchEvent(new CustomEvent("cuc:incoming_call", { detail: data }));
        } else if (data.type === "call_cancelled" || data.type === "call_ended") {
          window.dispatchEvent(new CustomEvent("cuc:call_cancelled", { detail: data }));
        } else {
          window.dispatchEvent(new CustomEvent("cuc:notification", { detail: payload }));
        }
      });

      return { ok: true, token };
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.warn("[usePushNotifications] Registration failed:", err);
      setRegistrationError(msg);
      setIsRegistering(false);
      return { ok: false, error: msg };
    }
  }, [registerTokenAsync]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission | "unsupported"> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        await registerPushToken();
      }
      return res;
    } catch {
      return "unsupported";
    }
  }, [registerPushToken]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isFirebaseConfigured()) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;

    // Bridge incoming messages from the service worker (e.g. user clicked "Accept" on push notification)
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "CUC_ACCEPT_CALL") {
        window.dispatchEvent(new CustomEvent("cuc:accept_call", { detail: event.data }));
      }
    };
    navigator.serviceWorker.addEventListener("message", handleSwMessage);

    // If permission was already granted previously, automatically register/refresh the token
    if (Notification.permission === "granted") {
      registerPushToken().catch(() => {});
    }

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleSwMessage);
    };
  }, [isAuthenticated, registerPushToken]);

  return {
    permission,
    requestPermission,
    registerPushToken,
    deviceToken,
    isRegistering,
    registrationError,
    isSupported,
    isSecure,
    deviceType: detectDeviceType(),
  };
}
