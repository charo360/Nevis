-- ================================================================
-- CRITICAL: RUN THIS IN SUPABASE SQL EDITOR
-- ================================================================
-- This creates all required database functions for the payment system
-- Apply this once to enable webhook processing and credit deduction
-- ================================================================

-- 1. Payment Processing Function (Idempotent)
-- ================================================================
CREATE OR REPLACE FUNCTION public.process_payment_with_idempotency(
    p_stripe_session_id TEXT,
    p_user_id UUID,
    p_plan_id TEXT,
    p_amount DECIMAL,
    p_credits_to_add INTEGER
)
RETURNS TABLE(
    payment_id UUID,
    was_duplicate BOOLEAN,
    credits_added INTEGER,
    new_total_credits INTEGER,
    new_remaining_credits INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_payment_id UUID;
    new_payment_id UUID;
    current_credits RECORD;
BEGIN
    -- Check if payment already exists (idempotency check)
    SELECT id INTO existing_payment_id
    FROM public.payment_transactions 
    WHERE stripe_session_id = p_stripe_session_id;
    
    IF existing_payment_id IS NOT NULL THEN
        -- Payment already processed, return existing data
        SELECT total_credits, remaining_credits
        INTO current_credits
        FROM public.user_credits
        WHERE user_id = p_user_id;
        
        RETURN QUERY SELECT 
            existing_payment_id,
            true as was_duplicate,
            0 as credits_added,
            COALESCE(current_credits.total_credits, 0) as new_total_credits,
            COALESCE(current_credits.remaining_credits, 0) as new_remaining_credits;
        RETURN;
    END IF;
    
    -- Create new payment record
    INSERT INTO public.payment_transactions (
        id,
        user_id,
        plan_id,
        amount,
        status,
        stripe_session_id,
        credits_added,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        p_plan_id,
        p_amount,
        'completed',
        p_stripe_session_id,
        p_credits_to_add,
        NOW()
    ) RETURNING id INTO new_payment_id;
    
    -- Add credits to user account
    INSERT INTO public.user_credits (user_id, total_credits, remaining_credits, used_credits, created_at, updated_at)
    VALUES (p_user_id, p_credits_to_add, p_credits_to_add, 0, NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET
        total_credits = public.user_credits.total_credits + p_credits_to_add,
        remaining_credits = public.user_credits.remaining_credits + p_credits_to_add,
        last_payment_at = NOW(),
        updated_at = NOW();
    
    -- Get updated credit balance
    SELECT total_credits, remaining_credits
    INTO current_credits
    FROM public.user_credits
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

GRANT EXECUTE ON FUNCTION public.process_payment_with_idempotency(TEXT, UUID, TEXT, DECIMAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_with_idempotency(TEXT, UUID, TEXT, DECIMAL, INTEGER) TO anon;

-- 2. Credit Deduction Function (for content generation)
-- ================================================================
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

    RAISE NOTICE '[deduct_credits_with_tracking_v2] Usage recorded id=% new_remaining=%', v_usage_id, v_new_balance;

    RETURN QUERY SELECT TRUE, 'Credits deducted successfully', v_new_balance, v_usage_id;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[deduct_credits_with_tracking_v2] ERROR: %', SQLERRM;
    RETURN QUERY SELECT FALSE, 'Error deducting credits: ' || SQLERRM, COALESCE(v_current_credits, 0), NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.deduct_credits_with_tracking_v2(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits_with_tracking_v2(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB) TO anon;

-- 3. Auto-grant signup credits trigger
-- ================================================================
CREATE OR REPLACE FUNCTION public.auto_grant_signup_credits()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.user_credits WHERE user_id = NEW.id) THEN
        INSERT INTO public.user_credits (user_id, total_credits, remaining_credits, used_credits, created_at, updated_at)
        VALUES (NEW.id, 10, 10, 0, NOW(), NOW());
        RAISE NOTICE 'Auto-granted 10 free credits to new user: %', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_grant_signup_credits ON auth.users;
CREATE TRIGGER trigger_auto_grant_signup_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_grant_signup_credits();

-- ================================================================
-- VERIFICATION
-- ================================================================
SELECT 'All functions created successfully!' as status;

-- Test credit deduction (optional - comment out if you don't want to test yet)
-- SELECT * FROM deduct_credits_with_tracking_v2(
--   '<your-user-id>'::uuid, 
--   2, 
--   'revo-1.0', 
--   'test', 
--   'test', 
--   '{}'::jsonb
-- );

