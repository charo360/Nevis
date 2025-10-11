-- Enhanced idempotent payment processing function
-- Uses both stripe_session_id and stripe_payment_intent_id for robust duplicate prevention
CREATE OR REPLACE FUNCTION process_payment_with_idempotency(
    p_stripe_session_id TEXT,
    p_stripe_payment_intent_id TEXT,
    p_user_id UUID,
    p_plan_id TEXT,
    p_amount DECIMAL,
    p_credits_to_add INTEGER DEFAULT 0
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
    -- Check if payment already exists using both identifiers for maximum safety
    SELECT id INTO existing_payment_id
    FROM payment_transactions 
    WHERE stripe_session_id = p_stripe_session_id 
       OR stripe_payment_intent_id = p_stripe_payment_intent_id;
    
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
    
    -- Create new payment record with all available identifiers
    INSERT INTO payment_transactions (
        id,
        user_id,
        stripe_session_id,
        stripe_payment_intent_id,
        plan_id,
        amount,
        status,
        credits_added,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        p_stripe_session_id,
        p_stripe_payment_intent_id,
        p_plan_id,
        p_amount,
        'completed',
        p_credits_to_add,
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
