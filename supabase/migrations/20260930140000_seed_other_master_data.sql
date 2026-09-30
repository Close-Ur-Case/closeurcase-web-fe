-- ==============================================================================
-- Migration: 20260930140000_seed_other_master_data.sql
-- Description: Seed master category, specialization, and legal service for "OTHER"
-- ==============================================================================

-- 1. Insert or update master category "Other"
INSERT INTO public.case_categories (id, name, code, description, sub_categories, active)
VALUES (
    'cat_other',
    'Other',
    'OTHER',
    'Other legal matters, uncategorized disputes, and general legal services',
    '[{"id":"spec_other","name":"Other","services":[{"id":"srv_other","name":"Other"}]}]'::jsonb,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    sub_categories = EXCLUDED.sub_categories,
    active = EXCLUDED.active;

-- 2. Insert or update case_specializations for "Other"
INSERT INTO public.case_specializations (id, category_id, name, description, display_order, active)
VALUES (
    'spec_other',
    'cat_other',
    'Other',
    'Other legal specialization',
    1,
    true
)
ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    active = EXCLUDED.active,
    updated_at = NOW();

-- 3. Insert or update legal_services for "Other"
INSERT INTO public.legal_services (id, specialization_id, category_id, name, display_order, active)
VALUES (
    'srv_other',
    'spec_other',
    'cat_other',
    'Other',
    1,
    true
)
ON CONFLICT (id) DO UPDATE SET
    specialization_id = EXCLUDED.specialization_id,
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    active = EXCLUDED.active,
    updated_at = NOW();
