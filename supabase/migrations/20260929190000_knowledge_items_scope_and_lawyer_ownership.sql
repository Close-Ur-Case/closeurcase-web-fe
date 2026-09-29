-- Migration: Add scope, uploaded_by, and lawyer_id to knowledge_items for Global vs My Docs isolation
ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS scope VARCHAR(32) NOT NULL DEFAULT 'global';
ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(128);
ALTER TABLE public.knowledge_items ADD COLUMN IF NOT EXISTS lawyer_id VARCHAR(64);

-- Ensure all pre-existing records default to 'global'
UPDATE public.knowledge_items SET scope = 'global' WHERE scope IS NULL OR scope = '';

-- Create indexes for high-performance scoped lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_items_scope ON public.knowledge_items (scope);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_lawyer_id ON public.knowledge_items (lawyer_id);
