-- Migration: Add is_affidavit column to case_documents
-- Allows categorizing case documents as sworn affidavits

ALTER TABLE public.case_documents 
ADD COLUMN IF NOT EXISTS is_affidavit BOOLEAN DEFAULT FALSE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_case_documents_is_affidavit 
ON public.case_documents(is_affidavit);
