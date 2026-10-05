-- Migration: Add indexes for fast lookup and conflict checking on citizen & lawyer email and phone
CREATE INDEX IF NOT EXISTS idx_citizens_email_lower ON public.citizens (lower(email));
CREATE INDEX IF NOT EXISTS idx_citizens_phone_clean ON public.citizens (phone);
CREATE INDEX IF NOT EXISTS idx_lawyers_email_lower ON public.lawyers (lower(email));
CREATE INDEX IF NOT EXISTS idx_lawyers_phone_clean ON public.lawyers (phone);
CREATE INDEX IF NOT EXISTS idx_lawyers_bar_id_lower ON public.lawyers (lower(bar_id));
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_phone_clean ON public.users (phone);
