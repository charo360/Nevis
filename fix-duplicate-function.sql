-- Drop the old version of the function with extra parameters
DROP FUNCTION IF EXISTS process_payment_with_idempotency(
    p_stripe_session_id TEXT,
    p_stripe_payment_intent_id TEXT,
    p_user_id UUID,
    p_plan_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_credits_to_add INTEGER,
    p_payment_method TEXT,
    p_source TEXT
);

-- Verify only the correct function remains
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as parameters
FROM pg_proc p 
WHERE p.proname = 'process_payment_with_idempotency';