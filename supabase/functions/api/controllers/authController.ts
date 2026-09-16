import type { Context } from "hono";
import { AuthService } from "../services/authService.ts";
import { ApiResponse } from "../utils/apiResponse.ts";

export async function sendCitizenOtp(c: Context) {
  const { phone } = await c.req.json();
  const result = await AuthService.sendCitizenOtp(phone);
  return ApiResponse.success(c, result, "OTP sent successfully");
}

export async function verifyCitizenOtp(c: Context) {
  const { phone, token, name, city } = await c.req.json();
  const result = await AuthService.verifyCitizenOtp({ phone, token, name, city });
  return ApiResponse.success(c, result, "Citizen authenticated successfully");
}

export async function registerLawyer(c: Context) {
  const body = await c.req.json();
  const result = await AuthService.registerLawyer(body);
  return ApiResponse.created(c, result, "Lawyer registered successfully. Pending verification.");
}

export async function loginLawyer(c: Context) {
  const { email, password } = await c.req.json();
  const result = await AuthService.loginLawyer(email, password);
  return ApiResponse.success(c, result, "Lawyer authenticated successfully");
}

export async function loginAdmin(c: Context) {
  const { email, password } = await c.req.json();
  const result = await AuthService.loginAdmin(email, password);
  return ApiResponse.success(c, result, "Administrator authenticated successfully");
}

export async function getCurrentUser(c: Context) {
  const user = c.get("user");
  return ApiResponse.success(c, user, "Current user session details");
}
