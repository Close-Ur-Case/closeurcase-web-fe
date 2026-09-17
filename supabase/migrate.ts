import { client } from "./functions/api/config/db.ts";

async function runMigrations() {
  console.log("=== Starting Database Migration ===");

  // Create migrations tracking table if not exists
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      id VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `);

  const migrationsDir = new URL("./migrations", import.meta.url);
  const files: string[] = [];

  for await (const entry of Deno.readDir(migrationsDir)) {
    if (entry.isFile && entry.name.endsWith(".sql")) {
      files.push(entry.name);
    }
  }

  files.sort();

  for (const filename of files) {
    const alreadyApplied = await client.unsafe(
      "SELECT id FROM public._migrations WHERE id = $1",
      [filename],
    );

    if (alreadyApplied && alreadyApplied.length > 0) {
      console.log(`- Skipping already applied migration: ${filename}`);
      continue;
    }

    console.log(`-> Applying migration: ${filename}`);
    const filePath = new URL(`./migrations/${filename}`, import.meta.url);
    const sqlContent = await Deno.readTextFile(filePath);

    await client.unsafe(sqlContent);
    await client.unsafe("INSERT INTO public._migrations (id) VALUES ($1)", [filename]);
    console.log(`✓ Migration applied successfully: ${filename}`);
  }

  // Ensure citizens.phone is nullable regardless of previous migration state
  await client.unsafe("ALTER TABLE public.citizens ALTER COLUMN phone DROP NOT NULL;");

  // Verify citizens.phone column nullability in database
  const colInfo = await client.unsafe(`
    SELECT table_name, column_name, is_nullable, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'citizens' 
      AND column_name IN ('phone', 'email');
  `);

  console.log("\nVerification - public.citizens columns status:");
  console.table(colInfo);

  console.log("\n✅ All database migrations completed successfully!");
  Deno.exit(0);
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  Deno.exit(1);
});
