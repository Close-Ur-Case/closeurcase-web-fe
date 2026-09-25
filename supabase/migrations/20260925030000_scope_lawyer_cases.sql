-- Migration: 20260925030000_scope_lawyer_cases.sql
-- Description: Ensure indexing on cases_user.lawyer_id for fast scoped lawyer queries and case request tracking

CREATE INDEX IF NOT EXISTS idx_cases_user_lawyer_id ON public.cases_user(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_user_lawyer_casestage ON public.cases_user(lawyer_id, lawyer_casestage_id);
CREATE INDEX IF NOT EXISTS idx_cases_user_lawyer_status ON public.cases_user(lawyer_id, case_status);

COMMENT ON INDEX idx_cases_user_lawyer_id IS 'Speeds up advocate case docket and received case request queries';
