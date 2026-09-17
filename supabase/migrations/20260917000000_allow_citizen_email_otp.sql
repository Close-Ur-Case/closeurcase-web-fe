-- Migration: Allow Citizen Sign-In via Email or Mobile OTP
-- Drop NOT NULL constraint on public.citizens.phone to allow email-only registration

ALTER TABLE public.citizens ALTER COLUMN phone DROP NOT NULL;
