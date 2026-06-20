-- Seed Demo Users securely into auth.users (using pgcrypto for password hash)
-- Resident
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, is_super_admin)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    '00000000-0000-0000-0000-000000000000', 
    'demo_resident@triid.app', 
    crypt('DemoPassword123!', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"full_name": "Jane (Resident)"}', 
    now(), now(), 'authenticated', false
) ON CONFLICT (id) DO NOTHING;

-- Artisan
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, is_super_admin)
VALUES (
    '22222222-2222-2222-2222-222222222222', 
    '00000000-0000-0000-0000-000000000000', 
    'demo_artisan@triid.app', 
    crypt('DemoPassword123!', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"full_name": "Chidi (Electrician)"}', 
    now(), now(), 'authenticated', false
) ON CONFLICT (id) DO NOTHING;

-- Insert into public.users
INSERT INTO users (id, email, full_name, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'demo_resident@triid.app', 'Jane (Resident)', 'resident'),
    ('22222222-2222-2222-2222-222222222222', 'demo_artisan@triid.app', 'Chidi (Electrician)', 'artisan')
ON CONFLICT (id) DO NOTHING;

-- Initialize Verified Artisan Profile
INSERT INTO artisan_profiles (user_id, skill_categories, bio, starting_price_min, starting_price_max, trust_tier, verification_status, average_rating, total_jobs_completed)
VALUES (
    '22222222-2222-2222-2222-222222222222', 
    ARRAY['electrical', 'plumbing'],
    'Expert electrician and general handyman with 10 years of experience in Redemption City. Fast and reliable!',
    5000, 
    20000, 
    'trusted', 
    'verified',
    4.9,
    15
) ON CONFLICT (user_id) DO NOTHING;

-- Seed historical dummy jobs
INSERT INTO jobs (id, resident_id, artisan_id, mode, category, description, status, estimated_amount, location, created_at)
VALUES 
    -- 1. Completed historical job 
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'scheduled', 'electrical', 'Fixed the faulty distribution board and replaced 3 sockets in the main hall.', 'confirmed', 15000, 'POINT(3.3857 6.5140)', NOW() - interval '3 days'),
    -- 2. Another historical emergency job
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'emergency', 'electrical', 'Partial power outage in the kitchen, fridge was going off.', 'confirmed', 8000, 'POINT(3.3857 6.5140)', NOW() - interval '1 day'),
    -- 3. ACTIVE JOB (pending/accepted) to immediately demonstrate workflow!
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'emergency', 'plumbing', 'Burst pipe in the bathroom, water is everywhere.', 'accepted', 12000, 'POINT(3.3857 6.5140)', NOW())
ON CONFLICT DO NOTHING;
