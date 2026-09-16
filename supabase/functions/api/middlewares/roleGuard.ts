import type { Context, Next } from "hono";
import { ApiError } from "../utils/apiError.ts";

export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user) {
      throw ApiError.unauthorized("Authentication required");
    }

    const normalizedUserRole = user.role.toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (normalizedUserRole === "admin" || normalizedUserRole === "superadmin") {
      await next();
      return;
    }

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      throw ApiError.forbidden(
        `Access forbidden: Requires [${allowedRoles.join(", ")}]. Current: ${user.role}`
      );
    }

    await next();
  };
}
