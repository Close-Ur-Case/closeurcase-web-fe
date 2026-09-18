-- Migration: 20260918080000_remove_duplicate_court_levels.sql
-- Description: Remove duplicate legacy court levels (lvl_1, lvl_2, lvl_3, lvl_4) and enforce unique court level names

-- 1. Ensure all courts use semantic level IDs
UPDATE public.courts SET level = 'lvl_supreme_court' WHERE level = 'lvl_1';
UPDATE public.courts SET level = 'lvl_high_court' WHERE level = 'lvl_2';
UPDATE public.courts SET level = 'lvl_district_court' WHERE level = 'lvl_3';
UPDATE public.courts SET level = 'lvl_mact' WHERE level = 'lvl_4';

-- 2. Remove legacy duplicate rows from court_levels
DELETE FROM public.court_levels WHERE id IN ('lvl_1', 'lvl_2', 'lvl_3', 'lvl_4');

-- 3. Add UNIQUE constraint on court_levels.name to prevent future duplicate names
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uq_court_levels_name' AND table_name = 'court_levels'
    ) THEN
        ALTER TABLE public.court_levels ADD CONSTRAINT uq_court_levels_name UNIQUE (name);
    END IF;
END $$;
