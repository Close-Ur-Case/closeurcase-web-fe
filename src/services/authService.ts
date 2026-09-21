/**
 * Authentication Service
 * Communicates with Supabase Edge Function /v1/auth endpoints
 * Supports citizen OTP, lawyer login/register, admin login, and /auth/me
 */

import { apiClient, setStoredToken, setStoredUser, clearAuthStorage, ApiError } from "./apiClient";
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
  ): Promise<{ success: boolean; message: string; isMock?: boolean }> {
    try {
      const res = await apiClient.post<{ message?: string }>("/auth/citizen/send-otp", payload, {
        skipAuth: true,
      });
      return {
        success: true,
        message: res?.message || "OTP sent successfully",
      };
    } catch (err: unknown) {
      // Local dev graceful fallback if backend is not reachable
      if (err instanceof ApiError && err.statusCode === 0) {
        console.info("[Auth] Local dev fallback: OTP sent (use 000000 or 0000).");
        return {
          success: true,
          isMock: true,
          message: "OTP sent (dev mock mode - use 000000)",
        };
      }
      throw err;
    }
  },

  /**
   * Verify citizen OTP and receive session token
   */
  async verifyCitizenOtp(payload: VerifyOtpPayload): Promise<AuthResponseData> {
    try {
      const res = await apiClient.post<RawAuthResponse>("/auth/citizen/verify-otp", payload, {
        skipAuth: true,
      });

      const token = res?.session?.access_token || res?.token;
      const user: AuthUser = {
        id: res?.user?.id || `u_${Date.now()}`,
        role: "citizen",
        email: res?.user?.email || payload.email,
        phone: res?.user?.phone || payload.phone,
        name: res?.user?.name || payload.name || "Citizen User",
        city: res?.user?.city || payload.city,
        citizenId: res?.user?.citizenId,
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
    } catch (err: unknown) {
      // Graceful dev mock fallback
      if (err instanceof ApiError && err.statusCode === 0) {
        const isValid =
          payload.token === "0000" || payload.token === "000000" || /^\d{4,6}$/.test(payload.token);
        if (isValid) {
          const user: AuthUser = {
            id: "citizen_demo",
            role: "citizen",
            phone: payload.phone || "+91 98765 43210",
            email: payload.email,
            name: payload.name || "Sai Teja Reddy",
            city: payload.city || "Hyderabad",
          };
          const token = "mock_citizen_jwt_token";
          setStoredToken(token);
          setStoredUser(user);
          return {
            user,
            token,
            isMock: true,
            message: "Citizen authenticated (dev mock mode)",
          };
        }
      }
      throw err;
    }
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
    try {
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
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 0) {
        // Fallback for local offline demo
        const user: AuthUser = {
          id: "l_demo",
          role: "lawyer",
          email: payload.email,
          name: "Swathi Reddy",
          lawyerId: "l_001",
        };
        const token = "mock_lawyer_jwt_token";
        setStoredToken(token);
        setStoredUser(user);
        return { user, token, isMock: true };
      }
      throw err;
    }
  },

  /**
   * Superadmin login with master credentials
   */
  async loginAdmin(payload: AdminLoginPayload): Promise<AuthResponseData> {
    try {
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
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 0) {
        const user: AuthUser = {
          id: "admin_demo",
          role: "admin",
          email: payload.email,
          name: "Platform Ops",
        };
        const token = "mock_admin_jwt_token";
        setStoredToken(token);
        setStoredUser(user);
        return { user, token, isMock: true };
      }
      throw err;
    }
  },

  /**
   * Get current authenticated user profile using Bearer token
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const res = await apiClient.get<{ user?: AuthUser }>("/auth/me");
      if (res?.user) {
        setStoredUser(res.user);
        return res.user;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Clear all authenticated session data
   */
  logout(): void {
    clearAuthStorage();
  },
};
