-- Migration: Replace title with petitioner and respondent in cases_user table
ALTER TABLE public.cases_user ADD COLUMN IF NOT EXISTS petitioner VARCHAR(255);
ALTER TABLE public.cases_user ADD COLUMN IF NOT EXISTS respondent VARCHAR(255);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'cases_user' AND column_name = 'title'
  ) THEN
    EXECUTE $mig$
      UPDATE public.cases_user
      SET 
        petitioner = COALESCE(
          petitioner,
          CASE 
            WHEN title ILIKE '% vs. %' THEN NULLIF(TRIM(SPLIT_PART(title, ' vs. ', 1)), '')
            WHEN title ILIKE '% vs %' THEN NULLIF(TRIM(SPLIT_PART(title, ' vs ', 1)), '')
            WHEN title ILIKE '% v. %' THEN NULLIF(TRIM(SPLIT_PART(title, ' v. ', 1)), '')
            WHEN title ILIKE '% - %' THEN NULLIF(TRIM(SPLIT_PART(title, ' - ', 1)), '')
            WHEN title ILIKE '% — %' THEN NULLIF(TRIM(SPLIT_PART(title, ' — ', 1)), '')
            ELSE NULLIF(TRIM(title), '')
          END,
          'Petitioner'
        ),
        respondent = COALESCE(
          respondent,
          CASE 
            WHEN title ILIKE '% vs. %' THEN NULLIF(TRIM(SPLIT_PART(title, ' vs. ', 2)), '')
            WHEN title ILIKE '% vs %' THEN NULLIF(TRIM(SPLIT_PART(title, ' vs ', 2)), '')
            WHEN title ILIKE '% v. %' THEN NULLIF(TRIM(SPLIT_PART(title, ' v. ', 2)), '')
            WHEN title ILIKE '% - %' THEN NULLIF(TRIM(SPLIT_PART(title, ' - ', 2)), '')
            WHEN title ILIKE '% — %' THEN NULLIF(TRIM(SPLIT_PART(title, ' — ', 2)), '')
            ELSE NULL
          END
        )
      WHERE petitioner IS NULL;

      ALTER TABLE public.cases_user DROP COLUMN title;
    $mig$;
  END IF;
END $$;

UPDATE public.cases_user
SET petitioner = 'Petitioner'
WHERE petitioner IS NULL OR petitioner = '';

ALTER TABLE public.cases_user ALTER COLUMN petitioner SET NOT NULL;
