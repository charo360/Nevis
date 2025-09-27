-- Payment Database Verification Queries
-- Run these queries to verify payment processing is working correctly

-- 1. Check payment_transactions table structure and recent records
SELECT 
    'payment_transactions' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN status = 'completed' THEN credits_added ELSE 0 END) as total_credits_added
FROM payment_transactions;

-- 2. Recent payment transactions (last 24 hours)
SELECT 
    id,
    user_id,
    plan_id,
    amount,
    status,
    credits_added,
    payment_method,
    created_at,
    CASE 
        WHEN stripe_session_id IS NOT NULL THEN 'Stripe'
        WHEN payment_method = 'free_plan' THEN 'Free'
        ELSE 'Other'
    END as payment_source
FROM payment_transactions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Payment success rate by plan
SELECT 
    plan_id,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
    ROUND(
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as success_rate_percent,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue,
    AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_payment_amount
FROM payment_transactions 
GROUP BY plan_id
ORDER BY total_attempts DESC;

-- 4. User subscription status after payments
SELECT 
    u.user_id,
    u.email,
    u.subscription_plan,
    u.subscription_status,
    u.remaining_credits,
    u.total_credits,
    u.trial_ends_at,
    u.last_payment_at,
    COUNT(pt.id) as payment_count,
    SUM(CASE WHEN pt.status = 'completed' THEN pt.amount ELSE 0 END) as total_paid
FROM users u
LEFT JOIN payment_transactions pt ON u.user_id = pt.user_id
WHERE u.subscription_plan != 'free' OR u.remaining_credits > 0
GROUP BY u.user_id, u.email, u.subscription_plan, u.subscription_status, 
         u.remaining_credits, u.total_credits, u.trial_ends_at, u.last_payment_at
ORDER BY u.last_payment_at DESC NULLS LAST
LIMIT 20;

-- 5. Test subscription access function for sample users
SELECT 
    u.user_id,
    u.subscription_plan,
    u.subscription_status,
    u.remaining_credits,
    access_check.*
FROM users u
CROSS JOIN LATERAL (
    SELECT * FROM check_subscription_access(u.user_id, 'revo-2.0')
) access_check
WHERE u.subscription_plan != 'free' OR u.remaining_credits > 0
LIMIT 10;

-- 6. Webhook processing verification (check for duplicate processing)
SELECT 
    stripe_session_id,
    COUNT(*) as record_count,
    ARRAY_AGG(status) as statuses,
    ARRAY_AGG(id) as transaction_ids,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM payment_transactions 
WHERE stripe_session_id IS NOT NULL
GROUP BY stripe_session_id
HAVING COUNT(*) > 1
ORDER BY record_count DESC;

-- 7. Credit balance verification
SELECT 
    user_id,
    total_credits,
    used_credits,
    remaining_credits,
    (total_credits - used_credits) as calculated_remaining,
    CASE 
        WHEN remaining_credits = (total_credits - used_credits) THEN '✅ Correct'
        ELSE '❌ Mismatch'
    END as balance_status
FROM users 
WHERE total_credits > 0
ORDER BY total_credits DESC
LIMIT 20;

-- 8. Usage logs correlation with payments
SELECT 
    DATE(pt.created_at) as payment_date,
    COUNT(DISTINCT pt.user_id) as paying_users,
    COUNT(DISTINCT ul.user_id) as active_users,
    SUM(pt.credits_added) as credits_purchased,
    SUM(ul.credits_used) as credits_consumed,
    ROUND(
        SUM(ul.credits_used) * 100.0 / NULLIF(SUM(pt.credits_added), 0), 
        2
    ) as utilization_rate_percent
FROM payment_transactions pt
LEFT JOIN usage_logs ul ON pt.user_id = ul.user_id 
    AND DATE(ul.created_at) = DATE(pt.created_at)
WHERE pt.status = 'completed' 
    AND pt.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(pt.created_at)
ORDER BY payment_date DESC;

-- 9. Failed payment analysis
SELECT 
    plan_id,
    payment_method,
    COUNT(*) as failure_count,
    ARRAY_AGG(DISTINCT metadata->>'error_code') as error_codes,
    MIN(created_at) as first_failure,
    MAX(created_at) as last_failure
FROM payment_transactions 
WHERE status = 'failed'
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY plan_id, payment_method
ORDER BY failure_count DESC;

-- 10. Revenue and growth metrics
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as daily_revenue,
    COUNT(DISTINCT user_id) as unique_customers,
    AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_order_value
FROM payment_transactions 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- 11. Subscription access verification for specific features
SELECT 
    feature,
    COUNT(*) as total_checks,
    COUNT(CASE WHEN has_access THEN 1 END) as granted_access,
    COUNT(CASE WHEN NOT has_access THEN 1 END) as denied_access,
    ROUND(
        COUNT(CASE WHEN has_access THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as access_grant_rate
FROM (
    SELECT 
        'revo-1.0' as feature,
        (check_subscription_access(user_id, 'revo-1.0')).has_access
    FROM users 
    WHERE subscription_plan != 'free' OR remaining_credits > 0
    
    UNION ALL
    
    SELECT 
        'revo-1.5' as feature,
        (check_subscription_access(user_id, 'revo-1.5')).has_access
    FROM users 
    WHERE subscription_plan != 'free' OR remaining_credits > 0
    
    UNION ALL
    
    SELECT 
        'revo-2.0' as feature,
        (check_subscription_access(user_id, 'revo-2.0')).has_access
    FROM users 
    WHERE subscription_plan != 'free' OR remaining_credits > 0
) access_checks
GROUP BY feature
ORDER BY feature;

-- 12. Health check query - overall system status
SELECT 
    'Payment System Health Check' as status,
    (
        SELECT COUNT(*) 
        FROM payment_transactions 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
    ) as payments_last_hour,
    (
        SELECT COUNT(*) 
        FROM payment_transactions 
        WHERE status = 'completed' 
            AND created_at >= NOW() - INTERVAL '24 hours'
    ) as successful_payments_24h,
    (
        SELECT COUNT(*) 
        FROM users 
        WHERE remaining_credits > 0
    ) as users_with_credits,
    (
        SELECT COUNT(*) 
        FROM usage_logs 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
    ) as feature_usage_last_hour,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM payment_transactions 
            WHERE created_at >= NOW() - INTERVAL '5 minutes'
        ) THEN '🟢 Active'
        WHEN EXISTS (
            SELECT 1 FROM payment_transactions 
            WHERE created_at >= NOW() - INTERVAL '1 hour'
        ) THEN '🟡 Slow'
        ELSE '🔴 Inactive'
    END as payment_activity_status;
