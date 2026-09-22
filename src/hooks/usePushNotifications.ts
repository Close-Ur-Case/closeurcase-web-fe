/**
 * Browser push notifications via Firebase Cloud Messaging.
 *
 * The full path is: request the browser's notification permission → register
 * a dedicated service worker for background push → ask Firebase for a device
 * token scoped to that worker → hand the token to the backend
 * (`/notifications/register-token`), which the FCM Admin client
 * (`supabase/functions/api/config/firebaseAdmin.ts`) later pushes to whenever
 * an in-app notification is created for this user.
 *
 * Every Firebase config value here (`VITE_FIREBASE_*`) is the same kind of
 * public, client-side value as the Supabase anon key already in this app —
 * not a secret, safe to ship in the bundle. Without them (or when the
 * browser doesn't support push, or the person denies/never grants
 * permission), this no-ops entirely: no error, no retry loop, just no
 * device gets registered. That mirrors how Razorpay/Agora degrade without
 * real keys elsewhere in this app.
 */

import { useEffect } from "react";
import { useAuth } from "@/context/useAuth";
import { useRegisterFcmTokenMutation } from "@/hooks/queries/useNotifications";

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

function isFirebaseConfigured(): boolean {
  return (
    Boolean(FIREBASE_CONFIG.apiKey) &&
    Boolean(FIREBASE_CONFIG.projectId) &&
    Boolean(FIREBASE_CONFIG.messagingSenderId) &&
    Boolean(FIREBASE_CONFIG.appId) &&
    Boolean(VAPID_KEY)
  );
}

/** Registers this browser for push, once per signed-in session, and never
 * more than once — call it from a layout every role's dashboard already
 * renders through, the same way `DashboardLayout` already fetches
 * notifications on mount. Nothing needs to read a return value: a
 * successful registration surfaces as this device receiving a push the next
 * time a notification targets it, not as UI state here. */
export function usePushNotifications(): void {
  const { isAuthenticated } = useAuth();
  // `mutate` is a stable reference across renders (react-query guarantees
  // this), so it's safe to depend on below without re-running per render.
  const { mutate: registerToken } = useRegisterFcmTokenMutation();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isFirebaseConfigured()) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    // Respect a prior "block" — only "default" (never asked) or an already
    // "granted" permission are worth acting on; re-asking after a denial is
    // exactly the nagging browsers' own permission model exists to prevent.
    if (Notification.permission === "denied") return;

    let cancelled = false;

    (async () => {
      try {
        const permission =
          Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();
        if (cancelled || permission !== "granted") return;

        // Registered separately from the app's own Workbox-managed PWA
        // service worker (see vite.config.ts) — Firebase's documented
        // pattern for adding web push to an app that already has one, rather
        // than replacing or merging into it. Config travels via the query
        // string because a static file under `public/` can't read Vite's
        // `import.meta.env` at runtime the way app code can.
        const params = new URLSearchParams({
          apiKey: FIREBASE_CONFIG.apiKey,
          projectId: FIREBASE_CONFIG.projectId,
          messagingSenderId: FIREBASE_CONFIG.messagingSenderId,
          appId: FIREBASE_CONFIG.appId,
        });
        const registration = await navigator.serviceWorker.register(
          `/firebase-messaging-sw.js?${params.toString()}`,
        );

        const { initializeApp } = await import("firebase/app");
        const { getMessaging, getToken } = await import("firebase/messaging");

        const app = initializeApp(FIREBASE_CONFIG as Record<string, string>);
        const messaging = getMessaging(app);
        const deviceToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (cancelled || !deviceToken) return;
        registerToken({ deviceToken, deviceType: "web" });
      } catch (err) {
        // Best-effort: a browser/permission/network hiccup here should never
        // surface to the person using the app — it just means this device
        // doesn't get push for this session.
        console.warn("[usePushNotifications] Registration skipped:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, registerToken]);
}
