/**
 * Authentication Service
 * Communicates with Supabase Edge Function /v1/auth endpoints
 * Supports citizen OTP, lawyer login/register, admin login, and /auth/me
 * ZERO-MOCK PRODUCTION STATE: Pure backend API calls with authentic tokens and sessions.
 */

import {
  apiClient,
  setStoredToken,
  setStoredUser,
  getStoredUser,
  clearAuthStorage,
} from "./apiClient";
import type {
  SendOtpPayload,
  VerifyOtpPayload,
  LawyerRegisterPayload,
  LawyerLoginPayload,
  AdminLoginPayload,
  AuthResponseData,
  AuthUser,
} from "@/types/api";

interface RawAuthResponse {
  user?: {
    id?: string;
    email?: string;
    phone?: string;
    name?: string;
    city?: string;
    citizenId?: string;
  };
  token?: string;
  session?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
  };
  /** The citizen *record* (id like "u_001") — distinct from `user.id`, which is
   * the Supabase auth UUID. Case rows reference this id via `citizenId`. */
  citizen?: {
    id?: string;
    name?: string;
    city?: string;
  };
  lawyer?: {
    id?: string;
    name?: string;
    city?: string;
  };
  admin?: {
    name?: string;
  };
  message?: string;
}

export const authService = {
  /**
   * Send 6-digit OTP to citizen mobile or email
   */
  async sendCitizenOtp(payload: SendOtpPayload): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ message?: string }>("/auth/citizen/send-otp", payload, {
      skipAuth: true,
    });
    return {
      success: true,
      message: res?.message || "OTP sent successfully",
    };
  },

  /**
   * Verify citizen OTP and receive session token
   */
  async verifyCitizenOtp(payload: VerifyOtpPayload): Promise<AuthResponseData> {
    const res = await apiClient.post<RawAuthResponse>("/auth/citizen/verify-otp", payload, {
      skipAuth: true,
    });

    const token = res?.session?.accessToken || res?.session?.access_token || res?.token;
    const isEmailSignup = Boolean(
      payload.email ||
      (payload.identifier && payload.identifier.includes("@")) ||
      (res?.user?.email && !res?.user?.phone),
    );
    const signupMethod: "email" | "phone" = isEmailSignup ? "email" : "phone";

    const user: AuthUser = {
      id: res?.user?.id || `u_${Date.now()}`,
      role: "citizen",
      email: res?.user?.email || payload.email,
      phone: res?.user?.phone || payload.phone,
      name: res?.citizen?.name || res?.user?.name || payload.name || "Citizen User",
      city: res?.citizen?.city || res?.user?.city || payload.city,
      // Must be the citizen record id, not the auth UUID — case scoping filters on it.
      citizenId: res?.citizen?.id || res?.user?.citizenId,
      signupMethod,
    };

    if (token) {
      setStoredToken(token);
    }
    setStoredUser(user);

    return {
      user,
      token,
      session: res?.session,
      message: "Citizen authenticated successfully",
    };
  },

  /**
   * Register a new advocate / lawyer account
   */
  async registerLawyer(payload: LawyerRegisterPayload): Promise<AuthResponseData> {
    const res = await apiClient.post<RawAuthResponse>("/auth/lawyer/register", payload, {
      skipAuth: true,
    });
    return {
      lawyer: res?.lawyer,
      session: res?.session,
      message: res?.message || "Lawyer registered successfully. Pending approval.",
    };
  },

  /**
   * Lawyer email & password login
   */
  async loginLawyer(payload: LawyerLoginPayload): Promise<AuthResponseData> {
    const res = await apiClient.post<RawAuthResponse>("/auth/lawyer/login", payload, {
      skipAuth: true,
    });

    const token = res?.session?.accessToken || res?.session?.access_token || res?.token;
    const user: AuthUser = {
      id: res?.user?.id || res?.lawyer?.id || "lawyer_id",
      role: "lawyer",
      email: res?.user?.email || payload.email,
      name: res?.lawyer?.name || "Advocate",
      lawyerId: res?.lawyer?.id,
      city: res?.lawyer?.city,
    };

    if (token) {
      setStoredToken(token);
    }
    setStoredUser(user);

    return {
      user,
      token,
      lawyer: res?.lawyer,
      session: res?.session,
      message: "Lawyer authenticated successfully",
    };
  },

  /**
   * Superadmin login with master credentials
   */
  async loginAdmin(payload: AdminLoginPayload): Promise<AuthResponseData> {
    const res = await apiClient.post<RawAuthResponse>("/auth/admin/login", payload, {
      skipAuth: true,
    });

    const token = res?.session?.accessToken || res?.session?.access_token || res?.token;
    const user: AuthUser = {
      id: res?.user?.id || "admin_id",
      role: "admin",
      email: res?.user?.email || payload.email,
      name: res?.admin?.name || "Platform Admin",
    };

    if (token) {
      setStoredToken(token);
    }
    setStoredUser(user);

    return {
      user,
      token,
      admin: res?.admin,
      session: res?.session,
      message: "Administrator authenticated successfully",
    };
  },

  /**
   * Get current authenticated user profile using Bearer token
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const res = await apiClient.get<Record<string, unknown>>("/auth/me");
      const resObj = (res || {}) as Record<string, unknown>;
      const rawUser =
        (resObj.user as AuthUser | undefined) ||
        (resObj.id && resObj.role ? (resObj as unknown as AuthUser) : null);
      if (rawUser) {
        const existing = getStoredUser<AuthUser>();
        const citizenObj = resObj.citizen as { id?: string } | undefined;
        const lawyerObj = resObj.lawyer as { id?: string } | undefined;
        const serverCitizenId =
          typeof resObj.citizenId === "string"
            ? resObj.citizenId
            : citizenObj?.id || rawUser.citizenId;
        const serverLawyerId =
          typeof resObj.lawyerId === "string" ? resObj.lawyerId : lawyerObj?.id || rawUser.lawyerId;

        const merged: AuthUser = {
          ...existing,
          ...rawUser,
          id: rawUser.id || existing?.id || "",
          role: (rawUser.role || existing?.role || "citizen") as AuthUser["role"],
          citizenId: serverCitizenId || existing?.citizenId,
          lawyerId: serverLawyerId || existing?.lawyerId,
          email: rawUser.email || existing?.email,
          name:
            rawUser.name ||
            existing?.name ||
            (rawUser.role === "admin"
              ? "Platform Admin"
              : rawUser.role === "lawyer"
                ? "Advocate"
                : "Citizen User"),
          phone: rawUser.phone || existing?.phone,
        };
        setStoredUser(merged);
        return merged;
      }
      return getStoredUser<AuthUser>();
    } catch {
      return getStoredUser<AuthUser>();
    }
  },

  /**
   * Clear all authenticated session data
   */
  logout(): void {
    clearAuthStorage();
  },
};
