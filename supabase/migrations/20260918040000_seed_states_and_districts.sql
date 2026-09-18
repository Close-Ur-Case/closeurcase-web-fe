-- ==============================================================================
-- Migration: 20260918040000_seed_states_and_districts.sql
-- Description:
--   1. Add state_id to public.districts (referencing public.states)
--   2. Add state_id & district_id foreign keys to public.citizens, public.lawyers,
--      public.cases_user, public.courts, and public.cities
--   3. Seed all 29 Indian States from locations.json into public.states
--   4. Seed all 59 Districts (Telangana & Andhra Pradesh) from locations.json into public.districts
--   5. Seed initial courts with state_id and district_id into public.courts
--   6. Assign particular state_id & district_id to all seed records
-- ==============================================================================

-- 1. Schema Extensions: Add state_id & district_id columns where missing

-- 1a. districts.state_id
ALTER TABLE public.districts 
    ADD COLUMN IF NOT EXISTS state_id VARCHAR(64) REFERENCES public.states(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_districts_state_id ON public.districts(state_id);

-- 1b. citizens.state_id & district_id
ALTER TABLE public.citizens 
    ADD COLUMN IF NOT EXISTS state_id VARCHAR(64) REFERENCES public.states(id) ON DELETE SET NULL;
ALTER TABLE public.citizens 
    ADD COLUMN IF NOT EXISTS district_id VARCHAR(64) REFERENCES public.districts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_citizens_state_id ON public.citizens(state_id);
CREATE INDEX IF NOT EXISTS idx_citizens_district_id ON public.citizens(district_id);

-- 1c. lawyers.state_id & district_id
ALTER TABLE public.lawyers 
    ADD COLUMN IF NOT EXISTS state_id VARCHAR(64) REFERENCES public.states(id) ON DELETE SET NULL;
ALTER TABLE public.lawyers 
    ADD COLUMN IF NOT EXISTS district_id VARCHAR(64) REFERENCES public.districts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lawyers_state_id ON public.lawyers(state_id);
CREATE INDEX IF NOT EXISTS idx_lawyers_district_id ON public.lawyers(district_id);

-- 1d. cases_user.state_id & district_id
ALTER TABLE public.cases_user 
    ADD COLUMN IF NOT EXISTS state_id VARCHAR(64) REFERENCES public.states(id) ON DELETE SET NULL;
ALTER TABLE public.cases_user 
    ADD COLUMN IF NOT EXISTS district_id VARCHAR(64) REFERENCES public.districts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cases_user_state_id ON public.cases_user(state_id);
CREATE INDEX IF NOT EXISTS idx_cases_user_district_id ON public.cases_user(district_id);

-- 1e. courts.state_id & district_id
ALTER TABLE public.courts 
    ADD COLUMN IF NOT EXISTS state_id VARCHAR(64) REFERENCES public.states(id) ON DELETE SET NULL;
ALTER TABLE public.courts 
    ADD COLUMN IF NOT EXISTS district_id VARCHAR(64) REFERENCES public.districts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_courts_state_id ON public.courts(state_id);
CREATE INDEX IF NOT EXISTS idx_courts_district_id ON public.courts(district_id);

-- 1f. cities.state_id & district_id
ALTER TABLE public.cities 
    ADD COLUMN IF NOT EXISTS state_id VARCHAR(64) REFERENCES public.states(id) ON DELETE SET NULL;
ALTER TABLE public.cities 
    ADD COLUMN IF NOT EXISTS district_id VARCHAR(64) REFERENCES public.districts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON public.cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_district_id ON public.cities(district_id);


-- 2. Seed All 29 Indian States & UTs (from locations.json)
INSERT INTO public.states (id, name, code, districts, active) VALUES
('andhra_pradesh', 'Andhra Pradesh', 'AP', '[
  {"id":"alluri_sitharama_raju","title":"Alluri Sitharama Raju"},
  {"id":"anakapalli","title":"Anakapalli"},
  {"id":"anantapur","title":"Anantapur"},
  {"id":"annamayya","title":"Annamayya"},
  {"id":"bapatla","title":"Bapatla"},
  {"id":"chittoor","title":"Chittoor"},
  {"id":"east_godavari","title":"East Godavari"},
  {"id":"eluru","title":"Eluru"},
  {"id":"guntur","title":"Guntur"},
  {"id":"kakinada","title":"Kakinada"},
  {"id":"konaseema","title":"Konaseema"},
  {"id":"krishna","title":"Krishna"},
  {"id":"kurnool","title":"Kurnool"},
  {"id":"nandyal","title":"Nandyal"},
  {"id":"ntr","title":"NTR"},
  {"id":"palnadu","title":"Palnadu"},
  {"id":"parvathipuram_manyam","title":"Parvathipuram Manyam"},
  {"id":"prakasam","title":"Prakasam"},
  {"id":"spsr_nellore","title":"Sri Potti Sriramulu Nellore"},
  {"id":"sri_sathya_sai","title":"Sri Sathya Sai"},
  {"id":"srikakulam","title":"Srikakulam"},
  {"id":"tirupati","title":"Tirupati"},
  {"id":"visakhapatnam","title":"Visakhapatnam"},
  {"id":"vizianagaram","title":"Vizianagaram"},
  {"id":"west_godavari","title":"West Godavari"},
  {"id":"ysr_kadapa","title":"YSR Kadapa"}
]'::jsonb, true),
('arunachal_pradesh', 'Arunachal Pradesh', 'AR', '[]'::jsonb, true),
('assam', 'Assam', 'AS', '[]'::jsonb, true),
('bihar', 'Bihar', 'BR', '[]'::jsonb, true),
('chhattisgarh', 'Chhattisgarh', 'CG', '[]'::jsonb, true),
('goa', 'Goa', 'GA', '[]'::jsonb, true),
('gujarat', 'Gujarat', 'GJ', '[]'::jsonb, true),
('haryana', 'Haryana', 'HR', '[]'::jsonb, true),
('himachal_pradesh', 'Himachal Pradesh', 'HP', '[]'::jsonb, true),
('jammu_kashmir', 'Jammu & Kashmir', 'JK', '[]'::jsonb, true),
('jharkhand', 'Jharkhand', 'JH', '[]'::jsonb, true),
('karnataka', 'Karnataka', 'KA', '[]'::jsonb, true),
('kerala', 'Kerala', 'KL', '[]'::jsonb, true),
('madhya_pradesh', 'Madhya Pradesh', 'MP', '[]'::jsonb, true),
('maharashtra', 'Maharashtra', 'MH', '[]'::jsonb, true),
('manipur', 'Manipur', 'MN', '[]'::jsonb, true),
('meghalaya', 'Meghalaya', 'ML', '[]'::jsonb, true),
('mizoram', 'Mizoram', 'MZ', '[]'::jsonb, true),
('nagaland', 'Nagaland', 'NL', '[]'::jsonb, true),
('odisha', 'Odisha', 'OD', '[]'::jsonb, true),
('punjab', 'Punjab', 'PB', '[]'::jsonb, true),
('rajasthan', 'Rajasthan', 'RJ', '[]'::jsonb, true),
('sikkim', 'Sikkim', 'SK', '[]'::jsonb, true),
('tamil_nadu', 'Tamil Nadu', 'TN', '[]'::jsonb, true),
('telangana', 'Telangana', 'TS', '[
  {"id":"adilabad","title":"Adilabad"},
  {"id":"bhadradri_kothagudem","title":"Bhadradri Kothagudem"},
  {"id":"hyderabad","title":"Hyderabad"},
  {"id":"jagtial","title":"Jagtial"},
  {"id":"jangaon","title":"Jangaon"},
  {"id":"jayashankar_bhupalpally","title":"Jayashankar Bhupalpally"},
  {"id":"jogulamba_gadwal","title":"Jogulamba Gadwal"},
  {"id":"kamareddy","title":"Kamareddy"},
  {"id":"karimnagar","title":"Karimnagar"},
  {"id":"khammam","title":"Khammam"},
  {"id":"komaram_bheem_asifabad","title":"Komaram Bheem Asifabad"},
  {"id":"mahabubabad","title":"Mahabubabad"},
  {"id":"mahabubnagar","title":"Mahabubnagar"},
  {"id":"mancherial","title":"Mancherial"},
  {"id":"medak","title":"Medak"},
  {"id":"medchal_malkajgiri","title":"Medchal Malkajgiri"},
  {"id":"mulugu","title":"Mulugu"},
  {"id":"nagarkurnool","title":"Nagarkurnool"},
  {"id":"nalgonda","title":"Nalgonda"},
  {"id":"narayanpet","title":"Narayanpet"},
  {"id":"nirmal","title":"Nirmal"},
  {"id":"nizamabad","title":"Nizamabad"},
  {"id":"peddapalli","title":"Peddapalli"},
  {"id":"rajanna_sircilla","title":"Rajanna Sircilla"},
  {"id":"rangareddy","title":"Rangareddy"},
  {"id":"sangareddy","title":"Sangareddy"},
  {"id":"siddipet","title":"Siddipet"},
  {"id":"suryapet","title":"Suryapet"},
  {"id":"vikarabad","title":"Vikarabad"},
  {"id":"wanaparthy","title":"Wanaparthy"},
  {"id":"warangal","title":"Warangal"},
  {"id":"hanumakonda","title":"Hanumakonda"},
  {"id":"yadadri_bhuvanagiri","title":"Yadadri Bhuvanagiri"}
]'::jsonb, true),
('tripura', 'Tripura', 'TR', '[]'::jsonb, true),
('uttar_pradesh', 'Uttar Pradesh', 'UP', '[]'::jsonb, true),
('uttarakhand', 'Uttarakhand', 'UK', '[]'::jsonb, true),
('west_bengal', 'West Bengal', 'WB', '[]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    districts = EXCLUDED.districts,
    active = EXCLUDED.active,
    updated_at = NOW()::text;


-- 3. Seed All 59 Districts (from locations.json)

-- 3a. Telangana Districts (33 Districts)
INSERT INTO public.districts (id, name, state, state_id, active) VALUES
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
('yadadri_bhuvanagiri', 'Yadadri Bhuvanagiri', 'Telangana', 'telangana', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    state = EXCLUDED.state,
    state_id = EXCLUDED.state_id,
    active = EXCLUDED.active,
    updated_at = NOW()::text;

-- 3b. Andhra Pradesh Districts (26 Districts)
INSERT INTO public.districts (id, name, state, state_id, active) VALUES
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
    active = EXCLUDED.active,
    updated_at = NOW()::text;


-- 4. Seed Initial Courts (with state_id & district_id)
INSERT INTO public.courts (id, name, level, state, city, district, state_id, district_id, active) VALUES
('court_hyd_dc', 'City Civil Court, Hyderabad', 'lvl_3', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_vzg_dc', 'District & Sessions Court, Visakhapatnam', 'lvl_3', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),
('court_tshc', 'High Court for the State of Telangana', 'lvl_2', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_aphc', 'High Court of Andhra Pradesh, Amaravati', 'lvl_2', 'Andhra Pradesh', 'Amaravati', 'Guntur', 'andhra_pradesh', 'guntur', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    state = EXCLUDED.state,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    state_id = EXCLUDED.state_id,
    district_id = EXCLUDED.district_id,
    active = EXCLUDED.active;


-- 5. Assign state_id and district_id to Seed Data

-- 5a. Update Cities with state_id and district_id
UPDATE public.cities SET state_id = 'telangana', district_id = 'hyderabad' WHERE id = 'city_1';
UPDATE public.cities SET state_id = 'andhra_pradesh', district_id = 'visakhapatnam' WHERE id = 'city_2';
UPDATE public.cities SET state_id = 'karnataka', district_id = NULL WHERE id = 'city_3';
UPDATE public.cities SET state_id = 'tamil_nadu', district_id = NULL WHERE id = 'city_4';
UPDATE public.cities SET state_id = 'maharashtra', district_id = NULL WHERE id = 'city_5';
UPDATE public.cities SET state_id = 'andhra_pradesh', district_id = 'ntr' WHERE id = 'city_7';
UPDATE public.cities SET state_id = 'maharashtra', district_id = NULL WHERE id = 'city_8';

-- 5b. Update Citizens with state_id and district_id
UPDATE public.citizens SET state_id = 'telangana', district_id = 'hyderabad', state = 'Telangana', city = 'Hyderabad' WHERE id = 'u_001';
UPDATE public.citizens SET state_id = 'andhra_pradesh', district_id = 'visakhapatnam', state = 'Andhra Pradesh', city = 'Visakhapatnam' WHERE id = 'u_002';
UPDATE public.citizens SET state_id = 'telangana', district_id = 'hyderabad', state = 'Telangana', city = 'Hyderabad' WHERE id = 'u_003';
UPDATE public.citizens SET state_id = 'andhra_pradesh', district_id = 'visakhapatnam', state = 'Andhra Pradesh', city = 'Visakhapatnam' WHERE id = 'u_004';

-- Also general fallback for any existing citizens with city 'Hyderabad' or 'Visakhapatnam'
UPDATE public.citizens SET state_id = 'telangana', district_id = 'hyderabad' WHERE (city ILIKE '%hyderabad%' OR address ILIKE '%hyderabad%') AND state_id IS NULL;
UPDATE public.citizens SET state_id = 'andhra_pradesh', district_id = 'visakhapatnam' WHERE (city ILIKE '%visakhapatnam%' OR address ILIKE '%visakhapatnam%') AND state_id IS NULL;

-- 5c. Update Lawyers with state_id and district_id
UPDATE public.lawyers SET state_id = 'telangana', district_id = 'hyderabad' WHERE id = 'l_001';
UPDATE public.lawyers SET state_id = 'telangana', district_id = 'hyderabad' WHERE id = 'l_002';
UPDATE public.lawyers SET state_id = 'andhra_pradesh', district_id = 'visakhapatnam' WHERE id = 'l_003';
UPDATE public.lawyers SET state_id = 'karnataka', district_id = NULL WHERE id = 'l_004';
UPDATE public.lawyers SET state_id = 'telangana', district_id = 'hyderabad' WHERE id = 'l_005';
UPDATE public.lawyers SET state_id = 'tamil_nadu', district_id = NULL WHERE id = 'l_006';

-- Also general fallback for any existing lawyers
UPDATE public.lawyers SET state_id = 'telangana', district_id = 'hyderabad' WHERE city ILIKE '%hyderabad%' AND state_id IS NULL;
UPDATE public.lawyers SET state_id = 'andhra_pradesh', district_id = 'visakhapatnam' WHERE city ILIKE '%visakhapatnam%' AND state_id IS NULL;
UPDATE public.lawyers SET state_id = 'karnataka' WHERE city ILIKE '%bengaluru%' AND state_id IS NULL;
UPDATE public.lawyers SET state_id = 'tamil_nadu' WHERE city ILIKE '%chennai%' AND state_id IS NULL;

-- 5d. Update Cases User with state_id and district_id
UPDATE public.cases_user SET state_id = 'telangana', district_id = 'hyderabad' WHERE id = 'CUC-20260831154512';
UPDATE public.cases_user SET state_id = 'andhra_pradesh', district_id = 'visakhapatnam' WHERE id = 'CUC-20260902112040';

-- General fallback for any existing user cases
UPDATE public.cases_user SET state_id = 'telangana', district_id = 'hyderabad' WHERE city ILIKE '%hyderabad%' AND state_id IS NULL;
UPDATE public.cases_user SET state_id = 'andhra_pradesh', district_id = 'visakhapatnam' WHERE city ILIKE '%visakhapatnam%' AND state_id IS NULL;
