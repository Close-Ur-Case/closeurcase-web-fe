/**
 * Firebase Cloud Messaging service worker — handles push while the app isn't
 * in the foreground. Registered separately from, and alongside, this app's
 * own Workbox-managed PWA service worker (see vite.config.ts's VitePWA
 * plugin); Firebase's own documented pattern for adding web push to an app
 * that already has a different service worker is exactly this — two
 * independently-scoped workers, not merging into one.
 *
 * A plain static file under public/ is never processed by Vite, so it can't
 * read import.meta.env the way app code can. The config values below (all
 * public, client-side identifiers — the same non-secret kind as a Supabase
 * anon key, not something that needs hiding) travel here instead via the
 * query string on the registration URL — see usePushNotifications.ts, which
 * is the only place this file is ever registered from.
 */

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const params = new URLSearchParams(self.location.search);
const apiKey = params.get("apiKey");
const projectId = params.get("projectId");
const messagingSenderId = params.get("messagingSenderId");
const appId = params.get("appId");

// Nothing to initialize if this ever loads without the expected query
// params — better to sit idle than throw and break service worker install.
if (apiKey && projectId && messagingSenderId && appId) {
  firebase.initializeApp({ apiKey, projectId, messagingSenderId, appId });
  const messaging = firebase.messaging();

  // The FCM Admin client (supabase/functions/api/config/firebaseAdmin.ts)
  // always sends a `notification` payload, which Firebase's SDK displays
  // automatically for a background message — no onBackgroundMessage handler
  // is needed for that default case. This hook exists for future data-only
  // pushes (e.g. silently refreshing something) that carry no visible
  // notification of their own.
  messaging.onBackgroundMessage((payload) => {
    if (payload?.notification) return;
    console.log("[firebase-messaging-sw.js] Data-only background message:", payload);
  });
}
