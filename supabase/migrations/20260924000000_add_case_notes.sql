-- ==============================================================================
-- Migration: Add notes JSONB column to public.cases_user
-- ==============================================================================
-- Enables advocates and administrators to record case memos, status notes,
-- and meeting logs directly on the case docket.

ALTER TABLE IF EXISTS public.cases_user
    ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT '[]'::jsonb NOT NULL;
