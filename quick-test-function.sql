-- Quick test of the idempotent payment function
-- Test with a sample payment to verify it works

SELECT 'Testing idempotent payment function...' as test_info;

-- Test 1: Create a new payment
SELECT * FROM process_payment_with_idempotency(
    'sess_test_12345',                  -- stripe_session_id
    'pi_test_67890',                    -- stripe_payment_intent_id
    '11111111-2222-3333-4444-555555555555'::UUID, -- sample user_id
    'test_plan',                        -- plan_id
    9.99,                              -- amount
    50                                 -- credits_to_add
);

-- Test 2: Try the same payment again (should detect duplicate)
SELECT * FROM process_payment_with_idempotency(
    'sess_test_12345',                  -- Same stripe_session_id
    'pi_test_67890',                    -- Same stripe_payment_intent_id
    '11111111-2222-3333-4444-555555555555'::UUID,
    'test_plan',
    9.99,
    50
);

-- Clean up test data
DELETE FROM payment_transactions WHERE stripe_session_id = 'sess_test_12345';
DELETE FROM user_credits WHERE user_id = '11111111-2222-3333-4444-555555555555'::UUID;