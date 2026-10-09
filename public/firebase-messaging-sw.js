/**
 * Firebase Cloud Messaging service worker — handles push notifications
 * for CloseUrCase when the web app or PWA is backgrounded, closed, or standalone.
 *
 * Supports:
 * 1. Standard in-app notifications (case updates, messages, hearings) with deep-linking.
 * 2. High-urgency video call alerts with "Accept" and "Decline" action buttons,
 *    vibration, background call decline, and auto-dismiss on cancellation.
 */

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBt6CZWZIiqhj7-OElAjL7hz0cFmG4uyag",
  authDomain: "close-ur-case.firebaseapp.com",
  projectId: "close-ur-case",
  storageBucket: "close-ur-case.firebasestorage.app",
  messagingSenderId: "668121591525",
  appId: "1:668121591525:web:be9a3c5b4faadd3f546e0c",
};

const params = new URLSearchParams(self.location.search);
const apiKey = params.get("apiKey") || DEFAULT_FIREBASE_CONFIG.apiKey;
const projectId = params.get("projectId") || DEFAULT_FIREBASE_CONFIG.projectId;
const messagingSenderId = params.get("messagingSenderId") || DEFAULT_FIREBASE_CONFIG.messagingSenderId;
const appId = params.get("appId") || DEFAULT_FIREBASE_CONFIG.appId;
const apiUrl = params.get("apiUrl") || "";

if (apiKey && projectId && messagingSenderId && appId) {
  firebase.initializeApp({ apiKey, projectId, messagingSenderId, appId });
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const data = payload?.data || {};
    const notifType = data.type;

    // ── 1. Video Call: Incoming Call ───────────────────────────
    if (notifType === "incoming_call") {
      const callerName = data.callerName || "Consultation Participant";
      const title = `Incoming Video Call: ${callerName}`;
      const roleLabel = data.callerRole === "lawyer" ? "Advocate" : "Client";
      const body = `${roleLabel} is calling you for Case ${data.caseId || ""}. Tap to answer.`;

      const notificationOptions = {
        body,
        icon: "/logo_nobg.png",
        badge: "/logo_nobg.png",
        tag: `call_${data.callId}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500, 200, 500],
        actions: [
          { action: "accept", title: "Accept Call" },
          { action: "decline", title: "Decline" },
        ],
        data: {
          ...data,
          targetUrl: data.caseId
            ? `/${data.recipientRole || "citizen"}/cases/${data.caseId}?callJoin=${data.callId || ""}`
            : "/",
        },
      };

      return self.registration.showNotification(title, notificationOptions);
    }

    // ── 2. Video Call: Dismiss on Cancel / End ────────────────
    if (notifType === "call_cancelled" || notifType === "call_ended") {
      const callTag = `call_${data.callId}`;
      return self.registration.getNotifications({ tag: callTag }).then((notifications) => {
        notifications.forEach((n) => n.close());
      });
    }

    // ── 3. Standard In-App Notifications (Data-only or custom fallback) ─
    if (!payload.notification && (data.title || data.body)) {
      const title = data.title || "CloseUrCase Notification";
      return self.registration.showNotification(title, {
        body: data.body || "",
        icon: "/logo_nobg.png",
        badge: "/logo_nobg.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: data.notificationId ? `notif_${data.notificationId}` : undefined,
        data: {
          ...data,
          targetUrl: data.url || "/",
        },
      });
    }

    // If payload contains standard notification object, Firebase SDK
    // webpush options handle lockscreen display automatically.
  });
}

// ── Notification Click Handler ──────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  // 1. Decline Action for Incoming Call
  if (action === "decline") {
    if (data.callId && apiUrl) {
      event.waitUntil(
        fetch(`${apiUrl.replace(/\/+$/, "")}/video-calls/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callId: data.callId,
            action: "decline",
          }),
        }).catch((err) => {
          console.warn("[firebase-messaging-sw.js] Failed to send call decline:", err);
        })
      );
    }
    return;
  }

  // 2. Accept Call or Open Target Route
  const targetUrl = data.targetUrl || data.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and broadcast event
      for (const client of clientList) {
        if ("focus" in client) {
          if (data.type === "incoming_call" || action === "accept") {
            client.postMessage({
              type: "CUC_ACCEPT_CALL",
              callId: data.callId,
              caseId: data.caseId,
              channelName: data.channelName,
              withName: data.callerName,
              role: data.recipientRole,
            });
          }
          if (client.url && !client.url.includes(targetUrl) && "navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      // If no window is open, launch a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
