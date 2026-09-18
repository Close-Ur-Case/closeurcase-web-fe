-- ==============================================================================
-- Link Lawyer Practice Areas, Specializations & Legal Services to Case Categories
-- ==============================================================================

-- 1. Ensure JSONB columns exist with proper defaults
ALTER TABLE public.lawyers
    ADD COLUMN IF NOT EXISTS practice_areas JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS legal_services JSONB DEFAULT '[]'::jsonb;

-- 2. Create GIN Indexes for high-performance JSONB containment queries (@>, ?, etc.)
CREATE INDEX IF NOT EXISTS idx_lawyers_practice_areas
    ON public.lawyers USING gin (practice_areas);

CREATE INDEX IF NOT EXISTS idx_lawyers_specializations
    ON public.lawyers USING gin (specializations);

CREATE INDEX IF NOT EXISTS idx_lawyers_legal_services
    ON public.lawyers USING gin (legal_services);

-- 3. Trigger function to validate that lawyer practice_areas match master case_categories
CREATE OR REPLACE FUNCTION public.validate_lawyer_case_taxonomies()
RETURNS TRIGGER AS $$
DECLARE
    invalid_area TEXT;
BEGIN
    IF NEW.practice_areas IS NOT NULL AND jsonb_typeof(NEW.practice_areas) = 'array' AND jsonb_array_length(NEW.practice_areas) > 0 THEN
        SELECT elem
        INTO invalid_area
        FROM jsonb_array_elements_text(NEW.practice_areas) AS elem
        WHERE NOT EXISTS (
            SELECT 1 FROM public.case_categories
            WHERE LOWER(TRIM(id)) = LOWER(TRIM(elem)) OR LOWER(TRIM(name)) = LOWER(TRIM(elem))
        )
        LIMIT 1;

        IF invalid_area IS NOT NULL THEN
            RAISE EXCEPTION 'Invalid practice area "%". Must match an existing category ID in case_categories.', invalid_area;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_lawyer_case_taxonomies ON public.lawyers;
CREATE TRIGGER trg_validate_lawyer_case_taxonomies
    BEFORE INSERT OR UPDATE OF practice_areas ON public.lawyers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_lawyer_case_taxonomies();
