-- Migration: 20261007000000_enhance_video_calls.sql
-- Description: Add consultation notes, ended_at timestamp, recording reference, and performance indexes to video_calls table.

ALTER TABLE IF EXISTS public.video_calls
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Composite index for fast lookup of call history by case
CREATE INDEX IF NOT EXISTS idx_video_calls_case_id_created 
  ON public.video_calls (case_id, created_at DESC);

-- Index for participant query optimization
CREATE INDEX IF NOT EXISTS idx_video_calls_caller_receiver 
  ON public.video_calls (caller_id, receiver_id);
