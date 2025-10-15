-- Database function to handle payment processing with idempotency
-- This prevents duplicate payments even with concurrent requests

CREATE OR REPLACE FUNCTION process_payment_with_idempotency(
    p_stripe_session_id TEXT,
    p_stripe_payment_intent_id TEXT DEFAULT NULL,
    p_user_id UUID,
    p_plan_id TEXT,
    p_amount DECIMAL,
    p_currency TEXT,
    p_credits_to_add INTEGER,
    p_payment_method TEXT DEFAULT 'card',
    p_source TEXT DEFAULT 'webhook'
) 
RETURNS TABLE(
    payment_id UUID,
    credits_added INTEGER,
    was_duplicate BOOLEAN,
    new_total_credits INTEGER,
    new_remaining_credits INTEGER
) AS $$
DECLARE
    existing_payment_id UUID;
    existing_status TEXT;
    user_current_total INTEGER;
    user_current_remaining INTEGER;
    user_current_used INTEGER;
    new_payment_id UUID;
BEGIN
    -- Lock the user row to prevent concurrent modifications
    PERFORM pg_advisory_xact_lock(('x' || substr(p_user_id::text, 1, 8))::bit(32)::int);
    
    -- Check for existing payment by session_id (primary key)
    SELECT id, status INTO existing_payment_id, existing_status
    FROM payment_transactions 
    WHERE stripe_session_id = p_stripe_session_id;
    
    -- If payment exists and is completed, return existing data
    IF existing_payment_id IS NOT NULL AND existing_status = 'completed' THEN
        -- Get current user credits for response
        SELECT 
            COALESCE(total_credits, 0),
            COALESCE(remaining_credits, 0),
            COALESCE(used_credits, 0)
        INTO user_current_total, user_current_remaining, user_current_used
        FROM user_credits 
        WHERE user_id = p_user_id;
        
        RETURN QUERY SELECT 
            existing_payment_id,
            p_credits_to_add,
            TRUE as was_duplicate,
            user_current_total,
            user_current_remaining;
        RETURN;
    END IF;
    
    -- If payment exists but is pending, update it to completed
    IF existing_payment_id IS NOT NULL AND existing_status != 'completed' THEN
        UPDATE payment_transactions 
        SET 
            status = 'completed',
            credits_added = p_credits_to_add,
            updated_at = CURRENT_TIMESTAMP,
            stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id)
        WHERE id = existing_payment_id;
        
        new_payment_id := existing_payment_id;
    ELSE
        -- Create new payment transaction
        INSERT INTO payment_transactions (
            id,
            user_id,
            stripe_session_id,
            stripe_payment_intent_id,
            plan_id,
            amount,
            currency,
            credits_added,
            payment_method,
            status,
            source,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            p_stripe_session_id,
            p_stripe_payment_intent_id,
            p_plan_id,
            p_amount,
            p_currency,
            p_credits_to_add,
            p_payment_method,
            'completed',
            p_source,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO new_payment_id;
    END IF;
    
    -- Get current user credits
    SELECT 
        COALESCE(total_credits, 0),
        COALESCE(remaining_credits, 0),
        COALESCE(used_credits, 0)
    INTO user_current_total, user_current_remaining, user_current_used
    FROM user_credits 
    WHERE user_id = p_user_id;
    
    -- If no user credits record exists, create it
    IF user_current_total IS NULL THEN
        INSERT INTO user_credits (
            user_id,
            total_credits,
            remaining_credits,
            used_credits,
            last_payment_at,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            p_credits_to_add,
            p_credits_to_add,
            0,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        user_current_total := p_credits_to_add;
        user_current_remaining := p_credits_to_add;
    ELSE
        -- Update existing user credits (only if this isn't a duplicate)
        IF existing_payment_id IS NULL OR existing_status != 'completed' THEN
            UPDATE user_credits 
            SET 
                total_credits = user_current_total + p_credits_to_add,
                remaining_credits = user_current_remaining + p_credits_to_add,
                last_payment_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = p_user_id;
            
            user_current_total := user_current_total + p_credits_to_add;
            user_current_remaining := user_current_remaining + p_credits_to_add;
        END IF;
    END IF;
    
    -- Return results
    RETURN QUERY SELECT 
        new_payment_id,
        p_credits_to_add,
        (existing_payment_id IS NOT NULL AND existing_status = 'completed') as was_duplicate,
        user_current_total,
        user_current_remaining;
END;
$$ LANGUAGE plpgsql;

-- Create unique constraint to prevent duplicate sessions
ALTER TABLE payment_transactions 
ADD CONSTRAINT unique_stripe_session_id 
UNIQUE (stripe_session_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session_id 
ON payment_transactions (stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_intent_id 
ON payment_transactions (stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_status 
ON payment_transactions (user_id, status);

-- Add source column if it doesn't exist
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'webhook';

-- Update the existing use_credits function to be more robust
CREATE OR REPLACE FUNCTION use_credits_with_model(
    p_user_id UUID,
    p_credits_to_use INTEGER,
    p_feature TEXT,
    p_model_version TEXT,
    p_model_cost INTEGER,
    p_generation_type TEXT,
    p_details JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
DECLARE
    current_remaining INTEGER;
BEGIN
    -- Lock the user row to prevent race conditions
    PERFORM pg_advisory_xact_lock(('x' || substr(p_user_id::text, 1, 8))::bit(32)::int);
    
    -- Get current remaining credits
    SELECT COALESCE(remaining_credits, 0) 
    INTO current_remaining
    FROM user_credits 
    WHERE user_id = p_user_id
    FOR UPDATE; -- Lock the row
    
    -- Check if user has sufficient credits
    IF current_remaining < p_credits_to_use THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits atomically
    UPDATE public.user_credits uc
    SET 
        remaining_credits = uc.remaining_credits - p_credits_to_use,
        used_credits = COALESCE(uc.used_credits, 0) + p_credits_to_use,
        updated_at = CURRENT_TIMESTAMP
    WHERE uc.user_id = p_user_id;
    
    -- Log the usage
    INSERT INTO credit_usage_history (
        id,
        user_id,
        credits_used,
        feature,
        model_version,
        model_cost,
        generation_type,
        details,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        p_credits_to_use,
        p_feature,
        p_model_version,
        p_model_cost,
        p_generation_type,
        p_details,
        CURRENT_TIMESTAMP
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;