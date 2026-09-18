-- ==============================================================================
-- Split Case Categories into Normalized Linked Tables:
-- 1. case_categories (Parent Category)
-- 2. case_specializations (Sub-Categories)
-- 3. legal_services (Legal Services)
-- ==============================================================================

-- 1. Create case_specializations table
CREATE TABLE IF NOT EXISTS public.case_specializations (
    id VARCHAR(64) PRIMARY KEY,
    category_id VARCHAR(64) NOT NULL REFERENCES public.case_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_specializations_category_id
    ON public.case_specializations (category_id);

CREATE INDEX IF NOT EXISTS idx_case_specializations_active
    ON public.case_specializations (active);

-- 2. Create legal_services table
CREATE TABLE IF NOT EXISTS public.legal_services (
    id VARCHAR(64) PRIMARY KEY,
    specialization_id VARCHAR(64) NOT NULL REFERENCES public.case_specializations(id) ON DELETE CASCADE,
    category_id VARCHAR(64) NOT NULL REFERENCES public.case_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_days INTEGER DEFAULT 7,
    base_fee NUMERIC(10, 2) DEFAULT 0,
    required_documents JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_services_specialization_id
    ON public.legal_services (specialization_id);

CREATE INDEX IF NOT EXISTS idx_legal_services_category_id
    ON public.legal_services (category_id);

CREATE INDEX IF NOT EXISTS idx_legal_services_active
    ON public.legal_services (active);

-- 3. Migrate existing JSONB data from case_categories.sub_categories into case_specializations
INSERT INTO public.case_specializations (id, category_id, name, description, display_order, active)
SELECT
    COALESCE(sc->>'id', 'spec_' || c.id || '_' || row_number() OVER (PARTITION BY c.id)) AS id,
    c.id AS category_id,
    sc->>'name' AS name,
    sc->>'description' AS description,
    (row_number() OVER (PARTITION BY c.id))::integer AS display_order,
    COALESCE((sc->>'active')::boolean, true) AS active
FROM public.case_categories c,
     jsonb_array_elements(c.sub_categories) AS sc
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    category_id = EXCLUDED.category_id,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    active = EXCLUDED.active,
    updated_at = NOW();

-- 4. Migrate existing JSONB data from case_categories.sub_categories[].services into legal_services
INSERT INTO public.legal_services (id, specialization_id, category_id, name, display_order, active)
SELECT
    COALESCE(
        sub.srv->>'id',
        'srv_' || sub.spec_id || '_' || (row_number() OVER (PARTITION BY sub.spec_id))
    ) AS id,
    sub.spec_id AS specialization_id,
    sub.cat_id AS category_id,
    COALESCE(sub.srv->>'name', sub.srv#>>'{}') AS name,
    (row_number() OVER (PARTITION BY sub.spec_id))::integer AS display_order,
    COALESCE((sub.srv->>'active')::boolean, true) AS active
FROM (
    SELECT
        c.id AS cat_id,
        COALESCE(sc->>'id', 'spec_' || c.id) AS spec_id,
        jsonb_array_elements(sc->'services') AS srv
    FROM public.case_categories c
    CROSS JOIN LATERAL jsonb_array_elements(c.sub_categories) AS sc
) sub
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    specialization_id = EXCLUDED.specialization_id,
    category_id = EXCLUDED.category_id,
    display_order = EXCLUDED.display_order,
    active = EXCLUDED.active,
    updated_at = NOW();

-- 5. Updated Trigger to validate lawyer taxonomies against normalized tables
CREATE OR REPLACE FUNCTION public.validate_lawyer_case_taxonomies()
RETURNS TRIGGER AS $$
DECLARE
    invalid_area TEXT;
    invalid_spec TEXT;
    invalid_service TEXT;
BEGIN
    -- Validate Practice Areas
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

    -- Validate Specializations
    IF NEW.specializations IS NOT NULL AND jsonb_typeof(NEW.specializations) = 'array' AND jsonb_array_length(NEW.specializations) > 0 THEN
        SELECT elem
        INTO invalid_spec
        FROM jsonb_array_elements_text(NEW.specializations) AS elem
        WHERE NOT EXISTS (
            SELECT 1 FROM public.case_specializations
            WHERE LOWER(TRIM(id)) = LOWER(TRIM(elem)) OR LOWER(TRIM(name)) = LOWER(TRIM(elem))
        )
        LIMIT 1;

        IF invalid_spec IS NOT NULL THEN
            RAISE EXCEPTION 'Invalid specialization "%". Must match an existing specialization ID in case_specializations.', invalid_spec;
        END IF;
    END IF;

    -- Validate Legal Services
    IF NEW.legal_services IS NOT NULL AND jsonb_typeof(NEW.legal_services) = 'array' AND jsonb_array_length(NEW.legal_services) > 0 THEN
        SELECT elem
        INTO invalid_service
        FROM jsonb_array_elements_text(NEW.legal_services) AS elem
        WHERE NOT EXISTS (
            SELECT 1 FROM public.legal_services
            WHERE LOWER(TRIM(id)) = LOWER(TRIM(elem)) OR LOWER(TRIM(name)) = LOWER(TRIM(elem))
        )
        LIMIT 1;

        IF invalid_service IS NOT NULL THEN
            RAISE EXCEPTION 'Invalid legal service "%". Must match an existing legal service ID in legal_services.', invalid_service;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_lawyer_case_taxonomies ON public.lawyers;
CREATE TRIGGER trg_validate_lawyer_case_taxonomies
    BEFORE INSERT OR UPDATE OF practice_areas, specializations, legal_services ON public.lawyers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_lawyer_case_taxonomies();
