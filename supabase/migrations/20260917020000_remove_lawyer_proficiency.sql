-- Migration: Remove proficiency and store lawyers.practice_areas as array of strings

-- 1. Strip 'proficiency' key and normalize practice_areas to array of strings (e.g. ["Family Law", "Corporate Law"])
UPDATE public.lawyers
SET practice_areas = (
  SELECT COALESCE(
    jsonb_agg(
      CASE 
        WHEN jsonb_typeof(elem) = 'object' AND elem ? 'name' THEN to_jsonb(elem->>'name')
        WHEN jsonb_typeof(elem) = 'string' THEN elem
        ELSE to_jsonb(elem::text)
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(practice_areas) elem
)
WHERE practice_areas IS NOT NULL
  AND jsonb_typeof(practice_areas) = 'array';

-- 2. Create GIN index on practice_areas for instant search & filtering
CREATE INDEX IF NOT EXISTS idx_lawyers_practice_areas ON public.lawyers USING gin (practice_areas);
