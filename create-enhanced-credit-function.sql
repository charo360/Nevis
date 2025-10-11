-- Enhanced function to use credits with model tracking
CREATE OR REPLACE FUNCTION use_credits_with_model(
    p_user_id UUID,
    p_credits_to_use INTEGER,
    p_feature TEXT DEFAULT 'design_generation',
    p_model_version TEXT DEFAULT 'revo-1.0',
    p_generation_type TEXT DEFAULT 'image',
    p_prompt_text TEXT DEFAULT NULL,
    p_result_success BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
    success BOOLEAN,
    credits_used INTEGER,
    remaining_credits INTEGER,
    used_credits INTEGER,
    model_version TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    current_credits RECORD;
    new_remaining INTEGER;
    new_used INTEGER;
BEGIN
    -- Get current credit balance
    SELECT total_credits, remaining_credits, used_credits
    INTO current_credits
    FROM user_credits
    WHERE user_id = p_user_id;
    
    -- Check if user exists and has sufficient credits
    IF current_credits IS NULL THEN
        RETURN QUERY SELECT false, 0, 0, 0, p_model_version;
        RETURN;
    END IF;
    
    IF current_credits.remaining_credits < p_credits_to_use THEN
        RETURN QUERY SELECT 
            false, 
            0, 
            current_credits.remaining_credits, 
            current_credits.used_credits,
            p_model_version;
        RETURN;
    END IF;
    
    -- Calculate new balances
    new_remaining := current_credits.remaining_credits - p_credits_to_use;
    new_used := current_credits.used_credits + p_credits_to_use;
    
    -- Update user credits
    UPDATE user_credits 
    SET 
        remaining_credits = new_remaining,
        used_credits = new_used,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record usage in history table
    INSERT INTO credit_usage_history (
        user_id,
        model_version,
        credits_used,
        feature,
        generation_type,
        prompt_text,
        result_success,
        created_at
    ) VALUES (
        p_user_id,
        p_model_version,
        p_credits_to_use,
        p_feature,
        p_generation_type,
        p_prompt_text,
        p_result_success,
        NOW()
    );
    
    -- Return success with updated balances
    RETURN QUERY SELECT 
        true,
        p_credits_to_use,
        new_remaining,
        new_used,
        p_model_version;
END;
$$;