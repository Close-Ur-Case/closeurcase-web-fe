# CloseUrCase Platform — Complete API Documentation

> **Version**: 1.0.0  
> **Runtime**: Deno / Supabase Edge Functions  
> **Framework**: Hono with `@hono/zod-openapi`  
> **Database**: Supabase PostgreSQL with Drizzle ORM (Supavisor Transaction Pooler on Port `6543`)  
> **OpenAPI Spec**: `v3.0.0` (108 Registered Endpoints across 25 Functional Tags)

---

## Interactive Documentation & Endpoints

| Environment | Base URL | Swagger UI URL | OpenAPI 3.0 JSON Spec |
| :--- | :--- | :--- | :--- |
| **Local Development** | `http://localhost:8000/api/v1` | [`http://localhost:8000/api-docs`](http://localhost:8000/api-docs) | [`http://localhost:8000/swagger.json`](http://localhost:8000/swagger.json) |
| **Cloud Production** | `https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/v1` | [`https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/api-docs`](https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/api-docs) | [`https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/swagger.json`](https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/swagger.json) |

---

## 1. Authentication & Response Architecture

### Standard Response Envelope
All API endpoints return standard JSON envelopes structured as follows:

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error or invalid request payload",
  "errors": [
    {
      "field": "notes",
      "message": "Notes content cannot be empty"
    }
  ]
}
```

### Authorization Header
For endpoints protected by authentication, provide the Bearer token in the request header:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

---

## 2. API Modules Index

| # | Domain Tag | Route Prefix | Total Endpoints | Summary |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **System & Health** | `/health`, `/init-db` | 2 | Runtime health checks and 1st-run table DDL initialization. |
| 2 | **Auth - Citizen** | `/v1/auth/citizen/*` | 2 | Mobile OTP send and verification for citizens. |
| 3 | **Auth - Lawyer** | `/v1/auth/lawyer/*` | 3 | Advocate registration, credential checking, and password login. |
| 4 | **Auth - General** | `/v1/auth/*` | 4 | Superadmin login, `/me` profile, session refresh, and auto-login. |
| 5 | **Citizens** | `/v1/citizens/*` | 6 | Citizen profile management, listing, and subscription entitlements. |
| 6 | **Lawyers** | `/v1/lawyers/*` | 10 | Advocate directory, filtering, moderation, status, bank accounts, and ratings. |
| 7 | **Cases - User** | `/v1/cases/user/*` | 9 | Filing user cases, lawyer stage progression, attachments, and messaging. |
| 8 | **Cases - Imported** | `/v1/cases/imported/*` | 3 | Stored eCourts dockets imported by advocates. |
| 9 | **Cases - General** | `/v1/cases/*` | 13 | Global case registry, status updates, advocate assignment, attachments, and chat. |
| 10 | **Daily Diary** | `/v1/dairy/*` | 4 | **Complete CRUD** daily notes, calendar date grouping, category presets, and docket links. |
| 11 | **eCourts Mock API** | `/v1/ecourts/*` | 2 | Deterministic 16-digit CNR case docket generator (no database required). |
| 12 | **Lookups & Master Data** | `/v1/master-data/*`, `/v1/lookups` | 13 | Taxonomies: categories, courts, cities, districts, states, languages, court levels. |
| 13 | **Video Calls** | `/v1/video-calls/*` | 9 | Agora RTC dynamic tokens, incoming call signaling, call logging, and history. |
| 14 | **Payments** | `/v1/payments/*` | 5 | Razorpay order creation, payment signature verification, and webhook handler. |
| 15 | **Subscriptions** | `/v1/subscriptions/*` | 5 | Advocate SaaS subscription plans, activation, and status tracking. |
| 16 | **Withdrawals** | `/v1/withdrawals/*` | 5 | Advocate balance withdrawals, payout summary, and admin approval/rejection. |
| 17 | **Notifications** | `/v1/notifications/*` | 4 | In-app alerts, FCM push tokens, unread counters, and mark-as-read. |
| 18 | **Storage** | `/v1/storage/*` | 3 | Presigned upload/download URLs for case documents, avatars, and ID proofs. |
| 19 | **Support** | `/v1/support/*` | 3 | Contact inquiries and customer assistance ticket workflow. |
| 20 | **AI Assistant** | `/v1/ai/*` | 9 | Statutory merit analysis, precedents, document summarization, legal QA, counter-arguments. |
| 21 | **AI Summarization** | `/v1/summarization/*` | 2 | Executive legal instrument and judgment summarization. |
| 22 | **Email Templates** | `/v1/email-templates/*` | 3 | Transactional HTML email rendering and dispatch. |
| 23 | **Admin** | `/v1/admin/*` | 4 | Platform aggregates, analytics trends, user moderation, and audit logs. |

---

## 3. Comprehensive Route Specifications

---

### Module 1: System & Health

#### `GET /health`
- **Summary**: Checks runtime health and connectivity.
- **Auth**: None (Public).
- **Response `200`**:
  ```json
  {
    "status": "operational",
    "runtime": "Supabase Edge Runtime",
    "timestamp": "2026-10-08T11:30:00.000Z"
  }
  ```

#### `ALL /init-db`
- **Summary**: Initializes all 20 PostgreSQL tables and master data seed items on fresh installs.
- **Auth**: Service Role / Admin.

---

### Module 2: Authentication & Sessions (`/v1/auth/*`)

#### `POST /v1/auth/citizen/send-otp`
- **Summary**: Dispatches an OTP to citizen's mobile number.
- **Request Body**:
  ```json
  { "phone": "+919876543210" }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": { "phone": "+919876543210", "otpSent": true, "expiresIn": 300 }
  }
  ```

#### `POST /v1/auth/citizen/verify-otp`
- **Summary**: Verifies mobile OTP and issues a JWT token. Automatically creates citizen record if first login.
- **Request Body**:
  ```json
  { "phone": "+919876543210", "otp": "123456" }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "user": { "id": "u_citizen_101", "role": "citizen", "phone": "+919876543210" }
    }
  }
  ```

#### `POST /v1/auth/lawyer/register`
- **Summary**: Registers a new advocate with bar council registration number.
- **Request Body**:
  ```json
  {
    "name": "Adv. Vikram Seth",
    "email": "vikram.seth@example.com",
    "phone": "+919849012345",
    "password": "SecurePassword123!",
    "barId": "TS/1402/2018",
    "city": "Hyderabad",
    "category": "Criminal",
    "experienceYears": 8
  }
  ```

#### `POST /v1/auth/lawyer/login`
- **Summary**: Authenticates an advocate via email and password.
- **Request Body**:
  ```json
  { "email": "vikram.seth@example.com", "password": "SecurePassword123!" }
  ```

#### `POST /v1/auth/admin/login`
- **Summary**: Authenticates superadmin users.
- **Request Body**:
  ```json
  { "email": "admin@closeurcase.com", "password": "AdminPassword!" }
  ```

#### `GET /v1/auth/me`
- **Summary**: Fetches active session profile corresponding to JWT token.
- **Auth**: Required (`Bearer <token>`).

#### `POST /v1/auth/refresh`
- **Summary**: Exchanges a valid refresh token for a fresh access token.
- **Request Body**:
  ```json
  { "refreshToken": "eyJhbGciOi..." }
  ```

---

### Module 3: Daily Diary Module (`/v1/dairy/*`)

#### `GET /v1/dairy`
- **Summary**: List daily notes for an advocate or citizen, optionally filtered.
- **Query Parameters**:
  - `userId` *(string, optional)*: Filter notes by user ID.
  - `date` *(string, optional, `YYYY-MM-DD`)*: Filter by target calendar date.
  - `caseId` *(string, optional)*: Filter notes associated with a specific case docket.
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "9e1f54c4-54b1-40cd-8501-6b3c8a441cad",
        "user_id": "usr_102",
        "entry_date": "2026-10-08",
        "notes": "Received certified copy of bail order from registry.",
        "category": "Court Hearing",
        "case_id": "CUC-20260831154512",
        "is_completed": false,
        "created_at": "2026-10-08 11:07:40.880465+00",
        "updated_at": "2026-10-08 11:07:40.880465+00"
      }
    ]
  }
  ```

#### `POST /v1/dairy`
- **Summary**: Create a new daily note.
- **Request Body**:
  ```json
  {
    "userId": "usr_102",
    "entryDate": "2026-10-08",
    "notes": "Discussed rejoinder strategy with Senior Counsel.",
    "category": "Legal Research",
    "caseId": "CUC-20260831154512",
    "isCompleted": false
  }
  ```
- **Response `201`**: Returns newly created row with generated UUID.

#### `PATCH /v1/dairy/:id`
- **Summary**: Partially update an existing daily note (content, status, category, linked case, date).
- **Path Parameters**:
  - `id` *(string)*: Unique note UUID.
- **Request Body**:
  ```json
  {
    "notes": "Updated remarks after hearing was adjourned to next Monday.",
    "category": "Court Hearing",
    "isCompleted": true
  }
  ```
- **Response `200`**: Returns updated record with refreshed `updated_at`.

#### `DELETE /v1/dairy/:id`
- **Summary**: Permanently delete a note record.
- **Path Parameters**:
  - `id` *(string)*: Unique note UUID.
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": { "id": "9e1f54c4-54b1-40cd-8501-6b3c8a441cad" },
    "message": "Dairy note deleted successfully"
  }
  ```

---

### Module 4: Case Management (`/v1/cases/*`)

#### `GET /v1/cases/user`
- **Summary**: List cases filed by citizens or assigned to lawyers.
- **Query Parameters**:
  - `citizenId` *(string, optional)*
  - `lawyerId` *(string, optional)*
  - `status` *(string, optional)*: e.g. `Pending`, `Assigned`, `In Progress`, `Resolved`, `Closed`.
  - `search` *(string, optional)*: Query by title, CNR, or serial number.

#### `POST /v1/cases/user`
- **Summary**: File a new user case.
- **Request Body**:
  ```json
  {
    "title": "K. Srinivas vs State of Telangana",
    "category": "Criminal Law",
    "citizenId": "u_001",
    "citizenName": "K. Srinivas",
    "description": "Bail petition application under Section 439 CrPC.",
    "caseDetails": {
      "courtName": "City Civil Court, Hyderabad",
      "filingDate": "2026-10-08"
    }
  }
  ```

#### `GET /v1/cases/user/:id`
- **Summary**: Fetch comprehensive case record including stages, timeline, and hearings.

#### `PATCH /v1/cases/user/:id/stage`
- **Summary**: Update advocate case stage (e.g., `Drafting`, `Arguments`, `Order Reserved`).
- **Request Body**:
  ```json
  {
    "stage": "Arguments",
    "note": "Petitioner arguments concluded; posted for orders."
  }
  ```

#### `POST /v1/cases/user/:id/attachments`
- **Summary**: Attach legal documents to a case docket.
- **Request Body**:
  ```json
  {
    "files": [
      {
        "id": "doc_101",
        "name": "Vakalatnama.pdf",
        "size": "2.4 MB",
        "type": "application/pdf",
        "url": "https://storage.supabase.co/..."
      }
    ]
  }
  ```

#### `GET /v1/cases/check-serial`
- **Summary**: Validate uniqueness of a serial case number.
- **Query Parameters**: `serial` *(string)*.

---

### Module 5: Lawyers & Advocates (`/v1/lawyers/*`)

#### `GET /v1/lawyers`
- **Summary**: Search and filter advocate directory.
- **Query Parameters**:
  - `city` *(string, optional)*: e.g. `Hyderabad`, `Bangalore`, `New Delhi`.
  - `category` *(string, optional)*: e.g. `Civil`, `Criminal`, `Corporate`.
  - `status` *(string, optional)*: `Active`, `Pending`, `Suspended`.
  - `availability` *(string, optional)*: `Online`, `Offline`, `Busy`.
  - `search` *(string, optional)*: Name, bio, or bar council registration ID.

#### `PATCH /v1/lawyers/:id/availability`
- **Summary**: Toggle advocate live consultation availability.
- **Request Body**:
  ```json
  { "availabilityStatus": "Online" }
  ```

#### `POST /v1/lawyers/:id/ratings`
- **Summary**: Submit client review and 1-5 star rating.
- **Request Body**:
  ```json
  {
    "caseId": "CUC-101",
    "rating": 5,
    "feedback": "Exceptional drafting and prompt representation."
  }
  ```

---

### Module 6: Video Calling & Agora RTC (`/v1/video-calls/*`)

#### `POST /v1/video-calls/agora-token`
- **Summary**: Generates an encrypted Agora RTC channel token for secure video consultations.
- **Request Body**:
  ```json
  {
    "channelName": "consult_CUC_101",
    "role": "publisher",
    "uid": 12345
  }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": {
      "token": "007eJxTYPCb1P/1z...",
      "channel": "consult_CUC_101",
      "appId": "8e72faf625694717b1e97affbe775762",
      "uid": 12345
    }
  }
  ```

#### `POST /v1/video-calls/initiate`
- **Summary**: Signals an incoming call request from client to advocate.

#### `POST /v1/video-calls/log-session`
- **Summary**: Stores call session metadata upon termination (duration, timestamps, notes).

---

### Module 7: Razorpay Payments & Subscriptions (`/v1/payments/*`)

#### `POST /v1/payments/create-order`
- **Summary**: Generates an authentic Razorpay Order ID.
- **Request Body**:
  ```json
  {
    "amount": 499900,
    "currency": "INR",
    "receipt": "rcpt_sub_adv_101"
  }
  ```

#### `POST /v1/payments/verify`
- **Summary**: Validates SHA256 HMAC signature of Razorpay payment payload.
- **Request Body**:
  ```json
  {
    "razorpay_order_id": "order_EKfLwp8q15Ktio",
    "razorpay_payment_id": "pay_29QQoUBi66xm2f",
    "razorpay_signature": "9ef4b630d6218b..."
  }
  ```

---

### Module 8: AI Legal Intelligence (`/v1/ai/*`)

#### `POST /v1/ai/case-analysis`
- **Summary**: Analyzes procedural strengths, weaknesses, and applicable court precedents.
- **Request Body**:
  ```json
  {
    "caseId": "CS-34410",
    "caseText": "Petitioner filed suit for specific performance of sale agreement dated 12-08-2022..."
  }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": {
      "caseMeritScore": 84,
      "strengths": ["Clear registered agreement of sale", "Timely notice sent within limitation"],
      "proceduralWeaknesses": ["Readiness and willingness proof required under Section 16(c)"],
      "precedents": [
        { "citation": "2021 SCC OnLine SC 450", "principle": "Mandatory compliance of readiness" }
      ],
      "recommendedActions": ["Attach bank statement proving balance consideration availability"]
    }
  }
  ```

#### `POST /v1/ai/summarize`
- **Summary**: Extracts executive covenants, termination conditions, and legal liabilities from uploaded instruments.

---

### Module 9: eCourts Integration (`/v1/ecourts/*`)

#### `GET /v1/ecourts/cases/:cnr`
- **Summary**: Generates standard Indian eCourts case dockets on-the-fly based on 16-character alphanumeric CNR.
- **Path Parameter**: `cnr` (e.g. `TSHC010022112026`).

---

## 4. Verification & Testing Instructions

### Run Automated API Suite Locally
To verify the entire API suite against your local development environment:

```bash
# 1. Start backend server
cd supabase && npm run dev

# 2. Test Health Endpoint
curl -s http://localhost:8000/health

# 3. Retrieve OpenAPI Specification
curl -s http://localhost:8000/swagger.json

# 4. Test Daily Diary CRUD Endpoints
curl -s -X POST http://localhost:8000/api/v1/dairy \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","notes":"Review court proceedings","category":"Court Hearing"}'
```

### Inspect Live OpenAPI Swagger UI
Navigate to either:
- **Local Development**: [http://localhost:8000/api-docs](http://localhost:8000/api-docs)
- **Production Supabase**: [https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/api-docs](https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api/api-docs)
