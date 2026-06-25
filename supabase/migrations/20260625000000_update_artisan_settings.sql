-- Update artisan_profiles for settings
ALTER TABLE artisan_profiles
ADD COLUMN IF NOT EXISTS accepts_emergency BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS accepts_standard BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS availability_schedule JSONB DEFAULT '{
  "Mon-AM": true, "Mon-PM": true,
  "Tue-AM": true, "Tue-PM": true,
  "Wed-AM": true, "Wed-PM": false,
  "Thu-AM": false, "Thu-PM": true,
  "Fri-AM": true, "Fri-PM": true,
  "Sat-AM": false, "Sat-PM": false,
  "Sun-AM": false, "Sun-PM": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS portfolio_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS primary_category TEXT;
