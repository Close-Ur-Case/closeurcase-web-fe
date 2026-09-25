/**
 * Authentication Service
 * Communicates with Supabase Edge Function /v1/auth endpoints
 * Supports citizen OTP, lawyer login/register, admin login, and /auth/me
 * ZERO-MOCK PRODUCTION STATE: Pure backend API calls with authentic tokens and sessions.
 */

import {
  apiClient,
  setStoredToken,
  setStoredRefreshToken,
  getStoredRefreshToken,
  setStoredUser,
  getStoredUser,
  clearAuthStorage,
} from "./apiClient";
import { getCitizenSession, setCitizenSession } from "@/features/citizen/session";
import { mergeRemoteLawyers } from "@/data/appStore";
import type { Lawyer } from "@/types";
import type {
  SendOtpPayload,
  SendOtpResponse,
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
    role?: string;
    email?: string;
    phone?: string;
    name?: string;
    city?: string;
    citizenId?: string;
    lawyerId?: string;
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
  async sendCitizenOtp(
    payload: SendOtpPayload,
  ): Promise<SendOtpResponse & { success: boolean; message: string }> {
    const res = await apiClient.post<SendOtpResponse>("/auth/citizen/send-otp", payload, {
      skipAuth: true,
    });
    return {
      success: true,
      message: res?.message || "OTP sent successfully",
      channel: res?.channel,
      recipient: res?.recipient,
      userExists: res?.userExists,
      name: res?.name || res?.fullName || null,
      fullName: res?.fullName || res?.name || null,
    };
  },

  /**
   * Verify citizen OTP and receive session token
   */
  async verifyCitizenOtp(
    payload: VerifyOtpPayload,
    options?: { skipStorage?: boolean }
  ): Promise<AuthResponseData> {
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

    const refreshToken = res?.session?.refreshToken || res?.session?.refresh_token;

    if (!options?.skipStorage) {
      if (token) {
        setStoredToken(token);
      }
      if (refreshToken) {
        setStoredRefreshToken(refreshToken);
      }
      setStoredUser(user);
    }

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
    const lawyerStatus =
      (res?.lawyer as { status?: string })?.status ||
      (res?.user as { status?: string })?.status ||
      "Pending";

    const user: AuthUser = {
      id: res?.user?.id || res?.lawyer?.id || "lawyer_id",
      role: "lawyer",
      email: res?.user?.email || payload.email,
      name: res?.lawyer?.name || "Advocate",
      lawyerId: res?.lawyer?.id,
      city: res?.lawyer?.city,
      status: lawyerStatus,
    };

    if (res?.lawyer) {
      mergeRemoteLawyers([res.lawyer as Partial<Lawyer>]);
    }

    const refreshToken = res?.session?.refreshToken || res?.session?.refresh_token;
    if (token) {
      setStoredToken(token);
    }
    if (refreshToken) {
      setStoredRefreshToken(refreshToken);
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

    const refreshToken = res?.session?.refreshToken || res?.session?.refresh_token;
    if (token) {
      setStoredToken(token);
    }
    if (refreshToken) {
      setStoredRefreshToken(refreshToken);
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
          status:
            (resObj.status as string) ||
            (lawyerObj as { status?: string })?.status ||
            (citizenObj as { status?: string })?.status ||
            rawUser.status ||
            existing?.status,
        };
        setStoredUser(merged);
        if (lawyerObj) {
          mergeRemoteLawyers([lawyerObj as Partial<Lawyer>]);
        }
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

  /**
   * Exchange stored refresh token for a fresh JWT access token
   */
  async refreshToken(): Promise<AuthResponseData | null> {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await apiClient.post<RawAuthResponse>(
        "/auth/refresh",
        { refreshToken },
        { skipAuth: true }
      );

      const token = res?.session?.accessToken || res?.session?.access_token || res?.token;
      const newRefreshToken = res?.session?.refreshToken || res?.session?.refresh_token;

      if (token) setStoredToken(token);
      if (newRefreshToken) setStoredRefreshToken(newRefreshToken);

      const existing = getStoredUser<AuthUser>();
      const user: AuthUser | undefined = res?.user
        ? {
            ...existing,
            id: res.user.id || existing?.id || "",
            role: (res.user.role || existing?.role || "citizen") as AuthUser["role"],
            email: res.user.email || existing?.email,
            phone: res.user.phone || existing?.phone,
            name: res.user.name || existing?.name || "User",
            citizenId: res.user.citizenId || existing?.citizenId,
            lawyerId: (res.user as { lawyerId?: string })?.lawyerId || existing?.lawyerId,
          }
        : existing || undefined;

      if (user) setStoredUser(user);

      return {
        user,
        token,
        session: res?.session,
        message: "Session refreshed successfully",
      };
    } catch (err) {
      console.warn("[authService] Token refresh failed:", err);
      return null;
    }
  },

  /**
   * Auto-login to restore active user session when JWT expired
   */
  async autoLogin(): Promise<AuthResponseData | null> {
    // 1. First try refresh token renewal
    const refreshed = await this.refreshToken();
    if (refreshed?.token) return refreshed;

    // 2. Try auto-login with stored session identity
    const existing = getStoredUser<AuthUser>();
    const citizenSession = getCitizenSession();
    const phone = existing?.phone || citizenSession?.phone;
    const email = existing?.email || citizenSession?.email;
    const role = existing?.role || (citizenSession.authenticated ? "citizen" : undefined);

    if (!role && !phone && !email) {
      return null;
    }

    try {
      const res = await apiClient.post<RawAuthResponse>(
        "/auth/auto-login",
        {
          role: role || "citizen",
          phone: phone || undefined,
          email: email || undefined,
          userId: existing?.id,
          citizenId: existing?.citizenId,
          lawyerId: existing?.lawyerId,
        },
        { skipAuth: true }
      );

      const token = res?.session?.accessToken || res?.session?.access_token || res?.token;
      const refreshToken = res?.session?.refreshToken || res?.session?.refresh_token;

      if (token) setStoredToken(token);
      if (refreshToken) setStoredRefreshToken(refreshToken);

      const resolvedUser: AuthUser = {
        id: res?.user?.id || existing?.id || `u_${Date.now()}`,
        role: ((res?.user as { role?: string })?.role || role || "citizen") as AuthUser["role"],
        email: res?.user?.email || email,
        phone: res?.user?.phone || phone,
        name: res?.citizen?.name || res?.lawyer?.name || res?.user?.name || existing?.name || "User",
        citizenId: res?.citizen?.id || res?.user?.citizenId || existing?.citizenId,
        lawyerId: res?.lawyer?.id || (res?.user as { lawyerId?: string })?.lawyerId || existing?.lawyerId,
        status:
          (res?.lawyer as { status?: string })?.status ||
          (res?.user as { status?: string })?.status ||
          existing?.status,
      };

      setStoredUser(resolvedUser);
      if (res?.lawyer) {
        mergeRemoteLawyers([res.lawyer as Partial<Lawyer>]);
      }
      if (resolvedUser.role === "citizen") {
        setCitizenSession({
          authenticated: true,
          phone: resolvedUser.phone || "",
          email: resolvedUser.email || undefined,
          fullName: resolvedUser.name || "Citizen",
        });
      }

      return {
        user: resolvedUser,
        token,
        session: res?.session,
        message: "Auto-login successful",
      };
    } catch (err) {
      console.warn("[authService] Auto-login failed:", err);
      return null;
    }
  },
};
