/**
 * Browser push notifications via Firebase Cloud Messaging.
 *
 * Supports desktop browsers, Android (Browser + PWA), and iOS (16.4+ installed PWA).
 * Handles token registration, foreground FCM events (video calls & updates),
 * and service worker message bridging for call accept actions.
 */

import { useEffect, useState } from "react";
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

/** Registers this browser for push, once per signed-in session, and bridges
 * foreground push and service worker message events to the app context. */
export function usePushNotifications(): {
  permission: NotificationPermission | "unsupported";
  requestPermission: () => Promise<NotificationPermission | "unsupported">;
} {
  const { isAuthenticated } = useAuth();
  const { mutate: registerToken } = useRegisterFcmTokenMutation();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(getPushPermission);

  const requestPermission = async (): Promise<NotificationPermission | "unsupported"> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res;
    } catch {
      return "unsupported";
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isFirebaseConfigured()) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    if (Notification.permission === "denied") return;

    let cancelled = false;

    // Bridge incoming messages from the service worker (e.g. user clicked "Accept" on push notification)
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "CUC_ACCEPT_CALL") {
        window.dispatchEvent(new CustomEvent("cuc:accept_call", { detail: event.data }));
      }
    };
    navigator.serviceWorker.addEventListener("message", handleSwMessage);

    (async () => {
      try {
        const perm =
          Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();
        setPermission(perm);
        if (cancelled || perm !== "granted") return;

        const params = new URLSearchParams({
          apiKey: FIREBASE_CONFIG.apiKey || "",
          projectId: FIREBASE_CONFIG.projectId || "",
          messagingSenderId: FIREBASE_CONFIG.messagingSenderId || "",
          appId: FIREBASE_CONFIG.appId || "",
          apiUrl: getApiBaseUrl(),
        });

        const registration = await navigator.serviceWorker.register(
          `/firebase-messaging-sw.js?${params.toString()}`,
        );

        const { initializeApp, getApps } = await import("firebase/app");
        const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

        const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG as Record<string, string>);
        const messaging = getMessaging(app);

        const tokenOptions: { serviceWorkerRegistration: ServiceWorkerRegistration; vapidKey?: string } = {
          serviceWorkerRegistration: registration,
        };
        if (VAPID_KEY) {
          tokenOptions.vapidKey = VAPID_KEY;
        }

        const deviceToken = await getToken(messaging, tokenOptions);

        if (cancelled || !deviceToken) return;
        registerToken({ deviceToken, deviceType: "web" });

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
      } catch (err) {
        console.warn("[usePushNotifications] Registration skipped:", err);
      }
    })();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("message", handleSwMessage);
    };
  }, [isAuthenticated, registerToken]);

  return { permission, requestPermission };
}
