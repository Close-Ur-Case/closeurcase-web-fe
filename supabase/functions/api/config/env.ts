// Supabase Edge Functions automatically inject SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
export const env = {
  NODE_ENV: Deno.env.get("NODE_ENV") || "production",
  CLIENT_URL: Deno.env.get("CLIENT_URL") || "http://localhost:8080",

  SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "https://zxsizwzjktorqjlzzchg.supabase.co",
  SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-service-key",

  // Supabase PostgreSQL Connection String
  DATABASE_URL:
    Deno.env.get("DATABASE_URL") ||
    Deno.env.get("SUPABASE_DB_URL") ||
    "postgresql://postgres:mEzRsjRsQmek4mqn@db.zxsizwzjktorqjlzzchg.supabase.co:5432/postgres",

  RAZORPAY_KEY_ID: Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_placeholder",
  RAZORPAY_KEY_SECRET: Deno.env.get("RAZORPAY_KEY_SECRET") || "placeholder_secret",
  RAZORPAY_WEBHOOK_SECRET: Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "placeholder_webhook_secret",

  AGORA_APP_ID: Deno.env.get("AGORA_APP_ID") || "placeholder_agora_app_id",
  AGORA_APP_CERTIFICATE: Deno.env.get("AGORA_APP_CERTIFICATE") || "placeholder_agora_certificate",

  FIREBASE_SERVICE_ACCOUNT_KEY: Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY") || "",

  STORAGE: {
    CASE_DOCUMENTS: Deno.env.get("STORAGE_CASE_DOCUMENTS_BUCKET") || "case-documents",
    ID_PROOFS: Deno.env.get("STORAGE_ID_PROOFS_BUCKET") || "id-proofs",
    AVATARS: Deno.env.get("STORAGE_AVATARS_BUCKET") || "avatars",
    KNOWLEDGE_BASE: Deno.env.get("STORAGE_KNOWLEDGE_BASE_BUCKET") || "knowledge-base",
  },
};
