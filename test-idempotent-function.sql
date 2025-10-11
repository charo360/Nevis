-- Test the corrected idempotent payment processing function
-- This script tests both new payment creation and duplicate prevention

-- First, let's test creating a new payment
SELECT 'Testing new payment creation...' as test_step;

SELECT * FROM process_payment_with_idempotency(
    'sess_test_123456789',  -- stripe_session_id
    '01234567-89ab-cdef-0123-456789abcdef'::UUID,  -- user_id (example UUID)
    'premium_plan',         -- plan_id
    19.99,                  -- amount
    100                     -- credits_to_add
);

-- Now test the same payment again to verify duplicate prevention
SELECT 'Testing duplicate payment prevention...' as test_step;

SELECT * FROM process_payment_with_idempotency(
    'sess_test_123456789',  -- Same stripe_session_id
    '01234567-89ab-cdef-0123-456789abcdef'::UUID,  -- Same user_id
    'premium_plan',         -- Same plan_id
    19.99,                  -- Same amount
    100                     -- Same credits_to_add
);

-- Check what was actually created in the database
SELECT 'Checking payment_transactions table...' as check_step;
SELECT * FROM payment_transactions WHERE stripe_session_id = 'sess_test_123456789';

SELECT 'Checking user_credits table...' as check_step;
SELECT * FROM user_credits WHERE user_id = '01234567-89ab-cdef-0123-456789abcdef'::UUID;

-- Clean up test data
SELECT 'Cleaning up test data...' as cleanup_step;
DELETE FROM payment_transactions WHERE stripe_session_id = 'sess_test_123456789';
DELETE FROM user_credits WHERE user_id = '01234567-89ab-cdef-0123-456789abcdef'::UUID;