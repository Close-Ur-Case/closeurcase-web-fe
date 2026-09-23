-- ==============================================================================
-- Migration: 20260925000000_seed_complete_production_data.sql
-- Description: Complete production seed for all Citizens, Lawyers, Cases, CNRs,
--              Subscriptions, Payments, Notifications, Video Calls, and Knowledge Base.
-- ==============================================================================

-- 0. Ensure Delhi exists in states table
INSERT INTO public.states (id, name, code, active)
VALUES ('delhi', 'Delhi (NCT)', 'DL', true)
ON CONFLICT (id) DO NOTHING;

-- Disable lawyer taxonomy/language triggers during mass seed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_lawyer_case_taxonomies') THEN
        ALTER TABLE public.lawyers DISABLE TRIGGER trg_validate_lawyer_case_taxonomies;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_lawyer_languages') THEN
        ALTER TABLE public.lawyers DISABLE TRIGGER trg_validate_lawyer_languages;
    END IF;
END $$;

-- 1. SEED CITIZEN USERS & PROFILES

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_u_001', 'citizen', 'saiteja.reddy@gmail.com', '+91 98110 22111')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  'u_001',
  'usr_u_001',
  'Sai Teja Reddy',
  'saiteja.reddy@gmail.com',
  '+91 98110 22111',
  'Hyderabad',
  'Telangana',
  'telangana',
  'hyderabad',
  'Active',
  '2025-02-14',
  '2026-09-06T09:15:00'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_u_002', 'citizen', 'lakshmi.prasanna92@gmail.com', '+91 98320 45123')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  'u_002',
  'usr_u_002',
  'Lakshmi Prasanna',
  'lakshmi.prasanna92@gmail.com',
  '+91 98320 45123',
  'Visakhapatnam',
  'Andhra Pradesh',
  'andhra_pradesh',
  'visakhapatnam',
  'Active',
  '2025-04-01',
  '2026-09-04T18:42:00'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_u_003', 'citizen', 'divya.chowdary@gmail.com', '+91 98450 88321')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  'u_003',
  'usr_u_003',
  'Divya Sri Chowdary',
  'divya.chowdary@gmail.com',
  '+91 98450 88321',
  'Hyderabad',
  'Telangana',
  'telangana',
  'hyderabad',
  'Active',
  '2025-06-11',
  '2026-09-05T11:20:00'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_u_004', 'citizen', 'ramana.naidu.vzg@gmail.com', '+91 98333 11902')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  'u_004',
  'usr_u_004',
  'Venkata Ramana Naidu',
  'ramana.naidu.vzg@gmail.com',
  '+91 98333 11902',
  'Visakhapatnam',
  'Andhra Pradesh',
  'andhra_pradesh',
  'visakhapatnam',
  'Inactive',
  '2025-11-08',
  '2026-05-20T08:05:00'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_u_005', 'citizen', 'padmavathi.rao1985@gmail.com', '+91 98771 55220')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  'u_005',
  'usr_u_005',
  'Padmavathi Rao',
  'padmavathi.rao1985@gmail.com',
  '+91 98771 55220',
  'Hyderabad',
  'Telangana',
  'telangana',
  'hyderabad',
  'Active',
  '2025-05-30',
  '2026-08-28T21:03:00'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_u_006', 'citizen', 'arjun.mehta.blr@gmail.com', '+91 99860 71204')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  'u_006',
  'usr_u_006',
  'Arjun Mehta',
  'arjun.mehta.blr@gmail.com',
  '+91 99860 71204',
  'Bengaluru',
  'Karnataka',
  'karnataka',
  NULL,
  'Active',
  '2026-01-19',
  '2026-09-03T14:10:00'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_u_007', 'citizen', 'fatima.sheikh.che@gmail.com', '+91 90030 44518')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  'u_007',
  'usr_u_007',
  'Fatima Sheikh',
  'fatima.sheikh.che@gmail.com',
  '+91 90030 44518',
  'Chennai',
  'Tamil Nadu',
  'tamil_nadu',
  NULL,
  'Active',
  '2026-03-22',
  '2026-09-01T10:47:00'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_u_008', 'citizen', 'manoj.kulkarni.pune@gmail.com', '+91 96570 88931')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  'u_008',
  'usr_u_008',
  'Manoj Kulkarni',
  'manoj.kulkarni.pune@gmail.com',
  '+91 96570 88931',
  'Pune',
  'Maharashtra',
  'maharashtra',
  NULL,
  'Active',
  '2026-06-14',
  '2026-08-19T16:35:00'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_u_009', 'citizen', 'sneha.kapoor.del@gmail.com', '+91 98101 23456')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  'u_009',
  'usr_u_009',
  'Sneha Kapoor',
  'sneha.kapoor.del@gmail.com',
  '+91 98101 23456',
  'Delhi / New Delhi',
  'Delhi',
  'delhi',
  NULL,
  'Active',
  '2026-07-01',
  '2026-09-01T12:00:00'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_u_010', 'citizen', 'rajesh.sharma.vja@gmail.com', '+91 98480 98765')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  'u_010',
  'usr_u_010',
  'Rajesh Sharma',
  'rajesh.sharma.vja@gmail.com',
  '+91 98480 98765',
  'Vijayawada',
  'Andhra Pradesh',
  'andhra_pradesh',
  'ntr',
  'Active',
  '2026-07-15',
  '2026-09-05T10:30:00'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;

-- 2. SEED LAWYER USERS & PROFILES

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_001', 'lawyer', 'swathi.reddy@closeur.legal', '+91 98100 12345')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_001',
  'usr_l_001',
  'Swathi Reddy',
  'swathi.reddy@closeur.legal',
  '+91 98100 12345',
  'Criminal',
  'Advocate — High Court',
  'Hyderabad',
  'telangana',
  'hyderabad',
  'Nampally',
  'TS/2014/1023',
  11,
  '4.8',
  'Approved',
  5,
  'Chamber No. 214, Telangana High Court Complex, Nampally, Hyderabad',
  'Swathi has spent over a decade defending clients across Telangana''s criminal courts, with a focus on bail applications, anti-corruption matters, and POCSO cases. She believes in swift, transparent communication with every client she represents.',
  '["lang_en","lang_te","lang_hi"]'::jsonb,
  '["cat_1","cat_1","cat_1"]'::jsonb,
  '["Anticipatory Bail","Criminal","POCSO Act","Fraud Case","Cheque Bounce"]'::jsonb,
  '["File Anticipatory Bail Application","Criminal Defense","POCSO Case Defense","File Fraud Case","Cheque Bounce Legal Notice"]'::jsonb,
  120,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-01-12'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_002', 'lawyer', 'srinivas.chowdary@closeur.legal', '+91 98100 23456')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_002',
  'usr_l_002',
  'Srinivas Chowdary',
  'srinivas.chowdary@closeur.legal',
  '+91 98100 23456',
  'Property',
  'Advocate — High Court',
  'Hyderabad',
  'telangana',
  'hyderabad',
  'Somajiguda',
  'TS/2011/0812',
  14,
  '4.6',
  'Approved',
  2,
  'Plot 45, Somajiguda, Hyderabad',
  'Srinivas is a property law specialist who has handled land disputes, partition suits, and illegal construction cases across Hyderabad for over 14 years. He is known for his meticulous documentation review.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_9","cat_1","cat_1","cat_1"]'::jsonb,
  '["Property"]'::jsonb,
  '["Illegal Construction","Property Verification","Property Dispute","Property Registration"]'::jsonb,
  95,
  1500,
  'Offline',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-02-20'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_003', 'lawyer', 'sailaja.naidu@closeur.legal', '+91 98100 34567')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_003',
  'usr_l_003',
  'Sailaja Naidu',
  'sailaja.naidu@closeur.legal',
  '+91 98100 34567',
  'Family',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'MVP Colony',
  'AP/2017/2210',
  8,
  '4.9',
  'Approved',
  1,
  'MVP Colony, Visakhapatnam',
  'Sailaja practices family law with an emphasis on divorce, child custody, and maintenance cases. She approaches every case with empathy while pursuing the best possible outcome for her clients.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_3","cat_1","cat_1"]'::jsonb,
  '["Divorce","Child Custody","Domestic Violence","Wills / Trusts","Family"]'::jsonb,
  '["File for Divorce","Child Custody Case","Domestic Violence Complaint","Will Drafting","Family Dispute"]'::jsonb,
  60,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-03-09'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_004', 'lawyer', 'venkatesh.rao@closeur.legal', '+91 98100 45678')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_004',
  'usr_l_004',
  'Venkatesh Rao',
  'venkatesh.rao@closeur.legal',
  '+91 98100 45678',
  'Corporate',
  'Advocate — High Court',
  'Hyderabad',
  'telangana',
  'hyderabad',
  'Gachibowli',
  'TS/2012/0091',
  13,
  '4.5',
  'Approved',
  2,
  'Level 4, Cyber Towers, Gachibowli, Hyderabad',
  'Venkatesh advises startups and mid-sized companies on incorporation, contracts, and compliance. His corporate practice spans arbitration, NCLT matters, and commercial dispute resolution.',
  '["lang_en","lang_te","lang_hi"]'::jsonb,
  '["cat_2","cat_1","cat_1"]'::jsonb,
  '["Arbitration","Corporate","NCLT"]'::jsonb,
  '["Arbitration Consultation","Company Law Compliance","Corporate Dispute","NCLT Case Filing"]'::jsonb,
  140,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-03-15'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_005', 'lawyer', 'haritha.sarma@closeur.legal', '+91 98100 56789')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_005',
  'usr_l_005',
  'Haritha Sarma',
  'haritha.sarma@closeur.legal',
  '+91 98100 56789',
  'Cyber',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'Dwaraka Nagar',
  'AP/2019/3320',
  6,
  '4.7',
  'Approved',
  2,
  'Dwaraka Nagar, Visakhapatnam',
  'Haritha focuses on cyber law, handling online fraud, data privacy, and social media harassment cases. She works closely with law enforcement''s cyber cells to build strong digital evidence trails.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_10","cat_1","cat_1","cat_1"]'::jsonb,
  '["Cyber Crime"]'::jsonb,
  '["Cyber Crime Complaint","Cyber Fraud Case","Online Harassment Case"]'::jsonb,
  40,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-04-12'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_006', 'lawyer', 'krishna.murthy@closeur.legal', '+91 98100 67890')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_006',
  'usr_l_006',
  'Krishna Murthy',
  'krishna.murthy@closeur.legal',
  '+91 98100 67890',
  'Labour',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'Gajuwaka',
  'AP/2010/0442',
  15,
  '4.4',
  'Approved',
  2,
  'Gajuwaka, Visakhapatnam',
  'Krishna has represented both employees and employers in labour disputes for 15 years, covering wrongful termination, wage recovery, and industrial tribunal matters.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_8","cat_1","cat_1"]'::jsonb,
  '["Labour & Service"]'::jsonb,
  '["Employment Dispute","Wrongful Termination Matter","Service Matter"]'::jsonb,
  55,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-05-14'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_007', 'lawyer', 'rohan.iyer@closeur.legal', '+91 98450 71234')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_007',
  'usr_l_007',
  'Rohan Iyer',
  'rohan.iyer@closeur.legal',
  '+91 98450 71234',
  'Civil',
  'Advocate — High Court',
  'Bengaluru',
  'karnataka',
  NULL,
  'Indiranagar',
  'KA/2013/1187',
  12,
  '4.6',
  'Approved',
  1,
  '3rd Floor, Indiranagar 100ft Road, Bengaluru',
  'Rohan practices before the Karnataka High Court and Supreme Court, handling writ petitions, appeals, and constitutional matters for individuals and small businesses across Bengaluru.',
  '["lang_en","lang_kn","lang_hi"]'::jsonb,
  '["cat_6","cat_8"]'::jsonb,
  '["High Court"]'::jsonb,
  '["High Court Case Filing","High Court Representation","Writ Petition"]'::jsonb,
  74,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-06-04'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_008', 'lawyer', 'priya.subramaniam@closeur.legal', '+91 98840 82345')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_008',
  'usr_l_008',
  'Priya Subramaniam',
  'priya.subramaniam@closeur.legal',
  '+91 98840 82345',
  'Consumer',
  'Advocate — High Court',
  'Chennai',
  'tamil_nadu',
  NULL,
  'T. Nagar',
  'TN/2016/2093',
  9,
  '4.7',
  'Approved',
  1,
  '2nd Avenue, T. Nagar, Chennai',
  'Priya represents consumers against defective products, insurance claim denials, and unfair trade practices before the Chennai District and State Consumer Disputes Redressal Commissions.',
  '["lang_en","lang_ta"]'::jsonb,
  '["cat_5","cat_1"]'::jsonb,
  '["Consumer Court"]'::jsonb,
  '["Consumer Complaint","Consumer Legal Notice","Consumer Dispute"]'::jsonb,
  58,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-04-18'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_009', 'lawyer', 'aditya.deshmukh@closeur.legal', '+91 98220 93456')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_009',
  'usr_l_009',
  'Aditya Deshmukh',
  'aditya.deshmukh@closeur.legal',
  '+91 98220 93456',
  'Civil',
  'Advocate — High Court',
  'Pune',
  'maharashtra',
  NULL,
  'Shivajinagar',
  'MH/2015/1745',
  10,
  '4.5',
  'Approved',
  2,
  'Fergusson College Road, Shivajinagar, Pune',
  'Aditya advises individuals and small businesses on income tax notices, GST compliance, and tax appeals, and represents clients before appellate tribunals across Maharashtra.',
  '["lang_en","lang_mr","lang_hi"]'::jsonb,
  '["cat_8","cat_4","cat_1"]'::jsonb,
  '["Tax"]'::jsonb,
  '["Tax Consultation","Income Tax Matter","Tax Dispute"]'::jsonb,
  47,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-07-22'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_010', 'lawyer', 'kavya.reddy@closeur.legal', '+91 98488 04567')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_010',
  'usr_l_010',
  'Kavya Reddy',
  'kavya.reddy@closeur.legal',
  '+91 98488 04567',
  'Labour',
  'Advocate — High Court',
  'Vijayawada',
  'andhra_pradesh',
  'ntr',
  'Governorpet',
  'AP/2018/2861',
  7,
  '4.3',
  'Suspended',
  0,
  'MG Road, Governorpet, Vijayawada',
  'Kavya represents employees in wrongful termination, wage recovery, and workplace disputes before the Labour Court and Industrial Tribunal in Vijayawada.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_8"]'::jsonb,
  '["Labour & Service"]'::jsonb,
  '["Employment Dispute","Wrongful Termination Matter","Salary / Wage Dispute"]'::jsonb,
  33,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-08-30'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_011', 'lawyer', 'nikhil.chandra@closeur.legal', '+91 98450 15678')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_011',
  'usr_l_011',
  'Nikhil Chandra',
  'nikhil.chandra@closeur.legal',
  '+91 98450 15678',
  'Corporate',
  'Advocate — High Court',
  'Bengaluru',
  'karnataka',
  NULL,
  'Koramangala',
  'KA/2017/2440',
  8,
  '4.8',
  'Approved',
  1,
  '5th Block, Koramangala, Bengaluru',
  'Nikhil advises early-stage startups on incorporation, founder agreements, and fundraising compliance — a go-to counsel for Bengaluru''s startup ecosystem.',
  '["lang_en","lang_kn","lang_hi"]'::jsonb,
  '["cat_2"]'::jsonb,
  '["Startup"]'::jsonb,
  '["Startup Legal Consultation","Business Registration","Founder Agreement"]'::jsonb,
  62,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-09-28'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_012', 'lawyer', 'ananya.deshpande@closeur.legal', '+91 99870 34521')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_012',
  'usr_l_012',
  'Ananya Deshpande',
  'ananya.deshpande@closeur.legal',
  '+91 99870 34521',
  'Environmental',
  'Advocate — High Court',
  'Hyderabad',
  'telangana',
  'hyderabad',
  'Banjara Hills',
  'TS/2019/3381',
  6,
  '4.9',
  'Approved',
  1,
  'Road No. 12, Banjara Hills, Hyderabad',
  'Ananya represents petitioners and industries in environmental clearance disputes and pollution control board proceedings across Telangana.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_12","cat_1"]'::jsonb,
  '["Environmental Clearance"]'::jsonb,
  '["NGT Representation","Pollution Control Compliance"]'::jsonb,
  15,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-10-31'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_013', 'lawyer', 'rajesh.varma@closeur.legal', '+91 98490 12890')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_013',
  'usr_l_013',
  'Rajesh Varma',
  'rajesh.varma@closeur.legal',
  '+91 98490 12890',
  'Criminal',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'Seethammadhara',
  'AP/2011/1542',
  15,
  '4.9',
  'Approved',
  2,
  'Opp. District Court, Seethammadhara, Visakhapatnam',
  'Rajesh is a senior criminal defense lawyer specializing in bail petitions, criminal appeals, and white-collar fraud defense in Visakhapatnam.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_1"]'::jsonb,
  '["Criminal","Anticipatory Bail","Fraud Case"]'::jsonb,
  '["Criminal Defense","File Anticipatory Bail Application","File Fraud Case"]'::jsonb,
  88,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-02-10'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_014', 'lawyer', 'ramana.rao@closeur.legal', '+91 98491 23901')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_014',
  'usr_l_014',
  'N. V. Ramana Rao',
  'ramana.rao@closeur.legal',
  '+91 98491 23901',
  'Civil',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'Maharanipeta',
  'AP/2009/0811',
  16,
  '4.8',
  'Approved',
  2,
  'Beach Road, Maharanipeta, Visakhapatnam',
  'Ramana Rao handles complex civil suits, injunction matters, money recovery suits, and civil appeals before Visakhapatnam courts and the AP High Court.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_8","cat_1"]'::jsonb,
  '["Civil Suit","Civil Dispute","Litigation"]'::jsonb,
  '["Civil Suit","Civil Litigation","Civil Dispute"]'::jsonb,
  110,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-01-28'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_015', 'lawyer', 'sunitha.reddy@closeur.legal', '+91 98492 34012')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_015',
  'usr_l_015',
  'Sunitha Reddy',
  'sunitha.reddy@closeur.legal',
  '+91 98492 34012',
  'Civil',
  'Advocate — High Court',
  'Hyderabad',
  'telangana',
  'hyderabad',
  'Ameerpet',
  'TS/2016/1942',
  9,
  '4.7',
  'Approved',
  0,
  'Main Road, Ameerpet, Hyderabad',
  'Sunitha specializes in civil litigation, contract enforcement, and civil legal notices for clients in Telangana.',
  '["lang_en","lang_te","lang_hi"]'::jsonb,
  '["cat_8"]'::jsonb,
  '["Civil Suit","Breach of Contract"]'::jsonb,
  '["Civil Suit","Civil Legal Notice","Contract Dispute Resolution"]'::jsonb,
  65,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-07-20'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_016', 'lawyer', 'pattabhi.ramaiah@closeur.legal', '+91 98493 45123')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_016',
  'usr_l_016',
  'K. Pattabhi Ramaiah',
  'pattabhi.ramaiah@closeur.legal',
  '+91 98493 45123',
  'Property',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'Siripuram',
  'AP/2007/0411',
  18,
  '4.9',
  'Approved',
  2,
  'Siripuram Towers, Siripuram, Visakhapatnam',
  'Pattabhi Ramaiah is a renowned property lawyer dealing with title verification, land acquisition, illegal possession, and RERA builder disputes.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_9","cat_1"]'::jsonb,
  '["Property","RERA","Landlord/Tenant"]'::jsonb,
  '["Property Dispute","Property Registration","RERA Case Filing"]'::jsonb,
  145,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2024-12-05'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_017', 'lawyer', 'ramesh.varma@closeur.legal', '+91 98494 56234')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_017',
  'usr_l_017',
  'Ramesh Varma',
  'ramesh.varma@closeur.legal',
  '+91 98494 56234',
  'Family',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'Dondaparthy',
  'AP/2018/3102',
  8,
  '4.7',
  'Approved',
  0,
  'Dondaparthy, Visakhapatnam',
  'Ramesh represents clients in divorce settlements, child custody rights, and domestic violence protection matters.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_3","cat_1"]'::jsonb,
  '["Divorce","Child Custody","Family"]'::jsonb,
  '["File for Divorce","Child Custody Case","Family Dispute"]'::jsonb,
  42,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-09-18'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_018', 'lawyer', 'suresh.kumar@closeur.legal', '+91 98495 67345')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_018',
  'usr_l_018',
  'Suresh Kumar',
  'suresh.kumar@closeur.legal',
  '+91 98495 67345',
  'Consumer',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'Akkayyapalem',
  'AP/2015/2190',
  10,
  '4.8',
  'Approved',
  2,
  'Akkayyapalem Main Road, Visakhapatnam',
  'Suresh advocates for consumer rights against defective products, medical negligence, and service deficiency.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_5","cat_1"]'::jsonb,
  '["Consumer Court"]'::jsonb,
  '["Consumer Complaint","Consumer Legal Notice","Consumer Dispute"]'::jsonb,
  78,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-10-01'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_019', 'lawyer', 'aditya.verma@closeur.legal', '+91 98496 78456')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_019',
  'usr_l_019',
  'Aditya Verma',
  'aditya.verma@closeur.legal',
  '+91 98496 78456',
  'Cyber',
  'Advocate — High Court',
  'Hyderabad',
  'telangana',
  'hyderabad',
  'HITEC City',
  'TS/2017/2801',
  9,
  '4.9',
  'Approved',
  2,
  'Mindspace IT Park, HITEC City, Hyderabad',
  'Aditya specializes in cybercrime defense, UPI financial fraud recovery, data breach response, and IT Act litigation.',
  '["lang_en","lang_te","lang_hi"]'::jsonb,
  '["cat_10","cat_1"]'::jsonb,
  '["Cyber Crime"]'::jsonb,
  '["Cyber Crime Complaint","Cyber Fraud Case","Cyber Crime Defense"]'::jsonb,
  105,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-04-14'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_020', 'lawyer', 'radhika.sen@closeur.legal', '+91 98497 89567')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_020',
  'usr_l_020',
  'Radhika Sen',
  'radhika.sen@closeur.legal',
  '+91 98497 89567',
  'Corporate',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'Waltair Uplands',
  'AP/2014/1723',
  11,
  '4.8',
  'Approved',
  0,
  'Waltair Uplands, Visakhapatnam',
  'Radhika provides legal counsel to corporations, partnership firms, and business owners on contracts, arbitration, and NCLT matters.',
  '["lang_en","lang_te","lang_hi"]'::jsonb,
  '["cat_2","cat_1"]'::jsonb,
  '["Corporate","Arbitration","Startup"]'::jsonb,
  '["Corporate Legal Consultation","Arbitration Consultation","Contract Review"]'::jsonb,
  82,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-08-11'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_021', 'lawyer', 'suryanarayana.b@closeur.legal', '+91 98498 90678')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_021',
  'usr_l_021',
  'B. Suryanarayana',
  'suryanarayana.b@closeur.legal',
  '+91 98498 90678',
  'Labour',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'Maddilapalem',
  'AP/2012/1209',
  13,
  '4.8',
  'Approved',
  0,
  'Maddilapalem, Visakhapatnam',
  'Suryanarayana represents industrial workers, IT employees, and labor unions in employment disputes and PF/ESI matters.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_8","cat_1"]'::jsonb,
  '["Labour & Service"]'::jsonb,
  '["Employment Dispute","Wrongful Termination Matter","Salary / Wage Dispute"]'::jsonb,
  69,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-03-25'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_022', 'lawyer', 'balaji.rao@closeur.legal', '+91 98499 01789')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_022',
  'usr_l_022',
  'Balaji Rao',
  'balaji.rao@closeur.legal',
  '+91 98499 01789',
  'Tax',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'Dwaraka Nagar',
  'AP/2010/0981',
  14,
  '4.8',
  'Approved',
  2,
  'Dwaraka Nagar 2nd Lane, Visakhapatnam',
  'Balaji Rao is a senior advocate dealing with Income Tax disputes, GST assessment notices, and appellate tax litigation.',
  '["lang_en","lang_te"]'::jsonb,
  '["cat_11","cat_1"]'::jsonb,
  '["Tax"]'::jsonb,
  '["Tax Consultation","Income Tax Matter","Tax Dispute"]'::jsonb,
  92,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-01-18'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_023', 'lawyer', 'vijay.kumar@closeur.legal', '+91 98500 12890')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_023',
  'usr_l_023',
  'Vijay Kumar',
  'vijay.kumar@closeur.legal',
  '+91 98500 12890',
  'Tax',
  'Advocate — High Court',
  'Hyderabad',
  'telangana',
  'hyderabad',
  'Banjara Hills',
  'TS/2013/1402',
  12,
  '4.7',
  'Approved',
  0,
  'Road No. 2, Banjara Hills, Hyderabad',
  'Vijay represents corporates and high-net-worth individuals in tax assessment challenges and GST disputes.',
  '["lang_en","lang_te","lang_hi"]'::jsonb,
  '["cat_11","cat_1"]'::jsonb,
  '["Tax"]'::jsonb,
  '["Tax Consultation","Income Tax Matter","Tax Dispute"]'::jsonb,
  71,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-02-28'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_024', 'lawyer', 'tarun.mehta@closeur.legal', '+91 98501 23901')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_024',
  'usr_l_024',
  'Tarun Mehta',
  'tarun.mehta@closeur.legal',
  '+91 98501 23901',
  'Environmental',
  'Advocate — High Court',
  'Visakhapatnam',
  'andhra_pradesh',
  'visakhapatnam',
  'MVP Colony',
  'AP/2016/2410',
  8,
  '4.7',
  'Approved',
  0,
  'MVP Colony Sector 4, Visakhapatnam',
  'Tarun works on coastal regulation zone (CRZ) disputes, industrial emission clearances, and environmental litigation.',
  '["lang_en","lang_te","lang_hi"]'::jsonb,
  '["cat_12","cat_1"]'::jsonb,
  '["Environmental Clearance"]'::jsonb,
  '["NGT Representation","Pollution Control Compliance"]'::jsonb,
  38,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2025-07-04'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_025', 'lawyer', 'meghana.iyer@closeur.legal', '+91 98502 34012')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_025',
  'usr_l_025',
  'Meghana Iyer',
  'meghana.iyer@closeur.legal',
  '+91 98502 34012',
  'Family',
  'Advocate — High Court',
  'Hyderabad',
  'telangana',
  'hyderabad',
  'Kondapur',
  'TS/2020/3690',
  5,
  '5',
  'Pending',
  0,
  'Kondapur Main Road, Hyderabad',
  'Meghana handles matrimonial disputes, guardianship petitions, and maintenance cases, with a mediation-first approach for families with children.',
  '["lang_en","lang_te","lang_hi"]'::jsonb,
  '["cat_3","cat_1"]'::jsonb,
  '["Divorce","Child Custody","Maintenance & Alimony"]'::jsonb,
  '["File for Divorce","Child Custody Case","Maintenance Petition"]'::jsonb,
  20,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2026-08-30'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

INSERT INTO public.users (id, role, email, phone)
VALUES ('usr_l_026', 'lawyer', 'farhan.qureshi@closeur.legal', '+91 98503 45123')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  'l_026',
  'usr_l_026',
  'Farhan Qureshi',
  'farhan.qureshi@closeur.legal',
  '+91 98503 45123',
  'Corporate',
  'Advocate — High Court',
  'Chennai',
  'tamil_nadu',
  NULL,
  'Nungambakkam',
  'TN/2018/2740',
  7,
  '5',
  'Pending',
  0,
  'Sterling Road, Nungambakkam, Chennai',
  'Farhan advises SMEs and family businesses on contracts, shareholder agreements, and commercial dispute resolution across Tamil Nadu.',
  '["lang_en","lang_ta","lang_hi"]'::jsonb,
  '["cat_2","cat_1"]'::jsonb,
  '["Corporate","Contract Review","Arbitration"]'::jsonb,
  '["Contract Review","Corporate Legal Consultation","Arbitration Consultation"]'::jsonb,
  20,
  1500,
  'Online',
  'State Bank of India',
  '•••• 4829',
  'SBIN0004812',
  'lawyer',
  true,
  '2026-09-02'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;

-- Re-enable lawyer triggers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_lawyer_case_taxonomies') THEN
        ALTER TABLE public.lawyers ENABLE TRIGGER trg_validate_lawyer_case_taxonomies;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_lawyer_languages') THEN
        ALTER TABLE public.lawyers ENABLE TRIGGER trg_validate_lawyer_languages;
    END IF;
END $$;

-- 3. SEED IMPORTED eCOURTS DOCKET MATTERS (cases_imported)

INSERT INTO public.cases_imported (cnr, case_details, entity_info, files, descriptions, case_ai_analysis, raw_data)
VALUES (
  'TSHC010011342025',
  '{"caseNumber":"OS/112/2025","cnr":"TSHC010011342025","courtName":"City Civil Court, Banjara Hills, Hyderabad","purpose":"EVIDENCE","contestedStatus":"CONTESTED","historyOfCaseHearings":[{"judge":"II Additional Chief Judge, City Civil Court, Hyderabad","businessOnDate":"2025-09-14","hearingDate":"2025-10-15","time":"11:00 AM","purposeOfListing":"First hearing — boundary survey report presented"},{"judge":"II Additional Chief Judge, City Civil Court, Hyderabad","businessOnDate":"2025-10-15","hearingDate":"2025-11-20","time":"10:30 AM","purposeOfListing":"Written statement filed by respondent; matter posted for framing of issues."},{"judge":"II Additional Chief Judge, City Civil Court, Hyderabad","businessOnDate":"2025-11-20","hearingDate":"2026-01-15","time":"11:15 AM","purposeOfListing":"Issues framed; matter posted for evidence."},{"judge":"II Additional Chief Judge, City Civil Court, Hyderabad","businessOnDate":"2026-01-15","hearingDate":"2026-03-10","time":"10:45 AM","purposeOfListing":"Plaintiff evidence recorded — PW-1 examined-in-chief."},{"judge":"II Additional Chief Judge, City Civil Court, Hyderabad","businessOnDate":"2026-03-10","hearingDate":"2026-09-05","time":"10:30 AM","purposeOfListing":"Next hearing — municipal survey cross-examination"}],"interimOrders":[{"orderDate":"2025-10-15","description":"Interim status-quo order restraining further construction pending survey review.","orderUrl":"order-cs34253-1.pdf"},{"orderDate":"2026-01-15","description":"Order permitting joint inspection of disputed boundary by court-appointed commissioner.","orderUrl":"order-cs34253-2.pdf"}],"filingDate":"2025-09-14","judges":["II Additional Chief Judge, City Civil Court, Hyderabad","III Additional Chief Judge, City Civil Court, Hyderabad"],"petitioners":["Sai Teja Reddy","Radhika Reddy"],"petitionerAdvocates":["Srinivas Chowdary","Kiran Kumar (Associate Counsel)"],"respondents":["Owner, Plot No. 45, Banjara Hills","GHMC Building Inspector (Proforma Respondent)"],"respondentAdvocates":["Not on record","Standing Counsel, GHMC"],"caseCategoryFacetPath":"Property Law/Boundary Disputes","hasOrders":true,"hasJudgments":false,"orderCount":2,"interimOrderCount":2,"judgmentCount":0,"hearingCount":5,"iaCount":2,"taggedMatters":[{"type":"Connected Matter","caseNumber":"IA/450/2025"},{"type":"Interlocutory Application","caseNumber":"IA/612/2026"}],"judgmentOrders":[]}'::jsonb,
  '{"cnr":"TSHC010011342025","nextDateOfHearing":"2026-09-05T05:30:00Z","lastDateOfHearing":"2026-03-10T05:30:00Z","dateCreated":"2025-09-14T09:00:00Z","dateModified":"2025-11-02T14:20:00Z"}'::jsonb,
  '{"files":[{"id":"d1","name":"CS-34253_Registered_Sale_Deed.pdf","size":"1.4 MB","uploadedAt":"2025-09-14"},{"id":"d2","name":"CS-34253_GHMC_Municipal_Survey_Report.pdf","size":"820 KB","uploadedAt":"2025-09-20"}]}'::jsonb,
  '{"enumFields":["caseType","caseStatus","courtCode","judicialSection","caseCategory","benchType","stateCode"],"enumLookup":{}}'::jsonb,
  NULL,
  '{"caseNumber":"OS/112/2025","cnr":"TSHC010011342025","courtName":"City Civil Court, Banjara Hills, Hyderabad","purpose":"EVIDENCE","contestedStatus":"CONTESTED","historyOfCaseHearings":[{"judge":"II Additional Chief Judge, City Civil Court, Hyderabad","businessOnDate":"2025-09-14","hearingDate":"2025-10-15","time":"11:00 AM","purposeOfListing":"First hearing — boundary survey report presented"},{"judge":"II Additional Chief Judge, City Civil Court, Hyderabad","businessOnDate":"2025-10-15","hearingDate":"2025-11-20","time":"10:30 AM","purposeOfListing":"Written statement filed by respondent; matter posted for framing of issues."},{"judge":"II Additional Chief Judge, City Civil Court, Hyderabad","businessOnDate":"2025-11-20","hearingDate":"2026-01-15","time":"11:15 AM","purposeOfListing":"Issues framed; matter posted for evidence."},{"judge":"II Additional Chief Judge, City Civil Court, Hyderabad","businessOnDate":"2026-01-15","hearingDate":"2026-03-10","time":"10:45 AM","purposeOfListing":"Plaintiff evidence recorded — PW-1 examined-in-chief."},{"judge":"II Additional Chief Judge, City Civil Court, Hyderabad","businessOnDate":"2026-03-10","hearingDate":"2026-09-05","time":"10:30 AM","purposeOfListing":"Next hearing — municipal survey cross-examination"}],"interimOrders":[{"orderDate":"2025-10-15","description":"Interim status-quo order restraining further construction pending survey review.","orderUrl":"order-cs34253-1.pdf"},{"orderDate":"2026-01-15","description":"Order permitting joint inspection of disputed boundary by court-appointed commissioner.","orderUrl":"order-cs34253-2.pdf"}],"filingDate":"2025-09-14","judges":["II Additional Chief Judge, City Civil Court, Hyderabad","III Additional Chief Judge, City Civil Court, Hyderabad"],"petitioners":["Sai Teja Reddy","Radhika Reddy"],"petitionerAdvocates":["Srinivas Chowdary","Kiran Kumar (Associate Counsel)"],"respondents":["Owner, Plot No. 45, Banjara Hills","GHMC Building Inspector (Proforma Respondent)"],"respondentAdvocates":["Not on record","Standing Counsel, GHMC"],"caseCategoryFacetPath":"Property Law/Boundary Disputes","hasOrders":true,"hasJudgments":false,"orderCount":2,"interimOrderCount":2,"judgmentCount":0,"hearingCount":5,"iaCount":2,"taggedMatters":[{"type":"Connected Matter","caseNumber":"IA/450/2025"},{"type":"Interlocutory Application","caseNumber":"IA/612/2026"}],"judgmentOrders":[]}'::jsonb
)
ON CONFLICT (cnr) DO UPDATE SET
  case_details = EXCLUDED.case_details,
  entity_info = EXCLUDED.entity_info,
  raw_data = EXCLUDED.raw_data;

INSERT INTO public.cases_imported (cnr, case_details, entity_info, files, descriptions, case_ai_analysis, raw_data)
VALUES (
  'TSHC010011872026',
  '{"caseNumber":"WP/1187/2026","cnr":"TSHC010011872026","caseType":"WP","caseTypeRaw":"Writ Petition","caseStatus":"PENDING","courtName":"High Court for the State of Telangana","purpose":"COUNTER FILED","contestedStatus":"CONTESTED","filingDate":"2026-05-12","historyOfCaseHearings":[{"judge":"Hon''ble Justice Bench-I","businessOnDate":"2026-05-12","hearingDate":"2026-05-14","time":"10:30 AM","purposeOfListing":"Counter filed by respondent; matter posted for arguments."},{"judge":"Hon''ble Justice Bench-I","businessOnDate":"2026-05-14","hearingDate":"2026-06-25","time":"10:30 AM","purposeOfListing":"Rejoinder filed by petitioner; matter posted for further arguments."},{"judge":"Hon''ble Justice Bench-I","businessOnDate":"2026-06-25","hearingDate":"2026-08-21","time":"10:30 AM","purposeOfListing":"Arguments"},{"judge":"Hon''ble Justice Bench-I","businessOnDate":"2026-08-21","hearingDate":"2026-09-30","time":"10:30 AM","purposeOfListing":"Arguments concluded; matter reserved for orders."}],"interimOrders":[{"orderDate":"2026-05-14","description":"Interim order staying recovery proceedings pending disposal of writ petition.","orderUrl":"order-cs51204-1.pdf"},{"orderDate":"2026-06-25","description":"Order directing respondent to file counter-affidavit within four weeks.","orderUrl":"order-cs51204-2.pdf"}],"judges":["Hon''ble Justice Bench-I","Hon''ble Justice Bench-II (Division Bench)"],"petitioners":["Mehta Textiles Pvt Ltd"],"petitionerAdvocates":["Swathi Reddy"],"respondents":["Regional Provident Fund Commissioner, Hyderabad","Union of India (Through Ministry of Labour)"],"respondentAdvocates":["Govt. Pleader","Assistant Solicitor General"],"caseCategoryFacetPath":"Labour Law/Provident Fund Disputes","hasOrders":true,"hasJudgments":false,"orderCount":2,"interimOrderCount":2,"judgmentCount":0,"hearingCount":4,"iaCount":2,"taggedMatters":[{"type":"Connected Matter","caseNumber":"WP/1188/2026"},{"type":"Batch Matter","caseNumber":"WPMP/2201/2026"}],"judgmentOrders":[]}'::jsonb,
  '{"cnr":"TSHC010011872026","nextDateOfHearing":"2026-09-30T05:00:00Z","lastDateOfHearing":"2026-08-21T05:00:00Z","dateCreated":"2026-07-20T09:00:00Z","dateModified":"2026-07-20T09:00:00Z"}'::jsonb,
  '{"files":[]}'::jsonb,
  '{"enumFields":["caseType","caseStatus","courtCode","judicialSection","caseCategory","benchType","stateCode"],"enumLookup":{"caseStatus":{"PENDING":"Pending"},"caseType":{"WP":"Writ Petition"}}}'::jsonb,
  NULL,
  '{"caseNumber":"WP/1187/2026","cnr":"TSHC010011872026","caseType":"WP","caseTypeRaw":"Writ Petition","caseStatus":"PENDING","courtName":"High Court for the State of Telangana","purpose":"COUNTER FILED","contestedStatus":"CONTESTED","filingDate":"2026-05-12","historyOfCaseHearings":[{"judge":"Hon''ble Justice Bench-I","businessOnDate":"2026-05-12","hearingDate":"2026-05-14","time":"10:30 AM","purposeOfListing":"Counter filed by respondent; matter posted for arguments."},{"judge":"Hon''ble Justice Bench-I","businessOnDate":"2026-05-14","hearingDate":"2026-06-25","time":"10:30 AM","purposeOfListing":"Rejoinder filed by petitioner; matter posted for further arguments."},{"judge":"Hon''ble Justice Bench-I","businessOnDate":"2026-06-25","hearingDate":"2026-08-21","time":"10:30 AM","purposeOfListing":"Arguments"},{"judge":"Hon''ble Justice Bench-I","businessOnDate":"2026-08-21","hearingDate":"2026-09-30","time":"10:30 AM","purposeOfListing":"Arguments concluded; matter reserved for orders."}],"interimOrders":[{"orderDate":"2026-05-14","description":"Interim order staying recovery proceedings pending disposal of writ petition.","orderUrl":"order-cs51204-1.pdf"},{"orderDate":"2026-06-25","description":"Order directing respondent to file counter-affidavit within four weeks.","orderUrl":"order-cs51204-2.pdf"}],"judges":["Hon''ble Justice Bench-I","Hon''ble Justice Bench-II (Division Bench)"],"petitioners":["Mehta Textiles Pvt Ltd"],"petitionerAdvocates":["Swathi Reddy"],"respondents":["Regional Provident Fund Commissioner, Hyderabad","Union of India (Through Ministry of Labour)"],"respondentAdvocates":["Govt. Pleader","Assistant Solicitor General"],"caseCategoryFacetPath":"Labour Law/Provident Fund Disputes","hasOrders":true,"hasJudgments":false,"orderCount":2,"interimOrderCount":2,"judgmentCount":0,"hearingCount":4,"iaCount":2,"taggedMatters":[{"type":"Connected Matter","caseNumber":"WP/1188/2026"},{"type":"Batch Matter","caseNumber":"WPMP/2201/2026"}],"judgmentOrders":[]}'::jsonb
)
ON CONFLICT (cnr) DO UPDATE SET
  case_details = EXCLUDED.case_details,
  entity_info = EXCLUDED.entity_info,
  raw_data = EXCLUDED.raw_data;

INSERT INTO public.cases_imported (cnr, case_details, entity_info, files, descriptions, case_ai_analysis, raw_data)
VALUES (
  'APVK020004422026',
  '{"caseNumber":"MVOP/442/2026","cnr":"APVK020004422026","caseType":"MVOP","caseTypeRaw":"Motor Vehicle Original Petition","caseStatus":"PENDING","courtName":"Motor Accidents Claims Tribunal, Visakhapatnam","purpose":"EVIDENCE","contestedStatus":"CONTESTED","filingDate":"2026-03-08","historyOfCaseHearings":[{"judge":"Chairman, MACT Visakhapatnam","businessOnDate":"2026-03-08","hearingDate":"2026-04-09","time":"11:00 AM","purposeOfListing":"Evidence of claimant recorded; matter posted for cross-examination."},{"judge":"Chairman, MACT Visakhapatnam","businessOnDate":"2026-04-09","hearingDate":"2026-06-18","time":"11:00 AM","purposeOfListing":"Cross-examination of claimant partly recorded; adjourned at request of respondent''s counsel."},{"judge":"Chairman, MACT Visakhapatnam","businessOnDate":"2026-06-18","hearingDate":"2026-08-27","time":"11:00 AM","purposeOfListing":"Cross-examination concluded; respondent evidence to begin."},{"judge":"Chairman, MACT Visakhapatnam","businessOnDate":"2026-08-27","hearingDate":"2026-10-05","time":"11:00 AM","purposeOfListing":"Respondent evidence commenced — RW-1 examined-in-chief."}],"interimOrders":[{"orderDate":"2026-04-09","description":"Interim order directing insurer to deposit 50% of the assessed compensation amount.","orderUrl":"order-cs51677-1.pdf"},{"orderDate":"2026-06-18","description":"Order permitting additional medical evidence to be placed on record.","orderUrl":"order-cs51677-2.pdf"}],"judges":["Chairman, MACT Visakhapatnam","Member, MACT Visakhapatnam"],"petitioners":["K. Padma Rao"],"petitionerAdvocates":["Swathi Reddy"],"respondents":["Andhra Pradesh State Road Transport Corporation","United India Insurance Co. Ltd. (Insurer)"],"respondentAdvocates":["APSRTC Legal Cell","Panel Counsel, United India Insurance"],"caseCategoryFacetPath":"Civil Law/Motor Accident Claims","hasOrders":true,"hasJudgments":false,"orderCount":2,"interimOrderCount":2,"judgmentCount":0,"hearingCount":4,"iaCount":2,"taggedMatters":[{"type":"Connected Matter","caseNumber":"MVOP/443/2026"},{"type":"Insurance Claim Reference","caseNumber":"CLM/7729/2026"}],"judgmentOrders":[]}'::jsonb,
  '{"cnr":"APVK020004422026","nextDateOfHearing":"2026-10-05T05:30:00Z","lastDateOfHearing":"2026-08-27T05:30:00Z","dateCreated":"2026-06-02T09:00:00Z","dateModified":"2026-06-02T09:00:00Z"}'::jsonb,
  '{"files":[]}'::jsonb,
  '{"enumFields":["caseType","caseStatus","courtCode","judicialSection","caseCategory","benchType","stateCode"],"enumLookup":{"caseStatus":{"PENDING":"Pending"}}}'::jsonb,
  NULL,
  '{"caseNumber":"MVOP/442/2026","cnr":"APVK020004422026","caseType":"MVOP","caseTypeRaw":"Motor Vehicle Original Petition","caseStatus":"PENDING","courtName":"Motor Accidents Claims Tribunal, Visakhapatnam","purpose":"EVIDENCE","contestedStatus":"CONTESTED","filingDate":"2026-03-08","historyOfCaseHearings":[{"judge":"Chairman, MACT Visakhapatnam","businessOnDate":"2026-03-08","hearingDate":"2026-04-09","time":"11:00 AM","purposeOfListing":"Evidence of claimant recorded; matter posted for cross-examination."},{"judge":"Chairman, MACT Visakhapatnam","businessOnDate":"2026-04-09","hearingDate":"2026-06-18","time":"11:00 AM","purposeOfListing":"Cross-examination of claimant partly recorded; adjourned at request of respondent''s counsel."},{"judge":"Chairman, MACT Visakhapatnam","businessOnDate":"2026-06-18","hearingDate":"2026-08-27","time":"11:00 AM","purposeOfListing":"Cross-examination concluded; respondent evidence to begin."},{"judge":"Chairman, MACT Visakhapatnam","businessOnDate":"2026-08-27","hearingDate":"2026-10-05","time":"11:00 AM","purposeOfListing":"Respondent evidence commenced — RW-1 examined-in-chief."}],"interimOrders":[{"orderDate":"2026-04-09","description":"Interim order directing insurer to deposit 50% of the assessed compensation amount.","orderUrl":"order-cs51677-1.pdf"},{"orderDate":"2026-06-18","description":"Order permitting additional medical evidence to be placed on record.","orderUrl":"order-cs51677-2.pdf"}],"judges":["Chairman, MACT Visakhapatnam","Member, MACT Visakhapatnam"],"petitioners":["K. Padma Rao"],"petitionerAdvocates":["Swathi Reddy"],"respondents":["Andhra Pradesh State Road Transport Corporation","United India Insurance Co. Ltd. (Insurer)"],"respondentAdvocates":["APSRTC Legal Cell","Panel Counsel, United India Insurance"],"caseCategoryFacetPath":"Civil Law/Motor Accident Claims","hasOrders":true,"hasJudgments":false,"orderCount":2,"interimOrderCount":2,"judgmentCount":0,"hearingCount":4,"iaCount":2,"taggedMatters":[{"type":"Connected Matter","caseNumber":"MVOP/443/2026"},{"type":"Insurance Claim Reference","caseNumber":"CLM/7729/2026"}],"judgmentOrders":[]}'::jsonb
)
ON CONFLICT (cnr) DO UPDATE SET
  case_details = EXCLUDED.case_details,
  entity_info = EXCLUDED.entity_info,
  raw_data = EXCLUDED.raw_data;

-- 4. SEED USER CASES (cases_user)

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-91101',
  'u_003',
  NULL,
  'new',
  NULL,
  'Urgent Bail Application — Detention at Cyberabad Police Station',
  'Emergency bail filing required within 24 hours due to procedural non-compliance during midnight arrest at Gachibowli.',
  '[]'::jsonb,
  'Criminal',
  'Criminal',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  true,
  '[{"id":"t_em1","status":"Submitted","at":"2026-09-04","time":"11:20 AM","note":"Emergency case created by citizen"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-91102',
  'u_002',
  NULL,
  'new',
  NULL,
  'Ex-parte Injunction — Imminent Illegal Property Demolition',
  'Urgent stay order required from High Court before municipal demolition crew executes notice issued without mandatory 15-day cure window.',
  '[]'::jsonb,
  'Property',
  'Property',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  true,
  '[{"id":"t_em2","status":"Submitted","at":"2026-08-13","time":"2:05 PM","note":"Emergency case created by citizen"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-91103',
  'u_004',
  NULL,
  'new',
  NULL,
  'Rent dispute — landlord withholding security deposit',
  'Citizen reached out over WhatsApp about a landlord refusing to refund a ₹1,20,000 security deposit after the tenant vacated a 2BHK flat in Seethammadhara, Visakhapatnam, with all dues cleared and the flat handed over in good condition.',
  '[]'::jsonb,
  'Property',
  'Property',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t_wa1","status":"Submitted","at":"2026-04-15","time":"6:40 PM","note":"Case created from WhatsApp conversation"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-91104',
  'u_005',
  NULL,
  'new',
  NULL,
  'Consumer complaint — e-commerce refund not processed',
  'Citizen messaged the platform''s WhatsApp helpline about a refund pending for over 45 days from an online retailer.',
  '[]'::jsonb,
  'Consumer',
  'Consumer',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t_wa2","status":"Submitted","at":"2026-08-29","time":"11:15 AM","note":"Case created from WhatsApp conversation"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-34253',
  'u_001',
  'l_002',
  'pending',
  'TSHC010011342025',
  'Property boundary dispute — Banjara Hills',
  'STATEMENT OF FACTS & LEGAL BREIF:

1. The applicant Sai Teja Reddy is the absolute registered owner of Plot No. 44, Road No. 12, Banjara Hills, Hyderabad, acquired via registered Sale Deed dated 14th March 2018 (Document No. 4012/2018).

2. In August 2025, the adjacent plot owner (Plot No. 45) commenced unauthorized construction of a reinforced concrete boundary wall. A formal municipal survey conducted by the Greater Hyderabad Municipal Corporation (GHMC) on 20th September 2025 verified that the construction encroaches approximately 2.4 feet into Plot No. 44 over a length of 48 feet, violating approved layout dimensions.

3. Statutory legal notices served under Section 80 CPC and Section 452 of the Telangana Municipalities Act, 2019 were met with non-compliance. Relief is sought for permanent injunction restraining further construction, demolition of the encroaching structure, and restoration of registered boundaries.',
  '[]'::jsonb,
  'Property',
  'Property',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2025-09-14","time":"10:05 AM"},{"id":"t2","status":"Assigned","at":"2025-09-16","time":"9:40 AM","note":"Assigned to Srinivas Chowdary"},{"id":"t3","status":"Under Review","at":"2025-09-22","time":"4:15 PM"},{"id":"t4","status":"In Progress","at":"2025-10-05","time":"11:50 AM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-61847',
  'u_002',
  'l_018',
  'new',
  NULL,
  'Consumer complaint — defective appliance & breach of warranty',
  'STATEMENT OF COMPLAINT & INJURY DETAILS:

1. The complainant Lakshmi Prasanna purchased a premium smart refrigerator (Model: UltraCool Pro 550L) from Authorized Distributor ElectroWorld, Dwaraka Nagar, Visakhapatnam on 12th July 2025 for ₹74,999 under invoice number EW-2025-8891.

2. Within 45 days of installation, the compressor unit suffered total failure resulting in loss of perishable household goods. Despite three official service requests (SR-9012, SR-9411, SR-9902), the technical team failed to rectify the defect. On 2nd November 2025, a second major cooling failure rendered the appliance unusable.

3. The manufacturer and distributor have rejected repeated requests for replacement or full refund under statutory warranty clauses. A formal complaint has been prepared for filing before the Visakhapatnam District Consumer Disputes Redressal Commission seeking full refund, compensation for spoiled goods (₹18,500), and litigation costs under Consumer Protection Act, 2019.',
  '[]'::jsonb,
  'Consumer',
  'Consumer',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2025-11-10","time":"3:30 PM"},{"id":"t2","status":"Assigned","at":"2025-11-12","time":"10:10 AM","note":"Assigned to Suresh Kumar"},{"id":"t3","status":"Under Review","at":"2025-11-18","time":"2:05 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-78902',
  'u_003',
  'l_019',
  'new',
  NULL,
  'Cyber fraud — unauthorized UPI phishing transaction',
  'INCIDENT REPORT & EVIDENTIARY BRIEF:

1. On 22nd October 2025 at 14:15 IST, the victim Divya Sri Chowdary received an SMS notification impersonating Nationalized Bank Customer Portal requesting urgent KYC update via link (http://secure-kyc-verify-bank.com).

2. Upon accessing the link, a malicious overlay captured authentication tokens, resulting in unauthorized debit of ₹84,000 across three immediate IMPS transactions into account number 9901-XXXX-4412 located in a foreign jurisdiction.

3. Immediate cyber crime helpline reporting (Cyber Crime Incident No. 2025-HYD-88910) was logged with the Cyberabad Cyber Crime Police Station within the 2-hour ''golden period''. Written representation served upon the bank under RBI Guidelines on Customer Liability in Unauthorized Electronic Banking Transactions (2017) seeking zero liability reversal.',
  '[]'::jsonb,
  'Cyber',
  'Cyber',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2025-10-22","time":"3:00 PM"},{"id":"t2","status":"Assigned","at":"2025-10-24","time":"10:00 AM","note":"Assigned to Aditya Verma"},{"id":"t3","status":"Under Review","at":"2025-10-30","time":"1:20 PM"},{"id":"t4","status":"Awaiting Documents","at":"2025-11-14","time":"9:15 AM","note":"FIR copy requested"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-45119',
  'u_005',
  'l_003',
  'new',
  NULL,
  'Family matter — mutual consent divorce petition',
  'PETITION FOR DISSOLUTION OF MARRIAGE BY MUTUAL CONSENT UNDER SECTION 13-B OF THE HINDU MARRIAGE ACT, 1955:

1. The Petitioner No. 1 Padmavathi Rao and Petitioner No. 2 were lawfully married on 18th May 2021 as per traditional Hindu rites and ceremonies at Somajiguda, Hyderabad. The marriage was duly registered with the Registrar of Marriages under Registration No. HYD-2021-8841.

2. Due to fundamental differences in temperament, lifestyle preferences, and irreconcilable personal disputes, cohabitation between the parties ceased on 10th January 2024. The parties have lived continuously separate and apart for a period exceeding one year preceding the date of this petition, without any cohabitation or marital relations.

3. All efforts for reconciliation mediated by family elders and community counselors have failed, and both parties have mutually and independently concluded that the marriage has broken down irretrievably.

4. A comprehensive Memorandum of Understanding & Settlement Agreement dated 1st June 2025 has been duly executed between the parties settling all ancillary matters:
   a) Permanent Alimony & Maintenance: Petitioner No. 2 has transferred a one-time full & final settlement sum of ₹25,00,000 to Petitioner No. 1''s bank account, and Petitioner No. 1 has relinquished all future claims for maintenance.
   b) Moveable Assets & Gold Ornaments: All gold jewelry, streedhan items, personal effects, and vehicles have been mutually divided and acknowledged in writing.
   c) Joint Financial Accounts: Joint bank accounts and credit liabilities have been severed without any outstanding claims against each other.

5. It is humbly prayed that this Hon''ble Family Court at Nampally, Hyderabad be pleased to:
   i) Pass a decree of divorce dissolving the marriage between Petitioner No. 1 and Petitioner No. 2 under Section 13-B of the Hindu Marriage Act, 1955.
   ii) Waive the 6-month statutory waiting period (cooling-off period) for Second Motion in accordance with Supreme Court directions in Amardeep Singh v. Harveen Kaur (2017 8 SCC 746).',
  '[]'::jsonb,
  'Family',
  'Family',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2025-06-11","time":"10:00 AM"},{"id":"t2","status":"Assigned","at":"2025-06-13","time":"9:30 AM","note":"Assigned to Sailaja Naidu"},{"id":"t3","status":"In Progress","at":"2025-07-01","time":"11:00 AM"},{"id":"t4","status":"Resolved","at":"2025-10-01","time":"3:45 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-93021',
  'u_004',
  'l_006',
  'new',
  NULL,
  'Wrongful termination & non-payment of severance',
  'WRONGFUL TERMINATION CLAIM STATEMENT:

1. The claimant Venkata Ramana Naidu served as Senior Systems Engineer at TechCorp Solutions Pvt. Ltd., Rushikonda IT Park, Visakhapatnam from 1st August 2022 to 31st October 2025 under a permanent employment agreement.

2. On 31st October 2025, HR issued an immediate termination email citing ''organizational restructuring'' without providing the mandatory 90-day contractual notice period, performance improvement plan (PIP), or statutory severance pay under Industrial Disputes Act.

3. The employer has withheld accrued salary for October 2025 (₹1,45,000), encashment of 24 days earned leave, and gratuity benefits. Legal representation challenges termination as arbitrary, demanding reinstatement or compensation of ₹12,80,000.',
  '[]'::jsonb,
  'Labour',
  'Labour',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2025-11-01","time":"9:50 AM"},{"id":"t2","status":"Assigned","at":"2025-11-03","time":"10:30 AM","note":"Assigned to Krishna Murthy"},{"id":"t3","status":"Under Review","at":"2025-11-08","time":"2:40 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-51204',
  'u_001',
  'l_001',
  'pending',
  'TSHC010011872026',
  'Mehta Textiles Pvt Ltd vs Regional Provident Fund Commissioner, Hyderabad',
  'Writ petition challenging a provident fund recovery order issued against Mehta Textiles Pvt Ltd, pending before the High Court for the State of Telangana. Imported from eCourts.',
  '[]'::jsonb,
  'Labour',
  'Labour',
  '[]'::jsonb,
  'cnrgenerated',
  'cnrgenerated',
  NULL,
  false,
  '[{"id":"t1","status":"Pending","at":"2026-07-20","time":"4:00 PM","note":"Imported from eCourts (TSHC010011872026)"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-51677',
  'u_001',
  'l_001',
  'pending',
  'APVK020004422026',
  'K. Padma Rao vs Andhra Pradesh State Road Transport Corporation',
  'Motor accident compensation claim filed by K. Padma Rao against APSRTC, pending before the Motor Accidents Claims Tribunal, Visakhapatnam. Imported from eCourts.',
  '[]'::jsonb,
  'Civil',
  'Civil',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"In Progress","at":"2026-06-02","time":"11:10 AM","note":"Imported from eCourts (APVK020004422026)"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-22418',
  'u_006',
  'l_001',
  'new',
  NULL,
  'Anticipatory bail — alleged criminal breach of trust (BNS §316)',
  'The applicant, a former accounts manager, apprehends arrest in a complaint alleging misappropriation of ₹6.2 lakh of company funds. He denies the allegation, has cooperated with two rounds of police questioning, and seeks anticipatory bail with an offer to deposit the disputed sum before the court.',
  '[]'::jsonb,
  'Criminal',
  'Criminal',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-07-18","time":"10:20 AM"},{"id":"t2","status":"Assigned","at":"2026-07-20","time":"9:30 AM","note":"Assigned to Swathi Reddy"},{"id":"t3","status":"Under Review","at":"2026-07-24","time":"3:10 PM"},{"id":"t4","status":"In Progress","at":"2026-07-25","time":"12:15 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-22571',
  'u_001',
  'l_001',
  'new',
  NULL,
  'Cheque dishonour — statutory notice under §138 NI Act',
  'The complainant received two post-dated cheques totalling ₹3,75,000 towards repayment of a friendly loan; both were returned ''funds insufficient''. A statutory demand notice has been issued and the 15-day compliance window has lapsed, clearing the way for a §138 complaint before the Magistrate.',
  '[]'::jsonb,
  'Criminal',
  'Criminal',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-08-22","time":"5:05 PM"},{"id":"t2","status":"Assigned","at":"2026-08-25","time":"10:00 AM","note":"Assigned to Swathi Reddy"},{"id":"t3","status":"Under Review","at":"2026-09-01","time":"1:40 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-30188',
  'u_005',
  'l_002',
  'new',
  NULL,
  'Partition suit — ancestral property, three co-parceners',
  'The plaintiff seeks partition and separate possession of a one-third share in an ancestral house at Malkajgiri. Two siblings are in occupation and have declined a family settlement; a preliminary decree defining shares is sought, followed by division by metes and bounds through a court commissioner.',
  '[]'::jsonb,
  'Property',
  'Property',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-05-09","time":"11:00 AM"},{"id":"t2","status":"Assigned","at":"2026-05-12","time":"9:45 AM","note":"Assigned to Srinivas Chowdary"},{"id":"t3","status":"In Progress","at":"2026-06-02","time":"12:00 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-40233',
  'u_002',
  'l_003',
  'new',
  NULL,
  'Guardianship & custody — minor child, interim visitation',
  'Following a marital separation, the petitioner seeks permanent custody of a 6-year-old child, with the respondent given structured weekend visitation. An interim arrangement is requested pending a welfare report from the court-appointed counsellor.',
  '[]'::jsonb,
  'Family',
  'Family',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-06-25","time":"2:30 PM"},{"id":"t2","status":"Assigned","at":"2026-06-28","time":"10:15 AM","note":"Assigned to Sailaja Naidu"},{"id":"t3","status":"In Progress","at":"2026-07-10","time":"11:30 AM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-50291',
  'u_006',
  'l_004',
  'new',
  NULL,
  'Contractual dispute — termination of a software services agreement',
  'The company disputes an early termination invoked by its client, who withheld ₹14.8 lakh in undisputed dues citing ''deliverable delays''. The matter turns on the notice-and-cure clause; the client has agreed to arbitration under the contract''s dispute-resolution clause.',
  '[]'::jsonb,
  'Corporate',
  'Corporate',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-06-11","time":"10:40 AM"},{"id":"t2","status":"Assigned","at":"2026-06-14","time":"9:30 AM","note":"Assigned to Venkatesh Rao"},{"id":"t3","status":"In Progress","at":"2026-07-02","time":"11:15 AM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-50347',
  'u_008',
  'l_004',
  'new',
  NULL,
  'Company law — oppression & mismanagement petition (NCLT)',
  'A minority shareholder (18%) alleges a rights issue was structured to dilute their holding and that related-party transactions were approved without disclosure. Relief sought includes setting aside the allotment and appointment of an independent director.',
  '[]'::jsonb,
  'Corporate',
  'Corporate',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-08-04","time":"4:20 PM"},{"id":"t2","status":"Assigned","at":"2026-08-07","time":"10:00 AM","note":"Assigned to Venkatesh Rao"},{"id":"t3","status":"Under Review","at":"2026-08-29","time":"12:30 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-60155',
  'u_007',
  'l_005',
  'new',
  NULL,
  'Online defamation & impersonation — fake social media profile',
  'An impersonating profile posted fabricated allegations about the complainant to her professional network. A takedown request under the IT Rules has been filed with the platform and a police complaint lodged with the cyber cell; a John Doe injunction is sought against further posts.',
  '[]'::jsonb,
  'Cyber',
  'Cyber',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-07-02","time":"9:15 AM"},{"id":"t2","status":"Assigned","at":"2026-07-05","time":"10:30 AM","note":"Assigned to Haritha Sarma"},{"id":"t3","status":"In Progress","at":"2026-07-20","time":"2:45 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-60238',
  'u_004',
  'l_005',
  'new',
  NULL,
  'UPI fraud recovery — unauthorised collect requests',
  'The complainant lost ₹47,000 across four ''collect'' requests approved under a spoofed merchant name. The incident was reported on the national cybercrime portal within the golden hour; a representation to the bank seeks reversal under the RBI limited-liability framework.',
  '[]'::jsonb,
  'Cyber',
  'Cyber',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-03-28","time":"8:05 PM"},{"id":"t2","status":"Assigned","at":"2026-03-30","time":"10:00 AM","note":"Assigned to Haritha Sarma"},{"id":"t3","status":"Awaiting Documents","at":"2026-04-19","time":"11:20 AM","note":"Bank dispute acknowledgement requested"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-70119',
  'u_002',
  'l_006',
  'new',
  NULL,
  'Provident fund & gratuity — non-remittance on separation',
  'On resignation after 7 years, the claimant''s PF transfer was blocked and gratuity of ₹2,10,000 remained unpaid past the 30-day statutory limit. A claim before the Controlling Authority under the Payment of Gratuity Act is prepared, with interest sought for the delay.',
  '[]'::jsonb,
  'Labour',
  'Labour',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-08-01","time":"10:10 AM"},{"id":"t2","status":"Assigned","at":"2026-08-04","time":"9:45 AM","note":"Assigned to Krishna Murthy"},{"id":"t3","status":"Under Review","at":"2026-08-26","time":"3:00 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-80166',
  'u_006',
  'l_007',
  'new',
  NULL,
  'Money recovery suit — unpaid contractor invoices',
  'A small interior-fit-out firm seeks recovery of ₹9,60,000 for completed work at a commercial site, supported by a signed completion certificate. The defendant alleges unspecified defects; a summary suit under Order XXXVII CPC has been filed.',
  '[]'::jsonb,
  'Civil',
  'Civil',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-05-15","time":"12:20 PM"},{"id":"t2","status":"Assigned","at":"2026-05-18","time":"10:00 AM","note":"Assigned to Rohan Iyer"},{"id":"t3","status":"In Progress","at":"2026-06-20","time":"12:45 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-90142',
  'u_007',
  'l_008',
  'new',
  NULL,
  'Consumer complaint — delayed apartment possession & penalty',
  'The complainant booked a flat with committed possession by December 2024; handover is now 20 months overdue. A complaint before the State Consumer Commission seeks delay penalty at the agreement rate, refund of maintenance collected in advance, and compensation.',
  '[]'::jsonb,
  'Consumer',
  'Consumer',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-04-26","time":"9:40 AM"},{"id":"t2","status":"Assigned","at":"2026-04-29","time":"10:15 AM","note":"Assigned to Priya Subramaniam"},{"id":"t3","status":"In Progress","at":"2026-05-30","time":"12:00 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-80233',
  'u_008',
  'l_009',
  'new',
  NULL,
  'Income-tax appeal — addition under §69A (unexplained money)',
  'An addition of ₹11.4 lakh was made treating agricultural-sale proceeds as unexplained. The assessee holds sale receipts and land records; an appeal before the Commissioner (Appeals) is filed with a stay application for the disputed demand.',
  '[]'::jsonb,
  'Tax',
  'Tax',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-06-20","time":"11:05 AM"},{"id":"t2","status":"Assigned","at":"2026-06-23","time":"9:50 AM","note":"Assigned to Aditya Deshmukh"},{"id":"t3","status":"Under Review","at":"2026-08-12","time":"3:20 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-80251',
  'u_008',
  'l_009',
  'new',
  NULL,
  'Injunction suit — trespass onto agricultural land',
  'The plaintiff seeks a permanent injunction restraining neighbours from using a disputed cart-track across his field and from grazing cattle on the standing crop. An interim injunction is sought pending a survey by the Taluka Inspector of Land Records.',
  '[]'::jsonb,
  'Civil',
  'Civil',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-05-02","time":"10:30 AM"},{"id":"t2","status":"Assigned","at":"2026-05-05","time":"9:40 AM","note":"Assigned to Aditya Deshmukh"},{"id":"t3","status":"In Progress","at":"2026-06-10","time":"12:10 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-50412',
  'u_006',
  'l_011',
  'new',
  NULL,
  'Founder dispute — share vesting & IP assignment',
  'A departing co-founder disputes the acceleration of unvested shares and has not executed the IP assignment for code written during the vesting period. The company seeks specific performance of the founders'' agreement and an interim bar on any third-party transfer of the disputed shares.',
  '[]'::jsonb,
  'Corporate',
  'Corporate',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-08-08","time":"3:15 PM"},{"id":"t2","status":"Assigned","at":"2026-08-11","time":"10:20 AM","note":"Assigned to Nikhil Chandra"},{"id":"t3","status":"Under Review","at":"2026-08-31","time":"1:05 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-11207',
  'u_001',
  'l_012',
  'new',
  NULL,
  'NGT petition — construction debris dumping in a lake buffer',
  'Residents allege sustained dumping of construction debris within the buffer zone of a notified lake, narrowing the water spread. A petition before the NGT seeks removal of the debris, a restoration plan, and environmental compensation from the responsible builder.',
  '[]'::jsonb,
  'Environmental',
  'Environmental',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-06-05","time":"11:45 AM"},{"id":"t2","status":"Assigned","at":"2026-06-09","time":"10:00 AM","note":"Assigned to Ananya Deshpande"},{"id":"t3","status":"In Progress","at":"2026-07-01","time":"12:30 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-22690',
  'u_004',
  'l_013',
  'new',
  NULL,
  'Regular bail — pending trial, offences under BNS §318/§336',
  'The accused has been in judicial custody for 3 months in a cheating-and-forgery case; the chargesheet is filed and the trial is unlikely to conclude soon. Regular bail is sought on grounds of parity with a co-accused already released and completed investigation.',
  '[]'::jsonb,
  'Criminal',
  'Criminal',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-04-02","time":"10:05 AM"},{"id":"t2","status":"Assigned","at":"2026-04-04","time":"9:30 AM","note":"Assigned to Rajesh Varma"},{"id":"t3","status":"In Progress","at":"2026-04-28","time":"12:00 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-80299',
  'u_002',
  'l_014',
  'new',
  NULL,
  'Specific performance — agreement of sale of a residential plot',
  'The plaintiff paid 80% of the sale consideration and took possession; the vendor now refuses to execute the sale deed citing a price rise. A suit for specific performance with an alternative claim for refund with interest is filed, along with a lis pendens registration.',
  '[]'::jsonb,
  'Civil',
  'Civil',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-03-18","time":"10:50 AM"},{"id":"t2","status":"Assigned","at":"2026-03-21","time":"9:30 AM","note":"Assigned to N. V. Ramana Rao"},{"id":"t3","status":"In Progress","at":"2026-04-22","time":"12:20 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-30244',
  'u_004',
  'l_016',
  'new',
  NULL,
  'RERA complaint — deviation from sanctioned plan',
  'Allottees allege the promoter altered the common areas and reduced the promised amenities from the sanctioned plan. A complaint before the AP RERA seeks rectification, a proportionate price reduction, and interest for the possession delay.',
  '[]'::jsonb,
  'Property',
  'Property',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-02-24","time":"11:10 AM"},{"id":"t2","status":"Assigned","at":"2026-02-27","time":"9:45 AM","note":"Assigned to K. Pattabhi Ramaiah"},{"id":"t3","status":"Under Review","at":"2026-04-10","time":"2:30 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-90188',
  'u_003',
  'l_018',
  'new',
  NULL,
  'Consumer complaint — repudiated health insurance claim',
  'A cashless hospitalisation claim of ₹3,40,000 was repudiated citing ''pre-existing disease non-disclosure'', though the condition was diagnosed after the policy start date. A complaint before the District Commission seeks payment of the claim with compensation for deficiency in service.',
  '[]'::jsonb,
  'Consumer',
  'Consumer',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-05-20","time":"10:15 AM"},{"id":"t2","status":"Assigned","at":"2026-05-23","time":"9:40 AM","note":"Assigned to Suresh Kumar"},{"id":"t3","status":"In Progress","at":"2026-06-24","time":"12:05 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-60299',
  'u_006',
  'l_019',
  'new',
  NULL,
  'Data breach response — leaked customer database',
  'A small e-commerce business discovered its customer database (≈12,000 records) offered for sale on a forum. Advice covers breach notification obligations, a complaint to the cybercrime unit, and a John Doe injunction against further circulation.',
  '[]'::jsonb,
  'Cyber',
  'Cyber',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-07-28","time":"9:30 AM"},{"id":"t2","status":"Assigned","at":"2026-07-31","time":"10:00 AM","note":"Assigned to Aditya Verma"},{"id":"t3","status":"Under Review","at":"2026-08-23","time":"1:15 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-80322',
  'u_002',
  'l_022',
  'new',
  NULL,
  'GST dispute — input tax credit reversal demand',
  'A show-cause notice proposes reversal of ₹7.9 lakh of input tax credit alleging supplier non-compliance. The taxpayer holds valid invoices and proof of payment; a reply to the SCN and, if adverse, an appeal before the Appellate Authority are prepared.',
  '[]'::jsonb,
  'Tax',
  'Tax',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-05-06","time":"10:40 AM"},{"id":"t2","status":"Assigned","at":"2026-05-09","time":"9:30 AM","note":"Assigned to Balaji Rao"},{"id":"t3","status":"In Progress","at":"2026-06-18","time":"12:00 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-22733',
  'u_003',
  'l_001',
  'new',
  NULL,
  'Quashing petition — FIR alleged to be a counterblast complaint',
  'The petitioner seeks quashing of an FIR registered days after he lodged a police complaint against the same party, contending the FIR is retaliatory and discloses no cognizable offence. The matter is before the High Court under §528 BNSS.',
  '[]'::jsonb,
  'Criminal',
  'Criminal',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-06-30","time":"11:30 AM"},{"id":"t2","status":"Assigned","at":"2026-07-02","time":"9:40 AM","note":"Assigned to Swathi Reddy"},{"id":"t3","status":"In Progress","at":"2026-07-18","time":"12:20 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-22744',
  'u_004',
  'l_013',
  'new',
  NULL,
  'White-collar defence — economic offences wing summons',
  'A director of a chit-fund company has been summoned by the Economic Offences Wing over investor complaints. The engagement covers representation during questioning, document production, and pre-emptive anticipatory bail preparation.',
  '[]'::jsonb,
  'Criminal',
  'Criminal',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-04-20","time":"10:00 AM"},{"id":"t2","status":"Assigned","at":"2026-04-22","time":"9:30 AM","note":"Assigned to Rajesh Varma"},{"id":"t3","status":"Under Review","at":"2026-05-14","time":"3:00 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-80355',
  'u_008',
  'l_014',
  'new',
  NULL,
  'Commercial dispute — recovery under a supply contract',
  'A wholesale supplier seeks ₹18.5 lakh for goods delivered against purchase orders; the buyer disputes quality on a part of the consignment. The matter is a commercial suit with a pending application for attachment before judgment.',
  '[]'::jsonb,
  'Civil',
  'Civil',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-04-08","time":"10:30 AM"},{"id":"t2","status":"Assigned","at":"2026-04-11","time":"9:45 AM","note":"Assigned to N. V. Ramana Rao"},{"id":"t3","status":"In Progress","at":"2026-05-16","time":"12:15 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-30291',
  'u_002',
  'l_016',
  'new',
  NULL,
  'Injunction — obstruction of a registered right of way',
  'The plaintiff''s registered pathway to a rear plot has been walled off by the front-plot owner. A suit for mandatory injunction to remove the obstruction and a prohibitory injunction against future interference is filed.',
  '[]'::jsonb,
  'Property',
  'Property',
  '[]'::jsonb,
  'filinginprogress',
  'filinginprogress',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-03-30","time":"10:20 AM"},{"id":"t2","status":"Assigned","at":"2026-04-02","time":"9:30 AM","note":"Assigned to K. Pattabhi Ramaiah"},{"id":"t3","status":"In Progress","at":"2026-04-25","time":"12:10 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-80366',
  'u_001',
  'l_022',
  'new',
  NULL,
  'Income-tax — reassessment notice under §148 challenged',
  'A reassessment notice was issued beyond the ordinary limitation period without recording adequate ''reason to believe''. Objections have been filed; if rejected, a writ petition before the High Court is contemplated.',
  '[]'::jsonb,
  'Tax',
  'Tax',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-07-12","time":"11:00 AM"},{"id":"t2","status":"Assigned","at":"2026-07-15","time":"9:40 AM","note":"Assigned to Balaji Rao"},{"id":"t3","status":"Under Review","at":"2026-08-27","time":"2:20 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-45330',
  'u_007',
  'l_008',
  'new',
  NULL,
  'Consumer complaint — defective two-wheeler, resolved by settlement',
  'A recurring electrical fault in a new scooter was not resolved across five service visits. Before evidence, the manufacturer agreed to a full buy-back at invoice value plus ₹15,000 towards costs; the complaint was disposed of in terms of the settlement.',
  '[]'::jsonb,
  'Consumer',
  'Consumer',
  '[]'::jsonb,
  'submitted',
  'submitted',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2025-12-10","time":"9:50 AM"},{"id":"t2","status":"Assigned","at":"2025-12-13","time":"10:00 AM","note":"Assigned to Priya Subramaniam"},{"id":"t3","status":"In Progress","at":"2026-01-20","time":"12:00 PM"},{"id":"t4","status":"Resolved","at":"2026-05-28","time":"4:10 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, title, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  'CS-34410',
  'u_001',
  'l_002',
  'closed',
  NULL,
  'Title verification & clean sale — completed engagement',
  'A pre-purchase due-diligence engagement for a resale apartment: 30-year title search, encumbrance certificate review, approval and tax-receipt checks, and a legal opinion. The transaction closed with a registered sale deed on the strength of the clear opinion.',
  '[]'::jsonb,
  'Property',
  'Property',
  '[]'::jsonb,
  'closed',
  'cnrgenerated',
  NULL,
  false,
  '[{"id":"t1","status":"Submitted","at":"2026-01-15","time":"10:00 AM"},{"id":"t2","status":"Assigned","at":"2026-01-16","time":"11:20 AM","note":"Assigned to Srinivas Chowdary"},{"id":"t3","status":"In Progress","at":"2026-01-22","time":"9:30 AM"},{"id":"t4","status":"Resolved","at":"2026-02-24","time":"3:00 PM"},{"id":"t5","status":"Closed","at":"2026-02-28","time":"5:00 PM"}]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;

-- 5. SEED SUBSCRIPTIONS

INSERT INTO public.subscriptions (id, citizen_id, plan_id, plan_label, amount, started_at, status, case_id)
VALUES (
  'sub_001',
  'u_001',
  'monthly',
  'Monthly',
  499,
  '2026-05-20',
  'Expired',
  'CS-11207'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  plan_label = EXCLUDED.plan_label;

INSERT INTO public.subscriptions (id, citizen_id, plan_id, plan_label, amount, started_at, status, case_id)
VALUES (
  'sub_002',
  'u_001',
  'yearly',
  'Yearly',
  4999,
  '2026-07-05',
  'Active',
  'CS-34253'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  plan_label = EXCLUDED.plan_label;

INSERT INTO public.subscriptions (id, citizen_id, plan_id, plan_label, amount, started_at, status, case_id)
VALUES (
  'sub_003',
  'u_002',
  'monthly',
  'Monthly',
  499,
  '2026-08-06',
  'Active',
  'CS-91102'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  plan_label = EXCLUDED.plan_label;

INSERT INTO public.subscriptions (id, citizen_id, plan_id, plan_label, amount, started_at, status, case_id)
VALUES (
  'sub_004',
  'u_003',
  'monthly',
  'Monthly',
  499,
  '2026-09-04',
  'Active',
  'CS-91101'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  plan_label = EXCLUDED.plan_label;

INSERT INTO public.subscriptions (id, citizen_id, plan_id, plan_label, amount, started_at, status, case_id)
VALUES (
  'sub_005',
  'u_005',
  'yearly',
  'Yearly',
  4999,
  '2025-06-11',
  'Expired',
  'CS-45119'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  plan_label = EXCLUDED.plan_label;

INSERT INTO public.subscriptions (id, citizen_id, plan_id, plan_label, amount, started_at, status, case_id)
VALUES (
  'sub_006',
  'u_006',
  'monthly',
  'Monthly',
  499,
  '2026-07-18',
  'Active',
  'CS-22418'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  plan_label = EXCLUDED.plan_label;

-- 6. SEED PAYMENTS

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_001',
  'commission',
  '2026-09-05',
  'Completed',
  'u_001',
  'Sai Teja Reddy',
  'l_002',
  'Srinivas Chowdary',
  'CS-34253',
  'Property boundary dispute — Banjara Hills',
  25000,
  5000,
  20000,
  'order_mock_pay_001',
  'pay_mock_pay_001'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_002',
  'commission',
  '2026-09-04',
  'Completed',
  'u_003',
  'Divya Sri Chowdary',
  'l_019',
  'Aditya Verma',
  'CS-78902',
  'Cyber fraud — unauthorized UPI phishing transaction',
  9800,
  1960,
  7840,
  'order_mock_pay_002',
  'pay_mock_pay_002'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_003',
  'commission',
  '2026-09-02',
  'Completed',
  'u_006',
  'Arjun Mehta',
  'l_001',
  'Swathi Reddy',
  'CS-22418',
  'Anticipatory bail — alleged criminal breach of trust (BNS §316)',
  15300,
  3060,
  12240,
  'order_mock_pay_003',
  'pay_mock_pay_003'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_004',
  'commission',
  '2026-08-28',
  'Completed',
  'u_002',
  'Lakshmi Prasanna',
  'l_018',
  'Suresh Kumar',
  'CS-61847',
  'Consumer complaint — defective appliance & breach of warranty',
  8500,
  1700,
  6800,
  'order_mock_pay_004',
  'pay_mock_pay_004'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_005',
  'commission',
  '2026-08-21',
  'Processing',
  'u_002',
  'Lakshmi Prasanna',
  'l_014',
  'N. V. Ramana Rao',
  'CS-80299',
  'Specific performance — agreement of sale of a residential plot',
  22000,
  4400,
  17600,
  'order_mock_pay_005',
  'pay_mock_pay_005'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_006',
  'commission',
  '2026-08-12',
  'Completed',
  'u_005',
  'Padmavathi Rao',
  'l_003',
  'Sailaja Naidu',
  'CS-45119',
  'Family matter — mutual consent divorce petition',
  29750,
  5950,
  23800,
  'order_mock_pay_006',
  'pay_mock_pay_006'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_007',
  'commission',
  '2026-07-30',
  'Completed',
  'u_004',
  'Venkata Ramana Naidu',
  'l_006',
  'Krishna Murthy',
  'CS-93021',
  'Wrongful termination & non-payment of severance',
  18000,
  3600,
  14400,
  'order_mock_pay_007',
  'pay_mock_pay_007'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_008',
  'commission',
  '2026-07-22',
  'Completed',
  'u_007',
  'Fatima Sheikh',
  'l_005',
  'Haritha Sarma',
  'CS-60155',
  'Online defamation & impersonation — fake social media profile',
  12400,
  2480,
  9920,
  'order_mock_pay_008',
  'pay_mock_pay_008'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_009',
  'commission',
  '2026-06-22',
  'Completed',
  'u_003',
  'Divya Sri Chowdary',
  'l_018',
  'Suresh Kumar',
  'CS-90188',
  'Consumer complaint — repudiated health insurance claim',
  9600,
  1920,
  7680,
  'order_mock_pay_009',
  'pay_mock_pay_009'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_010',
  'commission',
  '2026-06-05',
  'Completed',
  'u_006',
  'Arjun Mehta',
  'l_004',
  'Venkatesh Rao',
  'CS-50291',
  'Contractual dispute — termination of a software services agreement',
  21000,
  4200,
  16800,
  'order_mock_pay_010',
  'pay_mock_pay_010'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_014',
  'commission',
  '2026-05-28',
  'Completed',
  'u_007',
  'Fatima Sheikh',
  'l_008',
  'Priya Subramaniam',
  'CS-45330',
  'Consumer complaint — defective two-wheeler, resolved by settlement',
  16500,
  3300,
  13200,
  'order_mock_pay_014',
  'pay_mock_pay_014'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_015',
  'commission',
  '2026-02-28',
  'Completed',
  'u_001',
  'Sai Teja Reddy',
  'l_002',
  'Srinivas Chowdary',
  'CS-34410',
  'Title verification & clean sale — completed engagement',
  11000,
  2200,
  8800,
  'order_mock_pay_015',
  'pay_mock_pay_015'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_011',
  'subscription',
  '2026-07-05',
  'Completed',
  'u_001',
  'Sai Teja Reddy',
  NULL,
  NULL,
  'CS-34253',
  'Auto-Assign — Yearly plan',
  4999,
  4999,
  0,
  'order_mock_pay_011',
  'pay_mock_pay_011'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_012',
  'subscription',
  '2026-08-06',
  'Completed',
  'u_002',
  'Lakshmi Prasanna',
  NULL,
  NULL,
  'CS-91102',
  'Auto-Assign — Monthly plan',
  499,
  499,
  0,
  'order_mock_pay_012',
  'pay_mock_pay_012'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_013',
  'subscription',
  '2026-05-20',
  'Completed',
  'u_001',
  'Sai Teja Reddy',
  NULL,
  NULL,
  'CS-11207',
  'Auto-Assign — Monthly plan',
  499,
  499,
  0,
  'order_mock_pay_013',
  'pay_mock_pay_013'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_016',
  'subscription',
  '2026-09-04',
  'Completed',
  'u_003',
  'Divya Sri Chowdary',
  NULL,
  NULL,
  'CS-91101',
  'Auto-Assign — Monthly plan',
  499,
  499,
  0,
  'order_mock_pay_016',
  'pay_mock_pay_016'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_017',
  'subscription',
  '2026-07-18',
  'Completed',
  'u_006',
  'Arjun Mehta',
  NULL,
  NULL,
  'CS-22418',
  'Auto-Assign — Monthly plan',
  499,
  499,
  0,
  'order_mock_pay_017',
  'pay_mock_pay_017'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  'pay_018',
  'subscription',
  '2025-06-11',
  'Completed',
  'u_005',
  'Padmavathi Rao',
  NULL,
  NULL,
  'CS-45119',
  'Auto-Assign — Yearly plan',
  4999,
  4999,
  0,
  'order_mock_pay_018',
  'pay_mock_pay_018'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;

-- 7. SEED WITHDRAWAL REQUESTS

INSERT INTO public.withdrawal_requests (
  id, lawyer_id, lawyer_name, amount, requested_at, status, bank_name,
  account_number, ifsc_code, processed_at, reference_id, rejection_reason
)
VALUES (
  'w_101',
  'l_001',
  'Swathi Reddy',
  12240,
  '2026-09-02',
  'Approved',
  'HDFC Bank Ltd',
  '•••• 4829',
  'HDFC0001234',
  '2026-09-03',
  'TXN_94820194',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  processed_at = EXCLUDED.processed_at,
  reference_id = EXCLUDED.reference_id,
  rejection_reason = EXCLUDED.rejection_reason;

INSERT INTO public.withdrawal_requests (
  id, lawyer_id, lawyer_name, amount, requested_at, status, bank_name,
  account_number, ifsc_code, processed_at, reference_id, rejection_reason
)
VALUES (
  'w_102',
  'l_002',
  'Srinivas Chowdary',
  8500,
  '2026-09-06',
  'Pending',
  'State Bank of India',
  '•••• 9102',
  'SBIN0004812',
  NULL,
  NULL,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  processed_at = EXCLUDED.processed_at,
  reference_id = EXCLUDED.reference_id,
  rejection_reason = EXCLUDED.rejection_reason;

INSERT INTO public.withdrawal_requests (
  id, lawyer_id, lawyer_name, amount, requested_at, status, bank_name,
  account_number, ifsc_code, processed_at, reference_id, rejection_reason
)
VALUES (
  'w_103',
  'l_003',
  'Sailaja Naidu',
  15400,
  '2026-09-07',
  'Pending',
  'ICICI Bank',
  '•••• 3391',
  'ICIC0000281',
  NULL,
  NULL,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  processed_at = EXCLUDED.processed_at,
  reference_id = EXCLUDED.reference_id,
  rejection_reason = EXCLUDED.rejection_reason;

INSERT INTO public.withdrawal_requests (
  id, lawyer_id, lawyer_name, amount, requested_at, status, bank_name,
  account_number, ifsc_code, processed_at, reference_id, rejection_reason
)
VALUES (
  'w_104',
  'l_004',
  'Ananya Rao',
  16800,
  '2026-09-07',
  'Pending',
  'Axis Bank',
  '•••• 7714',
  'UTIB0001092',
  NULL,
  NULL,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  processed_at = EXCLUDED.processed_at,
  reference_id = EXCLUDED.reference_id,
  rejection_reason = EXCLUDED.rejection_reason;

INSERT INTO public.withdrawal_requests (
  id, lawyer_id, lawyer_name, amount, requested_at, status, bank_name,
  account_number, ifsc_code, processed_at, reference_id, rejection_reason
)
VALUES (
  'w_105',
  'l_005',
  'Rajeshwar Rao',
  6800,
  '2026-08-24',
  'Rejected',
  'Union Bank of India',
  '•••• 5567',
  'UBIN0553441',
  '2026-08-26',
  NULL,
  'Account name mismatch — please re-submit with updated bank proof.'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  processed_at = EXCLUDED.processed_at,
  reference_id = EXCLUDED.reference_id,
  rejection_reason = EXCLUDED.rejection_reason;

-- 8. SEED NOTIFICATIONS

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'n1',
  'citizen',
  'Lawyer assigned',
  'Srinivas Chowdary has been assigned to CS-34253.',
  '2025-09-16 09:40',
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'n2',
  'citizen',
  'Documents requested',
  'Please upload the FIR copy for CS-78902.',
  '2025-11-14 09:15',
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'n3',
  'citizen',
  'Hearing scheduled',
  'Next hearing for CS-22418 is listed for 16 Sep 2026 at 11:00 AM.',
  '2026-08-14 16:20',
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'n4',
  'citizen',
  'Status updated',
  'CS-45119 marked as Resolved.',
  '2025-10-01 15:45',
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'nl1',
  'lawyer',
  'New case assignment',
  'You have been assigned to CS-22733 — quashing petition for Divya Sri Chowdary.',
  '2026-07-02 09:40',
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'nl2',
  'lawyer',
  'New emergency request',
  'Emergency bail request CS-91101 is awaiting a lawyer. Custodial hearing scheduled.',
  '2026-09-04 11:25',
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'nl3',
  'lawyer',
  'Interim order uploaded',
  'Interim order added to CS-22418 — arrest of the petitioner stayed subject to conditions.',
  '2026-07-25 12:30',
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'na1',
  'admin',
  'New lawyer verification',
  'Meghana Iyer submitted bar credentials for verification.',
  '2026-08-30 14:00',
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'na2',
  'admin',
  'New lawyer verification',
  'Farhan Qureshi submitted bar credentials for verification.',
  '2026-09-02 10:20',
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'na3',
  'admin',
  'Emergency case unassigned',
  'CS-91102 (ex-parte demolition stay) has been unassigned for over 24 hours.',
  '2026-08-14 09:45',
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  'na4',
  'admin',
  'Withdrawal request pending',
  'Srinivas Chowdary requested a withdrawal of ₹8,500. Review in Revenue → Requests.',
  '2026-09-06 10:05',
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;

-- 9. SEED VIDEO CALLS

INSERT INTO public.video_calls (id, case_id, channel_name, with_name, caller_id, receiver_id, at, duration_seconds, status, role)
VALUES (
  'vc_l1',
  'CS-22418',
  'channel_vc_l1',
  'Arjun Mehta',
  'l_001',
  'u_001',
  '2026-09-23T05:04:07.980Z',
  1320,
  'completed',
  'lawyer'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  duration_seconds = EXCLUDED.duration_seconds;

INSERT INTO public.video_calls (id, case_id, channel_name, with_name, caller_id, receiver_id, at, duration_seconds, status, role)
VALUES (
  'vc_l2',
  'CS-22733',
  'channel_vc_l2',
  'Divya Sri Chowdary',
  'l_001',
  'u_001',
  '2026-09-22T11:04:07.981Z',
  600,
  'missed',
  'lawyer'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  duration_seconds = EXCLUDED.duration_seconds;

INSERT INTO public.video_calls (id, case_id, channel_name, with_name, caller_id, receiver_id, at, duration_seconds, status, role)
VALUES (
  'vc_l3',
  'CS-22571',
  'channel_vc_l3',
  'Sai Teja Reddy',
  'l_001',
  'u_001',
  '2026-09-21T07:04:07.981Z',
  900,
  'completed',
  'lawyer'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  duration_seconds = EXCLUDED.duration_seconds;

INSERT INTO public.video_calls (id, case_id, channel_name, with_name, caller_id, receiver_id, at, duration_seconds, status, role)
VALUES (
  'vc_l4',
  'CS-22418',
  'channel_vc_l4',
  'Arjun Mehta',
  'l_001',
  'u_001',
  '2026-09-18T08:04:07.981Z',
  720,
  'completed',
  'lawyer'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  duration_seconds = EXCLUDED.duration_seconds;

INSERT INTO public.video_calls (id, case_id, channel_name, with_name, caller_id, receiver_id, at, duration_seconds, status, role)
VALUES (
  'vc_c1',
  'CS-34253',
  'channel_vc_c1',
  'Srinivas Chowdary',
  'u_001',
  'l_001',
  '2026-09-23T03:04:07.981Z',
  1560,
  'completed',
  'citizen'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  duration_seconds = EXCLUDED.duration_seconds;

INSERT INTO public.video_calls (id, case_id, channel_name, with_name, caller_id, receiver_id, at, duration_seconds, status, role)
VALUES (
  'vc_c2',
  'CS-22571',
  'channel_vc_c2',
  'Swathi Reddy',
  'u_001',
  'l_001',
  '2026-09-22T02:04:07.981Z',
  600,
  'missed',
  'citizen'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  duration_seconds = EXCLUDED.duration_seconds;

INSERT INTO public.video_calls (id, case_id, channel_name, with_name, caller_id, receiver_id, at, duration_seconds, status, role)
VALUES (
  'vc_c3',
  'CS-11207',
  'channel_vc_c3',
  'Ananya Deshpande',
  'u_001',
  'l_001',
  '2026-09-19T00:04:07.981Z',
  1140,
  'completed',
  'citizen'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  duration_seconds = EXCLUDED.duration_seconds;

-- 10. SEED KNOWLEDGE BASE ITEMS

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb01',
  'Bharatiya Nyaya Sanhita (BNS) 2023 — Complete Act & Commentary',
  'Act',
  'Criminal',
  '4.2 MB',
  'https://closeurcase.app/docs/kb01.pdf',
  'kb01.pdf',
  'application/pdf',
  '2025-01-10'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb02',
  'Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 — Criminal Procedure Manual',
  'Act',
  'Criminal',
  '3.8 MB',
  'https://closeurcase.app/docs/kb02.pdf',
  'kb02.pdf',
  'application/pdf',
  '2025-01-15'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb03',
  'Transfer of Property Act 1882 — Annotated Commentary (2024 Edition)',
  'Act',
  'Property',
  '3.1 MB',
  'https://closeurcase.app/docs/kb03.pdf',
  'kb03.pdf',
  'application/pdf',
  '2025-03-10'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb04',
  'RERA 2016 & Registration Act 1908 — Property Transaction Compliance Guide',
  'Rule',
  'Property',
  '2.4 MB',
  'https://closeurcase.app/docs/kb04.pdf',
  'kb04.pdf',
  'application/pdf',
  '2025-04-20'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb05',
  'Consumer Protection Act 2019 — Rules, E-Commerce Regulations & NCDRC Practice',
  'Act',
  'Consumer',
  '2.1 MB',
  'https://closeurcase.app/docs/kb05.pdf',
  'kb05.pdf',
  'application/pdf',
  '2025-02-18'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb06',
  'NCDRC Key Rulings on Defective Goods & Service Deficiency (2021–2025)',
  'Judgement',
  'Consumer',
  '1.6 MB',
  'https://closeurcase.app/docs/kb06.pdf',
  'kb06.pdf',
  'application/pdf',
  '2025-04-25'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb07',
  'Information Technology Act 2000 — Sections 43, 66, 66C & 66D Enforcement Manual',
  'Act',
  'Cyber',
  '1.4 MB',
  'https://closeurcase.app/docs/kb07.pdf',
  'kb07.pdf',
  'application/pdf',
  '2025-03-18'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb08',
  'RBI Master Direction on Customer Protection in Unauthorised Electronic Banking Transactions (RBI/2017-18/15)',
  'Rule',
  'Cyber',
  '850 KB',
  'https://closeurcase.app/docs/kb08.pdf',
  'kb08.pdf',
  'application/pdf',
  '2025-04-05'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb09',
  'Hindu Marriage Act 1955 — Sections 13 & 13-B Divorce Proceedings, Mutual Consent & Case Laws',
  'Act',
  'Family',
  '1.5 MB',
  'https://closeurcase.app/docs/kb09.pdf',
  'kb09.pdf',
  'application/pdf',
  '2025-05-12'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb10',
  'Protection of Women from Domestic Violence Act 2005 — Procedure & Remedies Guide',
  'Act',
  'Family',
  '1.2 MB',
  'https://closeurcase.app/docs/kb10.pdf',
  'kb10.pdf',
  'application/pdf',
  '2025-05-28'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb11',
  'Industrial Disputes Act 1947 — Sections 25-F, 25-G & Severance Compensation Framework',
  'Act',
  'Labour',
  '1.1 MB',
  'https://closeurcase.app/docs/kb11.pdf',
  'kb11.pdf',
  'application/pdf',
  '2025-06-20'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb12',
  'Code on Wages 2019 — Minimum Wages, Bonus, Equal Pay & Enforcement Procedures',
  'Act',
  'Labour',
  '1.8 MB',
  'https://closeurcase.app/docs/kb12.pdf',
  'kb12.pdf',
  'application/pdf',
  '2025-07-05'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb13',
  'Companies Act 2013 — Directors'' Liability, Fraud & SFIO Investigation (Sections 206–229)',
  'Act',
  'Corporate',
  '2.9 MB',
  'https://closeurcase.app/docs/kb13.pdf',
  'kb13.pdf',
  'application/pdf',
  '2025-08-01'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb14',
  'Insolvency and Bankruptcy Code 2016 — Corporate Insolvency Resolution Process (CIRP) Guide',
  'Act',
  'Corporate',
  '3.3 MB',
  'https://closeurcase.app/docs/kb14.pdf',
  'kb14.pdf',
  'application/pdf',
  '2025-08-18'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb15',
  'Income Tax Act 1961 — Assessment, Appeals & Penalties (Sections 143–158) Practitioner Guide',
  'Act',
  'Tax',
  '4.0 MB',
  'https://closeurcase.app/docs/kb15.pdf',
  'kb15.pdf',
  'application/pdf',
  '2025-09-03'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb16',
  'GST Council Circulars on Input Tax Credit Reversal & Anti-Profiteering Orders (2024–2025)',
  'Rule',
  'Tax',
  '1.1 MB',
  'https://closeurcase.app/docs/kb16.pdf',
  'kb16.pdf',
  'application/pdf',
  '2025-09-20'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb17',
  'Environment Protection Act 1986 & NGT Act 2010 — Pollution Liability & Remediation Orders',
  'Act',
  'Environmental',
  '2.2 MB',
  'https://closeurcase.app/docs/kb17.pdf',
  'kb17.pdf',
  'application/pdf',
  '2025-10-10'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb18',
  'National Green Tribunal Landmark Judgements on Industrial Air & Water Pollution (2021–2025)',
  'Judgement',
  'Environmental',
  '1.7 MB',
  'https://closeurcase.app/docs/kb18.pdf',
  'kb18.pdf',
  'application/pdf',
  '2025-10-28'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb19',
  'Code of Civil Procedure 1908 — Interim Injunctions: Order XXXIX Rules 1 & 2 Practical Manual',
  'Rule',
  'Civil',
  '1.5 MB',
  'https://closeurcase.app/docs/kb19.pdf',
  'kb19.pdf',
  'application/pdf',
  '2025-11-05'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;

INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  'kb20',
  'Specific Relief Act 1963 (Amendment 2018) — Mandatory Injunction & Specific Performance Judgements',
  'Act',
  'Civil',
  '1.3 MB',
  'https://closeurcase.app/docs/kb20.pdf',
  'kb20.pdf',
  'application/pdf',
  '2025-11-15'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;
