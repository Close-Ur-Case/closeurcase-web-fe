# Running & Seeding CloseUrCase with Supabase (`run.md`)

This guide explains how to initialize your database tables, seed the mockup data, and run or test your Supabase Edge Function.

---

## 1. Database Setup & Seeding (Choose Option A or B)

All database schema migrations and seed scripts live directly inside the `supabase/` folder:
- **Table Schema Migration**: [`supabase/migrations/20260916000000_init_schema.sql`](file:///Users/sariyam/lomaa/closeurcase/supabase/migrations/20260916000000_init_schema.sql)
- **Seed Data (Mockup Rows)**: [`supabase/seed.sql`](file:///Users/sariyam/lomaa/closeurcase/supabase/seed.sql)

---

### Option A: Supabase Dashboard SQL Editor (Recommended — 1-Click, No Dependencies)

This is the fastest and most reliable way:

1. Open your Supabase Project:
   👉 **[https://supabase.com/dashboard/project/zxsizwzjktorqjlzzchg/sql/new](https://supabase.com/dashboard/project/zxsizwzjktorqjlzzchg/sql/new)**
2. Copy and paste the contents of [`supabase/migrations/20260916000000_init_schema.sql`](file:///Users/sariyam/lomaa/closeurcase/supabase/migrations/20260916000000_init_schema.sql) into the SQL editor and click **Run**.
   *(This creates all 16 tables: `cases`, `lawyers`, `citizens`, `payments`, `subscriptions`, `withdrawals`, `video_calls`, `notifications`, etc.)*
3. Next, copy and paste the contents of [`supabase/seed.sql`](file:///Users/sariyam/lomaa/closeurcase/supabase/seed.sql) into the SQL editor and click **Run**.
   *(This immediately populates all tables with the frontend mockup cases, lawyers, citizens, payments, and master taxonomies!)*

---

### Option B: Using Supabase CLI

You can push the schema and seed using the CLI from the project root:

```bash
# 1. Link your local repo to your Supabase project
npx supabase link --project-ref zxsizwzjktorqjlzzchg

# 2. Push schema migration to your cloud database
npx supabase db push
```

---

## 2. Independent Projects Architecture

- **Root Directory (`/`)**: 100% Frontend pilot project (React 19 + Vite + TailwindCSS). Run with `npm run dev` from root.
- **`supabase/` Directory**: 100% Backend project (Deno + Hono + Drizzle ORM + Edge Functions). Run independently with `cd supabase && npm run dev`.

---

## 3. Run the Backend Locally (Inside `supabase/` folder)

```bash
cd supabase
npm run dev
# OR: npm start
```

This launches the backend API on **`http://localhost:8000`** with hot-reloading (`--watch`) enabled.

Other commands inside `supabase/`:
```bash
npm run migrate  # Run all database schema migrations against Supabase PostgreSQL
npm run seed     # 1-click schema verify & data seed via HTTP
npm run deploy   # Deploy Edge Function to Supabase Cloud
```

Once running, you can test:
- **Server Root**: [http://localhost:8000/](http://localhost:8000/)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Swagger Documentation UI**: [http://localhost:8000/api-docs](http://localhost:8000/api-docs)
- **1-Click Database Setup & Seed**: [http://localhost:8000/init-db](http://localhost:8000/init-db)

- **Master Data API**: [http://localhost:8000/api/v1/master-data/categories](http://localhost:8000/api/v1/master-data/categories)

---

### Option C: Using Supabase CLI (Requires Docker Desktop)


If you have Docker Desktop installed and running:

```bash
npx supabase functions serve api --no-verify-jwt
```

Available on `http://localhost:54321/functions/v1/api`.


---

## 3. Deploy Live to Supabase Cloud

When ready to deploy:

```bash
npx supabase functions deploy api --no-verify-jwt
```

Your live Edge Function will be available at:
- `https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api`
