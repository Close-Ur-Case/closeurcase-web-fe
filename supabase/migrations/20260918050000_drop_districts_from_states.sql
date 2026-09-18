-- Drop redundant districts jsonb column from public.states
-- The normalized single source of truth for districts is public.districts
ALTER TABLE public.states DROP COLUMN IF EXISTS districts;
