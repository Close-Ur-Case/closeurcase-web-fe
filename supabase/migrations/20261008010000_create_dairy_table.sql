-- ==============================================================================
-- Migration: Create dairy table for daily notes module
-- Columns: pk (id), userid (user_id), entry_date (date), notes, status (is_completed), created_at, updated_at
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.dairy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_dairy_user_date ON public.dairy(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_dairy_entry_date ON public.dairy(entry_date);
CREATE INDEX IF NOT EXISTS idx_dairy_is_completed ON public.dairy(is_completed);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_dairy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dairy_updated_at ON public.dairy;
CREATE TRIGGER trg_dairy_updated_at
BEFORE UPDATE ON public.dairy
FOR EACH ROW
EXECUTE FUNCTION update_dairy_updated_at();
