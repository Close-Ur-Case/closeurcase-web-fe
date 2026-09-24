-- ==============================================================================
-- Migration: Add avatar_url to public.citizens
-- ==============================================================================
-- Allows citizens to have a persisted profile picture / avatar URL in the database
-- matching lawyer `photo_url` and admin `avatar_url`.

ALTER TABLE IF EXISTS public.citizens
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;
