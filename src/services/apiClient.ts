/**
 * Centralized API Client for CloseUrCase Platform
 * Handles authentication header injection, standard response parsing, and error normalization.
 */

import type { ApiResponse, ApiErrorResponse } from "@/types/api";

const TOKEN_KEY = "cuc_auth_token";
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
  localStorage.removeItem(USER_KEY);
};

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

    if (res.status === 401 && !skipAuth) {
      window.dispatchEvent(new CustomEvent("cuc:unauthorized"));
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
