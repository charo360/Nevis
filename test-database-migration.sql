-- Database Migration Verification Script
-- Run these queries to verify the migration worked correctly

-- 1. Check that all required tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'subscriptions', 'payment_transactions', 'usage_logs')
ORDER BY table_name;

-- Expected result: 4 tables (users, subscriptions, payment_transactions, usage_logs)

-- 2. Check that all required columns were added to users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
    'stripe_customer_id', 
    'stripe_subscription_id', 
    'trial_ends_at', 
    'last_payment_at',
    'total_credits',
    'used_credits', 
    'remaining_credits'
)
ORDER BY column_name;

-- Expected result: 7 columns with correct data types

-- 3. Check that indexes were created
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected result: Multiple indexes on subscription and usage tables

-- 4. Check that the subscription access function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'check_subscription_access';

-- Expected result: 1 function named check_subscription_access

-- 5. Test the subscription access function
SELECT * FROM check_subscription_access('test-user-id', 'revo-2.0');

-- Expected result: Function executes without error

-- 6. Check existing users got trial periods
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN trial_ends_at IS NOT NULL THEN 1 END) as users_with_trials,
    COUNT(CASE WHEN remaining_credits > 0 THEN 1 END) as users_with_credits,
    AVG(remaining_credits) as avg_credits
FROM users 
WHERE subscription_plan = 'free';

-- Expected result: Most/all free users should have trial_ends_at and credits > 0

-- 7. Check migration transaction was logged
SELECT 
    user_id,
    plan_id,
    status,
    metadata,
    created_at
FROM payment_transactions 
WHERE plan_id = 'migration' 
ORDER BY created_at DESC 
LIMIT 1;

-- Expected result: 1 migration transaction record
