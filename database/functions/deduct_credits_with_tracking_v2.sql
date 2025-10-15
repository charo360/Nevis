-- Safer version with renamed return columns and strict aliasing
CREATE OR REPLACE FUNCTION public.deduct_credits_with_tracking_v2(
    p_user_id UUID,
    p_credits_used INTEGER,
    p_model_version TEXT,
    p_feature TEXT,
    p_generation_type TEXT DEFAULT 'standard',
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    remaining_balance INTEGER,
    usage_id UUID
) AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_balance INTEGER;
    v_usage_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    RAISE NOTICE '[deduct_credits_with_tracking_v2] Start user=% credits=% model=% feature=% type=%', p_user_id, p_credits_used, p_model_version, p_feature, p_generation_type;

    SELECT EXISTS(SELECT 1 FROM public.user_credits uc WHERE uc.user_id = p_user_id)
    INTO v_user_exists;

    IF NOT v_user_exists THEN
        INSERT INTO public.user_credits (user_id, total_credits, remaining_credits, used_credits, created_at, updated_at)
        VALUES (p_user_id, 0, 0, 0, NOW(), NOW());
        v_current_credits := 0;
    ELSE
        SELECT uc.remaining_credits INTO v_current_credits
        FROM public.user_credits uc
        WHERE uc.user_id = p_user_id
        FOR UPDATE;
    END IF;

    IF v_current_credits < p_credits_used THEN
        RETURN QUERY SELECT FALSE, 'Insufficient credits. Required: ' || p_credits_used || ', Available: ' || v_current_credits, v_current_credits, NULL::UUID;
        RETURN;
    END IF;

    v_new_balance := v_current_credits - p_credits_used;
    RAISE NOTICE '[deduct_credits_with_tracking_v2] Current=% Deduct=% New=%', v_current_credits, p_credits_used, v_new_balance;

    UPDATE public.user_credits uc
    SET remaining_credits = v_new_balance,
        used_credits = uc.used_credits + p_credits_used,
        updated_at = NOW()
    WHERE uc.user_id = p_user_id;

    -- Insert usage with model_version to satisfy NOT NULL constraints where present
    INSERT INTO public.credit_usage_history (
        user_id, credits_used, model_version, feature, generation_type, result_success, created_at
    ) VALUES (
        p_user_id, p_credits_used, p_model_version, p_feature, p_generation_type, TRUE, NOW()
    ) RETURNING id INTO v_usage_id;

    RETURN QUERY SELECT TRUE, 'Credits deducted successfully', v_new_balance, v_usage_id;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[deduct_credits_with_tracking_v2] ERROR: %', SQLERRM;
    RETURN QUERY SELECT FALSE, 'Error deducting credits: ' || SQLERRM, COALESCE(v_current_credits, 0), NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.deduct_credits_with_tracking_v2(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB) TO authenticated;


