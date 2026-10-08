import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env.ts";
import * as schema from "../models/index.ts";

// PostgreSQL client optimized for Supabase Supavisor Transaction Pooler (Port 6543)
export const client = postgres(env.DATABASE_URL, {
  max: 10, // Allow up to 10 pooled connections to prevent blocking concurrent requests
  idle_timeout: 10, // Return idle connections to pool
  connect_timeout: 10,
  prepare: false, // Required for Supabase Transaction Pooler (Supavisor)
});

export const db = drizzle(client, { schema });
