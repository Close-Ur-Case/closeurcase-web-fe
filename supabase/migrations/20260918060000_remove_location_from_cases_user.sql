-- Drop indexes and location columns (city, state_id, district_id) from public.cases_user
-- Location belongs to the citizen, lawyer, or court; cases_user is strictly the booking/matter engagement.
DROP INDEX IF EXISTS idx_cases_user_state_id;
DROP INDEX IF EXISTS idx_cases_user_district_id;

ALTER TABLE public.cases_user DROP COLUMN IF EXISTS state_id;
ALTER TABLE public.cases_user DROP COLUMN IF EXISTS district_id;
ALTER TABLE public.cases_user DROP COLUMN IF EXISTS city;
