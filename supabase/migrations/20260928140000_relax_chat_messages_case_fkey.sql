-- Migration: relax_chat_messages_case_fkey
-- Allows chat messages to be sent for any case (user-submitted, imported, or legacy/demo)
-- without foreign key constraint violations, and optimizes query indexes.

ALTER TABLE IF EXISTS public.chat_messages 
    DROP CONSTRAINT IF EXISTS chat_messages_case_id_fkey;

CREATE INDEX IF NOT EXISTS idx_chat_messages_case_id 
    ON public.chat_messages(case_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_case_created 
    ON public.chat_messages(case_id, created_at ASC);
