-- Migration: Add lawyer registration columns, index, and referential integrity constraint for languages

-- 1. Ensure lawyer registration columns exist
ALTER TABLE public.lawyers ADD COLUMN IF NOT EXISTS registration_type VARCHAR(32) DEFAULT 'lawyer';
ALTER TABLE public.lawyers ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN DEFAULT TRUE;

-- 2. Drop junction table if previously created
DROP TABLE IF EXISTS public.lawyer_languages CASCADE;

-- 3. Create GIN index on languages JSONB array for fast lookup
CREATE INDEX IF NOT EXISTS idx_lawyers_languages ON public.lawyers USING gin (languages);

-- 4. Referential Integrity Constraint: Enforce that all IDs in languages array exist in public.languages
CREATE OR REPLACE FUNCTION public.validate_lawyer_languages()
RETURNS trigger AS $$
DECLARE
    invalid_lang text;
BEGIN
    IF NEW.languages IS NULL OR jsonb_array_length(NEW.languages) = 0 THEN
        RETURN NEW;
    END IF;

    -- Check if any element in NEW.languages does NOT exist in public.languages(id)
    SELECT val INTO invalid_lang
    FROM jsonb_array_elements_text(NEW.languages) AS val
    LEFT JOIN public.languages l ON l.id = val
    WHERE l.id IS NULL
    LIMIT 1;

    IF invalid_lang IS NOT NULL THEN
        RAISE EXCEPTION 'Foreign key violation: language ID "%" does not exist in public.languages table', invalid_lang;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_lawyer_languages ON public.lawyers;
CREATE TRIGGER trg_validate_lawyer_languages
BEFORE INSERT OR UPDATE OF languages ON public.lawyers
FOR EACH ROW
EXECUTE FUNCTION public.validate_lawyer_languages();
