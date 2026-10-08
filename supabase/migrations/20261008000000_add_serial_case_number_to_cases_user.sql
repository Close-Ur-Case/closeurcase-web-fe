-- ==============================================================================
-- Migration: Add unique serial_case_number to cases_user
-- 1. Create unique column serial_case_number
-- 2. Populate serial_case_number for all existing rows
-- 3. Create trigger to auto-set serial_case_number = case_categories.code/timestampwithoutyear/year
-- ==============================================================================

-- 1. Add column serial_case_number if not exists
ALTER TABLE public.cases_user 
ADD COLUMN IF NOT EXISTS serial_case_number VARCHAR(64);

-- 2. Populate serial_case_number for existing rows
WITH mapped AS (
  SELECT 
    cu.id,
    COALESCE(
      c1.code,
      c2.code,
      c3.code,
      c4.code,
      'OTHER'
    ) AS v_code,
    CASE 
      WHEN cu.id LIKE 'CUC-%' AND length(cu.id) >= 18 THEN substring(cu.id, 9, 10)
      WHEN cu.timeline::jsonb->0->>'at' IS NOT NULL AND cu.timeline::jsonb->0->>'time' IS NOT NULL 
        THEN to_char(to_timestamp((cu.timeline::jsonb->0->>'at') || ' ' || (cu.timeline::jsonb->0->>'time'), 'YYYY-MM-DD HH12:MI AM'), 'MMDDHH24MISS')
      ELSE to_char(cu.created_at, 'MMDDHH24MISS')
    END AS v_ts_no_year,
    CASE 
      WHEN cu.id LIKE 'CUC-%' AND length(cu.id) >= 18 THEN substring(cu.id, 5, 4)
      WHEN cu.timeline::jsonb->0->>'at' IS NOT NULL AND cu.timeline::jsonb->0->>'time' IS NOT NULL 
        THEN to_char(to_timestamp((cu.timeline::jsonb->0->>'at') || ' ' || (cu.timeline::jsonb->0->>'time'), 'YYYY-MM-DD HH12:MI AM'), 'YYYY')
      ELSE to_char(cu.created_at, 'YYYY')
    END AS v_year
  FROM public.cases_user cu
  LEFT JOIN public.case_categories c1 ON c1.id = cu.practice_area
  LEFT JOIN public.case_categories c2 ON c2.code = cu.practice_area
  LEFT JOIN public.case_categories c3 ON c3.name ILIKE cu.practice_area || '%'
  LEFT JOIN public.case_categories c4 ON c4.name ILIKE '%' || cu.practice_area || '%'
)
UPDATE public.cases_user cu
SET serial_case_number = m.v_code || '/' || m.v_ts_no_year || '/' || m.v_year
FROM mapped m
WHERE cu.id = m.id AND (cu.serial_case_number IS NULL OR cu.serial_case_number = '');

-- 3. Add UNIQUE constraint and index on serial_case_number
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_cases_user_serial_case_number'
    ) THEN
        ALTER TABLE public.cases_user 
        ADD CONSTRAINT uq_cases_user_serial_case_number UNIQUE (serial_case_number);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cases_user_serial_case_number 
ON public.cases_user (serial_case_number);

-- 4. Create trigger function to autoset serial_case_number on insert
CREATE OR REPLACE FUNCTION public.set_cases_user_serial_case_number()
RETURNS TRIGGER AS $$
DECLARE
    v_code VARCHAR(32);
    v_ts_no_year VARCHAR(32);
    v_year VARCHAR(10);
    v_candidate VARCHAR(64);
    v_counter INTEGER := 1;
BEGIN
    -- Autoset if serial_case_number is not explicitly provided
    IF NEW.serial_case_number IS NULL OR TRIM(NEW.serial_case_number) = '' THEN
        -- 1. Determine case_categories.code
        SELECT COALESCE(
            (SELECT code FROM public.case_categories WHERE id = NEW.practice_area LIMIT 1),
            (SELECT code FROM public.case_categories WHERE code = NEW.practice_area LIMIT 1),
            (SELECT code FROM public.case_categories WHERE name ILIKE NEW.practice_area || '%' LIMIT 1),
            (SELECT code FROM public.case_categories WHERE name ILIKE '%' || NEW.practice_area || '%' LIMIT 1),
            (SELECT c.code FROM public.case_specializations s 
             JOIN public.case_categories c ON c.id = s.category_id 
             WHERE s.id = NEW.specialization OR s.name ILIKE NEW.specialization LIMIT 1),
            'OTHER'
        ) INTO v_code;

        -- 2. Extract year and timestampwithoutyear
        IF NEW.id LIKE 'CUC-%' AND length(NEW.id) >= 18 THEN
            v_year := substring(NEW.id from 5 for 4);
            v_ts_no_year := substring(NEW.id from 9 for 10);
        ELSE
            v_year := to_char(COALESCE(NEW.created_at, NOW()), 'YYYY');
            v_ts_no_year := to_char(COALESCE(NEW.created_at, NOW()), 'MMDDHH24MISS');
        END IF;

        v_candidate := v_code || '/' || v_ts_no_year || '/' || v_year;

        -- 3. Collision resolution for guaranteed uniqueness
        WHILE EXISTS (
            SELECT 1 FROM public.cases_user 
            WHERE serial_case_number = v_candidate 
              AND (NEW.id IS NULL OR id != NEW.id)
        ) LOOP
            v_candidate := v_code || '/' || v_ts_no_year || LPAD(v_counter::text, 2, '0') || '/' || v_year;
            v_counter := v_counter + 1;
        END LOOP;

        NEW.serial_case_number := v_candidate;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach BEFORE INSERT trigger to public.cases_user
DROP TRIGGER IF EXISTS trg_set_cases_user_serial_case_number ON public.cases_user;
CREATE TRIGGER trg_set_cases_user_serial_case_number
BEFORE INSERT ON public.cases_user
FOR EACH ROW
EXECUTE FUNCTION public.set_cases_user_serial_case_number();
