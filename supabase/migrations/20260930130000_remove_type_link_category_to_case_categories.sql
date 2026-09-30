-- Migration: Remove knowledge_items.type and link knowledge_items.category to case_categories table
-- 1. Drop type column
ALTER TABLE public.knowledge_items DROP COLUMN IF EXISTS type;

-- 2. Normalize existing category data to case_categories.id
UPDATE public.knowledge_items ki
SET category = cc.id
FROM public.case_categories cc
WHERE ki.category = cc.name OR ki.category = cc.code;

-- In case any row has an invalid category, fallback to 'cat_1'
UPDATE public.knowledge_items
SET category = 'cat_1'
WHERE category NOT IN (SELECT id FROM public.case_categories);

-- 3. Add foreign key constraint linking knowledge_items.category to case_categories.id
ALTER TABLE public.knowledge_items
    DROP CONSTRAINT IF EXISTS fk_knowledge_items_category;

ALTER TABLE public.knowledge_items
    ADD CONSTRAINT fk_knowledge_items_category
    FOREIGN KEY (category) REFERENCES public.case_categories(id)
    ON DELETE CASCADE;

-- 4. Create index on knowledge_items.category
CREATE INDEX IF NOT EXISTS idx_knowledge_items_category ON public.knowledge_items (category);
