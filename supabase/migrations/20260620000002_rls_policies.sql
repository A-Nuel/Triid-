-- Enable Row-Level Security on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artisan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES ----------------------------------------------------
-- Users can see their own profile
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- (Optional) Artisans and residents can see basic info of each other if connected. 
-- For V1 we allow authenticated users to see basic user info for matching.
CREATE POLICY "Authenticated users can view others" 
ON users FOR SELECT 
USING (auth.role() = 'authenticated');

-- ARTISAN PROFILES POLICIES -----------------------------------------------
-- Anyone can view public artisan profiles
CREATE POLICY "Anyone can view artisan profiles" 
ON artisan_profiles FOR SELECT 
USING (true);

-- Artisans can update their own profile (linking artisan_profiles.user_id = auth.uid())
CREATE POLICY "Artisans can update own profile" 
ON artisan_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- JOBS TABLE POLICIES -----------------------------------------------------
-- Residents can view and update their own created jobs
CREATE POLICY "Residents can view own jobs" 
ON jobs FOR SELECT 
USING (auth.uid() = resident_id);

CREATE POLICY "Residents can insert own jobs" 
ON jobs FOR INSERT 
WITH CHECK (auth.uid() = resident_id);

CREATE POLICY "Residents can update own jobs" 
ON jobs FOR UPDATE 
USING (auth.uid() = resident_id);

-- Artisans can view jobs assigned to them, OR pending jobs in their community
CREATE POLICY "Artisans can view relevant jobs" 
ON jobs FOR SELECT 
USING (
  auth.uid() = artisan_id 
  OR (status = 'pending' OR status = 'matched') -- Matched temporarily until they accept/reject
);

-- WALLETS POLICIES --------------------------------------------------------
-- Artisans can only view their own wallet
CREATE POLICY "Artisans can view own wallet" 
ON wallets FOR SELECT 
USING (
  artisan_id = (SELECT id FROM artisan_profiles WHERE user_id = auth.uid())
);

-- Escrow transactions are viewable by the involved artisan or resident
CREATE POLICY "Involved parties can view escrow transactions" 
ON escrow_transactions FOR SELECT 
USING (
  job_id IN (
    SELECT id FROM jobs WHERE resident_id = auth.uid() OR artisan_id = auth.uid()
  )
);
