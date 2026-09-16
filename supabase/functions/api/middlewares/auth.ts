import type { Context, Next } from "hono";
import { supabase } from "../config/supabase.ts";
import { ApiError } from "../utils/apiError.ts";
import { db } from "../config/db.ts";
import { users } from "../models/users.ts";
import { eq } from "drizzle-orm";

export async function authenticateUser(c: Context, next: Next) {
  const authHeader = c.req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Authentication token required. Format: Bearer <token>");
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw ApiError.unauthorized("Invalid, expired, or revoked authentication token");
  }

  let role = user.user_metadata?.role;
  if (!role) {
    try {
      const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
      role = dbUser?.role || "citizen";
    } catch {
      role = "citizen";
    }
  }

  c.set("user", {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: role.toLowerCase(),
    userMetadata: user.user_metadata || {},
  });

  await next();
}

export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        c.set("user", {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: (user.user_metadata?.role || "citizen").toLowerCase(),
        });
      }
    } catch {
      c.set("user", null);
    }
  } else {
    c.set("user", null);
  }
  await next();
}
