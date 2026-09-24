import type { Context } from "hono";
import { AuthService } from "../services/authService.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { db } from "../config/db.ts";
import { citizens, lawyers } from "../models/users.ts";
import { eq, or } from "drizzle-orm";

export async function sendCitizenOtp(c: Context) {
  const body = await c.req.json();
  const result = await AuthService.sendCitizenOtp(body);
  return ApiResponse.success(c, result, result.message || "OTP sent successfully");
}

export async function verifyCitizenOtp(c: Context) {
  const body = await c.req.json();
  const result = await AuthService.verifyCitizenOtp(body);
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
  if (!user) {
    return ApiResponse.unauthorized(c, "Not authenticated");
  }

  let citizenRecord = null;
  let lawyerRecord = null;
  if (user.role === "citizen") {
    const [cit] = await db
      .select()
      .from(citizens)
      .where(or(eq(citizens.userId, user.id), eq(citizens.id, user.id)));
    citizenRecord = cit || null;
  } else if (user.role === "lawyer") {
    const [law] = await db
      .select()
      .from(lawyers)
      .where(or(eq(lawyers.userId, user.id), eq(lawyers.id, user.id)));
    lawyerRecord = law || null;
  }

  return ApiResponse.success(
    c,
    {
      ...user,
      citizenId: citizenRecord?.id || undefined,
      lawyerId: lawyerRecord?.id || undefined,
      name: citizenRecord?.name || lawyerRecord?.name || user.email?.split("@")[0] || "User",
      avatarUrl: citizenRecord?.avatarUrl || lawyerRecord?.photoUrl || undefined,
      citizen: citizenRecord,
      lawyer: lawyerRecord,
    },
    "Current user session details"
  );
}

