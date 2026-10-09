// In local development, load .env file if available
function loadLocalEnv() {
  const possiblePaths = [
    new URL("../../../.env", import.meta.url),
    new URL("../../../../.env", import.meta.url),
  ];

  for (const path of possiblePaths) {
    try {
      const text = Deno.readTextFileSync(path);
      for (const rawLine of text.split("\n")) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eqIdx = line.indexOf("=");
        if (eqIdx === -1) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!Deno.env.get(key)) {
          Deno.env.set(key, val);
        }
      }
      break;
    } catch {
      // In remote Supabase Edge Functions, secrets are injected automatically by the platform
    }
  }
}

loadLocalEnv();

// Supabase Edge Functions automatically inject SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
export const env = {
  NODE_ENV: Deno.env.get("NODE_ENV") || "production",
  CLIENT_URL: Deno.env.get("CLIENT_URL") || "http://localhost:8080",

  SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "",
  SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") || "",
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",

  // Supabase PostgreSQL Connection String
  DATABASE_URL:
    Deno.env.get("DATABASE_URL") ||
    Deno.env.get("SUPABASE_DB_URL") ||
    "",

  RAZORPAY_KEY_ID: Deno.env.get("RAZORPAY_KEY_ID") || "",
  RAZORPAY_KEY_SECRET: Deno.env.get("RAZORPAY_KEY_SECRET") || "",
  RAZORPAY_WEBHOOK_SECRET: Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "",

  AGORA_APP_ID: Deno.env.get("AGORA_APP_ID") || "",
  AGORA_APP_CERTIFICATE: Deno.env.get("AGORA_APP_CERTIFICATE") || "",

  FIREBASE_SERVICE_ACCOUNT_KEY: Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY") || "",

  AI_BASE_URL: Deno.env.get("AI_BASE_URL") || "",
  aibaseurl: Deno.env.get("AI_BASE_URL") || "",

  STORAGE: {
    CASE_DOCUMENTS: Deno.env.get("STORAGE_CASE_DOCUMENTS_BUCKET") || "case-documents",
    ID_PROOFS: Deno.env.get("STORAGE_ID_PROOFS_BUCKET") || "id-proofs",
    AVATARS: Deno.env.get("STORAGE_AVATARS_BUCKET") || "avatars",
    KNOWLEDGE_BASE: Deno.env.get("STORAGE_KNOWLEDGE_BASE_BUCKET") || "knowledge-base",
  },
};
