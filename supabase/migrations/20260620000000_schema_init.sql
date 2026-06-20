-- Enable PostGIS for geospatial matching
CREATE EXTENSION IF NOT EXISTS postgis;

-- Custom Enums
CREATE TYPE user_role AS ENUM ('resident', 'artisan', 'admin');
CREATE TYPE trust_tier AS ENUM ('new', 'vouched', 'trusted', 'pro');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE job_mode AS ENUM ('emergency', 'scheduled');
CREATE TYPE job_category AS ENUM ('electrical', 'plumbing', 'generator', 'vehicle', 'security', 'hvac', 'locksmith', 'other');
CREATE TYPE job_urgency AS ENUM ('low', 'medium', 'critical');
CREATE TYPE job_status AS ENUM ('pending', 'matched', 'accepted', 'in_progress', 'completed', 'confirmed', 'disputed', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('hold', 'advance_release', 'final_release', 'refund', 'dispute_hold', 'dispute_resolution');
CREATE TYPE vouch_relationship AS ENUM ('artisan_to_artisan', 'resident_to_artisan');
CREATE TYPE notif_channel AS ENUM ('in_app', 'push', 'sms');
CREATE TYPE sub_tier AS ENUM ('free', 'pro');

-- Tables
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region TEXT,
    country TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    community_id UUID REFERENCES communities(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE artisan_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    skill_categories TEXT[] NOT NULL DEFAULT '{}',
    bio TEXT,
    cover_photo_url TEXT,
    starting_price_min NUMERIC,
    starting_price_max NUMERIC,
    location GEOGRAPHY(Point),
    is_available BOOLEAN DEFAULT false,
    trust_tier trust_tier DEFAULT 'new',
    average_rating NUMERIC DEFAULT 0,
    total_jobs_completed INT DEFAULT 0,
    advance_withdrawal_limit_pct NUMERIC DEFAULT 0,
    verification_status verification_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
    artisan_id UUID REFERENCES users(id) ON DELETE SET NULL,
    community_id UUID REFERENCES communities(id),
    mode job_mode NOT NULL,
    category job_category NOT NULL,
    description TEXT NOT NULL,
    urgency job_urgency, -- null for scheduled
    status job_status DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ, -- null for emergency
    location GEOGRAPHY(Point) NOT NULL,
    estimated_amount NUMERIC,
    materials_estimate NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    matched_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ
);

CREATE TABLE escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    paystack_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id UUID REFERENCES artisan_profiles(id) ON DELETE CASCADE UNIQUE,
    available_balance NUMERIC DEFAULT 0,
    pending_balance NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vouches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    voucher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vouchee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    relationship vouch_relationship NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (voucher_id, vouchee_id, job_id)
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE UNIQUE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    artisan_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payload JSONB,
    channel notif_channel NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier sub_tier NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    paystack_ref TEXT
);

CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE artisan_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id UUID REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE artisan_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id UUID REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_available BOOLEAN DEFAULT true
);

CREATE TABLE saved_artisans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES users(id) ON DELETE CASCADE,
    artisan_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (resident_id, artisan_id)
);

-- Indexes (As Specified in PRD)
CREATE INDEX idx_artisan_profiles_loc ON artisan_profiles USING GIST (location);
CREATE INDEX idx_jobs_loc ON jobs USING GIST (location);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_community ON jobs(community_id);
CREATE INDEX idx_jobs_mode ON jobs(mode);
CREATE INDEX idx_vouches_vouchee ON vouches(vouchee_id);
CREATE INDEX idx_artisan_categories ON artisan_profiles USING GIN (skill_categories);

-- Update wallets function hook
CREATE OR REPLACE FUNCTION update_modified_column()   
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_modtime 
BEFORE UPDATE ON wallets 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Insert Demo Community
INSERT INTO communities (name, region, country) VALUES ('Redemption City', 'Ogun', 'Nigeria');
