-- Create enhanced credit deduction function with usage tracking
-- This function atomically deducts credits and records usage history

CREATE OR REPLACE FUNCTION deduct_credits_with_tracking(
    p_user_id UUID,
    p_credits_used INTEGER,
    p_model_version TEXT,
    p_feature TEXT,
    p_generation_type TEXT DEFAULT 'standard',
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    remaining_credits INTEGER,
    usage_id UUID
) AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_balance INTEGER;
    v_usage_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    -- Check if user exists in user_credits table
    SELECT EXISTS(
        SELECT 1 FROM user_credits WHERE user_id = p_user_id
    ) INTO v_user_exists;
    
    -- If user doesn't exist, create default record
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
            0, 
            0, 
            0,
            NOW(),
            NOW()
        );
        v_current_credits := 0;
    ELSE
        -- Get current remaining credits
        SELECT remaining_credits INTO v_current_credits
        FROM user_credits 
        WHERE user_id = p_user_id;
    END IF;
    
    -- Check if user has sufficient credits
    IF v_current_credits < p_credits_used THEN
        RETURN QUERY SELECT 
            FALSE as success,
            'Insufficient credits. Required: ' || p_credits_used || ', Available: ' || v_current_credits as message,
            v_current_credits as remaining_credits,
            NULL::UUID as usage_id;
        RETURN;
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_credits - p_credits_used;
    
    -- Update user credits atomically
    UPDATE user_credits 
    SET 
        remaining_credits = v_new_balance,
        used_credits = used_credits + p_credits_used,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record usage in history table
    INSERT INTO credit_usage_history (
        user_id,
        credits_used,
        model_version,
        feature,
        generation_type,
        result_success,
        metadata,
        created_at
    ) VALUES (
        p_user_id,
        p_credits_used,
        p_model_version,
        p_feature,
        p_generation_type,
        TRUE, -- Assuming successful generation at this point
        p_metadata,
        NOW()
    ) RETURNING id INTO v_usage_id;
    
    -- Return success result
    RETURN QUERY SELECT 
        TRUE as success,
        'Credits deducted successfully' as message,
        v_new_balance as remaining_credits,
        v_usage_id as usage_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback is automatic in PostgreSQL for failed transactions
        RETURN QUERY SELECT 
            FALSE as success,
            'Error deducting credits: ' || SQLERRM as message,
            COALESCE(v_current_credits, 0) as remaining_credits,
            NULL::UUID as usage_id;
END;
$$ LANGUAGE plpgsql;