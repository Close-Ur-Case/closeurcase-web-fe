-- Migration: Detach cases_user.documents and create separate table case_documents

-- 1. Create separate table case_documents
CREATE TABLE IF NOT EXISTS public.case_documents (
    id VARCHAR(128) PRIMARY KEY,
    case_id VARCHAR(128) NOT NULL REFERENCES public.cases_user(id) ON DELETE CASCADE,
    uploader_id VARCHAR(64),
    uploaded_by VARCHAR(32) DEFAULT 'citizen' NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    size VARCHAR(64),
    file_mime_type VARCHAR(128),
    uploaded_at VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON public.case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_uploaded_by ON public.case_documents(uploaded_by);

-- 3. Data Migration: Copy existing documents from cases_user.documents if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'cases_user' AND column_name = 'documents'
  ) THEN
    INSERT INTO public.case_documents (
      id, case_id, name, file_url, size, file_mime_type, uploaded_at, uploaded_by, created_at, updated_at
    )
    SELECT
      'doc_' || md5(c.id || '_' || ord::text || '_' || COALESCE(doc.val->>'id', '') || '_' || COALESCE(doc.val->>'name', '')),
      c.id,
      COALESCE(NULLIF(doc.val->>'name', ''), 'Document'),
      COALESCE(NULLIF(doc.val->>'fileUrl', ''), NULLIF(doc.val->>'file_url', ''), ''),
      doc.val->>'size',
      COALESCE(doc.val->>'fileMimeType', doc.val->>'file_mime_type'),
      COALESCE(NULLIF(doc.val->>'uploadedAt', ''), NULLIF(doc.val->>'uploaded_at', ''), TO_CHAR(c.created_at, 'YYYY-MM-DD')),
      COALESCE(NULLIF(doc.val->>'uploadedBy', ''), NULLIF(doc.val->>'uploaded_by', ''), 'citizen'),
      c.created_at,
      NOW()
    FROM public.cases_user c,
    LATERAL jsonb_array_elements(
      CASE 
        WHEN jsonb_typeof(c.documents) = 'array' THEN c.documents 
        ELSE '[]'::jsonb 
      END
    ) WITH ORDINALITY AS doc(val, ord)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Detach documents column from cases_user
    ALTER TABLE public.cases_user DROP COLUMN IF EXISTS documents;
  END IF;
END $$;
