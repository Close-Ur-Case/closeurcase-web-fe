-- ==============================================================================
-- Add error_message column to _migrations tracking table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public._migrations (
    id VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    error_message TEXT DEFAULT NULL
);

ALTER TABLE public._migrations ADD COLUMN IF NOT EXISTS error_message TEXT DEFAULT NULL;
