-- Update the verification_status enum
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'unverified' BEFORE 'pending';
ALTER TYPE verification_status RENAME VALUE 'rejected' TO 'failed';

-- Update the default of artisan_profiles.verification_status
ALTER TABLE artisan_profiles ALTER COLUMN verification_status SET DEFAULT 'unverified'::verification_status;
UPDATE artisan_profiles SET verification_status = 'unverified' WHERE verification_status IS NULL;

-- Create the identity_verifications table
CREATE TABLE IF NOT EXISTS identity_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id UUID UNIQUE REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_reference TEXT NOT NULL,
    name_match BOOLEAN NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for identity_verifications
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisans can view their own identity verifications"
    ON identity_verifications FOR SELECT
    USING ( artisan_id IN (SELECT id FROM artisan_profiles WHERE user_id = auth.uid()) );
