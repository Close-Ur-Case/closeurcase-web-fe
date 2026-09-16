# Production Deployment Guide: Supabase Edge Function (`deploy.md`)

This guide outlines how to deploy your CloseUrCase backend as a production-grade **Supabase Edge Function** using the Supabase CLI (`npx supabase`).

---

## 1. Overview

- **Project ID**: `zxsizwzjktorqjlzzchg`
- **Architecture**: Distributed Edge Serverless Function running on **Deno** using **Hono**
- **Location**: [`supabase/functions/api/`](file:///Users/sariyam/lomaa/closeurcase/supabase/functions/api)
- **Database**: Supabase PostgreSQL (`db.zxsizwzjktorqjlzzchg.supabase.co`)
- **Seeding**: [`supabase/migrations/`](file:///Users/sariyam/lomaa/closeurcase/supabase/migrations) & [`supabase/seed.sql`](file:///Users/sariyam/lomaa/closeurcase/supabase/seed.sql)

---

## 2. Step-by-Step Deployment Instructions

Run these commands from your project root (`/Users/sariyam/lomaa/closeurcase`):

### Step 1: Login to Supabase CLI (One-time setup)
```bash
npx supabase login
```
*(This opens a browser window to authenticate with your Supabase account)*

---

### Step 2: Link your local repository to your Supabase project
```bash
npx supabase link --project-ref zxsizwzjktorqjlzzchg
```
*(Enter your database password when prompted)*

---

### Step 3: Set Third-Party Secrets (Razorpay, Agora)
Supabase automatically injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_DB_URL`.
Set your custom 3rd-party credentials using:

```bash
npx supabase secrets set \
  RAZORPAY_KEY_ID="rzp_test_yourKeyId" \
  RAZORPAY_KEY_SECRET="yourRazorpayKeySecret" \
  AGORA_APP_ID="yourAgoraAppId" \
  AGORA_APP_CERTIFICATE="yourAgoraAppCert"
```

---

### Step 4: Deploy the Edge Function
```bash
npx supabase functions deploy api --no-verify-jwt
```

> **Why `--no-verify-jwt`?**
> The `api` edge function contains its own custom internal authentication router (Phone OTP for Citizens, Email for Lawyers, public legal directory). This flag allows unauthenticated visitors to hit public endpoints like `/lawyers` and `/auth/citizen/send-otp`, while protected endpoints are securely guarded by the internal `authenticateUser` middleware.

---

## 3. Database Migration & Seeding

Before or after deploying the Edge Function, ensure your database has all tables and mockup data:

1. **Dashboard Method (Fastest)**:
   - Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/zxsizwzjktorqjlzzchg/sql/new)
   - Paste and run [`supabase/migrations/20260916000000_init_schema.sql`](file:///Users/sariyam/lomaa/closeurcase/supabase/migrations/20260916000000_init_schema.sql)
   - Paste and run [`supabase/seed.sql`](file:///Users/sariyam/lomaa/closeurcase/supabase/seed.sql)
2. **CLI Method**:
   ```bash
   npx supabase db push
   ```

---

## 4. Your Live Edge Function Endpoints

Once deployed, your backend is live globally:

- **Root Info**:
  `https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api`
- **Health Check**:
  `https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/health`
- **Interactive Swagger Docs**:
  `https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/api-docs`
- **Citizen Phone OTP (Send)**:
  `POST https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/auth/citizen/send-otp`
- **Citizen Phone OTP (Verify)**:
  `POST https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/auth/citizen/verify-otp`
- **Lawyer Registration**:
  `POST https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/auth/lawyer/register`
- **Lawyer Login**:
  `POST https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/auth/lawyer/login`
- **Browse Lawyers**:
  `GET https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/lawyers`
- **Cases (List & Create)**:
  `GET/POST https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/cases`
- **Razorpay Orders**:
  `POST https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/payments/create-order`
- **Agora Video Call Token**:
  `POST https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/video-calls/token`
