import { client } from "../config/db.ts";

export class DbInitService {
  /**
   * Initializes all 20 database tables and seeds mockup data on first run
   */
  static async initializeDatabase() {
    console.log("Initializing database tables and seed data...");

    // 1. Schema Tables DDL
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS public.users (
          id VARCHAR(128) PRIMARY KEY,
          role VARCHAR(32) NOT NULL DEFAULT 'citizen',
          email VARCHAR(255),
          phone VARCHAR(32),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.citizens (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(128) REFERENCES public.users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(32) NOT NULL,
          city VARCHAR(128),
          current_location TEXT,
          address TEXT,
          state VARCHAR(128),
          pincode VARCHAR(16),
          emergency_contact VARCHAR(32),
          status VARCHAR(32) DEFAULT 'Active' NOT NULL,
          joined_at VARCHAR(32) NOT NULL,
          last_login_at VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS state VARCHAR(128);
      ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS pincode VARCHAR(16);
      ALTER TABLE public.citizens ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(32);

      CREATE TABLE IF NOT EXISTS public.lawyers (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(128) REFERENCES public.users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(32) NOT NULL,
          category VARCHAR(64) NOT NULL,
          role_title VARCHAR(128),
          city VARCHAR(128) NOT NULL,
          cities JSONB DEFAULT '[]'::jsonb,
          current_location TEXT,
          area VARCHAR(128),
          bar_id VARCHAR(128) NOT NULL,
          experience_years INTEGER DEFAULT 0 NOT NULL,
          rating TEXT DEFAULT '4.5' NOT NULL,
          status VARCHAR(32) DEFAULT 'Pending' NOT NULL,
          active_cases INTEGER DEFAULT 0 NOT NULL,
          photo_url TEXT,
          id_proof_url TEXT,
          id_proof_file_name VARCHAR(255),
          office_address TEXT,
          bio TEXT,
          languages JSONB DEFAULT '[]'::jsonb,
          practice_areas JSONB DEFAULT '[]'::jsonb,
          specializations JSONB DEFAULT '[]'::jsonb,
          legal_services JSONB DEFAULT '[]'::jsonb,
          courts JSONB DEFAULT '[]'::jsonb,
          awards JSONB DEFAULT '[]'::jsonb,
          rating_count INTEGER DEFAULT 0,
          consultation_fee INTEGER DEFAULT 1000,
          availability_status VARCHAR(32) DEFAULT 'Online',
          bank_name VARCHAR(128),
          account_number VARCHAR(64),
          ifsc_code VARCHAR(32),
          joined_at VARCHAR(32) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      ALTER TABLE public.lawyers ADD COLUMN IF NOT EXISTS cities JSONB DEFAULT '[]'::jsonb;

      CREATE TABLE IF NOT EXISTS public.admin_profiles (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(128) REFERENCES public.users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(32),
          role VARCHAR(64) DEFAULT 'superadmin' NOT NULL,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.cases (
          id VARCHAR(128) PRIMARY KEY,
          cnr VARCHAR(32) UNIQUE,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(64) NOT NULL,
          citizen_id VARCHAR(64) REFERENCES public.citizens(id) ON DELETE SET NULL,
          citizen_name VARCHAR(255) NOT NULL,
          lawyer_id VARCHAR(64) REFERENCES public.lawyers(id) ON DELETE SET NULL,
          lawyer_name VARCHAR(255),
          status VARCHAR(64) DEFAULT 'Pending' NOT NULL,
          city VARCHAR(128) NOT NULL,
          source VARCHAR(32) DEFAULT 'manual',
          is_emergency BOOLEAN DEFAULT FALSE,
          emergency_reason TEXT,
          via_whatsapp BOOLEAN DEFAULT FALSE,
          practice_area VARCHAR(255),
          specialization VARCHAR(255),
          legal_service VARCHAR(255),
          case_details JSONB DEFAULT '{}'::jsonb,
          entity_info JSONB DEFAULT '{}'::jsonb,
          files JSONB DEFAULT '{"files":[]}'::jsonb,
          descriptions JSONB DEFAULT '{"enumFields":[],"enumLookup":{}}'::jsonb,
          case_ai_analysis JSONB DEFAULT NULL,
          timeline JSONB DEFAULT '[]'::jsonb,
          created_at VARCHAR(64) NOT NULL,
          updated_at VARCHAR(64) NOT NULL,
          db_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          db_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.case_hearings (
          id VARCHAR(64) PRIMARY KEY,
          case_id VARCHAR(128) REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
          judge TEXT DEFAULT '',
          business_on_date VARCHAR(32) NOT NULL,
          hearing_date VARCHAR(32),
          time VARCHAR(32),
          purpose_of_listing TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.case_orders (
          id VARCHAR(64) PRIMARY KEY,
          case_id VARCHAR(128) REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
          order_date VARCHAR(32) NOT NULL,
          order_type VARCHAR(64) DEFAULT 'INTERIM' NOT NULL,
          description TEXT,
          order_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.case_notes (
          id VARCHAR(64) PRIMARY KEY,
          case_id VARCHAR(128) REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
          text TEXT NOT NULL,
          author VARCHAR(128) DEFAULT 'You' NOT NULL,
          created_at VARCHAR(64) NOT NULL,
          db_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.case_documents (
          id VARCHAR(64) PRIMARY KEY,
          case_id VARCHAR(128) REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
          name VARCHAR(255) NOT NULL,
          size VARCHAR(64) NOT NULL,
          file_url TEXT NOT NULL,
          file_mime_type VARCHAR(128),
          uploaded_by VARCHAR(32) DEFAULT 'citizen',
          uploaded_at VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.lawyer_documents (
          id VARCHAR(64) PRIMARY KEY,
          lawyer_id VARCHAR(64) REFERENCES public.lawyers(id) ON DELETE CASCADE NOT NULL,
          title VARCHAR(255) NOT NULL,
          size VARCHAR(64) NOT NULL,
          file_url TEXT NOT NULL,
          file_name VARCHAR(255),
          file_mime_type VARCHAR(128),
          uploaded_at VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.lawyer_ratings (
          id VARCHAR(64) PRIMARY KEY,
          lawyer_id VARCHAR(64) REFERENCES public.lawyers(id) ON DELETE CASCADE NOT NULL,
          case_id VARCHAR(128) REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
          citizen_id VARCHAR(64) REFERENCES public.citizens(id) ON DELETE SET NULL,
          citizen_name VARCHAR(255) NOT NULL,
          rating INTEGER NOT NULL,
          review TEXT DEFAULT '',
          created_at VARCHAR(64) NOT NULL,
          db_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.subscription_plans (
          id VARCHAR(32) PRIMARY KEY,
          label VARCHAR(128) NOT NULL,
          price INTEGER NOT NULL,
          cadence VARCHAR(32) NOT NULL,
          badge VARCHAR(64),
          audience VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          features JSONB DEFAULT '[]'::jsonb,
          active VARCHAR(16) DEFAULT 'true',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.subscriptions (
          id VARCHAR(64) PRIMARY KEY,
          citizen_id VARCHAR(64) REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
          plan_id VARCHAR(32) NOT NULL,
          plan_label VARCHAR(128) NOT NULL,
          amount INTEGER NOT NULL,
          started_at VARCHAR(32) NOT NULL,
          expires_at VARCHAR(64),
          status VARCHAR(32) DEFAULT 'Active' NOT NULL,
          case_id VARCHAR(128) REFERENCES public.cases(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS expires_at VARCHAR(64);

      CREATE TABLE IF NOT EXISTS public.payments (
          id VARCHAR(64) PRIMARY KEY,
          source VARCHAR(32) NOT NULL,
          date VARCHAR(32) NOT NULL,
          status VARCHAR(32) DEFAULT 'Completed' NOT NULL,
          citizen_id VARCHAR(64) REFERENCES public.citizens(id) ON DELETE SET NULL,
          citizen_name VARCHAR(255),
          lawyer_id VARCHAR(64) REFERENCES public.lawyers(id) ON DELETE SET NULL,
          lawyer_name VARCHAR(255),
          case_id VARCHAR(128) REFERENCES public.cases(id) ON DELETE SET NULL,
          case_title TEXT,
          gross_amount INTEGER NOT NULL,
          platform_amount INTEGER DEFAULT 0 NOT NULL,
          lawyer_amount INTEGER DEFAULT 0 NOT NULL,
          razorpay_order_id VARCHAR(128),
          razorpay_payment_id VARCHAR(128),
          razorpay_signature VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
          id VARCHAR(64) PRIMARY KEY,
          lawyer_id VARCHAR(64) REFERENCES public.lawyers(id) ON DELETE CASCADE NOT NULL,
          lawyer_name VARCHAR(255) NOT NULL,
          amount INTEGER NOT NULL,
          requested_at VARCHAR(32) NOT NULL,
          status VARCHAR(32) DEFAULT 'Pending' NOT NULL,
          bank_name VARCHAR(128) NOT NULL,
          account_number VARCHAR(64) NOT NULL,
          ifsc_code VARCHAR(32) NOT NULL,
          processed_at VARCHAR(32),
          reference_id VARCHAR(128),
          rejection_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.chat_messages (
          id VARCHAR(64) PRIMARY KEY,
          case_id VARCHAR(128) REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
          sender VARCHAR(32) NOT NULL,
          sender_name VARCHAR(255) NOT NULL,
          text TEXT,
          attachment_type VARCHAR(32),
          attachment_name VARCHAR(255),
          attachment_url TEXT,
          attachment_size VARCHAR(64),
          audio_duration INTEGER,
          read BOOLEAN DEFAULT FALSE NOT NULL,
          at VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.contact_inquiries (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          category VARCHAR(64) DEFAULT 'general' NOT NULL,
          subject VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(32) DEFAULT 'New' NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.ai_case_analyses (
          id VARCHAR(64) PRIMARY KEY,
          case_id VARCHAR(128) REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
          type VARCHAR(64) NOT NULL,
          input_prompt TEXT NOT NULL,
          response_content JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.video_calls (
          id VARCHAR(64) PRIMARY KEY,
          case_id VARCHAR(128) REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
          channel_name VARCHAR(128),
          with_name VARCHAR(255) NOT NULL,
          caller_id VARCHAR(64),
          receiver_id VARCHAR(64),
          at VARCHAR(64) NOT NULL,
          duration_seconds INTEGER,
          status VARCHAR(32) DEFAULT 'completed' NOT NULL,
          role VARCHAR(32) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.app_notifications (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(128),
          role VARCHAR(32) DEFAULT 'all',
          title VARCHAR(255) NOT NULL,
          body TEXT NOT NULL,
          at VARCHAR(64) NOT NULL,
          read BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.fcm_tokens (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL,
          role VARCHAR(32) NOT NULL,
          device_token TEXT NOT NULL,
          device_type VARCHAR(32) DEFAULT 'web',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.knowledge_items (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          type VARCHAR(64) NOT NULL,
          category VARCHAR(64) NOT NULL,
          size VARCHAR(64) NOT NULL,
          file_url TEXT,
          file_name VARCHAR(255),
          file_mime_type VARCHAR(128),
          uploaded_at VARCHAR(64) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.case_categories (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(32) NOT NULL,
          description TEXT DEFAULT '',
          sub_categories JSONB DEFAULT '[]'::jsonb,
          active BOOLEAN DEFAULT TRUE NOT NULL,
          updated_at VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.cities (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          state VARCHAR(128) NOT NULL,
          tier VARCHAR(32) DEFAULT 'Tier 1',
          active BOOLEAN DEFAULT TRUE NOT NULL,
          updated_at VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.districts (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          state VARCHAR(128) NOT NULL,
          active BOOLEAN DEFAULT TRUE NOT NULL,
          updated_at VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.courts (
          id VARCHAR(64) PRIMARY KEY,
          name TEXT NOT NULL,
          level VARCHAR(64) NOT NULL,
          state VARCHAR(128) NOT NULL,
          city VARCHAR(128),
          district VARCHAR(128),
          active BOOLEAN DEFAULT TRUE NOT NULL,
          updated_at VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.states (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          code VARCHAR(16) NOT NULL,
          districts JSONB DEFAULT '[]'::jsonb,
          active BOOLEAN DEFAULT TRUE NOT NULL,
          updated_at VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.court_levels (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          code VARCHAR(32) NOT NULL,
          active BOOLEAN DEFAULT TRUE NOT NULL,
          updated_at VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.languages (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          native_name VARCHAR(128) NOT NULL,
          code VARCHAR(16) NOT NULL,
          active BOOLEAN DEFAULT TRUE NOT NULL,
          updated_at VARCHAR(64),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cases_cnr ON public.cases (cnr);
      CREATE INDEX IF NOT EXISTS idx_cases_case_details ON public.cases USING gin (case_details);
      CREATE INDEX IF NOT EXISTS idx_cases_entity_info ON public.cases USING gin (entity_info);
      CREATE INDEX IF NOT EXISTS idx_case_hearings_case_id ON public.case_hearings (case_id);
      CREATE INDEX IF NOT EXISTS idx_case_orders_case_id ON public.case_orders (case_id);
    `;

    await client.unsafe(schemaSql);
    console.log("Tables verified / created successfully.");

    // 2. Seed Mockup Data
    const seedSql = `
      -- Master Categories
      INSERT INTO public.case_categories (id, name, code, description, sub_categories, active) VALUES
      ('cat_1', 'Criminal Defense', 'CRIM', 'Bail, trials, appeals, and white-collar defence across criminal courts', '[{"name":"Anticipatory Bail","services":["File Anticipatory Bail Application","Anticipatory Bail Hearing"]},{"name":"Criminal Defense","services":["File Criminal Case","Criminal Defense"]}]'::jsonb, true),
      ('cat_2', 'Civil & Property', 'CIVIL', 'Land disputes, property registration, injunctions, and recovery suits', '[{"name":"Property Dispute","services":["Title Verification","Partition Suit","Injunction Suit"]},{"name":"RERA","services":["Builder Delay Complaint","RERA Appeal"]}]'::jsonb, true),
      ('cat_3', 'Family & Matrimonial', 'FAMILY', 'Divorce, child custody, maintenance, and domestic dispute resolutions', '[{"name":"Divorce","services":["Mutual Consent Divorce","Contested Divorce","Child Custody"]},{"name":"Domestic Violence","services":["Protection Order Application"]}]'::jsonb, true),
      ('cat_4', 'Corporate & Commercial', 'CORP', 'Contracts, M&A, startup compliance, arbitration, and NCLT insolvency', '[{"name":"Company Law","services":["Incorporation","Shareholders Agreement","NCLT Petition"]}]'::jsonb, true),
      ('cat_5', 'Consumer & Motor Accident', 'CONSUMER', 'Consumer disputes, defect complaints, and MACT accident claim tribunals', '[{"name":"Consumer Protection","services":["District Forum Complaint","Product Liability"]}]'::jsonb, true)
      ON CONFLICT (id) DO NOTHING;

      -- Cities
      INSERT INTO public.cities (id, name, state, tier, active) VALUES
      ('city_1', 'Hyderabad', 'Telangana', 'Tier 1', true),
      ('city_2', 'Visakhapatnam', 'Andhra Pradesh', 'Tier 2', true),
      ('city_3', 'Bengaluru', 'Karnataka', 'Tier 1', true),
      ('city_4', 'Chennai', 'Tamil Nadu', 'Tier 1', true),
      ('city_5', 'Mumbai', 'Maharashtra', 'Tier 1', true),
      ('city_6', 'Delhi / New Delhi', 'Delhi', 'Tier 1', true),
      ('city_7', 'Vijayawada', 'Andhra Pradesh', 'Tier 2', true),
      ('city_8', 'Pune', 'Maharashtra', 'Tier 1', true)
      ON CONFLICT (id) DO NOTHING;

      -- Languages
      INSERT INTO public.languages (id, name, native_name, code, active) VALUES
      ('lang_en', 'English', 'English', 'en', true),
      ('lang_hi', 'Hindi', 'हिन्दी', 'hi', true),
      ('lang_te', 'Telugu', 'తెలుగు', 'te', true),
      ('lang_ta', 'Tamil', 'தமிழ்', 'ta', true),
      ('lang_kn', 'Kannada', 'ಕನ್ನಡ', 'kn', true)
      ON CONFLICT (id) DO NOTHING;

      -- Court Levels
      INSERT INTO public.court_levels (id, name, code, active) VALUES
      ('lvl_1', 'Supreme Court', 'SC', true),
      ('lvl_2', 'High Court', 'HC', true),
      ('lvl_3', 'District Court', 'DC', true),
      ('lvl_4', 'Tribunal', 'TRB', true)
      ON CONFLICT (id) DO NOTHING;

      -- Super Admin
      INSERT INTO public.users (id, role, email, phone) VALUES
      ('usr_admin_master', 'admin', 'admin@closeurcase.app', '+919800000000')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.admin_profiles (id, user_id, name, email, phone, role) VALUES
      ('admin_01', 'usr_admin_master', 'Platform Super Admin', 'admin@closeurcase.app', '+919800000000', 'superadmin')
      ON CONFLICT (id) DO NOTHING;

      -- Citizens
      INSERT INTO public.users (id, role, email, phone) VALUES
      ('usr_u_001', 'citizen', 'saiteja.reddy@gmail.com', '+91 98110 22111'),
      ('usr_u_002', 'citizen', 'lakshmi.prasanna92@gmail.com', '+91 98320 45123'),
      ('usr_u_003', 'citizen', 'divya.chowdary@gmail.com', '+91 98450 88321'),
      ('usr_u_004', 'citizen', 'ramana.naidu.vzg@gmail.com', '+91 98333 11902')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.citizens (id, user_id, name, email, phone, city, address, state, pincode, emergency_contact, status, joined_at, last_login_at) VALUES
      ('u_001', 'usr_u_001', 'Sai Teja Reddy', 'saiteja.reddy@gmail.com', '+91 98110 22111', 'Hyderabad', 'Plot 12, Kavuri Hills, Madhapur', 'Telangana', '500081', '+919811022119', 'Active', '2025-02-14', '2026-09-06T09:15:00'),
      ('u_002', 'usr_u_002', 'Lakshmi Prasanna', 'lakshmi.prasanna92@gmail.com', '+91 98320 45123', 'Visakhapatnam', 'D.No 4-12, Seethammadhara', 'Andhra Pradesh', '530013', '+919832045129', 'Active', '2025-04-01', '2026-09-04T18:42:00'),
      ('u_003', 'usr_u_003', 'Divya Sri Chowdary', 'divya.chowdary@gmail.com', '+91 98450 88321', 'Hyderabad', 'Flat 402, Rainbow Vistas, Hitec City', 'Telangana', '500018', '+919845088329', 'Active', '2025-06-11', '2026-09-05T11:20:00'),
      ('u_004', 'usr_u_004', 'Venkata Ramana Naidu', 'ramana.naidu.vzg@gmail.com', '+91 98333 11902', 'Visakhapatnam', 'Sector 5, MVP Colony', 'Andhra Pradesh', '530017', NULL, 'Inactive', '2025-11-08', '2026-05-20T08:05:00')
      ON CONFLICT (id) DO NOTHING;

      -- Verified Lawyers (From mock.ts)
      INSERT INTO public.users (id, role, email, phone) VALUES
      ('usr_l_001', 'lawyer', 'swathi.reddy@legal.in', '+91 98765 43210'),
      ('usr_l_002', 'lawyer', 'srinivas.chowdary@courtlaw.in', '+91 98490 11223'),
      ('usr_l_003', 'lawyer', 'sailaja.naidu@familylaw.org', '+91 98220 33445'),
      ('usr_l_004', 'lawyer', 'ananya.rao@corplaw.in', '+91 98111 22334'),
      ('usr_l_005', 'lawyer', 'rajeshwar.rao@propertylaw.in', '+91 98444 55667'),
      ('usr_l_006', 'lawyer', 'meera.nambiar@cyberlaw.in', '+91 98777 88990')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.lawyers (id, user_id, name, email, phone, category, role_title, city, cities, area, bar_id, experience_years, rating, status, active_cases, office_address, bio, languages, rating_count, consultation_fee, availability_status, bank_name, account_number, ifsc_code, joined_at) VALUES
      ('l_001', 'usr_l_001', 'Adv. Swathi Reddy', 'swathi.reddy@legal.in', '+91 98765 43210', 'Civil', 'Senior Advocate — High Court', 'Hyderabad', '["Hyderabad","Secunderabad"]'::jsonb, 'Banjara Hills', 'TS/1234/2014', 12, '4.9', 'Approved', 8, 'Road No. 12, Banjara Hills, Hyderabad', 'Civil litigation, corporate writs, and property title dispute settlements.', '["English","Telugu","Hindi"]'::jsonb, 42, 1500, 'Online', 'HDFC Bank Ltd', '50100234567890', 'HDFC0001234', '2024-03-10'),
      ('l_002', 'usr_l_002', 'Adv. Srinivas Chowdary', 'srinivas.chowdary@courtlaw.in', '+91 98490 11223', 'Criminal', 'Criminal Defense Advocate', 'Hyderabad', '["Hyderabad"]'::jsonb, 'Gachibowli', 'TS/5678/2012', 14, '4.8', 'Approved', 11, 'Plot 45, Telecom Nagar, Gachibowli, Hyderabad', 'Courtroom experience in anticipatory bails, economic offences, and criminal revisions.', '["English","Telugu"]'::jsonb, 38, 2000, 'Online', 'State Bank of India', '38920194829', 'SBIN0004812', '2024-05-18'),
      ('l_003', 'usr_l_003', 'Adv. Sailaja Naidu', 'sailaja.naidu@familylaw.org', '+91 98220 33445', 'Family', 'Family & Matrimonial Advocate', 'Visakhapatnam', '["Visakhapatnam"]'::jsonb, 'MVP Colony', 'AP/9102/2016', 9, '4.9', 'Approved', 6, 'Sector 3, MVP Colony, Visakhapatnam', 'Expert counsel in divorce mediation, child custody, and domestic disputes.', '["English","Telugu"]'::jsonb, 29, 1200, 'Online', 'ICICI Bank', '192801948201', 'ICIC0000281', '2024-08-22'),
      ('l_004', 'usr_l_004', 'Adv. Ananya Rao', 'ananya.rao@corplaw.in', '+91 98111 22334', 'Corporate', 'Corporate & M&A Specialist', 'Bengaluru', '["Bengaluru"]'::jsonb, 'Indiranagar', 'KAR/3421/2015', 11, '4.9', 'Approved', 9, '100 Feet Road, Indiranagar, Bengaluru', 'Corporate restructuring, venture funding agreements, commercial arbitration.', '["English","Kannada","Hindi"]'::jsonb, 51, 2500, 'Online', 'Axis Bank', '9180200482910', 'UTIB0000421', '2024-02-15'),
      ('l_005', 'usr_l_005', 'Adv. Rajeshwar Rao', 'rajeshwar.rao@propertylaw.in', '+91 98444 55667', 'Property', 'Property & Revenue Law Specialist', 'Hyderabad', '["Hyderabad"]'::jsonb, 'Jubilee Hills', 'TS/7891/2010', 16, '4.8', 'Approved', 14, 'Road No. 36, Jubilee Hills, Hyderabad', 'Specialized in land acquisition, partition suits, title search, and High Court writs.', '["English","Telugu"]'::jsonb, 67, 1800, 'Online', 'State Bank of India', '20194829104', 'SBIN0001048', '2023-11-20'),
      ('l_006', 'usr_l_006', 'Adv. Meera Nambiar', 'meera.nambiar@cyberlaw.in', '+91 98777 88990', 'Cyber', 'Cyber Crime & Data Privacy Counsel', 'Chennai', '["Chennai"]'::jsonb, 'T. Nagar', 'TN/2049/2018', 8, '4.7', 'Approved', 5, 'G.N. Chetty Road, T. Nagar, Chennai', 'Handling cyber fraud, online defamation, digital evidence authentication under Section 65B.', '["English","Tamil","Malayalam"]'::jsonb, 24, 1500, 'Online', 'HDFC Bank', '50100482910492', 'HDFC0000192', '2024-06-10')
      ON CONFLICT (id) DO NOTHING;

      -- Subscription Plans Catalog
      INSERT INTO public.subscription_plans (id, label, price, cadence, badge, audience, description, features, active) VALUES
      ('free', 'Free', 0, '', NULL, 'For getting started', 'Browse verified advocates and file cases manually, at your own pace.', '["Manual advocate search & selection","File up to 2 active cases","Standard case tracking","Community support"]'::jsonb, 'true'),
      ('monthly', 'Monthly', 499, '/month', 'Popular', 'For active matters', 'Priority admin-assigned advocate support, billed every month.', '["Auto-dispatch to top verified specialists","Priority admin allocation & case tracking","Unlimited active cases","Priority support"]'::jsonb, 'true'),
      ('yearly', 'Yearly', 4999, '/year', 'Save 17%', 'For long-term needs', 'Priority admin-assigned advocate support, billed once a year.', '["Everything in Monthly","2 months free vs monthly billing","Dedicated case manager","Early access to new features"]'::jsonb, 'true')
      ON CONFLICT (id) DO NOTHING;

      -- Legal Cases (Includes eCourts canonical case DLND020047882015 from case_structure.json)
      INSERT INTO public.cases (id, cnr, title, description, category, citizen_id, citizen_name, lawyer_id, lawyer_name, status, city, source, is_emergency, practice_area, specialization, legal_service, case_details, entity_info, files, descriptions, timeline, created_at, updated_at) VALUES
      ('CUC-20260831154512', 'TSHC010022112026', 'Sai Teja Reddy vs. ABC Developers Pvt Ltd', 'Delay in apartment handover and violation of RERA sanctioned plan in Kondapur project.', 'Property', 'u_001', 'Sai Teja Reddy', 'l_001', 'Adv. Swathi Reddy', 'In Progress', 'Hyderabad', 'manual', false, 'Real Estate & RERA', 'Possession Delay', 'File RERA Dispute Notice', '{"cnr":"TSHC010022112026","caseNumber":"CC/248/2026","courtName":"City Civil Court, Hyderabad","petitioners":["Sai Teja Reddy"],"respondents":["ABC Developers Pvt Ltd"]}'::jsonb, '{"cnr":"TSHC010022112026","dateCreated":"2026-08-31T15:45:12Z","dateModified":"2026-09-03T14:15:00Z"}'::jsonb, '{"files":[]}'::jsonb, '{"enumFields":[],"enumLookup":{}}'::jsonb, '[{"id":"tl_1","status":"Pending","at":"2026-08-31","time":"3:45 PM","note":"Case filed by citizen"},{"id":"tl_2","status":"Assigned","at":"2026-09-01","time":"11:30 AM","note":"Assigned to Adv. Swathi Reddy"},{"id":"tl_3","status":"In Progress","at":"2026-09-03","time":"2:15 PM","note":"Notice served"}]'::jsonb, '2026-08-31', '2026-09-03'),
      ('CUC-20260902112040', 'APVK020001172026', 'Lakshmi Prasanna vs. State of AP & Ors', 'Anticipatory bail petition in connection with commercial dispute.', 'Criminal', 'u_002', 'Lakshmi Prasanna', 'l_002', 'Adv. Srinivas Chowdary', 'Under Review', 'Visakhapatnam', 'manual', true, 'Criminal Defense', 'Anticipatory Bail', 'File Anticipatory Bail Application', '{"cnr":"APVK020001172026","caseNumber":"BAIL/117/2026","courtName":"District & Sessions Court, Visakhapatnam","petitioners":["Lakshmi Prasanna"],"respondents":["State of AP & Ors"]}'::jsonb, '{"cnr":"APVK020001172026","dateCreated":"2026-09-02T11:20:40Z","dateModified":"2026-09-02T13:00:00Z"}'::jsonb, '{"files":[]}'::jsonb, '{"enumFields":[],"enumLookup":{}}'::jsonb, '[{"id":"tl_4","status":"Pending","at":"2026-09-02","time":"11:20 AM","note":"Emergency case created"},{"id":"tl_5","status":"Under Review","at":"2026-09-02","time":"1:00 PM","note":"FIR records reviewed"}]'::jsonb, '2026-09-02', '2026-09-02'),
      ('CUC-20260904093015', 'TSFC050000892026', 'Divya Sri Chowdary vs. K. Ramesh', 'Mutual consent divorce petition with agreed child custody and asset division.', 'Family', 'u_003', 'Divya Sri Chowdary', 'l_003', 'Adv. Sailaja Naidu', 'Submitted', 'Hyderabad', 'manual', false, 'Family & Matrimonial', 'Mutual Consent Divorce', 'File First Motion Application', '{"cnr":"TSFC050000892026","caseNumber":"FC/89/2026","courtName":"Family Court, Hyderabad","petitioners":["Divya Sri Chowdary"],"respondents":["K. Ramesh"]}'::jsonb, '{"cnr":"TSFC050000892026","dateCreated":"2026-09-04T09:30:15Z","dateModified":"2026-09-04T09:30:15Z"}'::jsonb, '{"files":[]}'::jsonb, '{"enumFields":[],"enumLookup":{}}'::jsonb, '[{"id":"tl_6","status":"Submitted","at":"2026-09-04","time":"9:30 AM","note":"Draft petition uploaded"}]'::jsonb, '2026-09-04', '2026-09-04'),
      ('CUC-ECOURT-DLND020047882015', 'DLND020047882015', 'MR.ARUN JAITLEY vs MR. ARVIND KEJRIWAL', 'Criminal complaint case under Criminal Procedure Code before Chief Metropolitan Magistrate, New Delhi, PHC.', 'Criminal', 'u_001', 'Sai Teja Reddy', 'l_002', 'Adv. Srinivas Chowdary', 'Disposed', 'New Delhi', 'ecourt', false, 'Criminal Law/Other Criminal Matters', 'Plaintiff/Petitioner Evidence', 'Criminal Procedure Code',
      '{"caseNumber":"202400248072016","district":"New Delhi","state":"DL","stateCode":"26","districtCode":"7","courtCode":2,"caseTypeSub":"Criminal Procedure Code.","courtName":"Chief Metropolitan Magistrate, New Delhi, PHC","courtNo":2,"firDetails":{"caseNumber":"273","policeStation":"Central Crime Branch-CCB I","year":"2018"},"filedDocuments":[],"subordinateCourt":{},"linkCases":[],"purpose":"Plaintiff/Petitioner Evidence","disposalType":"DISMISSED_AS_WITHDRAWN","disposalTypeRaw":"DISMISSED AS WITHDRAWN","contestedStatus":"UNCONTESTED","lastHearingDate":"2018-07-07","cnr":"DLND020047882015","cnrCourtCode":"DLND02","courtComplexCode":"DLND02","cnrCaseNumber":"0047882015","cnrYear":"2015","caseType":"CC","caseTypeRaw":"Ct Cases","caseStatus":"DISPOSED","filingNumber":"27843/2015","filingDate":"2015-12-21","registrationNumber":"24807/2016","registrationDate":"2015-12-21","firstHearingDate":"2016-01-05","nextHearingDate":"2018-07-07","decisionDate":"2018-07-07","caseDurationDays":929,"filingToFirstHearingDays":15,"judges":[],"petitioners":["MR.ARUN JAITLEY"],"petitionerAdvocates":[],"respondents":["MR. ARVIND KEJRIWAL"],"respondentAdvocates":[],"caseCategoryFacetPath":"Criminal Law/Other Criminal Matters","hasOrders":true,"hasJudgments":true,"orderCount":10,"interimOrderCount":9,"judgmentCount":1,"hearingCount":25,"iaCount":0,"taggedMatters":[{"type":"Case Number","caseNumber":"CRLMP/33524/2024"}],"earlierCourtDetails":[],"interlocutoryApplications":[],"listingDates":[],"notices":[],"caveatDetails":[]}'::jsonb,
      '{"cnr":"DLND020047882015","nextDateOfHearing":"2018-07-07T00:00:00Z","lastDateOfHearing":"2018-07-07T00:00:00Z","dateCreated":"2026-02-18T15:33:18.064345Z","dateModified":"2026-05-01T09:38:35.670942Z"}'::jsonb,
      '{"files":[]}'::jsonb,
      '{"enumFields":["caseType","caseStatus","courtCode","judicialSection","caseCategory","benchType","stateCode"],"enumLookup":{"caseType":{"CC":"Criminal Complaint Case"},"caseStatus":{"DISPOSED":"Disposed"},"courtCode":{"DLND02":"Chief Metropolitan Magistrate, New Delhi, PHC"}}}'::jsonb,
      '[{"id":"tl_ec_1","status":"Disposed","at":"2018-07-07","time":"11:00 AM","note":"DISMISSED AS WITHDRAWN by Addl. Chief Metropolitan Magistrate"}]'::jsonb,
      '2015-12-21', '2018-07-07')
      ON CONFLICT (id) DO NOTHING;

      -- Case Hearings & Orders
      INSERT INTO public.case_hearings (id, case_id, judge, business_on_date, hearing_date, time, purpose_of_listing) VALUES
      ('h_101', 'CUC-20260831154512', 'Hon''ble Judicial Member RERA', '2026-09-10', '2026-09-28', '11:30 AM', 'Respondent Appearance and Counter Filing'),
      ('h_ec_1', 'CUC-ECOURT-DLND020047882015', 'Chief Metropolitan Magistrate', '2016-01-05', '2016-04-07', '10:30 AM', 'Misc./ Appearance'),
      ('h_ec_2', 'CUC-ECOURT-DLND020047882015', 'Chief Metropolitan Magistrate', '2016-04-07', '2016-05-19', '10:30 AM', 'Misc./ Appearance'),
      ('h_ec_3', 'CUC-ECOURT-DLND020047882015', 'Chief Metropolitan Magistrate', '2016-10-24', '2016-11-26', '11:00 AM', 'Misc. Arguments'),
      ('h_ec_4', 'CUC-ECOURT-DLND020047882015', 'Chief Metropolitan Magistrate', '2018-01-02', '2018-02-08', '11:30 AM', 'Prosecution Evidence'),
      ('h_ec_5', 'CUC-ECOURT-DLND020047882015', 'Addl. Chief Metropolitan Magistrate', '2018-05-19', '2018-07-07', '11:00 AM', 'Plaintiff/Petitioner Evidence'),
      ('h_ec_6', 'CUC-ECOURT-DLND020047882015', 'Addl. Chief Metropolitan Magistrate', '2018-07-07', NULL, '12:00 PM', 'Disposed — DISMISSED AS WITHDRAWN')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.case_orders (id, case_id, order_date, order_type, description, order_url) VALUES
      ('ord_1', 'CUC-ECOURT-DLND020047882015', '2017-10-27', 'INTERIM', 'COPY OF ORDER', 'order-1.pdf'),
      ('ord_2', 'CUC-ECOURT-DLND020047882015', '2017-12-15', 'INTERIM', 'COPY OF ORDER', 'order-2.pdf'),
      ('ord_3', 'CUC-ECOURT-DLND020047882015', '2018-01-02', 'INTERIM', 'COPY OF ORDER', 'order-4.pdf'),
      ('ord_4', 'CUC-ECOURT-DLND020047882015', '2018-03-01', 'INTERIM', 'COPY OF JUDICIAL PROCEEDINGS', 'order-7.pdf'),
      ('ord_5', 'CUC-ECOURT-DLND020047882015', '2018-07-07', 'JUDGMENT', 'COPY OF FINAL ORDER / JUDGMENT', 'order-10.pdf')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.case_notes (id, case_id, text, author, created_at) VALUES
      ('note_101', 'CUC-20260831154512', 'Client submitted original payment receipts and developer allotment letter.', 'Adv. Swathi Reddy', '2026-09-02T14:00:00'),
      ('note_ec_1', 'CUC-ECOURT-DLND020047882015', 'Imported canonical matter DLND020047882015 from eCourts record.', 'Adv. Srinivas Chowdary', '2018-07-07T14:00:00')
      ON CONFLICT (id) DO NOTHING;

      -- Subscriptions
      INSERT INTO public.subscriptions (id, citizen_id, plan_id, plan_label, amount, started_at, status, case_id) VALUES
      ('sub_101', 'u_001', 'monthly', 'Monthly Auto-Assign Plan', 499, '2026-08-30', 'Active', 'CUC-20260831154512'),
      ('sub_102', 'u_002', 'yearly', 'Annual Premium Plan', 4999, '2026-09-01', 'Active', 'CUC-20260902112040')
      ON CONFLICT (id) DO NOTHING;

      -- Payments
      INSERT INTO public.payments (id, source, date, status, citizen_id, citizen_name, gross_amount, platform_amount, lawyer_amount, razorpay_order_id, razorpay_payment_id) VALUES
      ('pay_101', 'subscription', '2026-08-30', 'Completed', 'u_001', 'Sai Teja Reddy', 499, 499, 0, 'order_mock_101', 'pay_mock_101'),
      ('pay_102', 'consultation', '2026-09-01', 'Completed', 'u_001', 'Sai Teja Reddy', 1500, 300, 1200, 'order_mock_102', 'pay_mock_102'),
      ('pay_103', 'commission', '2026-09-02', 'Completed', 'u_002', 'Lakshmi Prasanna', 5000, 1000, 4000, 'order_mock_103', 'pay_mock_103')
      ON CONFLICT (id) DO NOTHING;

      -- Withdrawal Requests
      INSERT INTO public.withdrawal_requests (id, lawyer_id, lawyer_name, amount, requested_at, status, bank_name, account_number, ifsc_code, processed_at, reference_id) VALUES
      ('w_101', 'l_001', 'Swathi Reddy', 12240, '2026-09-02', 'Approved', 'HDFC Bank Ltd', '•••• 4829', 'HDFC0001234', '2026-09-03', 'TXN_94820194'),
      ('w_102', 'l_002', 'Srinivas Chowdary', 8500, '2026-09-06', 'Pending', 'State Bank of India', '•••• 9102', 'SBIN0004812', NULL, NULL),
      ('w_103', 'l_003', 'Sailaja Naidu', 15400, '2026-09-07', 'Pending', 'ICICI Bank', '•••• 3391', 'ICIC0000281', NULL, NULL)
      ON CONFLICT (id) DO NOTHING;

      -- Chat Messages
      INSERT INTO public.chat_messages (id, case_id, sender, sender_name, text, read, at) VALUES
      ('msg_001', 'CUC-20260831154512', 'citizen', 'Sai Teja Reddy', 'Hello Adv. Swathi, I have uploaded the apartment sale deed and the developer builder allotment letter.', true, '2026-09-01T10:00:00Z'),
      ('msg_002', 'CUC-20260831154512', 'lawyer', 'Adv. Swathi Reddy', 'Thank you Sai Teja. I have reviewed the allotment clause 14. The developer is clearly in breach of the 24-month handover deadline under Section 18 of RERA.', true, '2026-09-01T10:15:00Z'),
      ('msg_003', 'CUC-20260831154512', 'citizen', 'Sai Teja Reddy', 'Should we file an interim injunction or claim interest for the 18 months delay?', false, '2026-09-01T10:30:00Z'),
      ('msg_004', 'CUC-20260831154512', 'lawyer', 'Adv. Swathi Reddy', 'We will claim statutory interest under Section 18(1) proviso, plus compensation for structural deviations. I have drafted the petition.', false, '2026-09-01T10:45:00Z')
      ON CONFLICT (id) DO NOTHING;

      -- Contact Inquiries
      INSERT INTO public.contact_inquiries (id, name, email, category, subject, message, status) VALUES
      ('inq_001', 'Vikramaditya Construction Ltd', 'legal@vikramaditya.in', 'corporate', 'Corporate Empanelment Inquiry', 'We would like to empanel our company legal matters on CloseUrCase platform for nationwide dispute management.', 'New'),
      ('inq_002', 'Radha Krishna Rao', 'radha.krishna@gmail.com', 'general', 'Query regarding property verification in Hyderabad', 'Can I hire an advocate specifically for search report and title investigation?', 'New')
      ON CONFLICT (id) DO NOTHING;

      -- AI Case Analyses
      INSERT INTO public.ai_case_analyses (id, case_id, type, input_prompt, response_content) VALUES
      ('ai_001', 'CUC-20260831154512', 'counter_argument', 'Developer claims force majeure due to supply shortages and municipal delays', '{"counterText":"Force majeure defence under RERA Section 6 requires notification within 30 days of impediment and cannot excuse commercially foreseeable delays. (Pioneer Urban v. Govindan, 2019).","authorities":["RERA Act 2016 Section 6 & 18","Pioneer Urban Land and Infrastructure Ltd. v. Govindan Raghavan (2019) 5 SCC 725"],"confidenceScore":95}'::jsonb)
      ON CONFLICT (id) DO NOTHING;

      -- Video Calls
      INSERT INTO public.video_calls (id, case_id, channel_name, with_name, caller_id, receiver_id, at, duration_seconds, status, role) VALUES
      ('vc_101', 'CUC-20260831154512', 'case_CUC-20260831154512', 'Adv. Swathi Reddy', 'u_001', 'l_001', '2026-09-01T15:30:00Z', 1420, 'completed', 'citizen'),
      ('vc_102', 'CUC-20260902112040', 'case_CUC-20260902112040', 'Adv. Srinivas Chowdary', 'u_002', 'l_002', '2026-09-02T17:00:00Z', 980, 'completed', 'citizen')
      ON CONFLICT (id) DO NOTHING;

      -- Knowledge Items
      INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at) VALUES
      ('kb_1', 'Bharatiya Nyaya Sanhita (BNS) 2023 Overview', 'Act', 'Criminal', '2.4 MB', 'https://closeurcase.app/docs/bns-2023.pdf', 'bns-2023.pdf', 'application/pdf', '2026-01-15'),
      ('kb_2', 'Real Estate (Regulation and Development) Act, 2016', 'Act', 'Property', '1.8 MB', 'https://closeurcase.app/docs/rera-act.pdf', 'rera-act.pdf', 'application/pdf', '2026-02-10')
      ON CONFLICT (id) DO NOTHING;

      -- Notifications
      INSERT INTO public.app_notifications (id, role, title, body, at, read) VALUES
      ('notif_1', 'citizen', 'Hearing Scheduled', 'Your case CUC-20260831154512 has a hearing scheduled on 28 Sep 2026.', '2026-09-10T11:30:00Z', false),
      ('notif_2', 'admin', 'New Withdrawal Request', 'Adv. Srinivas Chowdary submitted a payout request of ₹8,500.', '2026-09-06T10:00:00Z', false),
      ('notif_3', 'lawyer', 'Withdrawal Approved', 'Your payout of ₹12,240 was approved and processed via TXN_94820194.', '2026-09-03T16:45:00Z', true)
      ON CONFLICT (id) DO NOTHING;
    `;

    await client.unsafe(seedSql);
    console.log("Mockup seed data inserted successfully into Supabase!");

    return {
      success: true,
      message: "Database schema verified and mockup seed data populated successfully!",
    };
  }
}
