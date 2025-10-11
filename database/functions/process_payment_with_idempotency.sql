-- Create idempotent payment processing function
-- Matches actual payment_transactions table structure
CREATE OR REPLACE FUNCTION process_payment_with_idempotency(
    p_stripe_session_id TEXT,
    p_user_id TEXT, -- Changed to TEXT to match table
    p_plan_id TEXT,
    p_amount DECIMAL,
    p_credits_to_add INTEGER DEFAULT 0
)dempotent payment processing function (updated for existing schema)
CREATE OR REPLACE FUNCTION process_payment_with_idempotency(
    p_stripe_session_id TEXT,
    p_user_id UUID,
    p_plan_id TEXT,
    p_amount DECIMAL,
    p_currency TEXT DEFAULT 'usd',
    p_credits_to_add INTEGER DEFAULT 0,
    p_payment_method TEXT DEFAULT 'card',
    p_source TEXT DEFAULT 'webhook'
)
RETURNS TABLE(
    payment_id UUID,
    was_duplicate BOOLEAN,
    credits_added INTEGER,
    new_total_credits INTEGER,
    new_remaining_credits INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    existing_payment_id UUID;
    new_payment_id UUID;
    current_credits RECORD;
BEGIN
    -- Check if payment already exists (idempotency check)
    -- Only use stripe_session_id since payment_intent_id column doesn't exist yet
    SELECT id INTO existing_payment_id
    FROM payment_transactions 
    WHERE stripe_session_id = p_stripe_session_id;
    
    IF existing_payment_id IS NOT NULL THEN
        -- Payment already processed, return existing data
        SELECT total_credits, remaining_credits
        INTO current_credits
        FROM user_credits
        WHERE user_id = p_user_id;
        
        RETURN QUERY SELECT 
            existing_payment_id,
            true as was_duplicate,
            0 as credits_added,
            COALESCE(current_credits.total_credits, 0) as new_total_credits,
            COALESCE(current_credits.remaining_credits, 0) as new_remaining_credits;
        RETURN;
    END IF;
    
    -- Create new payment record (without stripe_payment_intent_id for now)
    INSERT INTO payment_transactions (
        id,
        user_id,
        plan_id,
        amount,
        currency,
        status,
        stripe_session_id,
        credits_added,
        payment_method,
        source,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        p_plan_id,
        p_amount,
        p_currency,
        'completed',
        p_stripe_session_id,
        p_credits_to_add,
        p_payment_method,
        p_source,
        NOW()
    ) RETURNING id INTO new_payment_id;
    
    -- Add credits to user account
    INSERT INTO user_credits (user_id, total_credits, remaining_credits, used_credits, created_at, updated_at)
    VALUES (p_user_id, p_credits_to_add, p_credits_to_add, 0, NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET
        total_credits = user_credits.total_credits + p_credits_to_add,
        remaining_credits = user_credits.remaining_credits + p_credits_to_add,
        last_payment_at = NOW(),
        updated_at = NOW();
    
    -- Get updated credit balance
    SELECT total_credits, remaining_credits
    INTO current_credits
    FROM user_credits
    WHERE user_id = p_user_id;
    
    -- Return success result
    RETURN QUERY SELECT 
        new_payment_id,
        false as was_duplicate,
        p_credits_to_add as credits_added,
        current_credits.total_credits as new_total_credits,
        current_credits.remaining_credits as new_remaining_credits;
END;
$$;