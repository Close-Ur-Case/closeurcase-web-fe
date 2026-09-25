-- Migration: Add index and constraints for lawyer status and availability_status
-- Supports fast citizen lawyer matching by status='Approved' and availability_status='Online'

UPDATE public.lawyers
SET availability_status = 'Online'
WHERE availability_status IS NULL OR id = 'l_002';

ALTER TABLE public.lawyers
  ALTER COLUMN availability_status SET DEFAULT 'Online';

CREATE INDEX IF NOT EXISTS idx_lawyers_status_availability
  ON public.lawyers (status, availability_status);

COMMENT ON INDEX public.idx_lawyers_status_availability IS
  'Optimizes filtering verified online advocates for citizen case bookings';
