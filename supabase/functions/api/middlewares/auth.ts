import type { Context, Next } from "hono";
import { supabase, supabaseAdmin } from "../config/supabase.ts";
import { env } from "../config/env.ts";
import { ApiError } from "../utils/apiError.ts";
import { db } from "../config/db.ts";
import { users } from "../models/users.ts";
import { eq } from "drizzle-orm";

export async function authenticateUser(c: Context, next: Next) {
  const authHeader = c.req.header("authorization");
  const match = authHeader?.match(/^bearer\s+(.+)$/i);
  if (!match) {
    throw ApiError.unauthorized("Authentication token required. Format: Bearer <token>");
  }

  const token = match[1].trim();

  // Superadmin / service-role key support for direct system testing and automation
  if (env.SUPABASE_SERVICE_ROLE_KEY && token === env.SUPABASE_SERVICE_ROLE_KEY) {
    c.set("user", {
      id: "usr_admin_master",
      email: "admin@closeurcase.com",
      role: "superadmin",
      userMetadata: { role: "superadmin" },
    });
    return await next();
  }

  // Attempt to resolve user from supabaseAdmin, fallback to supabase client
  let user = null;
  const { data: adminData, error: adminErr } = await supabaseAdmin.auth.getUser(token);
  if (!adminErr && adminData?.user) {
    user = adminData.user;
  } else {
    const { data: clientData, error: clientErr } = await supabase.auth.getUser(token);
    if (!clientErr && clientData?.user) {
      user = clientData.user;
    }
  }

  if (!user) {
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
  const match = authHeader?.match(/^bearer\s+(.+)$/i);
  if (match) {
    try {
      const token = match[1].trim();

      if (env.SUPABASE_SERVICE_ROLE_KEY && token === env.SUPABASE_SERVICE_ROLE_KEY) {
        c.set("user", {
          id: "usr_admin_master",
          email: "admin@closeurcase.com",
          role: "superadmin",
          userMetadata: { role: "superadmin" },
        });
        return await next();
      }

      let user = null;
      const { data: adminData, error: adminErr } = await supabaseAdmin.auth.getUser(token);
      if (!adminErr && adminData?.user) {
        user = adminData.user;
      } else {
        const { data: clientData, error: clientErr } = await supabase.auth.getUser(token);
        if (!clientErr && clientData?.user) {
          user = clientData.user;
        }
      }

      if (user) {
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
      } else {
        c.set("user", null);
      }
    } catch {
      c.set("user", null);
    }
  } else {
    c.set("user", null);
  }
  await next();
}
