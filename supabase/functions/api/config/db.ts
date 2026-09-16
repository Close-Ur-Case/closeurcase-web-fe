import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env.ts";
import * as schema from "../models/index.ts";

// PostgreSQL client for Deno Edge environment
export const client = postgres(env.DATABASE_URL, {
  max: 5,
  idle_timeout: 10,
  connect_timeout: 10,
  prepare: false, // Required for Supabase connection pooler
});

export const db = drizzle(client, { schema });
