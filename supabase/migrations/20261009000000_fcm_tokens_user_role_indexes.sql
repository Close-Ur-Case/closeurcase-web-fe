-- Migration: Add performance indexes to fcm_tokens for fast targeting by userId and role
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_role ON public.fcm_tokens (role);
CREATE INDEX IF NOT EXISTS idx_app_notifications_user_id ON public.app_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_app_notifications_role ON public.app_notifications (role);
