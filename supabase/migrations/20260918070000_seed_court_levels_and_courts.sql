-- Migration: 20260918070000_seed_court_levels_and_courts.sql
-- Description: Seed court_levels and courts from COURTS_DATA mock data, add foreign key constraint courts.level -> court_levels.id

-- 1. Seed Court Levels (17 standard levels + legacy backward-compatible IDs)
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
-- Legacy IDs
('lvl_1', 'Supreme Court', 'SC', true),
('lvl_2', 'High Court', 'HC', true),
('lvl_3', 'District Court', 'DC', true),
('lvl_4', 'Tribunal', 'TRB', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    active = EXCLUDED.active;

-- 2. Migrate existing courts to semantic level IDs
UPDATE public.courts SET level = 'lvl_high_court' WHERE level = 'lvl_2';
UPDATE public.courts SET level = 'lvl_district_court' WHERE level = 'lvl_3';
UPDATE public.courts SET level = 'lvl_supreme_court' WHERE level = 'lvl_1';
UPDATE public.courts SET level = 'lvl_mact' WHERE level = 'lvl_4';

-- 3. Add Foreign Key constraint courts.level -> court_levels.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'courts_level_fkey' AND table_name = 'courts'
    ) THEN
        ALTER TABLE public.courts
            ADD CONSTRAINT courts_level_fkey 
            FOREIGN KEY (level) REFERENCES public.court_levels(id) 
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_courts_level ON public.courts(level);

-- 4. Seed all Courts from COURTS_DATA + Retain existing regional courts
INSERT INTO public.courts (id, name, level, state, city, district, state_id, district_id, active) VALUES
-- Existing Retained Courts
('court_hyd_dc', 'City Civil Court, Hyderabad', 'lvl_civil_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_vzg_dc', 'District & Sessions Court, Visakhapatnam', 'lvl_district_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),
('court_tshc', 'High Court for the State of Telangana', 'lvl_high_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_aphc', 'High Court of Andhra Pradesh, Amaravati', 'lvl_high_court', 'Andhra Pradesh', 'Amaravati', 'Guntur', 'andhra_pradesh', 'guntur', true),

-- COURTS_DATA Group 1: High Court
('court_telangana_hc', 'Telangana High Court', 'lvl_high_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_ap_hc_vzg', 'High Court of Andhra Pradesh (Visakhapatnam Bench)', 'lvl_high_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 2: District Court
('court_dc_hyderabad', 'District Court, Hyderabad', 'lvl_district_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_dc_visakhapatnam', 'District Court, Visakhapatnam', 'lvl_district_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 3: Sessions Court
('court_sessions_hyderabad', 'Sessions Court, Hyderabad', 'lvl_sessions_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_sessions_visakhapatnam', 'Sessions Court, Visakhapatnam', 'lvl_sessions_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 4: Civil Court
('court_civil_hyderabad', 'City Civil Court, Hyderabad', 'lvl_civil_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_civil_visakhapatnam', 'City Civil Court, Visakhapatnam', 'lvl_civil_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 5: Criminal Court
('court_cmm_hyderabad', 'Chief Metropolitan Magistrate Court, Hyderabad', 'lvl_criminal_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_cjm_visakhapatnam', 'Chief Judicial Magistrate Court, Visakhapatnam', 'lvl_criminal_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 6: Family Court
('court_family_hyderabad', 'Family Court, Hyderabad', 'lvl_family_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_family_visakhapatnam', 'Family Court, Visakhapatnam', 'lvl_family_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 7: Commercial Court
('court_commercial_hyderabad', 'Commercial Court, Hyderabad', 'lvl_commercial_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_commercial_visakhapatnam', 'Commercial Court, Visakhapatnam', 'lvl_commercial_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 8: Labour Court
('court_labour_hyderabad', 'Labour Court, Hyderabad', 'lvl_labour_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_labour_visakhapatnam', 'Labour Court, Visakhapatnam', 'lvl_labour_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 9: Consumer Court
('court_consumer_hyderabad', 'District Consumer Disputes Redressal Commission, Hyderabad', 'lvl_consumer_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_consumer_visakhapatnam', 'District Consumer Disputes Redressal Commission, Visakhapatnam', 'lvl_consumer_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 10: Juvenile Justice Court
('court_jjb_hyderabad', 'Juvenile Justice Board, Hyderabad', 'lvl_juvenile_justice_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_jjb_visakhapatnam', 'Juvenile Justice Board, Visakhapatnam', 'lvl_juvenile_justice_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 11: POCSO Court
('court_pocso_hyderabad', 'Special Court for POCSO Cases, Hyderabad', 'lvl_pocso_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_pocso_visakhapatnam', 'Special Court for POCSO Cases, Visakhapatnam', 'lvl_pocso_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 12: NDPS Court
('court_ndps_hyderabad', 'Special Court for NDPS Cases, Hyderabad', 'lvl_ndps_court', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_ndps_visakhapatnam', 'Special Court for NDPS Cases, Visakhapatnam', 'lvl_ndps_court', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 13: Motor Accident Claims Tribunal
('court_mact_hyderabad', 'Motor Accidents Claims Tribunal, Hyderabad', 'lvl_mact', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_mact_visakhapatnam', 'Motor Accidents Claims Tribunal, Visakhapatnam', 'lvl_mact', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 14: NCLT
('court_nclt_hyderabad', 'National Company Law Tribunal, Hyderabad Bench', 'lvl_nclt', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_nclt_visakhapatnam', 'National Company Law Tribunal, Visakhapatnam Bench', 'lvl_nclt', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 15: CAT
('court_cat_hyderabad', 'Central Administrative Tribunal, Hyderabad Bench', 'lvl_cat', 'Telangana', 'Hyderabad', 'Hyderabad', 'telangana', 'hyderabad', true),
('court_cat_visakhapatnam', 'Central Administrative Tribunal, Visakhapatnam Bench', 'lvl_cat', 'Andhra Pradesh', 'Visakhapatnam', 'Visakhapatnam', 'andhra_pradesh', 'visakhapatnam', true),

-- COURTS_DATA Group 16: DRT
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
