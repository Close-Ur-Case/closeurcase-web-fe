-- ==============================================================================
-- Migration: Create Project-Wide Centralized Lookups Table & Drop Legacy Lookups
-- ==============================================================================

-- 1. Drop existing foreign key constraints on cases_user
ALTER TABLE IF EXISTS public.cases_user DROP CONSTRAINT IF EXISTS cases_user_case_type_fkey;
ALTER TABLE IF EXISTS public.cases_user DROP CONSTRAINT IF EXISTS cases_user_lawyer_casestage_id_fkey;

-- 2. Create project-wide lookups table (no requires_cnr column)
CREATE TABLE IF NOT EXISTS public.lookups (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    label VARCHAR(128) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lookups_category ON public.lookups (category);
CREATE INDEX IF NOT EXISTS idx_lookups_sort ON public.lookups (category, sort_order);

-- 3. Seed merged lookups data across project categories
INSERT INTO public.lookups (id, category, label, description, sort_order) VALUES
-- Category: case_type
('new', 'case_type', 'New Case', 'Brand new matter requiring advocate filing and initial court registration', 1),
('pending', 'case_type', 'Pending Case', 'Existing matter currently pending before a court with assigned CNR', 2),
('closed', 'case_type', 'Closed / Disposed Case', 'Past or disposed court matter with assigned CNR', 3),

-- Category: lawyer_casestage
('submitted', 'lawyer_casestage', 'Submitted', 'Case submitted by citizen, awaiting advocate review', 0),
('accepted', 'lawyer_casestage', 'Accepted', 'Advocate accepted representation', 1),
('filinginprogress', 'lawyer_casestage', 'Filing in Progress', 'Court filing and petition drafting in progress', 2),
('cnrgenerated', 'lawyer_casestage', 'CNR Generated', 'Case filed and CNR number assigned by court registry', 3),
('rejected', 'lawyer_casestage', 'Rejected', 'Advocate declined representation', 4)
ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

-- 4. Drop legacy standalone tables
DROP TABLE IF EXISTS public.case_types CASCADE;
DROP TABLE IF EXISTS public.lawyer_casestages CASCADE;

-- 5. Re-link cases_user foreign keys to public.lookups(id)
ALTER TABLE public.cases_user
    ADD CONSTRAINT cases_user_case_type_fkey FOREIGN KEY (case_type) REFERENCES public.lookups(id);

ALTER TABLE public.cases_user
    ADD CONSTRAINT cases_user_lawyer_casestage_id_fkey FOREIGN KEY (lawyer_casestage_id) REFERENCES public.lookups(id);
