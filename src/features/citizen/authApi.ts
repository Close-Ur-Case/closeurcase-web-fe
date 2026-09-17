/**
 * Citizen Authentication API Client
 * Interfaces directly with CloseUrCase Supabase Edge Functions
 * with automatic local fallback for offline/development environments.
 */

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000/api/v1";

export interface SendOtpPayload {
  phone?: string;
  email?: string;
  identifier?: string;
}

export interface VerifyOtpPayload {
  phone?: string;
  email?: string;
  identifier?: string;
  token: string;
  name?: string;
  city?: string;
}

export interface AuthApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  isMock?: boolean;
}

/**
 * Sends OTP to either mobile number or email ID via Supabase backend.
 */
export async function sendCitizenOtpApi(payload: SendOtpPayload): Promise<AuthApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/citizen/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success === false) {
      // If backend explicitly rejected input, return that error
      return {
        success: false,
        error: json?.message || "Failed to send OTP via server",
      };
    }

    return {
      success: true,
      message: json?.message || "OTP sent successfully",
      data: json?.data,
    };
  } catch (_networkErr) {
    // Graceful fallback for local dev when Edge Function server is not running
    console.info("[Auth API] Backend unavailable, operating in local mock mode (use 000000 or 0000).");
    return {
      success: true,
      isMock: true,
      message: "OTP sent (dev mock mode).",
    };
  }
}

/**
 * Verifies OTP for mobile or email.
 */
export async function verifyCitizenOtpApi(payload: VerifyOtpPayload): Promise<AuthApiResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/citizen/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success === false) {
      return {
        success: false,
        error: json?.message || "Invalid or expired OTP code",
      };
    }

    return {
      success: true,
      message: json?.message || "Authenticated successfully",
      data: json?.data,
    };
  } catch (_networkErr) {
    // Local dev mock verification
    const { token } = payload;
    // Accept standard mock codes or any valid 4/6 digit code in mock mode
    const isValidMock = token === "0000" || token === "000000" || /^\d{4,6}$/.test(token);
    if (isValidMock) {
      return {
        success: true,
        isMock: true,
        message: "Authenticated successfully (dev mock mode)",
      };
    }
    return {
      success: false,
      error: "Invalid OTP. Use 000000 for mock verification.",
    };
  }
}
