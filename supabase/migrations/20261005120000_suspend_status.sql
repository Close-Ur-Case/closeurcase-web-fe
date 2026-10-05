-- Migration: Add index for citizen status and update suspended test user
CREATE INDEX IF NOT EXISTS idx_citizens_status ON public.citizens (status);

-- Update u_004 to Suspended
UPDATE public.citizens
SET status = 'Suspended', updated_at = NOW()
WHERE id = 'u_004';

-- Update l_006 to Suspended
UPDATE public.lawyers
SET status = 'Suspended', updated_at = NOW()
WHERE id = 'l_006';

