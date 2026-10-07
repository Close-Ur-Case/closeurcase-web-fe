import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env.ts";
import * as schema from "../models/index.ts";

// PostgreSQL client optimized for Supabase Supavisor Transaction Pooler (Port 6543)
export const client = postgres(env.DATABASE_URL, {
  max: 1, // Only 1 connection per serverless worker to prevent multiplication
  idle_timeout: 4, // Rapidly return connections to pool on idle
  connect_timeout: 5,
  prepare: false, // Required for Supabase Transaction Pooler (Supavisor)
});

export const db = drizzle(client, { schema });
