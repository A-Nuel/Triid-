-- Atomic function for Job Acceptance (PRD 16.3)
-- Ensures that only one artisan can claim a job via compare-and-set
CREATE OR REPLACE FUNCTION accept_job_atomic(p_job_id UUID, p_artisan_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows_updated INTEGER;
BEGIN
    UPDATE jobs
    SET artisan_id = p_artisan_id, status = 'matched', accepted_at = NOW()
    WHERE id = p_job_id AND artisan_id IS NULL;
    
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    
    IF v_rows_updated = 0 THEN
        RETURN FALSE; -- Job was already taken or doesn't exist
    END IF;
    
    RETURN TRUE;
END;
$$;


-- Atomic function for Job Confirmation & Escrow Release (PRD 16.1)
-- Ensures job status, ledger entry, and wallet balance are updated together
CREATE OR REPLACE FUNCTION confirm_job_completion_atomic(
    p_job_id UUID,
    p_artisan_id UUID,
    p_release_amount NUMERIC,
    p_paystack_ref TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_balance NUMERIC;
BEGIN
    -- 1. Lock the wallet row
    SELECT available_balance INTO v_current_balance 
    FROM wallets 
    WHERE artisan_id = (SELECT id FROM artisan_profiles WHERE user_id = p_artisan_id) 
    FOR UPDATE;

    -- If no wallet found for artisan (they might be new without a wallet), we must handle it. V1 assumption is wallet is created on signup.
    -- For safety, we will just proceed, but we should ensure the artisan profile exists.
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for artisan user_id: %', p_artisan_id;
    END IF;

    -- 2. Update job status
    UPDATE jobs 
    SET status = 'confirmed', confirmed_at = NOW() 
    WHERE id = p_job_id AND status = 'completed';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job % is not in completed state or does not exist', p_job_id;
    END IF;

    -- 3. Insert escrow release
    INSERT INTO escrow_transactions (job_id, type, amount, balance_after, paystack_ref)
    VALUES (p_job_id, 'final_release', p_release_amount, v_current_balance + p_release_amount, p_paystack_ref);

    -- 4. Update wallet balance
    UPDATE wallets 
    SET available_balance = available_balance + p_release_amount 
    WHERE artisan_id = (SELECT id FROM artisan_profiles WHERE user_id = p_artisan_id);

    RETURN TRUE;
END;
$$;
