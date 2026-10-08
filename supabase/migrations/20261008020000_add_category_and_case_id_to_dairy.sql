-- ==============================================================================
-- Migration: Add category and case_id to dairy table
-- Allows saving preset category and linking to a specific case docket
-- ==============================================================================

ALTER TABLE public.dairy
  ADD COLUMN IF NOT EXISTS category VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS case_id VARCHAR(64) NULL;

-- Indexes for speedy filtering by case and category
CREATE INDEX IF NOT EXISTS idx_dairy_case_id ON public.dairy(case_id);
CREATE INDEX IF NOT EXISTS idx_dairy_category ON public.dairy(category);
