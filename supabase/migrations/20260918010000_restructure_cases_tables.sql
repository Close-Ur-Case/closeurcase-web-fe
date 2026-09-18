-- ==============================================================================
-- Migration: Restructure Cases into cases_imported and cases_user
-- ==============================================================================

-- 1. Drop dependent foreign key constraints referencing public.cases if any
ALTER TABLE IF EXISTS public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_case_id_fkey;
ALTER TABLE IF EXISTS public.video_calls DROP CONSTRAINT IF EXISTS video_calls_case_id_fkey;
ALTER TABLE IF EXISTS public.ai_case_analyses DROP CONSTRAINT IF EXISTS ai_case_analyses_case_id_fkey;
ALTER TABLE IF EXISTS public.lawyer_ratings DROP CONSTRAINT IF EXISTS lawyer_ratings_case_id_fkey;
ALTER TABLE IF EXISTS public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_case_id_fkey;
ALTER TABLE IF EXISTS public.payments DROP CONSTRAINT IF EXISTS payments_case_id_fkey;

-- 2. Drop legacy case sub-tables and cases table
DROP TABLE IF EXISTS public.case_hearings CASCADE;
DROP TABLE IF EXISTS public.case_orders CASCADE;
DROP TABLE IF EXISTS public.case_notes CASCADE;
DROP TABLE IF EXISTS public.case_documents CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;

-- 3. Create lookup table: case_types
CREATE TABLE IF NOT EXISTS public.case_types (
    id VARCHAR(32) PRIMARY KEY,
    label VARCHAR(64) NOT NULL,
    description TEXT,
    requires_cnr BOOLEAN DEFAULT FALSE NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

INSERT INTO public.case_types (id, label, description, requires_cnr, sort_order) VALUES
('new', 'New Case', 'Brand new matter requiring advocate filing and initial court registration', false, 1),
('pending', 'Pending Case', 'Existing matter currently pending before a court with assigned CNR', true, 2),
('closed', 'Closed / Disposed Case', 'Past or disposed court matter with assigned CNR', true, 3)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    requires_cnr = EXCLUDED.requires_cnr,
    sort_order = EXCLUDED.sort_order;

-- 4. Create lookup table: lawyer_casestages
CREATE TABLE IF NOT EXISTS public.lawyer_casestages (
    id VARCHAR(64) PRIMARY KEY,
    label VARCHAR(128) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

INSERT INTO public.lawyer_casestages (id, label, description, sort_order) VALUES
('submitted', 'Submitted', 'Case submitted by citizen, awaiting advocate review', 0),
('accepted', 'Accepted', 'Advocate accepted representation', 1),
('filinginprogress', 'Filing in Progress', 'Court filing and petition drafting in progress', 2),
('cnrgenerated', 'CNR Generated', 'Case filed and CNR number assigned by court registry', 3),
('rejected', 'Rejected', 'Advocate declined representation', 4)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

-- 5. Create table: cases_imported (read-only, strictly following case_structure.json)
CREATE TABLE IF NOT EXISTS public.cases_imported (
    cnr VARCHAR(32) PRIMARY KEY,
    case_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    entity_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    files JSONB NOT NULL DEFAULT '{"files":[]}'::jsonb,
    descriptions JSONB NOT NULL DEFAULT '{"enumFields":[],"enumLookup":{}}'::jsonb,
    case_ai_analysis JSONB DEFAULT NULL,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cases_imported_details ON public.cases_imported USING gin (case_details);
CREATE INDEX IF NOT EXISTS idx_cases_imported_entity ON public.cases_imported USING gin (entity_info);

-- 6. Create table: cases_user
CREATE TABLE IF NOT EXISTS public.cases_user (
    id VARCHAR(128) PRIMARY KEY,
    citizen_id VARCHAR(64) REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
    lawyer_id VARCHAR(64) REFERENCES public.lawyers(id) ON DELETE SET NULL,
    case_type VARCHAR(32) REFERENCES public.case_types(id) NOT NULL,
    cnr VARCHAR(32) REFERENCES public.cases_imported(cnr) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    documents JSONB DEFAULT '[]'::jsonb NOT NULL,
    practice_area VARCHAR(128) NOT NULL,
    specialization VARCHAR(128) NOT NULL,
    legal_services JSONB DEFAULT '[]'::jsonb NOT NULL,
    case_status VARCHAR(64) DEFAULT 'submitted' NOT NULL,
    lawyer_casestage_id VARCHAR(64) DEFAULT 'submitted' REFERENCES public.lawyer_casestages(id) NOT NULL,
    rejection_reason TEXT,
    city VARCHAR(128),
    is_emergency BOOLEAN DEFAULT FALSE,
    timeline JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cases_user_citizen ON public.cases_user (citizen_id);
CREATE INDEX IF NOT EXISTS idx_cases_user_lawyer ON public.cases_user (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_user_cnr ON public.cases_user (cnr);
CREATE INDEX IF NOT EXISTS idx_cases_user_status ON public.cases_user (case_status);
CREATE INDEX IF NOT EXISTS idx_cases_user_stage ON public.cases_user (lawyer_casestage_id);

-- 7. Seed canonical case_structure.json into cases_imported FIRST
INSERT INTO public.cases_imported (cnr, case_details, entity_info, files, descriptions, case_ai_analysis, raw_data) VALUES
('DLND020047882015',
'{"cnr":"DLND020047882015","caseNumber":"202400248072016","district":"New Delhi","state":"DL","stateCode":"26","districtCode":"7","courtCode":2,"caseTypeSub":"Criminal Procedure Code.","courtName":"Chief Metropolitan Magistrate, New Delhi, PHC","courtNo":2,"firDetails":{"caseNumber":"273","policeStation":"Central Crime Branch-CCB I","year":"2018"},"filedDocuments":[],"subordinateCourt":{},"linkCases":[],"purpose":"Plaintiff/Petitioner Evidence","disposalType":"DISMISSED_AS_WITHDRAWN","disposalTypeRaw":"DISMISSED AS WITHDRAWN","contestedStatus":"UNCONTESTED","lastHearingDate":"2018-07-07","cnrCourtCode":"DLND02","courtComplexCode":"DLND02","cnrCaseNumber":"0047882015","cnrYear":"2015","caseType":"CC","caseTypeRaw":"Ct Cases","caseStatus":"DISPOSED","filingNumber":"27843/2015","filingDate":"2015-12-21","registrationNumber":"24807/2016","registrationDate":"2015-12-21","firstHearingDate":"2016-01-05","nextHearingDate":"2018-07-07","decisionDate":"2018-07-07","caseDurationDays":929,"filingToFirstHearingDays":15,"judges":[],"petitioners":["MR.ARUN JAITLEY"],"petitionerAdvocates":[],"respondents":["MR. ARVIND KEJRIWAL"],"respondentAdvocates":[],"caseCategoryFacetPath":"Criminal Law/Other Criminal Matters","hasOrders":true,"hasJudgments":true,"orderCount":10,"interimOrderCount":9,"judgmentCount":1,"hearingCount":25,"iaCount":0,"taggedMatters":[{"type":"Case Number","caseNumber":"CRLMP/33524/2024"}],"earlierCourtDetails":[],"interlocutoryApplications":[],"listingDates":[],"notices":[],"caveatDetails":[],"historyOfCaseHearings":[{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2016-01-05","hearingDate":"2016-04-07","purposeOfListing":"Misc./ Appearance"},{"judge":"Addl. Chief Metropolitan Magistrate","businessOnDate":"2018-07-07","purposeOfListing":"Disposed"}],"interimOrders":[{"orderDate":"2017-10-27","description":"COPY OF ORDER","orderUrl":"order-1.pdf"}],"judgmentOrders":[{"orderDate":"2018-07-07","orderType":"COPY OF ORDER","orderUrl":"order-10.pdf"}]}'::jsonb,
'{"cnr":"DLND020047882015","nextDateOfHearing":"2018-07-07T00:00:00Z","lastDateOfHearing":"2018-07-07T00:00:00Z","dateCreated":"2026-02-18T15:33:18.064345Z","dateModified":"2026-05-01T09:38:35.670942Z"}'::jsonb,
'{"files":[]}'::jsonb,
'{"enumFields":["caseType","caseStatus","courtCode","judicialSection","caseCategory","benchType","stateCode"],"enumLookup":{"caseType":{"CC":"Criminal Complaint Case"},"caseStatus":{"DISPOSED":"Disposed"},"courtCode":{"DLND02":"Chief Metropolitan Magistrate, New Delhi, PHC"}}}'::jsonb,
NULL,
$rawjson${"caseDetails":{"caseNumber":"202400248072016","district":"New Delhi","state":"DL","stateCode":"26","districtCode":"7","courtCode":2,"caseTypeSub":"Criminal Procedure Code.","courtName":"Chief Metropolitan Magistrate, New Delhi, PHC","courtNo":2,"firDetails":{"caseNumber":"273","policeStation":"Central Crime Branch-CCB I","year":"2018"},"historyOfCaseHearings":[{"judge":"","businessOnDate":"2016-01-05","hearingDate":"2016-04-07","purposeOfListing":"Misc./ Appearance"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2016-04-07","hearingDate":"2016-05-19","purposeOfListing":"Misc./ Appearance"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2016-05-19","hearingDate":"2016-07-16","purposeOfListing":"Misc./ Appearance"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2016-07-16","hearingDate":"2016-08-16","purposeOfListing":"Misc./ Appearance"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2016-08-16","hearingDate":"2016-10-24","purposeOfListing":"Misc./ Appearance"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2016-10-24","hearingDate":"2016-11-26","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2016-11-26","hearingDate":"2016-12-20","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2016-12-20","hearingDate":"2017-01-18","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2017-01-18","hearingDate":"2017-03-25","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2017-03-25","hearingDate":"2017-05-20","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2017-05-20","hearingDate":"2017-08-05","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2017-08-05","hearingDate":"2017-09-25","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2017-09-25","hearingDate":"2017-10-27","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2017-10-27","hearingDate":"2017-12-15","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2017-12-15","hearingDate":"2017-12-18","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2017-12-18","hearingDate":"2018-01-02","purposeOfListing":"Misc. Arguments"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2018-01-02","hearingDate":"2018-02-08","purposeOfListing":"Prosecution Evidence"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2018-02-08","hearingDate":"2018-02-28","purposeOfListing":"Prosecution Evidence"},{"judge":"Chief Metropolitan Magistrate","businessOnDate":"2018-02-28","hearingDate":"2018-03-01","purposeOfListing":"Prosecution Evidence"},{"judge":"Addl. Chief Metropolitan Magistrate","businessOnDate":"2018-03-01","hearingDate":"2018-04-03","purposeOfListing":"Misc. Arguments"},{"judge":"Addl. Chief Metropolitan Magistrate","businessOnDate":"2018-04-03","hearingDate":"2018-04-07","purposeOfListing":"Misc. Arguments"},{"judge":"Addl. Chief Metropolitan Magistrate","businessOnDate":"2018-04-07","hearingDate":"2018-05-11","purposeOfListing":"Plaintiff/Petitioner Evidence"},{"judge":"Addl. Chief Metropolitan Magistrate","businessOnDate":"2018-05-11","hearingDate":"2018-05-19","purposeOfListing":"Plaintiff/Petitioner Evidence"},{"judge":"Addl. Chief Metropolitan Magistrate","businessOnDate":"2018-05-19","hearingDate":"2018-07-07","purposeOfListing":"Plaintiff/Petitioner Evidence"},{"judge":"Addl. Chief Metropolitan Magistrate","businessOnDate":"2018-07-07","purposeOfListing":"Disposed"}],"filedDocuments":[],"subordinateCourt":{},"linkCases":[],"purpose":"Plaintiff/Petitioner Evidence","disposalType":"DISMISSED_AS_WITHDRAWN","disposalTypeRaw":"DISMISSED AS WITHDRAWN","contestedStatus":"UNCONTESTED","lastHearingDate":"2018-07-07","interimOrders":[{"orderDate":"2017-10-27","description":"COPY OF ORDER","orderUrl":"order-1.pdf"},{"orderDate":"2017-12-15","description":"COPY OF ORDER","orderUrl":"order-2.pdf"},{"orderDate":"2017-12-18","description":"COPY OF ORDER","orderUrl":"order-3.pdf"},{"orderDate":"2018-01-02","description":"COPY OF ORDER","orderUrl":"order-4.pdf"},{"orderDate":"2018-02-08","description":"COPY OF ORDER","orderUrl":"order-5.pdf"},{"orderDate":"2018-02-28","description":"COPY OF ORDER","orderUrl":"order-6.pdf"},{"orderDate":"2018-03-01","description":"COPY OF JUDICIAL PROCEEDINGS","orderUrl":"order-7.pdf"},{"orderDate":"2018-04-03","description":"COPY OF ORDER","orderUrl":"order-8.pdf"},{"orderDate":"2018-05-19","description":"COPY OF JUDICIAL PROCEEDINGS","orderUrl":"order-9.pdf"}],"processes":[],"businessOnDateEntries":[{"date":"2016-01-05","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"--","nextPurpose":"Misc./ Appearance","nextHearingDate":"2016-04-07"},{"date":"2016-04-07","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"--","nextPurpose":"Misc./ Appearance","nextHearingDate":"2016-05-19"},{"date":"2016-05-19","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"P F","nextPurpose":"Misc./ Appearance","nextHearingDate":"2016-07-16"},{"date":"2016-07-16","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"FP","nextPurpose":"Misc./ Appearance","nextHearingDate":"2016-08-16"},{"date":"2016-08-16","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"CON","nextPurpose":"Misc./ Appearance","nextHearingDate":"2016-10-24"},{"date":"2016-10-24","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"arg","nextPurpose":"Misc. Arguments","nextHearingDate":"2016-11-26"},{"date":"2016-11-26","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"arg","nextPurpose":"Misc. Arguments","nextHearingDate":"2016-12-20"},{"date":"2016-12-20","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"or","nextPurpose":"Misc. Arguments","nextHearingDate":"2017-01-18"},{"date":"2017-01-18","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"m","nextPurpose":"Misc. Arguments","nextHearingDate":"2017-03-25"},{"date":"2017-03-25","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"ch","nextPurpose":"Misc. Arguments","nextHearingDate":"2017-05-20"},{"date":"2017-05-20","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"further proceedings","nextPurpose":"Misc. Arguments","nextHearingDate":"2017-08-05"},{"date":"2017-08-05","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"heard","nextPurpose":"Misc. Arguments","nextHearingDate":"2017-09-25"},{"date":"2017-09-25","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"FP","nextPurpose":"Misc. Arguments","nextHearingDate":"2017-10-27"},{"date":"2017-10-27","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"Heard","nextPurpose":"Misc. Arguments","nextHearingDate":"2017-12-15"},{"date":"2017-12-15","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"heard","nextPurpose":"Misc. Arguments","nextHearingDate":"2017-12-18"},{"date":"2017-12-18","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"heard","nextPurpose":"Misc. Arguments","nextHearingDate":"2018-01-02"},{"date":"2018-01-02","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"heard","nextPurpose":"Prosecution Evidence","nextHearingDate":"2018-02-08"},{"date":"2018-02-08","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"heard","nextPurpose":"Prosecution Evidence","nextHearingDate":"2018-02-28"},{"date":"2018-02-28","courtOf":"Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"FP","nextPurpose":"Prosecution Evidence","nextHearingDate":"2018-03-01"},{"date":"2018-03-01","courtOf":"Addl. Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"CN","nextPurpose":"Misc. Arguments","nextHearingDate":"2018-04-03"},{"date":"2018-04-03","courtOf":"Addl. Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"accused no. 1,2,3,5,6 withdraw the case. put up on date fixed","nextPurpose":"Misc. Arguments","nextHearingDate":"2018-04-07"},{"date":"2018-04-07","courtOf":"Addl. Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"CE","nextPurpose":"Plaintiff/Petitioner Evidence","nextHearingDate":"2018-05-11"},{"date":"2018-05-11","courtOf":"Addl. Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"--\nReason for Adjournment\n:\nJudge on Leave","nextPurpose":"Plaintiff/Petitioner Evidence","nextHearingDate":"2018-05-19"},{"date":"2018-05-19","courtOf":"Addl. Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"Two applications have been moved on behalf of the sureties Gopal Mohan and Naresh Balyan for release of FDR.\nApplication perused. Considered.","nextPurpose":"Plaintiff/Petitioner Evidence","nextHearingDate":"2018-07-07"},{"date":"2018-07-07","courtOf":"Addl. Chief Metropolitan Magistrate","petitioner":"MR.ARUN JAITLEY","respondent":"MR. ARVIND KEJRIWAL","business":"DAW\nNature of Disposal\n:\nDISMISSED AS WITHDRAWN\nDisposal Date\n:\n07-07-2018\nAddl. Chief Metropolitan Magistrate"}],"cnr":"DLND020047882015","cnrCourtCode":"DLND02","courtComplexCode":"DLND02","cnrCaseNumber":"0047882015","cnrYear":"2015","caseType":"CC","caseTypeRaw":"Ct Cases","caseStatus":"DISPOSED","filingNumber":"27843/2015","filingDate":"2015-12-21","registrationNumber":"24807/2016","registrationDate":"2015-12-21","firstHearingDate":"2016-01-05","nextHearingDate":"2018-07-07","decisionDate":"2018-07-07","caseDurationDays":929,"filingToFirstHearingDays":15,"judges":[],"petitioners":["MR.ARUN JAITLEY"],"petitionerAdvocates":[],"respondents":["MR. ARVIND KEJRIWAL"],"respondentAdvocates":[],"caseCategoryFacetPath":"Criminal Law/Other Criminal Matters","hasOrders":true,"hasJudgments":true,"orderCount":10,"interimOrderCount":9,"judgmentCount":1,"hearingCount":25,"iaCount":0,"taggedMatters":[{"type":"Case Number","caseNumber":"CRLMP/33524/2024"}],"earlierCourtDetails":[],"interlocutoryApplications":[],"listingDates":[],"notices":[],"judgmentOrders":[{"orderDate":"2018-07-07","orderType":"COPY OF ORDER","orderUrl":"order-10.pdf"}],"caveatDetails":[]},"entityInfo":{"cnr":"DLND020047882015","nextDateOfHearing":"2018-07-07T00:00:00Z","lastDateOfHearing":"2018-07-07T00:00:00Z","dateCreated":"2026-02-18T15:33:18.064345Z","dateModified":"2026-05-01T09:38:35.670942Z"},"files":{"files":[]},"descriptions":{"enumFields":["caseType","caseStatus","courtCode","judicialSection","caseCategory","benchType","stateCode"],"enumLookup":{"caseType":{"CC":"Criminal Complaint Case"},"caseStatus":{"DISPOSED":"Disposed"},"courtCode":{"DLND02":"Chief Metropolitan Magistrate, New Delhi, PHC"},"judicialSection":{},"caseCategory":{},"benchType":{},"stateCode":{}}},"caseAiAnalysis":null}$rawjson$::jsonb
)
ON CONFLICT (cnr) DO NOTHING;

-- 8. Seed initial cases_user records
INSERT INTO public.cases_user (id, citizen_id, lawyer_id, case_type, cnr, title, description, documents, practice_area, specialization, legal_services, case_status, lawyer_casestage_id, rejection_reason, city, is_emergency, timeline) VALUES
('CUC-20260831154512', 'u_001', 'l_001', 'new', NULL, 'Sai Teja Reddy vs. ABC Developers Pvt Ltd', 'Delay in apartment handover and violation of RERA sanctioned plan in Kondapur project.', '[]'::jsonb, 'cat_1', 'spec_1_1', '["srv_1_1_1", "srv_1_1_2"]'::jsonb, 'filinginprogress', 'filinginprogress', NULL, 'Hyderabad', false, '[{"id":"tl_1","status":"submitted","at":"2026-08-31T15:45:12Z","note":"Case submitted by citizen"},{"id":"tl_2","status":"accepted","at":"2026-09-01T11:30:00Z","note":"Assigned to Adv. Swathi Reddy"},{"id":"tl_3","status":"filinginprogress","at":"2026-09-03T14:15:00Z","note":"Drafting petition"}]'::jsonb),
('CUC-20260902112040', 'u_002', 'l_002', 'pending', 'DLND020047882015', 'Lakshmi Prasanna vs. State of AP & Ors', 'Anticipatory bail petition in connection with commercial dispute.', '[]'::jsonb, 'cat_6', 'spec_6_3', '["srv_6_3_2"]'::jsonb, 'accepted', 'accepted', NULL, 'Visakhapatnam', true, '[{"id":"tl_4","status":"submitted","at":"2026-09-02T11:20:40Z","note":"Emergency case created"},{"id":"tl_5","status":"accepted","at":"2026-09-02T13:00:00Z","note":"Advocate accepted brief"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 9. Clean up any orphaned references in dependent tables before adding constraints
DELETE FROM public.chat_messages WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM public.cases_user);
DELETE FROM public.video_calls WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM public.cases_user);
DELETE FROM public.lawyer_ratings WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM public.cases_user);
DELETE FROM public.ai_case_analyses WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM public.cases_user);
UPDATE public.subscriptions SET case_id = NULL WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM public.cases_user);
UPDATE public.payments SET case_id = NULL WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM public.cases_user);

-- 10. Re-link dependent tables to cases_user
ALTER TABLE IF EXISTS public.chat_messages
    DROP CONSTRAINT IF EXISTS chat_messages_case_id_fkey,
    ADD CONSTRAINT chat_messages_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases_user(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.video_calls
    DROP CONSTRAINT IF EXISTS video_calls_case_id_fkey,
    ADD CONSTRAINT video_calls_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases_user(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.ai_case_analyses
    DROP CONSTRAINT IF EXISTS ai_case_analyses_case_id_fkey,
    ADD CONSTRAINT ai_case_analyses_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases_user(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.lawyer_ratings
    DROP CONSTRAINT IF EXISTS lawyer_ratings_case_id_fkey,
    ADD CONSTRAINT lawyer_ratings_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases_user(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_case_id_fkey,
    ADD CONSTRAINT subscriptions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases_user(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.payments
    DROP CONSTRAINT IF EXISTS payments_case_id_fkey,
    ADD CONSTRAINT payments_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases_user(id) ON DELETE SET NULL;
