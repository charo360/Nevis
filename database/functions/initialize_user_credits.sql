-- Function to initialize new user with default free credits
CREATE OR REPLACE FUNCTION initialize_user_credits(p_user_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    credits_granted INTEGER
) AS $$
DECLARE
    v_user_exists BOOLEAN;
    v_free_credits INTEGER := 20; -- Default free credits for new users
BEGIN
    -- Check if user already has credits record
    SELECT EXISTS(
        SELECT 1 FROM user_credits WHERE user_id = p_user_id
    ) INTO v_user_exists;
    
    -- If user doesn't exist, create record with free credits
    IF NOT v_user_exists THEN
        INSERT INTO user_credits (
            user_id,
            total_credits,
            remaining_credits,
            used_credits,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            v_free_credits,
            v_free_credits,
            0,
            NOW(),
            NOW()
        );
        
        -- Record the free credits as a "transaction"
        INSERT INTO payment_transactions (
            user_id,
            plan_id,
            amount,
            status,
            credits_added,
            stripe_session_id,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            'free_trial',
            0.00,
            'completed',
            v_free_credits,
            'free_credits_' || p_user_id,
            NOW(),
            NOW()
        );
        
        RETURN QUERY SELECT 
            TRUE as success,
            'Welcome! You have been granted ' || v_free_credits || ' free credits to try our AI agent.' as message,
            v_free_credits as credits_granted;
    ELSE
        RETURN QUERY SELECT 
            FALSE as success,
            'User already has credits initialized' as message,
            0 as credits_granted;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            FALSE as success,
            'Error initializing user credits: ' || SQLERRM as message,
            0 as credits_granted;
END;
$$ LANGUAGE plpgsql;