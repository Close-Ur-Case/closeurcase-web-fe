import { client } from "./functions/api/config/db.ts";

async function main() {
  console.log("=== Step 1: Dropping all public tables ===");
  const dropSql = `
    DO $$ DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
    END $$;
  `;
  await client.unsafe(dropSql);
  console.log("✓ All existing public tables dropped successfully.");

  console.log("\n=== Step 2: Re-migrating schema ===");
  const migrationPath = new URL("./migrations/20260916000000_init_schema.sql", import.meta.url);
  const schemaSql = await Deno.readTextFile(migrationPath);
  await client.unsafe(schemaSql);
  console.log("✓ Schema re-migrated successfully (all 20+ tables & constraints created).");

  console.log("\n=== Step 3: Re-seeding database ===");
  const seedPath = new URL("./seed.sql", import.meta.url);
  const seedSql = await Deno.readTextFile(seedPath);
  await client.unsafe(seedSql);
  console.log("✓ Mockup data re-seeded successfully.");

  console.log("\n=== Step 4: Verifying record counts ===");
  const counts = await client.unsafe(`
    SELECT
      (SELECT COUNT(*) FROM public.users) as users_count,
      (SELECT COUNT(*) FROM public.citizens) as citizens_count,
      (SELECT COUNT(*) FROM public.lawyers) as lawyers_count,
      (SELECT COUNT(*) FROM public.cases) as cases_count,
      (SELECT COUNT(*) FROM public.case_hearings) as hearings_count,
      (SELECT COUNT(*) FROM public.case_orders) as orders_count,
      (SELECT COUNT(*) FROM public.case_categories) as categories_count,
      (SELECT COUNT(*) FROM public.cities) as cities_count,
      (SELECT COUNT(*) FROM public.subscription_plans) as plans_count,
      (SELECT COUNT(*) FROM public.chat_messages) as messages_count,
      (SELECT COUNT(*) FROM public.payments) as payments_count,
      (SELECT COUNT(*) FROM public.knowledge_items) as knowledge_count
  `);

  console.log("Database Stats:", JSON.stringify(counts[0], null, 2));
  console.log("\n✅ Database has been completely reset, re-migrated, and re-seeded!");
  Deno.exit(0);
}

main().catch((err) => {
  console.error("❌ Reset/Migrate/Seed failed:", err);
  Deno.exit(1);
});
