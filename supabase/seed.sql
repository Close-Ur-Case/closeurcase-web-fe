-- ==============================================================================
-- CloseUrCase Database Seed Data
-- ==============================================================================

-- 1. Master Taxonomies: Categories
INSERT INTO public.case_categories (id, name, code, description, sub_categories, active) VALUES
('cat_1', 'Criminal Defense', 'CRIM', 'Bail, trials, appeals, and white-collar defence across criminal courts', '[{"id":"spec_1_1","name":"Anticipatory Bail","services":[{"id":"srv_1_1_1","name":"File Anticipatory Bail Application"},{"id":"srv_1_1_2","name":"Anticipatory Bail Hearing"},{"id":"srv_1_1_3","name":"Anticipatory Bail Appeal"}]},{"id":"spec_1_2","name":"Criminal","services":[{"id":"srv_1_2_1","name":"File Criminal Case"},{"id":"srv_1_2_2","name":"Criminal Defense"},{"id":"srv_1_2_3","name":"Criminal Case Consultation"},{"id":"srv_1_2_4","name":"Criminal Appeal"},{"id":"srv_1_2_5","name":"Criminal Revision"}]},{"id":"spec_1_3","name":"Cyber Crime","services":[{"id":"srv_1_3_1","name":"Cyber Crime Complaint"},{"id":"srv_1_3_2","name":"Cyber Fraud Case"},{"id":"srv_1_3_3","name":"Online Harassment Case"},{"id":"srv_1_3_4","name":"Cyber Crime Defense"},{"id":"srv_1_3_5","name":"Cyber Crime Investigation Assistance"}]},{"id":"spec_1_4","name":"Fraud Case","services":[{"id":"srv_1_4_1","name":"File Fraud Case"},{"id":"srv_1_4_2","name":"Fraud Case Defense"},{"id":"srv_1_4_3","name":"Financial Fraud Complaint"},{"id":"srv_1_4_4","name":"Fraud Case Appeal"}]},{"id":"spec_1_5","name":"Litigation","services":[{"id":"srv_1_5_1","name":"Civil Litigation"},{"id":"srv_1_5_2","name":"Criminal Litigation"},{"id":"srv_1_5_3","name":"Court Representation"},{"id":"srv_1_5_4","name":"File Lawsuit"},{"id":"srv_1_5_5","name":"Litigation Consultation"}]},{"id":"spec_1_6","name":"POCSO Act","services":[{"id":"srv_1_6_1","name":"POCSO Case Filing"},{"id":"srv_1_6_2","name":"POCSO Case Defense"},{"id":"srv_1_6_3","name":"POCSO Bail Application"},{"id":"srv_1_6_4","name":"POCSO Case Representation"},{"id":"srv_1_6_5","name":"POCSO Appeal"}]},{"id":"spec_1_7","name":"Anti Corruption","services":[{"id":"srv_1_7_1","name":"Anti Corruption Complaint"},{"id":"srv_1_7_2","name":"Anti Corruption Case Defense"},{"id":"srv_1_7_3","name":"Vigilance Case"},{"id":"srv_1_7_4","name":"Anti Corruption Litigation"}]},{"id":"spec_1_8","name":"PMLA","services":[{"id":"srv_1_8_1","name":"PMLA Case Defense"},{"id":"srv_1_8_2","name":"PMLA Bail Application"},{"id":"srv_1_8_3","name":"PMLA Property Attachment Matter"},{"id":"srv_1_8_4","name":"PMLA Case Representation"},{"id":"srv_1_8_5","name":"PMLA Appeal"}]}]'::jsonb, true),
('cat_2', 'Corporate Law', 'CORP', 'Arbitration, company law, NCLT, insolvency, IP, and commercial contracts', '[{"id":"spec_2_1","name":"Arbitration","services":[{"id":"srv_2_1_1","name":"Arbitration Consultation"},{"id":"srv_2_1_2","name":"File Arbitration Case"},{"id":"srv_2_1_3","name":"Arbitration Representation"},{"id":"srv_2_1_4","name":"Arbitration Award Challenge"},{"id":"srv_2_1_5","name":"Arbitration Appeal"}]},{"id":"spec_2_2","name":"Startup","services":[{"id":"srv_2_2_1","name":"Startup Legal Consultation"},{"id":"srv_2_2_2","name":"Business Registration"},{"id":"srv_2_2_3","name":"Founder Agreement"},{"id":"srv_2_2_4","name":"Shareholder Agreement"},{"id":"srv_2_2_5","name":"Startup Compliance"}]},{"id":"spec_2_3","name":"Corporate","services":[{"id":"srv_2_3_1","name":"Corporate Legal Consultation"},{"id":"srv_2_3_2","name":"Company Law Compliance"},{"id":"srv_2_3_3","name":"Corporate Dispute"},{"id":"srv_2_3_4","name":"Board and Shareholder Matters"},{"id":"srv_2_3_5","name":"Corporate Representation"}]},{"id":"spec_2_4","name":"Breach of Contract","services":[{"id":"srv_2_4_1","name":"Contract Review"},{"id":"srv_2_4_2","name":"Breach of Contract Notice"},{"id":"srv_2_4_3","name":"Breach of Contract Case"},{"id":"srv_2_4_4","name":"Contract Dispute Resolution"},{"id":"srv_2_4_5","name":"Contract Litigation"}]},{"id":"spec_2_5","name":"NCLT","services":[{"id":"srv_2_5_1","name":"NCLT Case Filing"},{"id":"srv_2_5_2","name":"NCLT Representation"},{"id":"srv_2_5_3","name":"Company Petition"},{"id":"srv_2_5_4","name":"NCLT Appeal"},{"id":"srv_2_5_5","name":"Corporate Insolvency Matter"}]},{"id":"spec_2_6","name":"Bankruptcy / Insolvency","services":[{"id":"srv_2_6_1","name":"Insolvency Consultation"},{"id":"srv_2_6_2","name":"Insolvency Proceedings"},{"id":"srv_2_6_3","name":"Bankruptcy Proceedings"},{"id":"srv_2_6_4","name":"IBC Case Filing"},{"id":"srv_2_6_5","name":"Insolvency Representation"}]},{"id":"spec_2_7","name":"Patent","services":[{"id":"srv_2_7_1","name":"Patent Search"},{"id":"srv_2_7_2","name":"Patent Application"},{"id":"srv_2_7_3","name":"Patent Registration"},{"id":"srv_2_7_4","name":"Patent Infringement Case"},{"id":"srv_2_7_5","name":"Patent Opposition"}]},{"id":"spec_2_8","name":"Media and Entertainment","services":[{"id":"srv_2_8_1","name":"Media Legal Consultation"},{"id":"srv_2_8_2","name":"Entertainment Contract"},{"id":"srv_2_8_3","name":"Copyright Dispute"},{"id":"srv_2_8_4","name":"Defamation Matter"},{"id":"srv_2_8_5","name":"Media Litigation"}]},{"id":"spec_2_9","name":"Trademark & Copyright","services":[{"id":"srv_2_9_1","name":"Trademark Search"},{"id":"srv_2_9_2","name":"Trademark Registration"},{"id":"srv_2_9_3","name":"Trademark Infringement"},{"id":"srv_2_9_4","name":"Copyright Registration"},{"id":"srv_2_9_5","name":"Copyright Infringement"}]},{"id":"spec_2_10","name":"Documentation","services":[{"id":"srv_2_10_1","name":"Legal Document Drafting"},{"id":"srv_2_10_2","name":"Agreement Drafting"},{"id":"srv_2_10_3","name":"Contract Drafting"},{"id":"srv_2_10_4","name":"Document Review"},{"id":"srv_2_10_5","name":"Legal Documentation"}]}]'::jsonb, true),
('cat_3', 'Family Law', 'FAM', 'Divorce, custody, maintenance, wills, and domestic relations', '[{"id":"spec_3_1","name":"Wills / Trusts","services":[{"id":"srv_3_1_1","name":"Will Drafting"},{"id":"srv_3_1_2","name":"Will Registration"},{"id":"srv_3_1_3","name":"Will Review"},{"id":"srv_3_1_4","name":"Trust Deed Drafting"},{"id":"srv_3_1_5","name":"Trust Registration"}]},{"id":"spec_3_2","name":"Child Custody","services":[{"id":"srv_3_2_1","name":"Child Custody Case"},{"id":"srv_3_2_2","name":"Child Custody Petition"},{"id":"srv_3_2_3","name":"Child Visitation Matter"},{"id":"srv_3_2_4","name":"Child Custody Dispute"},{"id":"srv_3_2_5","name":"Child Custody Appeal"}]},{"id":"spec_3_3","name":"Muslim Law","services":[{"id":"srv_3_3_1","name":"Muslim Marriage Matter"},{"id":"srv_3_3_2","name":"Muslim Divorce Matter"},{"id":"srv_3_3_3","name":"Muslim Personal Law Consultation"},{"id":"srv_3_3_4","name":"Muslim Inheritance Matter"},{"id":"srv_3_3_5","name":"Muslim Family Dispute"}]},{"id":"spec_3_4","name":"Domestic Violence","services":[{"id":"srv_3_4_1","name":"Domestic Violence Complaint"},{"id":"srv_3_4_2","name":"Domestic Violence Case"},{"id":"srv_3_4_3","name":"Protection Order"},{"id":"srv_3_4_4","name":"Domestic Violence Defense"},{"id":"srv_3_4_5","name":"Domestic Violence Appeal"}]},{"id":"spec_3_5","name":"Succession Certificate","services":[{"id":"srv_3_5_1","name":"Succession Certificate Application"},{"id":"srv_3_5_2","name":"Succession Certificate Case"},{"id":"srv_3_5_3","name":"Succession Certificate Consultation"},{"id":"srv_3_5_4","name":"Succession Certificate Appeal"}]},{"id":"spec_3_6","name":"Divorce","services":[{"id":"srv_3_6_1","name":"File for Divorce"},{"id":"srv_3_6_2","name":"Reply / Send Legal Notice for Divorce"},{"id":"srv_3_6_3","name":"Contest Divorce Case"},{"id":"srv_3_6_4","name":"Divorce Appeal"},{"id":"srv_3_6_5","name":"Mutual Consent Divorce"},{"id":"srv_3_6_6","name":"Contested Divorce"},{"id":"srv_3_6_7","name":"Divorce Settlement"}]},{"id":"spec_3_7","name":"Family","services":[{"id":"srv_3_7_1","name":"Family Dispute"},{"id":"srv_3_7_2","name":"Family Settlement"},{"id":"srv_3_7_3","name":"Maintenance Matter"},{"id":"srv_3_7_4","name":"Family Court Representation"},{"id":"srv_3_7_5","name":"Family Legal Consultation"}]},{"id":"spec_3_8","name":"Court Marriage","services":[{"id":"srv_3_8_1","name":"Court Marriage Registration"},{"id":"srv_3_8_2","name":"Marriage Registration"},{"id":"srv_3_8_3","name":"Special Marriage Act Registration"},{"id":"srv_3_8_4","name":"Court Marriage Documentation"}]},{"id":"spec_3_9","name":"Dowry Case","services":[{"id":"srv_3_9_1","name":"Dowry Complaint"},{"id":"srv_3_9_2","name":"Dowry Harassment Case"},{"id":"srv_3_9_3","name":"Dowry Case Defense"},{"id":"srv_3_9_4","name":"Dowry Case Representation"},{"id":"srv_3_9_5","name":"Dowry Case Appeal"}]}]'::jsonb, true),
('cat_4', 'Banking & Finance', 'BANK', 'Cheque bounce, debt recovery, banking disputes, GST, and customs', '[{"id":"spec_4_1","name":"Cheque Bounce","services":[{"id":"srv_4_1_1","name":"Cheque Bounce Legal Notice"},{"id":"srv_4_1_2","name":"File Cheque Bounce Case"},{"id":"srv_4_1_3","name":"Cheque Bounce Case Defense"},{"id":"srv_4_1_4","name":"Cheque Bounce Settlement"},{"id":"srv_4_1_5","name":"Cheque Bounce Appeal"}]},{"id":"spec_4_2","name":"Recovery","services":[{"id":"srv_4_2_1","name":"Money Recovery Notice"},{"id":"srv_4_2_2","name":"Debt Recovery Case"},{"id":"srv_4_2_3","name":"Loan Recovery Matter"},{"id":"srv_4_2_4","name":"Recovery Suit"},{"id":"srv_4_2_5","name":"Debt Settlement"}]},{"id":"spec_4_3","name":"Tax","services":[{"id":"srv_4_3_1","name":"Tax Consultation"},{"id":"srv_4_3_2","name":"Income Tax Matter"},{"id":"srv_4_3_3","name":"Tax Notice Reply"},{"id":"srv_4_3_4","name":"Tax Dispute"},{"id":"srv_4_3_5","name":"Tax Appeal"}]},{"id":"spec_4_4","name":"Banking / Finance","services":[{"id":"srv_4_4_1","name":"Banking Dispute"},{"id":"srv_4_4_2","name":"Loan Dispute"},{"id":"srv_4_4_3","name":"Banking Legal Notice"},{"id":"srv_4_4_4","name":"Financial Agreement Review"},{"id":"srv_4_4_5","name":"Banking Litigation"}]},{"id":"spec_4_5","name":"GST","services":[{"id":"srv_4_5_1","name":"GST Registration"},{"id":"srv_4_5_2","name":"GST Notice Reply"},{"id":"srv_4_5_3","name":"GST Compliance"},{"id":"srv_4_5_4","name":"GST Dispute"},{"id":"srv_4_5_5","name":"GST Appeal"}]},{"id":"spec_4_6","name":"Customs & Central Excise","services":[{"id":"srv_4_6_1","name":"Customs Consultation"},{"id":"srv_4_6_2","name":"Customs Dispute"},{"id":"srv_4_6_3","name":"Customs Notice Reply"},{"id":"srv_4_6_4","name":"Central Excise Matter"},{"id":"srv_4_6_5","name":"Customs Appeal"}]}]'::jsonb, true),
('cat_5', 'Consumer Law', 'CONS', 'Consumer forum complaints, insurance, medical negligence, and motor accidents', '[{"id":"spec_5_1","name":"Insurance","services":[{"id":"srv_5_1_1","name":"Insurance Claim Dispute"},{"id":"srv_5_1_2","name":"Insurance Claim Rejection"},{"id":"srv_5_1_3","name":"Insurance Legal Notice"},{"id":"srv_5_1_4","name":"Insurance Consumer Case"},{"id":"srv_5_1_5","name":"Insurance Appeal"}]},{"id":"spec_5_2","name":"Medical Negligence","services":[{"id":"srv_5_2_1","name":"Medical Negligence Consultation"},{"id":"srv_5_2_2","name":"Medical Negligence Complaint"},{"id":"srv_5_2_3","name":"Medical Negligence Case"},{"id":"srv_5_2_4","name":"Medical Negligence Consumer Case"},{"id":"srv_5_2_5","name":"Medical Negligence Defense"}]},{"id":"spec_5_3","name":"Motor Accident","services":[{"id":"srv_5_3_1","name":"Motor Accident Claim"},{"id":"srv_5_3_2","name":"Motor Accident Compensation"},{"id":"srv_5_3_3","name":"Motor Accident Case"},{"id":"srv_5_3_4","name":"Motor Accident Tribunal Matter"},{"id":"srv_5_3_5","name":"Motor Accident Appeal"}]},{"id":"spec_5_4","name":"Consumer Court","services":[{"id":"srv_5_4_1","name":"Consumer Complaint"},{"id":"srv_5_4_2","name":"Consumer Legal Notice"},{"id":"srv_5_4_3","name":"Consumer Court Representation"},{"id":"srv_5_4_4","name":"Consumer Dispute"},{"id":"srv_5_4_5","name":"Consumer Court Appeal"}]}]'::jsonb, true),
('cat_6', 'Higher Courts', 'HCRT', 'Supreme Court, High Court, writs, SLPs, and tribunal representation', '[{"id":"spec_6_1","name":"Armed Forces Tribunal","services":[{"id":"srv_6_1_1","name":"AFT Case Filing"},{"id":"srv_6_1_2","name":"AFT Representation"},{"id":"srv_6_1_3","name":"Service Matter Appeal"},{"id":"srv_6_1_4","name":"Armed Forces Legal Consultation"}]},{"id":"spec_6_2","name":"Supreme Court","services":[{"id":"srv_6_2_1","name":"Supreme Court Case Filing"},{"id":"srv_6_2_2","name":"Supreme Court Representation"},{"id":"srv_6_2_3","name":"Special Leave Petition (SLP)"},{"id":"srv_6_2_4","name":"Supreme Court Appeal"},{"id":"srv_6_2_5","name":"Supreme Court Legal Consultation"}]},{"id":"spec_6_3","name":"High Court","services":[{"id":"srv_6_3_1","name":"High Court Case Filing"},{"id":"srv_6_3_2","name":"High Court Representation"},{"id":"srv_6_3_3","name":"Writ Petition"},{"id":"srv_6_3_4","name":"High Court Appeal"},{"id":"srv_6_3_5","name":"High Court Bail Application"},{"id":"srv_6_3_6","name":"High Court Legal Consultation"}]}]'::jsonb, true),
('cat_7', 'International Law', 'INTL', 'Immigration, cross-border disputes, and NRI legal matters', '[{"id":"spec_7_1","name":"Immigration","services":[{"id":"srv_7_1_1","name":"Immigration Consultation"},{"id":"srv_7_1_2","name":"Visa Legal Assistance"},{"id":"srv_7_1_3","name":"Immigration Application"},{"id":"srv_7_1_4","name":"Immigration Appeal"},{"id":"srv_7_1_5","name":"Immigration Dispute"}]},{"id":"spec_7_2","name":"International Law","services":[{"id":"srv_7_2_1","name":"International Legal Consultation"},{"id":"srv_7_2_2","name":"Cross Border Dispute"},{"id":"srv_7_2_3","name":"International Contract Matter"},{"id":"srv_7_2_4","name":"International Arbitration"},{"id":"srv_7_2_5","name":"International Litigation"}]},{"id":"spec_7_3","name":"NRI","services":[{"id":"srv_7_3_1","name":"NRI Legal Consultation"},{"id":"srv_7_3_2","name":"NRI Property Matter"},{"id":"srv_7_3_3","name":"NRI Family Dispute"},{"id":"srv_7_3_4","name":"NRI Documentation"},{"id":"srv_7_3_5","name":"NRI Power of Attorney"}]}]'::jsonb, true),
('cat_8', 'Labour & Civil Matters', 'LAB', 'Employment disputes, service matters, RTI, and civil suits', '[{"id":"spec_8_1","name":"Labour & Service","services":[{"id":"srv_8_1_1","name":"Employment Dispute"},{"id":"srv_8_1_2","name":"Wrongful Termination Matter"},{"id":"srv_8_1_3","name":"Salary / Wage Dispute"},{"id":"srv_8_1_4","name":"Service Matter"},{"id":"srv_8_1_5","name":"Labour Court Case"}]},{"id":"spec_8_2","name":"R.T.I","services":[{"id":"srv_8_2_1","name":"RTI Application"},{"id":"srv_8_2_2","name":"RTI Appeal"},{"id":"srv_8_2_3","name":"RTI Legal Consultation"},{"id":"srv_8_2_4","name":"RTI Complaint"}]},{"id":"spec_8_3","name":"Civil","services":[{"id":"srv_8_3_1","name":"Civil Suit"},{"id":"srv_8_3_2","name":"Civil Dispute"},{"id":"srv_8_3_3","name":"Civil Litigation"},{"id":"srv_8_3_4","name":"Civil Appeal"},{"id":"srv_8_3_5","name":"Civil Legal Notice"}]}]'::jsonb, true),
('cat_9', 'Property Law', 'PROP', 'Land titles, landlord-tenant, RERA, and real-estate litigation', '[{"id":"spec_9_1","name":"Landlord/Tenant","services":[{"id":"srv_9_1_1","name":"Landlord / Tenant Dispute"},{"id":"srv_9_1_2","name":"Rent Agreement"},{"id":"srv_9_1_3","name":"Eviction Matter"},{"id":"srv_9_1_4","name":"Rent Recovery"},{"id":"srv_9_1_5","name":"Tenant Rights Matter"},{"id":"srv_9_1_6","name":"Landlord Rights Matter"}]},{"id":"spec_9_2","name":"Property","services":[{"id":"srv_9_2_1","name":"Property Dispute"},{"id":"srv_9_2_2","name":"Property Documentation"},{"id":"srv_9_2_3","name":"Property Verification"},{"id":"srv_9_2_4","name":"Property Sale Agreement"},{"id":"srv_9_2_5","name":"Transfer of Ownership"},{"id":"srv_9_2_6","name":"Property Registration"},{"id":"srv_9_2_7","name":"Illegal Possession"},{"id":"srv_9_2_8","name":"Illegal Construction"},{"id":"srv_9_2_9","name":"Ancestral Property Dispute"}]},{"id":"spec_9_3","name":"RERA","services":[{"id":"srv_9_3_1","name":"RERA Complaint"},{"id":"srv_9_3_2","name":"RERA Case Filing"},{"id":"srv_9_3_3","name":"Builder Delay Case"},{"id":"srv_9_3_4","name":"Builder Fraud Case"},{"id":"srv_9_3_5","name":"Property Possession Dispute"},{"id":"srv_9_3_6","name":"RERA Appeal"}]}]'::jsonb, true),
('cat_10', 'Cyber', 'CYB', 'Cybercrime, IT Act offences, digital fraud, and online privacy', '[{"id":"spec_10_1","name":"Cyber Crime Complaint","services":[{"id":"srv_10_1_1","name":"File Cyber Crime Complaint"},{"id":"srv_10_1_2","name":"Cyber Crime FIR Assistance"},{"id":"srv_10_1_3","name":"Cyber Cell Representation"}]},{"id":"spec_10_2","name":"Online Harassment","services":[{"id":"srv_10_2_1","name":"Online Harassment Complaint"},{"id":"srv_10_2_2","name":"Stalking / Threats Case"},{"id":"srv_10_2_3","name":"Takedown Request"},{"id":"srv_10_2_4","name":"John Doe Injunction"}]},{"id":"spec_10_3","name":"Financial Cyber Fraud","services":[{"id":"srv_10_3_1","name":"UPI / Card Fraud Recovery"},{"id":"srv_10_3_2","name":"Bank Liability Representation"},{"id":"srv_10_3_3","name":"Cyber Fraud FIR & Follow-up"}]},{"id":"spec_10_4","name":"Data Theft & Privacy","services":[{"id":"srv_10_4_1","name":"Data Breach Response"},{"id":"srv_10_4_2","name":"Privacy Violation Notice"},{"id":"srv_10_4_3","name":"Data Protection Compliance"}]},{"id":"spec_10_5","name":"IT Act Offenses","services":[{"id":"srv_10_5_1","name":"IT Act Case Filing"},{"id":"srv_10_5_2","name":"IT Act Defense"},{"id":"srv_10_5_3","name":"IT Act Appeal"}]},{"id":"spec_10_6","name":"Social Media Impersonation","services":[{"id":"srv_10_6_1","name":"Impersonation Complaint"},{"id":"srv_10_6_2","name":"Profile Takedown Request"},{"id":"srv_10_6_3","name":"Defamation & Impersonation Suit"}]}]'::jsonb, true),
('cat_11', 'Tax', 'TAX', 'Direct/indirect tax appeals, GST disputes, and income-tax tribunals', '[{"id":"spec_11_1","name":"Income Tax Appeals","services":[{"id":"srv_11_1_1","name":"CIT(A) Appeal Filing"},{"id":"srv_11_1_2","name":"ITAT Representation"},{"id":"srv_11_1_3","name":"Stay Application"},{"id":"srv_11_1_4","name":"Rectification Petition"}]},{"id":"spec_11_2","name":"GST Disputes & Filings","services":[{"id":"srv_11_2_1","name":"GST SCN Reply"},{"id":"srv_11_2_2","name":"GST Appeal"},{"id":"srv_11_2_3","name":"Input Tax Credit Dispute"},{"id":"srv_11_2_4","name":"GST Refund Claim"}]},{"id":"spec_11_3","name":"Customs & Central Excise","services":[{"id":"srv_11_3_1","name":"Customs SCN Reply"},{"id":"srv_11_3_2","name":"CESTAT Appeal"},{"id":"srv_11_3_3","name":"Duty Drawback Matter"}]},{"id":"spec_11_4","name":"Tax Assessment Notices","services":[{"id":"srv_11_4_1","name":"Reassessment Notice Reply"},{"id":"srv_11_4_2","name":"Scrutiny Assessment Support"},{"id":"srv_11_4_3","name":"Assessment Appeal"}]},{"id":"spec_11_5","name":"Cheque Bounce (Sec 138)","services":[{"id":"srv_11_5_1","name":"Statutory Notice"},{"id":"srv_11_5_2","name":"Section 138 Complaint"},{"id":"srv_11_5_3","name":"Section 138 Defense"}]},{"id":"spec_11_6","name":"Debt Recovery Tribunal (DRT)","services":[{"id":"srv_11_6_1","name":"DRT Application"},{"id":"srv_11_6_2","name":"SARFAESI Objection"},{"id":"srv_11_6_3","name":"DRAT Appeal"}]}]'::jsonb, true),
('cat_12', 'Environmental', 'ENV', 'NGT proceedings, pollution-control violations, and clearances', '[{"id":"spec_12_1","name":"National Green Tribunal (NGT)","services":[{"id":"srv_12_1_1","name":"NGT Original Application"},{"id":"srv_12_1_2","name":"NGT Representation"},{"id":"srv_12_1_3","name":"NGT Appeal"}]},{"id":"spec_12_2","name":"Pollution Control Board Matters","services":[{"id":"srv_12_2_1","name":"Consent to Establish / Operate"},{"id":"srv_12_2_2","name":"Closure Notice Reply"},{"id":"srv_12_2_3","name":"PCB Appeal"}]},{"id":"spec_12_3","name":"Environmental Impact Clearance","services":[{"id":"srv_12_3_1","name":"EIA Clearance Application"},{"id":"srv_12_3_2","name":"Clearance Condition Compliance"},{"id":"srv_12_3_3","name":"Clearance Challenge"}]},{"id":"spec_12_4","name":"Forest & Wildlife Regulations","services":[{"id":"srv_12_4_1","name":"Forest Clearance Matter"},{"id":"srv_12_4_2","name":"Wildlife Permit Matter"},{"id":"srv_12_4_3","name":"Encroachment Defense"}]},{"id":"spec_12_5","name":"Waste Management Compliance","services":[{"id":"srv_12_5_1","name":"Waste Rules Compliance Advice"},{"id":"srv_12_5_2","name":"Violation Notice Reply"},{"id":"srv_12_5_3","name":"Remediation Plan Support"}]}]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, description = EXCLUDED.description, sub_categories = EXCLUDED.sub_categories, active = EXCLUDED.active;

-- Populate Case Specializations from Categories sub_categories
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

-- Populate Legal Services from Categories sub_categories services
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

-- Master Taxonomies: States (All 29 Indian States & UTs from locations.json)
INSERT INTO public.states (id, name, code, active) VALUES
('andhra_pradesh', 'Andhra Pradesh', 'AP', true),
('arunachal_pradesh', 'Arunachal Pradesh', 'AR', true),
('assam', 'Assam', 'AS', true),
('bihar', 'Bihar', 'BR', true),
('chhattisgarh', 'Chhattisgarh', 'CG', true),
('goa', 'Goa', 'GA', true),
('gujarat', 'Gujarat', 'GJ', true),
('haryana', 'Haryana', 'HR', true),
('himachal_pradesh', 'Himachal Pradesh', 'HP', true),
('jammu_kashmir', 'Jammu & Kashmir', 'JK', true),
('jharkhand', 'Jharkhand', 'JH', true),
('karnataka', 'Karnataka', 'KA', true),
('kerala', 'Kerala', 'KL', true),
('madhya_pradesh', 'Madhya Pradesh', 'MP', true),
('maharashtra', 'Maharashtra', 'MH', true),
('manipur', 'Manipur', 'MN', true),
('meghalaya', 'Meghalaya', 'ML', true),
('mizoram', 'Mizoram', 'MZ', true),
('nagaland', 'Nagaland', 'NL', true),
('odisha', 'Odisha', 'OD', true),
('punjab', 'Punjab', 'PB', true),
('rajasthan', 'Rajasthan', 'RJ', true),
('sikkim', 'Sikkim', 'SK', true),
('tamil_nadu', 'Tamil Nadu', 'TN', true),
('telangana', 'Telangana', 'TS', true),
('tripura', 'Tripura', 'TR', true),
('uttar_pradesh', 'Uttar Pradesh', 'UP', true),
('uttarakhand', 'Uttarakhand', 'UK', true),
('west_bengal', 'West Bengal', 'WB', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    active = EXCLUDED.active;

-- Master Taxonomies: Districts (All 59 Districts from locations.json)
INSERT INTO public.districts (id, name, state, state_id, active) VALUES
-- Telangana (33)
('adilabad', 'Adilabad', 'Telangana', 'telangana', true),
('bhadradri_kothagudem', 'Bhadradri Kothagudem', 'Telangana', 'telangana', true),
('hyderabad', 'Hyderabad', 'Telangana', 'telangana', true),
('jagtial', 'Jagtial', 'Telangana', 'telangana', true),
('jangaon', 'Jangaon', 'Telangana', 'telangana', true),
('jayashankar_bhupalpally', 'Jayashankar Bhupalpally', 'Telangana', 'telangana', true),
('jogulamba_gadwal', 'Jogulamba Gadwal', 'Telangana', 'telangana', true),
('kamareddy', 'Kamareddy', 'Telangana', 'telangana', true),
('karimnagar', 'Karimnagar', 'Telangana', 'telangana', true),
('khammam', 'Khammam', 'Telangana', 'telangana', true),
('komaram_bheem_asifabad', 'Komaram Bheem Asifabad', 'Telangana', 'telangana', true),
('mahabubabad', 'Mahabubabad', 'Telangana', 'telangana', true),
('mahabubnagar', 'Mahabubnagar', 'Telangana', 'telangana', true),
('mancherial', 'Mancherial', 'Telangana', 'telangana', true),
('medak', 'Medak', 'Telangana', 'telangana', true),
('medchal_malkajgiri', 'Medchal Malkajgiri', 'Telangana', 'telangana', true),
('mulugu', 'Mulugu', 'Telangana', 'telangana', true),
('nagarkurnool', 'Nagarkurnool', 'Telangana', 'telangana', true),
('nalgonda', 'Nalgonda', 'Telangana', 'telangana', true),
('narayanpet', 'Narayanpet', 'Telangana', 'telangana', true),
('nirmal', 'Nirmal', 'Telangana', 'telangana', true),
('nizamabad', 'Nizamabad', 'Telangana', 'telangana', true),
('peddapalli', 'Peddapalli', 'Telangana', 'telangana', true),
('rajanna_sircilla', 'Rajanna Sircilla', 'Telangana', 'telangana', true),
('rangareddy', 'Rangareddy', 'Telangana', 'telangana', true),
('sangareddy', 'Sangareddy', 'Telangana', 'telangana', true),
('siddipet', 'Siddipet', 'Telangana', 'telangana', true),
('suryapet', 'Suryapet', 'Telangana', 'telangana', true),
('vikarabad', 'Vikarabad', 'Telangana', 'telangana', true),
('wanaparthy', 'Wanaparthy', 'Telangana', 'telangana', true),
('warangal', 'Warangal', 'Telangana', 'telangana', true),
('hanumakonda', 'Hanumakonda', 'Telangana', 'telangana', true),
('yadadri_bhuvanagiri', 'Yadadri Bhuvanagiri', 'Telangana', 'telangana', true),
-- Andhra Pradesh (26)
('alluri_sitharama_raju', 'Alluri Sitharama Raju', 'Andhra Pradesh', 'andhra_pradesh', true),
('anakapalli', 'Anakapalli', 'Andhra Pradesh', 'andhra_pradesh', true),
('anantapur', 'Anantapur', 'Andhra Pradesh', 'andhra_pradesh', true),
('annamayya', 'Annamayya', 'Andhra Pradesh', 'andhra_pradesh', true),
('bapatla', 'Bapatla', 'Andhra Pradesh', 'andhra_pradesh', true),
('chittoor', 'Chittoor', 'Andhra Pradesh', 'andhra_pradesh', true),
('east_godavari', 'East Godavari', 'Andhra Pradesh', 'andhra_pradesh', true),
('eluru', 'Eluru', 'Andhra Pradesh', 'andhra_pradesh', true),
('guntur', 'Guntur', 'Andhra Pradesh', 'andhra_pradesh', true),
('kakinada', 'Kakinada', 'Andhra Pradesh', 'andhra_pradesh', true),
('konaseema', 'Konaseema', 'Andhra Pradesh', 'andhra_pradesh', true),
('krishna', 'Krishna', 'Andhra Pradesh', 'andhra_pradesh', true),
('kurnool', 'Kurnool', 'Andhra Pradesh', 'andhra_pradesh', true),
('nandyal', 'Nandyal', 'Andhra Pradesh', 'andhra_pradesh', true),
('ntr', 'NTR', 'Andhra Pradesh', 'andhra_pradesh', true),
('palnadu', 'Palnadu', 'Andhra Pradesh', 'andhra_pradesh', true),
('parvathipuram_manyam', 'Parvathipuram Manyam', 'Andhra Pradesh', 'andhra_pradesh', true),
('prakasam', 'Prakasam', 'Andhra Pradesh', 'andhra_pradesh', true),
('spsr_nellore', 'Sri Potti Sriramulu Nellore', 'Andhra Pradesh', 'andhra_pradesh', true),
('sri_sathya_sai', 'Sri Sathya Sai', 'Andhra Pradesh', 'andhra_pradesh', true),
('srikakulam', 'Srikakulam', 'Andhra Pradesh', 'andhra_pradesh', true),
('tirupati', 'Tirupati', 'Andhra Pradesh', 'andhra_pradesh', true),
('visakhapatnam', 'Visakhapatnam', 'Andhra Pradesh', 'andhra_pradesh', true),
('vizianagaram', 'Vizianagaram', 'Andhra Pradesh', 'andhra_pradesh', true),
('west_godavari', 'West Godavari', 'Andhra Pradesh', 'andhra_pradesh', true),
('ysr_kadapa', 'YSR Kadapa', 'Andhra Pradesh', 'andhra_pradesh', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    state = EXCLUDED.state,
    state_id = EXCLUDED.state_id,
    active = EXCLUDED.active;

-- Master Taxonomies: Court Levels
INSERT INTO public.court_levels (id, name, code, active) VALUES
('lvl_supreme_court', 'Supreme Court', 'SC', true),
('lvl_high_court', 'High Court', 'HC', true),
('lvl_district_court', 'District Court', 'DC', true),
('lvl_sessions_court', 'Sessions Court', 'SESS', true),
('lvl_civil_court', 'Civil Court', 'CIV', true),
('lvl_criminal_court', 'Criminal Court', 'CRIM', true),
('lvl_family_court', 'Family Court', 'FC', true),
('lvl_commercial_court', 'Commercial Court', 'COMM', true),
('lvl_labour_court', 'Labour Court', 'LC', true),
('lvl_consumer_court', 'Consumer Court', 'CDRC', true),
('lvl_juvenile_justice_court', 'Juvenile Justice Court', 'JJB', true),
('lvl_pocso_court', 'POCSO Court', 'POCSO', true),
('lvl_ndps_court', 'NDPS Court', 'NDPS', true),
('lvl_mact', 'Motor Accident Claims Tribunal', 'MACT', true),
('lvl_nclt', 'National Company Law Tribunal (NCLT)', 'NCLT', true),
('lvl_cat', 'Central Administrative Tribunal (CAT)', 'CAT', true),
('lvl_drt', 'Debt Recovery Tribunal (DRT)', 'DRT', true),
('lvl_1', 'Supreme Court', 'SC', true),
('lvl_2', 'High Court', 'HC', true),
('lvl_3', 'District Court', 'DC', true),
('lvl_4', 'Tribunal', 'TRB', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    active = EXCLUDED.active;

-- Master Taxonomies: Courts
INSERT INTO public.courts (id, name, level, state, city, district, state_id, district_id, active) VALUES
-- Existing Regional Courts
('court_hyd_dc', 'City Civil Court, Hyderabad', 'lvl_civil_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_vzg_dc', 'District & Sessions Court, Visakhapatnam', 'lvl_district_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),
('court_tshc', 'High Court for the State of Telangana', 'lvl_high_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_aphc', 'High Court of Andhra Pradesh, Amaravati', 'lvl_high_court', 'Andhra Pradesh', 'Amaravati', 'Guntur', 'andhra_pradesh', 'guntur', true),

-- COURTS_DATA: High Court
('court_telangana_hc', 'Telangana High Court', 'lvl_high_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_ap_hc_vzg', 'High Court of Andhra Pradesh (Visakhapatnam Bench)', 'lvl_high_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: District Court
('court_dc_hyderabad', 'District Court, Hyderabad', 'lvl_district_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_dc_visakhapatnam', 'District Court, Visakhapatnam', 'lvl_district_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: Sessions Court
('court_sessions_hyderabad', 'Sessions Court, Hyderabad', 'lvl_sessions_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_sessions_visakhapatnam', 'Sessions Court, Visakhapatnam', 'lvl_sessions_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: Civil Court
('court_civil_hyderabad', 'City Civil Court, Hyderabad', 'lvl_civil_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_civil_visakhapatnam', 'City Civil Court, Visakhapatnam', 'lvl_civil_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: Criminal Court
('court_cmm_hyderabad', 'Chief Metropolitan Magistrate Court, Hyderabad', 'lvl_criminal_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_cjm_visakhapatnam', 'Chief Judicial Magistrate Court, Visakhapatnam', 'lvl_criminal_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: Family Court
('court_family_hyderabad', 'Family Court, Hyderabad', 'lvl_family_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_family_visakhapatnam', 'Family Court, Visakhapatnam', 'lvl_family_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: Commercial Court
('court_commercial_hyderabad', 'Commercial Court, Hyderabad', 'lvl_commercial_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_commercial_visakhapatnam', 'Commercial Court, Visakhapatnam', 'lvl_commercial_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: Labour Court
('court_labour_hyderabad', 'Labour Court, Hyderabad', 'lvl_labour_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_labour_visakhapatnam', 'Labour Court, Visakhapatnam', 'lvl_labour_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: Consumer Court
('court_consumer_hyderabad', 'District Consumer Disputes Redressal Commission, Hyderabad', 'lvl_consumer_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_consumer_visakhapatnam', 'District Consumer Disputes Redressal Commission, Visakhapatnam', 'lvl_consumer_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: Juvenile Justice Court
('court_jjb_hyderabad', 'Juvenile Justice Board, Hyderabad', 'lvl_juvenile_justice_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_jjb_visakhapatnam', 'Juvenile Justice Board, Visakhapatnam', 'lvl_juvenile_justice_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: POCSO Court
('court_pocso_hyderabad', 'Special Court for POCSO Cases, Hyderabad', 'lvl_pocso_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_pocso_visakhapatnam', 'Special Court for POCSO Cases, Visakhapatnam', 'lvl_pocso_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: NDPS Court
('court_ndps_hyderabad', 'Special Court for NDPS Cases, Hyderabad', 'lvl_ndps_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_ndps_visakhapatnam', 'Special Court for NDPS Cases, Visakhapatnam', 'lvl_ndps_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: Motor Accident Claims Tribunal
('court_mact_hyderabad', 'Motor Accidents Claims Tribunal, Hyderabad', 'lvl_mact', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_mact_visakhapatnam', 'Motor Accidents Claims Tribunal, Visakhapatnam', 'lvl_mact', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: NCLT
('court_nclt_hyderabad', 'National Company Law Tribunal, Hyderabad Bench', 'lvl_nclt', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_nclt_visakhapatnam', 'National Company Law Tribunal, Visakhapatnam Bench', 'lvl_nclt', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: CAT
('court_cat_hyderabad', 'Central Administrative Tribunal, Hyderabad Bench', 'lvl_cat', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_cat_visakhapatnam', 'Central Administrative Tribunal, Visakhapatnam Bench', 'lvl_cat', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA: DRT
('court_drt_hyderabad', 'Debt Recovery Tribunal, Hyderabad', 'lvl_drt', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_drt_visakhapatnam', 'Debt Recovery Tribunal, Visakhapatnam', 'lvl_drt', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    state = EXCLUDED.state,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    state_id = EXCLUDED.state_id,
    district_id = EXCLUDED.district_id,
    active = EXCLUDED.active;

-- Master Taxonomies: Cities (with state_id & district_id)
INSERT INTO public.cities (id, name, state, state_id, district_id, tier, active) VALUES
('city_1', 'Hyderabad', 'Telangana', 'telangana', 'hyderabad', 'Tier 1', true),
('city_2', 'Visakhapatnam', 'Andhra Pradesh', 'andhra_pradesh', 'visakhapatnam', 'Tier 2', true),
('city_3', 'Bengaluru', 'Karnataka', 'karnataka', NULL, 'Tier 1', true),
('city_4', 'Chennai', 'Tamil Nadu', 'tamil_nadu', NULL, 'Tier 1', true),
('city_5', 'Mumbai', 'Maharashtra', 'maharashtra', NULL, 'Tier 1', true),
('city_6', 'Delhi / New Delhi', 'Delhi', NULL, NULL, 'Tier 1', true),
('city_7', 'Vijayawada', 'Andhra Pradesh', 'andhra_pradesh', 'ntr', 'Tier 2', true),
('city_8', 'Pune', 'Maharashtra', 'maharashtra', NULL, 'Tier 1', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    state = EXCLUDED.state,
    state_id = EXCLUDED.state_id,
    district_id = EXCLUDED.district_id,
    tier = EXCLUDED.tier,
    active = EXCLUDED.active;

-- Master Taxonomies: Languages
INSERT INTO public.languages (id, name, native_name, code, active) VALUES
('lang_en', 'English', 'English', 'en', true),
('lang_hi', 'Hindi', 'हिन्दी', 'hi', true),
('lang_te', 'Telugu', 'తెలుగు', 'te', true),
('lang_ta', 'Tamil', 'தமிழ்', 'ta', true),
('lang_kn', 'Kannada', 'ಕನ್ನಡ', 'kn', true),
('lang_ml', 'Malayalam', 'മലയാളം', 'ml', true),
('lang_mr', 'Marathi', 'मराठी', 'mr', true),
('lang_bn', 'Bengali', 'বাংলা', 'bn', true),
('lang_gu', 'Gujarati', 'ગુજરાતી', 'gu', true),
('lang_or', 'Odia', 'ଓଡ଼ିଆ', 'or', true),
('lang_pa', 'Punjabi', 'ਪੰਜਾਬੀ', 'pa', true),
('lang_ur', 'Urdu', 'اردو', 'ur', true),
('lang_as', 'Assamese', 'অসমীয়া', 'as', true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    native_name = EXCLUDED.native_name,
    code = EXCLUDED.code,
    active = EXCLUDED.active;

-- 2. Super Admin User
INSERT INTO public.users (id, role, email, phone) VALUES
('usr_admin_master', 'admin', 'admin@closeurcase.app', '+919800000000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_profiles (id, user_id, name, email, phone, role) VALUES
('admin_01', 'usr_admin_master', 'Platform Super Admin', 'admin@closeurcase.app', '+919800000000', 'superadmin')
ON CONFLICT (id) DO NOTHING;

-- 3. Citizens (with state_id & district_id)
INSERT INTO public.users (id, role, email, phone) VALUES
('usr_u_001', 'citizen', 'saiteja.reddy@gmail.com', '+91 98110 22111'),
('usr_u_002', 'citizen', 'lakshmi.prasanna92@gmail.com', '+91 98320 45123'),
('usr_u_003', 'citizen', 'divya.chowdary@gmail.com', '+91 98450 88321'),
('usr_u_004', 'citizen', 'ramana.naidu.vzg@gmail.com', '+91 98333 11902')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at) VALUES
('u_001', 'usr_u_001', 'Sai Teja Reddy', 'saiteja.reddy@gmail.com', '+91 98110 22111', 'Hyderabad', 'Telangana', 'telangana', 'hyderabad', 'Active', '2025-02-14', '2026-09-06T09:15:00'),
('u_002', 'usr_u_002', 'Lakshmi Prasanna', 'lakshmi.prasanna92@gmail.com', '+91 98320 45123', 'Visakhapatnam', 'Andhra Pradesh', 'andhra_pradesh', 'visakhapatnam', 'Active', '2025-04-01', '2026-09-04T18:42:00'),
('u_003', 'usr_u_003', 'Divya Sri Chowdary', 'divya.chowdary@gmail.com', '+91 98450 88321', 'Hyderabad', 'Telangana', 'telangana', 'hyderabad', 'Active', '2025-06-11', '2026-09-05T11:20:00'),
('u_004', 'usr_u_004', 'Venkata Ramana Naidu', 'ramana.naidu.vzg@gmail.com', '+91 98333 11902', 'Visakhapatnam', 'Andhra Pradesh', 'andhra_pradesh', 'visakhapatnam', 'Inactive', '2025-11-08', '2026-05-20T08:05:00')
ON CONFLICT (id) DO UPDATE SET
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    state_id = EXCLUDED.state_id,
    district_id = EXCLUDED.district_id;

-- 4. Lawyers (with state_id & district_id)
INSERT INTO public.users (id, role, email, phone) VALUES
('usr_l_001', 'lawyer', 'swathi.reddy@legal.in', '+91 98765 43210'),
('usr_l_002', 'lawyer', 'srinivas.chowdary@courtlaw.in', '+91 98490 11223'),
('usr_l_003', 'lawyer', 'sailaja.naidu@familylaw.org', '+91 98220 33445'),
('usr_l_004', 'lawyer', 'ananya.rao@corplaw.in', '+91 98111 22334'),
('usr_l_005', 'lawyer', 'rajeshwar.rao@propertylaw.in', '+91 98444 55667'),
('usr_l_006', 'lawyer', 'meera.nambiar@cyberlaw.in', '+91 98777 88990')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lawyers (id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area, bar_id, experience_years, rating, status, active_cases, office_address, bio, languages, practice_areas, specializations, legal_services, rating_count, consultation_fee, availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at) VALUES
('l_001', 'usr_l_001', 'Adv. Swathi Reddy', 'swathi.reddy@legal.in', '+91 98765 43210', 'Criminal Defense', 'Senior Advocate — High Court', 'Hyderabad', 'telangana', 'hyderabad', 'Banjara Hills', 'TS/1234/2014', 12, '4.9', 'Approved', 8, 'Road No. 12, Banjara Hills, Hyderabad', 'Civil litigation, corporate writs, and property title dispute settlements.', '["lang_en", "lang_te", "lang_hi"]'::jsonb, '["cat_1", "cat_6"]'::jsonb, '["spec_1_1", "spec_1_2", "spec_6_3"]'::jsonb, '["srv_1_1_1", "srv_1_1_2", "srv_1_2_2", "srv_6_3_2"]'::jsonb, 42, 1500, 'Online', 'HDFC Bank Ltd', '50100234567890', 'HDFC0001234', 'lawyer', true, '2024-03-10'),
('l_002', 'usr_l_002', 'Adv. Srinivas Chowdary', 'srinivas.chowdary@courtlaw.in', '+91 98490 11223', 'Property Law', 'Criminal Defense Advocate', 'Hyderabad', 'telangana', 'hyderabad', 'Gachibowli', 'TS/5678/2012', 14, '4.8', 'Approved', 11, 'Plot 45, Telecom Nagar, Gachibowli, Hyderabad', 'Courtroom experience in anticipatory bails, economic offences, and criminal revisions.', '["lang_en", "lang_te"]'::jsonb, '["cat_9", "cat_8"]'::jsonb, '["spec_9_2", "spec_9_3", "spec_8_3"]'::jsonb, '["srv_9_2_1", "srv_9_2_6", "srv_9_3_2", "srv_8_3_3"]'::jsonb, 38, 2000, 'Online', 'State Bank of India', '38920194829', 'SBIN0004812', 'lawyer', true, '2024-05-18'),
('l_003', 'usr_l_003', 'Adv. Sailaja Naidu', 'sailaja.naidu@familylaw.org', '+91 98220 33445', 'Family Law', 'Family & Matrimonial Advocate', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', 'MVP Colony', 'AP/9102/2016', 9, '4.9', 'Approved', 6, 'Sector 3, MVP Colony, Visakhapatnam', 'Expert counsel in divorce mediation, child custody, and domestic disputes.', '["lang_en", "lang_te"]'::jsonb, '["cat_3"]'::jsonb, '["spec_3_6", "spec_3_2", "spec_3_7"]'::jsonb, '["srv_3_6_5", "srv_3_2_1", "srv_3_7_1"]'::jsonb, 29, 1200, 'Online', 'ICICI Bank', '192801948201', 'ICIC0000281', 'lawyer', true, '2024-08-22'),
('l_004', 'usr_l_004', 'Adv. Ananya Rao', 'ananya.rao@corplaw.in', '+91 98111 22334', 'Corporate Law', 'Corporate & M&A Specialist', 'Bengaluru', 'karnataka', NULL, 'Indiranagar', 'KAR/3421/2015', 11, '4.9', 'Approved', 9, '100 Feet Road, Indiranagar, Bengaluru', 'Corporate restructuring, venture funding agreements, commercial arbitration.', '["lang_en", "lang_kn", "lang_hi"]'::jsonb, '["cat_2", "cat_4"]'::jsonb, '["spec_2_1", "spec_2_4", "spec_2_5"]'::jsonb, '["srv_2_1_1", "srv_2_4_1", "srv_2_5_1"]'::jsonb, 51, 2500, 'Online', 'Axis Bank', '9180200482910', 'UTIB0000421', 'lawyer', true, '2024-02-15'),
('l_005', 'usr_l_005', 'Adv. Rajeshwar Rao', 'rajeshwar.rao@propertylaw.in', '+91 98444 55667', 'Property Law', 'Property & Revenue Law Specialist', 'Hyderabad', 'telangana', 'hyderabad', 'Jubilee Hills', 'TS/7891/2010', 16, '4.8', 'Approved', 14, 'Road No. 36, Jubilee Hills, Hyderabad', 'Specialized in land acquisition, partition suits, title search, and High Court writs.', '["lang_en", "lang_te"]'::jsonb, '["cat_9"]'::jsonb, '["spec_9_1", "spec_9_2", "spec_9_3"]'::jsonb, '["srv_9_1_1", "srv_9_2_1", "srv_9_3_1"]'::jsonb, 67, 1800, 'Online', 'State Bank of India', '20194829104', 'SBIN0001048', 'lawyer', true, '2023-11-20'),
('l_006', 'usr_l_006', 'Adv. Meera Nambiar', 'meera.nambiar@cyberlaw.in', '+91 98777 88990', 'Cyber', 'Cyber Crime & Data Privacy Counsel', 'Chennai', 'tamil_nadu', NULL, 'T. Nagar', 'TN/2049/2018', 8, '4.7', 'Approved', 5, 'G.N. Chetty Road, T. Nagar, Chennai', 'Handling cyber fraud, online defamation, digital evidence authentication under Section 65B.', '["lang_en", "lang_ta", "lang_ml"]'::jsonb, '["cat_10"]'::jsonb, '["spec_10_1", "spec_10_2"]'::jsonb, '["srv_10_1_1", "srv_10_1_2", "srv_10_2_1"]'::jsonb, 24, 1500, 'Online', 'HDFC Bank', '50100482910492', 'HDFC0000192', 'lawyer', true, '2024-06-10')
ON CONFLICT (id) DO UPDATE
SET languages = EXCLUDED.languages,
    practice_areas = EXCLUDED.practice_areas,
    specializations = EXCLUDED.specializations,
    legal_services = EXCLUDED.legal_services,
    registration_type = EXCLUDED.registration_type,
    declaration_accepted = EXCLUDED.declaration_accepted;

-- 5. Centralized Project Lookups (Case Types & Lawyer Case Stages)
INSERT INTO public.lookups (id, category, label, description, sort_order) VALUES
('new', 'case_type', 'New Case', 'Brand new matter requiring advocate filing and initial court registration', 1),
('pending', 'case_type', 'Pending Case', 'Existing matter currently pending before a court with assigned CNR', 2),
('closed', 'case_type', 'Closed / Disposed Case', 'Past or disposed court matter with assigned CNR', 3),
('submitted', 'lawyer_casestage', 'Submitted', 'Case submitted by citizen, awaiting advocate review', 0),
('accepted', 'lawyer_casestage', 'Accepted', 'Advocate accepted representation', 1),
('filinginprogress', 'lawyer_casestage', 'Filing in Progress', 'Court filing and petition drafting in progress', 2),
('cnrgenerated', 'lawyer_casestage', 'CNR Generated', 'Case filed and CNR number assigned by court registry', 3),
('rejected', 'lawyer_casestage', 'Rejected', 'Advocate declined representation', 4)
ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

-- 5c. Imported Cases (eCourts Canonical DLND020047882015 from case_structure.json)
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

-- 5d. Cases User (Citizen Bookings & Submissions)
INSERT INTO public.cases_user (id, citizen_id, lawyer_id, case_type, cnr, title, description, documents, practice_area, specialization, legal_services, case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline) VALUES
('CUC-20260831154512', 'u_001', 'l_001', 'new', NULL, 'Sai Teja Reddy vs. ABC Developers Pvt Ltd', 'Delay in apartment handover and violation of RERA sanctioned plan in Kondapur project.', '[]'::jsonb, 'cat_1', 'spec_1_1', '["srv_1_1_1", "srv_1_1_2"]'::jsonb, 'filinginprogress', 'filinginprogress', NULL, false, '[{"id":"tl_1","status":"submitted","at":"2026-08-31T15:45:12Z","note":"Case submitted by citizen"},{"id":"tl_2","status":"accepted","at":"2026-09-01T11:30:00Z","note":"Assigned to Adv. Swathi Reddy"},{"id":"tl_3","status":"filinginprogress","at":"2026-09-03T14:15:00Z","note":"Drafting petition"}]'::jsonb),
('CUC-20260902112040', 'u_002', 'l_002', 'pending', 'DLND020047882015', 'Lakshmi Prasanna vs. State of AP & Ors', 'Anticipatory bail petition in connection with commercial dispute.', '[]'::jsonb, 'cat_6', 'spec_6_3', '["srv_6_3_2"]'::jsonb, 'accepted', 'accepted', NULL, true, '[{"id":"tl_4","status":"submitted","at":"2026-09-02T11:20:40Z","note":"Emergency case created"},{"id":"tl_5","status":"accepted","at":"2026-09-02T13:00:00Z","note":"Advocate accepted brief"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 6. Subscriptions
INSERT INTO public.subscriptions (id, citizen_id, plan_id, plan_label, amount, started_at, status, case_id) VALUES
('sub_101', 'u_001', 'monthly', 'Monthly Auto-Assign Plan', 1499, '2026-08-30', 'Active', 'CUC-20260831154512'),
('sub_102', 'u_002', 'yearly', 'Annual Premium Plan', 9999, '2026-09-01', 'Active', 'CUC-20260902112040')
ON CONFLICT (id) DO NOTHING;

-- 7. Payments (Razorpay)
INSERT INTO public.payments (id, source, date, status, citizen_id, citizen_name, gross_amount, platform_amount, lawyer_amount, razorpay_order_id, razorpay_payment_id) VALUES
('pay_101', 'subscription', '2026-08-30', 'Completed', 'u_001', 'Sai Teja Reddy', 1499, 1499, 0, 'order_mock_101', 'pay_mock_101'),
('pay_102', 'consultation', '2026-09-01', 'Completed', 'u_001', 'Sai Teja Reddy', 1500, 300, 1200, 'order_mock_102', 'pay_mock_102'),
('pay_103', 'commission', '2026-09-02', 'Completed', 'u_002', 'Lakshmi Prasanna', 5000, 1000, 4000, 'order_mock_103', 'pay_mock_103')
ON CONFLICT (id) DO NOTHING;

-- 8. Withdrawal Requests
INSERT INTO public.withdrawal_requests (id, lawyer_id, lawyer_name, amount, requested_at, status, bank_name, account_number, ifsc_code, processed_at, reference_id) VALUES
('w_101', 'l_001', 'Swathi Reddy', 12240, '2026-09-02', 'Approved', 'HDFC Bank Ltd', '•••• 4829', 'HDFC0001234', '2026-09-03', 'TXN_94820194'),
('w_102', 'l_002', 'Srinivas Chowdary', 8500, '2026-09-06', 'Pending', 'State Bank of India', '•••• 9102', 'SBIN0004812', NULL, NULL),
('w_103', 'l_003', 'Sailaja Naidu', 15400, '2026-09-07', 'Pending', 'ICICI Bank', '•••• 3391', 'ICIC0000281', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 9. Video Calls (Agora)
INSERT INTO public.video_calls (id, case_id, channel_name, with_name, caller_id, receiver_id, at, duration_seconds, status, role) VALUES
('vc_101', 'CUC-20260831154512', 'case_CUC-20260831154512', 'Adv. Swathi Reddy', 'u_001', 'l_001', '2026-09-01T15:30:00Z', 1420, 'completed', 'citizen'),
('vc_102', 'CUC-20260902112040', 'case_CUC-20260902112040', 'Adv. Srinivas Chowdary', 'u_002', 'l_002', '2026-09-02T17:00:00Z', 980, 'completed', 'citizen')
ON CONFLICT (id) DO NOTHING;

-- 10. Knowledge Items
INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at) VALUES
('kb_1', 'Bharatiya Nyaya Sanhita (BNS) 2023 Overview', 'Act', 'Criminal', '2.4 MB', 'https://closeurcase.app/docs/bns-2023.pdf', 'bns-2023.pdf', 'application/pdf', '2026-01-15'),
('kb_2', 'Real Estate (Regulation and Development) Act, 2016', 'Act', 'Property', '1.8 MB', 'https://closeurcase.app/docs/rera-act.pdf', 'rera-act.pdf', 'application/pdf', '2026-02-10')
ON CONFLICT (id) DO NOTHING;

-- 11. Notifications
INSERT INTO public.app_notifications (id, role, title, body, at, read) VALUES
('notif_1', 'citizen', 'Hearing Scheduled', 'Your case CUC-20260831154512 has a hearing scheduled on 28 Sep 2026.', '2026-09-10T11:30:00Z', false),
('notif_2', 'admin', 'New Withdrawal Request', 'Adv. Srinivas Chowdary submitted a payout request of ₹8,500.', '2026-09-06T10:00:00Z', false),
('notif_3', 'lawyer', 'Withdrawal Approved', 'Your payout of ₹12,240 was approved and processed via TXN_94820194.', '2026-09-03T16:45:00Z', true)
ON CONFLICT (id) DO NOTHING;

-- 12. Subscription Plans Catalog (Matches citizen.subscriptions.tsx & subscriptionPlans.ts)
INSERT INTO public.subscription_plans (id, label, price, cadence, badge, audience, description, features, active) VALUES
('free', 'Free', 0, '', NULL, 'For getting started', 'Browse verified advocates and file cases manually, at your own pace.', '["Manual advocate search & selection","File up to 2 active cases","Standard case tracking","Community support"]'::jsonb, 'true'),
('monthly', 'Monthly', 499, '/month', 'Popular', 'For active matters', 'Priority admin-assigned advocate support, billed every month.', '["Auto-dispatch to top verified specialists","Priority admin allocation & case tracking","Unlimited active cases","Priority support"]'::jsonb, 'true'),
('yearly', 'Yearly', 4999, '/year', 'Save 17%', 'For long-term needs', 'Priority admin-assigned advocate support, billed once a year.', '["Everything in Monthly","2 months free vs monthly billing","Dedicated case manager","Early access to new features"]'::jsonb, 'true')
ON CONFLICT (id) DO NOTHING;

-- 13. Consultation Chat Messages (Matches citizen.chat.$id.tsx & lawyer.chat.$id.tsx)
INSERT INTO public.chat_messages (id, case_id, sender, sender_name, text, read, at) VALUES
('msg_001', 'CUC-20260831154512', 'citizen', 'Sai Teja Reddy', 'Hello Adv. Swathi, I have uploaded the apartment sale deed and the developer builder allotment letter.', true, '2026-09-01T10:00:00Z'),
('msg_002', 'CUC-20260831154512', 'lawyer', 'Adv. Swathi Reddy', 'Thank you Sai Teja. I have reviewed the allotment clause 14. The developer is clearly in breach of the 24-month handover deadline under Section 18 of RERA.', true, '2026-09-01T10:15:00Z'),
('msg_003', 'CUC-20260831154512', 'citizen', 'Sai Teja Reddy', 'Should we file an interim injunction or claim interest for the 18 months delay?', false, '2026-09-01T10:30:00Z'),
('msg_004', 'CUC-20260831154512', 'lawyer', 'Adv. Swathi Reddy', 'We will claim statutory interest under Section 18(1) proviso, plus compensation for structural deviations. I have drafted the petition.', false, '2026-09-01T10:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- 14. Contact Inquiries (Matches contact.tsx)
INSERT INTO public.contact_inquiries (id, name, email, category, subject, message, status) VALUES
('inq_001', 'Vikramaditya Construction Ltd', 'legal@vikramaditya.in', 'corporate', 'Corporate Empanelment Inquiry', 'We would like to empanel our company legal matters on CloseUrCase platform for nationwide dispute management.', 'New'),
('inq_002', 'Radha Krishna Rao', 'radha.krishna@gmail.com', 'general', 'Query regarding property verification in Hyderabad', 'Can I hire an advocate specifically for search report and title investigation?', 'New')
ON CONFLICT (id) DO NOTHING;

-- 15. AI Case Analyses (Matches lawyer.ai-assistant.tsx)
INSERT INTO public.ai_case_analyses (id, case_id, type, input_prompt, response_content) VALUES
('ai_001', 'CUC-20260831154512', 'counter_argument', 'Developer claims force majeure due to supply shortages and municipal delays', '{"counterText":"Force majeure defence under RERA Section 6 requires notification within 30 days of impediment and cannot excuse commercially foreseeable delays. (Pioneer Urban v. Govindan, 2019).","authorities":["RERA Act 2016 Section 6 & 18","Pioneer Urban Land and Infrastructure Ltd. v. Govindan Raghavan (2019) 5 SCC 725"],"confidenceScore":95}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 16. Additional Verified Lawyers (From mock.ts)
INSERT INTO public.users (id, role, email, phone) VALUES
('usr_l_004', 'lawyer', 'ananya.rao@corplaw.in', '+91 98111 22334'),
('usr_l_005', 'lawyer', 'rajeshwar.rao@propertylaw.in', '+91 98444 55667'),
('usr_l_006', 'lawyer', 'meera.nambiar@cyberlaw.in', '+91 98777 88990')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lawyers (id, user_id, name, email, phone, category, role_title, city, area, bar_id, experience_years, rating, status, active_cases, office_address, bio, languages, practice_areas, specializations, legal_services, rating_count, consultation_fee, availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at) VALUES
('l_004', 'usr_l_004', 'Adv. Ananya Rao', 'ananya.rao@corplaw.in', '+91 98111 22334', 'Corporate Law', 'Corporate & M&A Specialist', 'Bengaluru', 'Indiranagar', 'KAR/3421/2015', 11, '4.9', 'Approved', 9, '100 Feet Road, Indiranagar, Bengaluru', 'Corporate restructuring, venture funding agreements, commercial arbitration.', '["lang_en", "lang_kn", "lang_hi"]'::jsonb, '["cat_2", "cat_4"]'::jsonb, '["spec_2_3", "spec_2_4", "spec_2_5"]'::jsonb, '["srv_2_4_1", "srv_2_3_1", "srv_2_5_1"]'::jsonb, 51, 2500, 'Online', 'Axis Bank', '9180200482910', 'UTIB0000421', 'lawyer', true, '2024-02-15'),
('l_005', 'usr_l_005', 'Adv. Rajeshwar Rao', 'rajeshwar.rao@propertylaw.in', '+91 98444 55667', 'Property Law', 'Property & Revenue Law Specialist', 'Hyderabad', 'Jubilee Hills', 'TS/7891/2010', 16, '4.8', 'Approved', 14, 'Road No. 36, Jubilee Hills, Hyderabad', 'Specialized in land acquisition, partition suits, title search, and High Court writs.', '["lang_en", "lang_te"]'::jsonb, '["cat_9"]'::jsonb, '["spec_9_2", "spec_9_3"]'::jsonb, '["srv_9_2_1", "srv_9_2_6", "srv_9_3_1"]'::jsonb, 67, 1800, 'Online', 'State Bank of India', '20194829104', 'SBIN0001048', 'lawyer', true, '2023-11-20'),
('l_006', 'usr_l_006', 'Adv. Meera Nambiar', 'meera.nambiar@cyberlaw.in', '+91 98777 88990', 'Cyber', 'Cyber Crime & Data Privacy Counsel', 'Chennai', 'T. Nagar', 'TN/2049/2018', 8, '4.7', 'Approved', 5, 'G.N. Chetty Road, T. Nagar, Chennai', 'Handling cyber fraud, online defamation, digital evidence authentication under Section 65B.', '["lang_en", "lang_ta", "lang_ml"]'::jsonb, '["cat_10"]'::jsonb, '["spec_10_1", "spec_10_4", "spec_10_3"]'::jsonb, '["srv_10_1_1", "srv_10_4_1", "srv_10_3_1"]'::jsonb, 24, 1500, 'Online', 'HDFC Bank', '50100482910492', 'HDFC0000192', 'lawyer', true, '2024-06-10')
ON CONFLICT (id) DO UPDATE
SET languages = EXCLUDED.languages,
    practice_areas = EXCLUDED.practice_areas,
    specializations = EXCLUDED.specializations,
    legal_services = EXCLUDED.legal_services,
    registration_type = EXCLUDED.registration_type,
    declaration_accepted = EXCLUDED.declaration_accepted;

