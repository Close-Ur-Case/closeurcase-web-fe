import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  sendCitizenOtp,
  verifyCitizenOtp,
  registerLawyer,
  checkCredentialAvailability,
  loginLawyer,
  loginAdmin,
  getCurrentUser,
  refreshSession,
  autoLogin,
} from "../controllers/authController.ts";
import { authenticateUser } from "../middlewares/auth.ts";
import {
  SendCitizenOtpSchema,
  VerifyCitizenOtpSchema,
  LawyerRegisterSchema,
  CheckCredentialAvailabilitySchema,
  CheckCredentialAvailabilityResponseSchema,
  LawyerLoginSchema,
  AdminLoginSchema,
  RefreshTokenSchema,
  AutoLoginSchema,
  AuthResponseSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
} from "../schemas/index.ts";

const auth = new OpenAPIHono();

const sendCitizenOtpRoute = createRoute({
  method: "post",
  path: "/citizen/send-otp",
  tags: ["Auth - Citizen"],
  summary: "Send 6-digit OTP to citizen via mobile number or email",
  description: "Dispatches a 6-digit one-time password to the specified mobile phone number or email address for passwordless sign in. Ensures phone/email is not registered to an advocate account.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SendCitizenOtpSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "OTP dispatched successfully",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
    400: {
      description: "Missing or invalid mobile number / email address",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    409: {
      description: "Conflict: Mobile number or email is already registered to a lawyer account",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const verifyCitizenOtpRoute = createRoute({
  method: "post",
  path: "/citizen/verify-otp",
  tags: ["Auth - Citizen"],
  summary: "Verify citizen 6-digit OTP code & start authenticated session",
  description: "Validates the 6-digit OTP entered by the citizen. Creates citizen record if first-time sign-in. Verifies that credentials do not conflict with a lawyer account.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: VerifyCitizenOtpSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "OTP verified and citizen session returned",
      content: { "application/json": { schema: AuthResponseSchema } },
    },
    400: {
      description: "Invalid or expired OTP token",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    409: {
      description: "Conflict: Mobile number or email is already registered to a lawyer account",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const registerLawyerRoute = createRoute({
  method: "post",
  path: "/lawyer/register",
  tags: ["Auth - Lawyer"],
  summary: "Register a new advocate / lawyer account",
  description: "Creates an advocate profile with bar council number, practice areas, experience years, and sets status to Pending moderation. Rejects if phone or email is already used by an existing citizen or lawyer.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LawyerRegisterSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Lawyer account registered and pending verification",
      content: { "application/json": { schema: AuthResponseSchema } },
    },
    400: {
      description: "Missing or invalid required registration fields",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    409: {
      description: "Conflict: Mobile number or email is already registered to an existing citizen or lawyer, or Bar ID already exists",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const checkCredentialAvailabilityRoute = createRoute({
  method: "post",
  path: "/check-exists",
  tags: ["Auth - General"],
  summary: "Check if email or phone is already registered across citizens and lawyers",
  description: "Validates availability of email and phone before signup. Ensures existing citizen phone/email is not used for lawyer signup, and advocate phone/email is not used for citizen signup.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CheckCredentialAvailabilitySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Credential availability check result",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const loginLawyerRoute = createRoute({
  method: "post",
  path: "/lawyer/login",
  tags: ["Auth - Lawyer"],
  summary: "Lawyer sign in with email and password",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LawyerLoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Authentication successful",
      content: { "application/json": { schema: AuthResponseSchema } },
    },
  },
});

const loginAdminRoute = createRoute({
  method: "post",
  path: "/admin/login",
  tags: ["Admin"],
  summary: "Superadmin sign in with master credentials",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AdminLoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Admin authentication successful",
      content: { "application/json": { schema: AuthResponseSchema } },
    },
  },
});

const getMeRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["Auth - General"],
  summary: "Get current authenticated user profile",
  middleware: [authenticateUser],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "User profile matching bearer token",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const refreshSessionRoute = createRoute({
  method: "post",
  path: "/refresh",
  tags: ["Auth - General"],
  summary: "Exchange refresh token for fresh access token and session",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RefreshTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Session refreshed successfully",
      content: { "application/json": { schema: AuthResponseSchema } },
    },
    401: {
      description: "Session expired or invalid refresh token",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

const autoLoginRoute = createRoute({
  method: "post",
  path: "/auto-login",
  tags: ["Auth - General"],
  summary: "Auto-login active session when JWT expired and verify suspend status",
  description: "Restores user session during relogin for citizen or lawyer, checking and returning latest account status (including Suspended).",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AutoLoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Session restored via auto-login with verified user status",
      content: { "application/json": { schema: AuthResponseSchema } },
    },
    401: {
      description: "Auto-login failed or credentials unavailable",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

auth.openapi(sendCitizenOtpRoute, sendCitizenOtp as any);
auth.openapi(verifyCitizenOtpRoute, verifyCitizenOtp as any);
auth.openapi(registerLawyerRoute, registerLawyer as any);
auth.openapi(checkCredentialAvailabilityRoute, checkCredentialAvailability as any);
auth.openapi(loginLawyerRoute, loginLawyer as any);
auth.openapi(loginAdminRoute, loginAdmin as any);
auth.openapi(getMeRoute, getCurrentUser as any);
auth.openapi(refreshSessionRoute, refreshSession as any);
auth.openapi(autoLoginRoute, autoLogin as any);

export default auth;

