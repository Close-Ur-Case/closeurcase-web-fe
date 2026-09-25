/**
 * Centralized API Client for CloseUrCase Platform
 * Handles authentication header injection, standard response parsing, and error normalization.
 */

import type { ApiResponse, ApiErrorResponse } from "@/types/api";

const TOKEN_KEY = "cuc_auth_token";
const REFRESH_TOKEN_KEY = "cuc_refresh_token";
const USER_KEY = "cuc_auth_user";

export class ApiError extends Error {
  statusCode: number;
  errors?: unknown[];

  constructor(message: string, statusCode: number = 500, errors?: unknown[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (url) return url.replace(/\/+$/, "");
  return "http://localhost:8000/api/v1";
};

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setStoredRefreshToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const getStoredUser = <T = unknown>(): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: unknown | null): void => {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

export const clearAuthStorage = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Checks whether a given JWT token string has expired.
 * Inspects payload `exp` claim with a safe 10-second margin.
 */
export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return Date.now() >= (payload.exp - 10) * 1000;
  } catch {
    return false;
  }
}

let lastSessionExpiredDispatch = 0;

/**
 * Dispatches a global event instructing the UI to display the Session Expired modal.
 * Debounced by 1500ms to avoid duplicate popups when multiple parallel requests fail.
 */
export function notifySessionExpired(message?: string): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastSessionExpiredDispatch < 1500) return;
  lastSessionExpiredDispatch = now;

  window.dispatchEvent(
    new CustomEvent("cuc:session-expired", {
      detail: {
        message: message || "Your session has expired. Please re-login to continue.",
        timestamp: now,
      },
    })
  );
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, skipAuth = false, headers: customHeaders, ...customOptions } = options;

  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Build query string
  let url = `${baseUrl}${cleanEndpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let fetchBody: BodyInit | undefined;
  if (body !== undefined) {
    fetchBody = body instanceof FormData ? body : JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...customOptions,
      headers,
      body: fetchBody,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Network error: Unable to reach the server. Please check your connection.";
    throw new ApiError(message, 0);
  }

  let json: (ApiResponse<T> & ApiErrorResponse) | null = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      json = await res.json();
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const errorDetails = (json?.errors as Array<{ message?: string }>) || [];
    const errorMessage =
      json?.message ||
      (errorDetails.length > 0 ? errorDetails[0]?.message : undefined) ||
      `Request failed with status ${res.status}`;

    // Intercept 401 Unauthorized for authenticated calls to show session expired modal
    if (res.status === 401 && !skipAuth && typeof window !== "undefined") {
      const isPublicAuthRoute =
        cleanEndpoint.includes("/auth/citizen/send-otp") ||
        cleanEndpoint.includes("/auth/citizen/verify-otp") ||
        cleanEndpoint.includes("/auth/lawyer/login") ||
        cleanEndpoint.includes("/auth/lawyer/register") ||
        cleanEndpoint.includes("/auth/admin/login") ||
        cleanEndpoint.includes("/auth/refresh");

      if (!isPublicAuthRoute) {
        notifySessionExpired(errorMessage);
      }
    }

    throw new ApiError(errorMessage, res.status, json?.errors);
  }

  // If response matches standard ApiResponse envelope, unpack data field
  if (json && typeof json === "object" && "success" in json && "data" in json) {
    return json.data as T;
  }

  return json as unknown as T;
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "POST", body }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
