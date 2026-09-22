import { env } from "./env.ts";

/**
 * FCM HTTP v1 client, hand-rolled rather than pulling in `firebase-admin`.
 *
 * Google's official Admin SDK is Node-specific and doesn't run cleanly under
 * Deno; this codebase's existing convention for third-party integrations
 * (see `razorpay.ts`, `agora.ts`) is a direct `fetch` against the provider's
 * own REST API rather than an SDK, so this follows the same shape.
 *
 * The FCM v1 API is authenticated with a short-lived OAuth2 access token,
 * obtained via the "JWT Bearer" grant (RFC 7523): sign a claims set with the
 * service account's private key (RS256), then exchange that JWT for an
 * access token at Google's token endpoint. Deno's Web Crypto API can do the
 * RS256 signing natively — no extra dependency needed for that either.
 */

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function parseServiceAccount(): ServiceAccount | null {
  if (!env.FIREBASE_SERVICE_ACCOUNT_KEY) return null;
  try {
    const parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (!parsed?.project_id || !parsed?.client_email || !parsed?.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

function base64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** PEM (`-----BEGIN PRIVATE KEY-----...`) -> the raw DER bytes `importKey` needs. */
function pemToPkcs8(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function signServiceAccountJwt(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );

  return `${unsigned}.${base64url(new Uint8Array(signature))}`;
}

/** Cached in-memory: Google's tokens are valid for an hour, and every push
 * would otherwise re-sign a JWT and round-trip the token endpoint. Refreshed
 * a minute before actual expiry rather than exactly at it. */
let cachedAccessToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
    return cachedAccessToken.value;
  }

  const assertion = await signServiceAccountJwt(serviceAccount);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firebase OAuth token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedAccessToken = {
    value: data.access_token,
    expiresAt: now + (data.expires_in || 3600) * 1000,
  };
  return cachedAccessToken.value;
}

export interface FcmSendResult {
  ok: boolean;
  /** Set when FCM reports the token itself is dead (unregistered / malformed) —
   * the caller should stop retrying it and remove it, not just log and move on. */
  tokenInvalid?: boolean;
  error?: string;
}

export const firebaseAdmin = {
  /** Whether a usable service account is configured. `FIREBASE_SERVICE_ACCOUNT_KEY`
   * defaults to an empty string (see env.ts), so this is `false` out of the box —
   * push notifications need a real Firebase project's credentials before any of
   * this can send anything, the same way Razorpay/Agora need real keys. */
  isConfigured(): boolean {
    return parseServiceAccount() !== null;
  },

  /** Sends one push via FCM's HTTP v1 API to a single device token. */
  async sendToDevice(
    deviceToken: string,
    notification: { title: string; body: string },
    data?: Record<string, string>
  ): Promise<FcmSendResult> {
    const serviceAccount = parseServiceAccount();
    if (!serviceAccount) {
      return { ok: false, error: "Firebase not configured (FIREBASE_SERVICE_ACCOUNT_KEY unset)" };
    }

    try {
      const accessToken = await getAccessToken(serviceAccount);
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: deviceToken,
              notification,
              ...(data ? { data } : {}),
            },
          }),
        }
      );

      if (res.ok) return { ok: true };

      const errBody: any = await res.json().catch(() => ({}));
      const fcmErrorCode = errBody?.error?.details?.find((d: any) =>
        String(d?.["@type"] || "").includes("FcmError")
      )?.errorCode;
      const tokenInvalid =
        res.status === 404 || fcmErrorCode === "UNREGISTERED" || fcmErrorCode === "INVALID_ARGUMENT";

      return {
        ok: false,
        tokenInvalid,
        error: errBody?.error?.message || `FCM send failed (${res.status})`,
      };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
