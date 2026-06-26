-- Add new statuses to job_status ENUM
-- Note: PostgreSQL allows adding values to ENUMs safely
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'offer_pending';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'offer_declined';

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_code TEXT NOT NULL UNIQUE,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    route TEXT,
    method TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for fast lookup by support team
CREATE INDEX IF NOT EXISTS idx_error_logs_code ON error_logs(error_code);
