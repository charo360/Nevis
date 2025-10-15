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
    RAISE NOTICE '[deduct_credits_with_tracking] Start for user=% with credits=% model=% feature=% gen_type=%', p_user_id, p_credits_used, p_model_version, p_feature, p_generation_type;
    -- Check if user exists in user_credits table
    SELECT EXISTS(
        SELECT 1 FROM public.user_credits uc WHERE uc.user_id = p_user_id
    ) INTO v_user_exists;
    
    -- If user doesn't exist, create default record
    IF NOT v_user_exists THEN
        INSERT INTO public.user_credits (
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
        SELECT uc.remaining_credits INTO v_current_credits
        FROM public.user_credits uc
        WHERE uc.user_id = p_user_id
        FOR UPDATE; -- lock row to avoid races
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
    RAISE NOTICE '[deduct_credits_with_tracking] Current=% Deduct=% NewBalance=%', v_current_credits, p_credits_used, v_new_balance;
    
    -- Update user credits atomically
    UPDATE public.user_credits uc
    SET 
        remaining_credits = v_new_balance,
        used_credits = uc.used_credits + p_credits_used,
        updated_at = NOW()
    WHERE uc.user_id = p_user_id;
    
    -- Record usage in history table
    INSERT INTO public.credit_usage_history (
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
    RAISE NOTICE '[deduct_credits_with_tracking] Usage recorded id=% new_remaining=%', v_usage_id, v_new_balance;
    
    -- Return success result
        RETURN QUERY SELECT 
        TRUE as success,
        'Credits deducted successfully' as message,
        v_new_balance as remaining_credits,
        v_usage_id as usage_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback is automatic in PostgreSQL for failed transactions
        RAISE NOTICE '[deduct_credits_with_tracking] ERROR: %', SQLERRM;
        RETURN QUERY SELECT 
            FALSE as success,
            'Error deducting credits: ' || SQLERRM as message,
            COALESCE(v_current_credits, 0) as remaining_credits,
            NULL::UUID as usage_id;
END;
$$ LANGUAGE plpgsql;