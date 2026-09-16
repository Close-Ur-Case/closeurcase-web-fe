-- ==============================================================================
-- CloseUrCase Database Schema Migration
-- ==============================================================================

-- 1. Users & Profiles
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

-- 2. Legal Cases & Details
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

-- 3. Subscriptions & Payments (Razorpay)
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


-- 4. Agora Video Calling & Notifications
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

-- 5. Master Data Taxonomies
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

-- Indexes for performance & eCourts queries
CREATE INDEX IF NOT EXISTS idx_cases_cnr ON public.cases (cnr);
CREATE INDEX IF NOT EXISTS idx_cases_citizen_id ON public.cases (citizen_id);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON public.cases (lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases (status);
CREATE INDEX IF NOT EXISTS idx_cases_category ON public.cases (category);
CREATE INDEX IF NOT EXISTS idx_cases_case_details ON public.cases USING gin (case_details);
CREATE INDEX IF NOT EXISTS idx_cases_entity_info ON public.cases USING gin (entity_info);
CREATE INDEX IF NOT EXISTS idx_case_hearings_case_id ON public.case_hearings (case_id);
CREATE INDEX IF NOT EXISTS idx_case_orders_case_id ON public.case_orders (case_id);

