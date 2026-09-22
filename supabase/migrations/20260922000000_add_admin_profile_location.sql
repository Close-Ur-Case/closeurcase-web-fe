-- ==============================================================================
-- Migration: Add city/current_location to admin_profiles
-- ==============================================================================
-- `citizens` and `lawyers` both carry `city` and `current_location`; the shared
-- frontend `ProfileForm` component renders those fields for every role,
-- including admin. `admin_profiles` never got them, so there was no server-side
-- home for the admin profile screen's city field to persist to.

ALTER TABLE IF EXISTS public.admin_profiles
    ADD COLUMN IF NOT EXISTS city VARCHAR(128),
    ADD COLUMN IF NOT EXISTS current_location TEXT;
