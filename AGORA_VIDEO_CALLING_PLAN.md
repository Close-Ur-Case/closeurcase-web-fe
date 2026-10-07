# Agora 1-on-1 Video Calling Implementation Plan

**Project:** CloseUrCase (Legal Tech Platform)  
**Use Case:** 1-on-1 Secure Citizen-to-Lawyer Video Consultations  
**Tech Stack:** React 19, Vite, TanStack Router, Tailwind CSS v4, Supabase (Hono backend), Agora Web RTC SDK v4 (`agora-rtc-sdk-ng`)

---

## 1. Executive Summary & Goals

This plan outlines the complete step-by-step implementation for integrating **Agora RTC** for 1-on-1 video consultations between Citizens and Advocates on CloseUrCase.

### Key Objectives
* **Strictly 1-on-1 Architecture:** Optimized bandwidth and zero group overhead.
* **Production-Grade Security:** Dynamic Agora RTC AccessToken2 generation via Supabase backend.
* **Consultation-Specific UX:**
  * Fullscreen remote video with Picture-in-Picture (PIP) local preview.
  * Screen sharing for case documents (FIRs, affidavits, contracts).
  * 30-minute consultation countdown with a visual warning at 25 minutes.
  * Waiting room state when one party joins before the other.
* **Call Logging:** Automatically persist call metadata and duration to Supabase database.

---

## 2. Current Codebase Audit & Gap Analysis

| Component | Current State | Required Action |
| :--- | :--- | :--- |
| **Backend Token API** (`supabase/functions/api/routes/videoCallRoutes.ts`) | Endpoint `/api/v1/video-calls/token` exists | ✅ Keep route, update token builder |
| **Backend Token Builder** (`agoraTokenBuilder.ts`) | Uses custom HMAC JSON string (rejected by Agora servers) | ⚠️ Replace with official standard Agora AccessToken2 (`agora-token` npm) |
| **Frontend Dependencies** (`package.json`) | No Agora package installed | ⚠️ Install `agora-rtc-sdk-ng` |
| **Frontend Call Overlay** (`VideoCallOverlay.tsx`) | Uses mock `getUserMedia` loop and timer | ⚠️ Connect to real Agora channel, remote track subscription & screen share |
| **Video Call State** (`VideoCallContext.tsx`) | Handles modal open/close | ✅ Already supports active call state |
| **Call Logging** (`videoCallService.logCall`) | Ready and mapped to Supabase Drizzle table `video_calls` | ✅ Call on call hangup with accurate duration |
| **Database Schema** (`public.video_calls`) | Table exists with core fields | ⚠️ Add optional `ended_at`, `notes`, `recording_url` and indexing |

---

## 3. Architecture & Data Flow

```
+-------------+                 +---------------------------+                 +-------------------+
|   Citizen   |                 |    CloseUrCase Web App    |                 |   Advocate/Lawyer |
+------+------+                 +-------------+-------------+                 +---------+---------+
       |                                      |                                         |
       | 1. Joins Consultation                |                                         |
       +------------------------------------->| 2. Fetch Agora RTC Token                |
       |                                      +--------------------+                    |
       |                                      | (POST /video-calls/token)               |
       |                                      |<-------------------+                    |
       |                                      |                                         |
       |                                      | 3. Connects to Agora Channel            |
       |                                      |    channel: "case_<caseId>"             |
       |                                      +---------------------------------------->| 4. Advocate Joins
       |                                      |                                         |
       |                   5. Bidirectional Encrypted 1-on-1 Media Stream               |
       |<==============================================================================>|
       |                         (Audio, Video, Screen Share)                           |
       |                                      |                                         |
       | 6. Consultation Ends (30 mins / Hang up)                                       |
       +------------------------------------->|                                         |
                                              | 7. Leave Agora Channel                  |
                                              | 8. POST /video-calls/log                |
                                              |    (Persist duration & status)          |
```

---

## 4. Specific Changes Breakdown: Frontend, Backend & Database

### A. Frontend Changes (Client Application)

#### 1. Package Dependencies (`package.json`)
* **Add:** `agora-rtc-sdk-ng` (`^4.23.0` or latest)
* **Command:** `npm install agora-rtc-sdk-ng`
* **Purpose:** Official Agora WebRTC SDK for client connection, media tracks, audio/video encoding, and screen sharing.

#### 2. New Hook: `src/features/video-call/useAgoraRtc.ts`
Create a centralized, robust custom hook to isolate all Agora RTC logic from UI code:
* **Connection Lifecycle:** 
  * Connect to Agora RTC channel using `appId`, `channelName`, `token`, and `uid`.
  * Gracefully leave channel and stop all tracks on unmount.
* **Track Management:**
  * Create local microphone and camera tracks via `AgoraRTC.createMicrophoneAndCameraTracks()`.
  * Publish tracks to the channel.
* **Remote Subscription (1-on-1):**
  * Listen for `user-published` event to subscribe to the remote citizen/advocate’s audio & video.
  * Listen for `user-unpublished` / `user-left` to update remote video state and display waiting state.
* **Meeting Controls:**
  * `toggleMic()`: Mute/unmute microphone track (`localAudioTrack.setEnabled(!micOn)`).
  * `toggleCam()`: Turn camera on/off (`localVideoTrack.setEnabled(!camOn)`).
  * `toggleScreenShare()`: Create and publish `AgoraRTC.createScreenVideoTrack()` for reviewing case documents, affidavits, or FIRs.
* **Network & Quality:**
  * Listen to `network-quality` and `connection-state-change` to alert users on unstable mobile networks.

#### 3. Component Overhaul: `src/components/app/VideoCallOverlay.tsx`
Replace the existing simulated loop with the real Agora 1-on-1 interface:
* **Dual Viewport Layout:**
  * **Main Stage (Fullscreen):** Renders the **Remote Participant** (when the citizen joins, they see the lawyer; when the lawyer joins, they see the citizen).
  * **PIP Floating Tile (Bottom Right):** Renders the **Local Participant** self-preview.
* **Waiting Room State:**
  * When remote user is not yet connected: Display animated status: *"Waiting for Advocate / Client to join…"*.
* **Document Screen Share Dock:**
  * Button to toggle screen sharing for presenting case files.
* **Consultation Timer Banner:**
  * Countdown from 30:00 down to 00:00.
  * Warning alert badge at 25:00 (`"5 minutes remaining"`).
  * Automatic graceful disconnect at 30:00.
* **Hangup & Remote Logging:**
  * Unpublish tracks, call `client.leave()`, and invoke `videoCallService.logCall(...)`.

#### 4. Context & Trigger Points
* **`src/features/video-call/VideoCallContext.tsx`:**
  * Verify payload includes `caseId`, `withName`, `role`, and optional `channelName`.
* **Chat Integration (`src/routes/citizen.chat.$id.tsx` & `src/routes/lawyer.chat.$id.tsx`):**
  * Hook the header "Video Call" action button to trigger `useVideoCall().startCall({ caseId, withName, role })`.

#### 5. Environment Variables (`.env`)
* Add:
  ```env
  VITE_AGORA_APP_ID=your_agora_app_id
  ```

---

### B. Backend Changes (Supabase Edge API / Hono)

#### 1. Dependencies (`supabase/functions/api/`)
* Import the official Agora token generator package in Deno/Node:
  ```ts
  import { RtcTokenBuilder, RtcRole } from "npm:agora-token@2.0.3";
  ```

#### 2. Token Builder: `supabase/functions/api/utils/agoraTokenBuilder.ts`
* **Current Issue:** Uses a custom HMAC JSON string which is rejected by Agora RTC gateways.
* **Fix:** Rewrite using standard Agora AccessToken2 / `RtcTokenBuilder.buildTokenWithUid(...)`:
  ```ts
  export function buildAgoraRtcToken({
    appId,
    appCertificate,
    channelName,
    uid,
    role = RtcRole.PUBLISHER,
    expireSeconds = 3600,
  }) {
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + expireSeconds;
    return RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      Number(uid),
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    );
  }
  ```

#### 3. Service Layer: `supabase/functions/api/services/agoraService.ts`
* **`generateToken()` Enhancement:**
  * Generate a predictable or numeric `uid` (Agora RTC prefers 32-bit positive integers).
  * Set token expiration to 3,600 seconds (1 hour).
  * Maintain safe mock fallback if credentials are empty during development.
* **`logCall()` Enhancement:**
  * Store exact `ended_at` timestamp.
  * Support optional `notes` and `recording_url` fields.

#### 4. Route Security: `supabase/functions/api/routes/videoCallRoutes.ts`
* Verify that the requesting authenticated user (`auth.uid`) is either the **assigned lawyer** or the **client/citizen** for the given `caseId` before issuing an RTC token for `case_<caseId>`.

#### 5. Environment Variables (`supabase/.env`)
* Add:
  ```env
  AGORA_APP_ID=your_agora_app_id
  AGORA_APP_CERTIFICATE=your_agora_app_certificate
  ```

---

### C. Database (DB) Changes (PostgreSQL / Supabase / Drizzle)

#### 1. Existing Table Status
The table `public.video_calls` is **already initialized** in your database with the following columns:
* `id` (`varchar(64)`, Primary Key)
* `case_id` (`varchar(128)`, References `cases_user(id)` ON DELETE CASCADE)
* `channel_name` (`varchar(128)`)
* `with_name` (`varchar(255)`)
* `caller_id` (`varchar(64)`)
* `receiver_id` (`varchar(64)`)
* `at` (`varchar(64)`)
* `duration_seconds` (`integer`)
* `status` (`varchar(32)` - `completed` | `cancelled` | `missed`)
* `role` (`varchar(32)` - `citizen` | `lawyer`)
* `created_at` (`timestamptz`)

#### 2. New Migration: `supabase/migrations/20261007000000_enhance_video_calls.sql`
Add auxiliary fields to support legal consultation notes, exact end timestamps, and indexing:

```sql
-- Enhance video_calls table for legal consultation management
ALTER TABLE public.video_calls
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Composite index for quick call history lookup per case
CREATE INDEX IF NOT EXISTS idx_video_calls_case_id_created 
  ON public.video_calls (case_id, created_at DESC);

-- Index for user call logs
CREATE INDEX IF NOT EXISTS idx_video_calls_caller_receiver 
  ON public.video_calls (caller_id, receiver_id);
```

#### 3. Drizzle ORM Model Update: `supabase/functions/api/models/videoCalls.ts`
Update the table definition to reflect the new columns:

```ts
import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { casesUser } from "./casesUser.ts";

export const videoCalls = pgTable("video_calls", {
  id: varchar("id", { length: 64 }).primaryKey(),
  caseId: varchar("case_id", { length: 128 }).notNull().references(() => casesUser.id, { onDelete: "cascade" }),
  channelName: varchar("channel_name", { length: 128 }),
  withName: varchar("with_name", { length: 255 }).notNull(),
  callerId: varchar("caller_id", { length: 64 }),
  receiverId: varchar("receiver_id", { length: 64 }),
  at: varchar("at", { length: 64 }).notNull(),
  durationSeconds: integer("duration_seconds"),
  status: varchar("status", { length: 32 }).default("completed").notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  notes: text("notes"),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

#### 4. Frontend Type Sync: `src/types/api.ts`
Update `LogCallPayload` and `VideoCallRecord`:

```ts
export interface LogCallPayload {
  caseId: string;
  withName?: string;
  channelName?: string;
  callerId?: string;
  receiverId?: string;
  role?: string;
  status?: string;
  durationSeconds?: number;
  endedAt?: string;
  notes?: string;
}

export interface VideoCallRecord {
  id: string;
  caseId: string;
  channelName?: string;
  withName: string;
  callerId?: string | null;
  receiverId?: string | null;
  at: string;
  durationSeconds?: number;
  status: string;
  role: string;
  endedAt?: string | null;
  notes?: string | null;
  recordingUrl?: string | null;
  createdAt?: string;
}
```

---

## 5. Step-by-Step Implementation Roadmap

### Phase 1: Environment & Credentials Setup
1. Register/log in to [Agora Console](https://console.agora.io/).
2. Create project with **"Testing mode: App ID + Token"**.
3. Add `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` to `supabase/.env`.
4. Add `VITE_AGORA_APP_ID` to `.env`.

---

### Phase 2: Database Migration & Backend Token Update
1. Run migration `20261007000000_enhance_video_calls.sql`.
2. Update `supabase/functions/api/models/videoCalls.ts`.
3. Update `supabase/functions/api/utils/agoraTokenBuilder.ts` with `agora-token`.
4. Verify `/video-calls/token` endpoint returns valid token.

---

### Phase 3: Frontend SDK Installation & Custom Hook
1. Install `agora-rtc-sdk-ng`:
   ```bash
   npm install agora-rtc-sdk-ng
   ```
2. Implement `src/features/video-call/useAgoraRtc.ts`.

---

### Phase 4: Upgrade `VideoCallOverlay.tsx`
1. Replace mock media loop with `useAgoraRtc`.
2. Wire up full-screen remote video and picture-in-picture local preview.
3. Add screen share toggle for legal files.
4. Add 30-minute consultation timer with 5-minute remaining alert.
5. Wire hang up to `videoCallService.logCall`.

---

### Phase 5: Verification & End-to-End Testing
1. Test 1-on-1 call between two browser tabs.
2. Verify audio, video, mute, and camera toggles.
3. Test screen share document review.
4. Verify call duration is correctly saved in `video_calls` table in Supabase.

---

## 6. Testing & Quality Assurance Plan

| Scenario | Test Procedure | Expected Result |
| :--- | :--- | :--- |
| **Two-Party Join** | Open citizen in Tab 1, lawyer in Tab 2 with same `caseId` | Both exchange audio and video smoothly within 2 seconds |
| **Waiting Room** | Citizen enters 5 minutes early before lawyer | Citizen sees "Waiting for Advocate" banner; video auto-connects when lawyer joins |
| **Microphone Mute** | Citizen clicks mute | Lawyer stops hearing audio; citizen mic icon turns red |
| **Camera Toggle** | Lawyer disables camera | Citizen sees avatar placeholder; camera turns off immediately |
| **Screen Sharing** | Lawyer shares PDF case file tab | Citizen sees document in high resolution |
| **30-Minute Timer** | Fast-forward elapsed time to 25 mins | Warning toast appears: "5 minutes remaining in consultation" |
| **Network Drop** | Disconnect Wi-Fi for 5 seconds on mobile | Agora triggers reconnection state and recovers stream seamlessly |
| **Database Log** | End call after 2 minutes | Supabase table `video_calls` contains record with `durationSeconds: 120` |
