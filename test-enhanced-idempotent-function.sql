-- Test the enhanced idempotent payment processing function
-- Tests both stripe_session_id and stripe_payment_intent_id duplicate prevention

-- Test 1: Create a new payment
SELECT 'Test 1: Creating new payment...' as test_step;

SELECT * FROM process_payment_with_idempotency(
    'sess_test_enhanced_123',           -- stripe_session_id
    'pi_test_enhanced_456',             -- stripe_payment_intent_id
    '01234567-89ab-cdef-0123-456789abcdef'::UUID,  -- user_id
    'premium_plan',                     -- plan_id
    29.99,                             -- amount
    150                                -- credits_to_add
);

-- Test 2: Try same session_id (should detect duplicate)
SELECT 'Test 2: Testing duplicate via session_id...' as test_step;

SELECT * FROM process_payment_with_idempotency(
    'sess_test_enhanced_123',           -- Same session_id
    'pi_different_789',                 -- Different payment_intent_id
    '01234567-89ab-cdef-0123-456789abcdef'::UUID,
    'premium_plan',
    29.99,
    150
);

-- Test 3: Try same payment_intent_id (should detect duplicate)
SELECT 'Test 3: Testing duplicate via payment_intent_id...' as test_step;

SELECT * FROM process_payment_with_idempotency(
    'sess_different_456',               -- Different session_id
    'pi_test_enhanced_456',             -- Same payment_intent_id
    '01234567-89ab-cdef-0123-456789abcdef'::UUID,
    'premium_plan',
    29.99,
    150
);

-- Check database state
SELECT 'Checking payment_transactions table...' as check_step;
SELECT id, stripe_session_id, stripe_payment_intent_id, amount, credits_added 
FROM payment_transactions 
WHERE stripe_session_id LIKE 'sess_test_enhanced%' 
   OR stripe_payment_intent_id LIKE 'pi_test_enhanced%';

SELECT 'Checking user_credits table...' as check_step;
SELECT user_id, total_credits, remaining_credits 
FROM user_credits 
WHERE user_id = '01234567-89ab-cdef-0123-456789abcdef'::UUID;

-- Clean up test data
SELECT 'Cleaning up test data...' as cleanup_step;
DELETE FROM payment_transactions 
WHERE stripe_session_id LIKE 'sess_test_enhanced%' 
   OR stripe_payment_intent_id LIKE 'pi_test_enhanced%';

DELETE FROM user_credits 
WHERE user_id = '01234567-89ab-cdef-0123-456789abcdef'::UUID;