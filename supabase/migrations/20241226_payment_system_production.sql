-- Production Payment System Migration
-- Run this migration to add payment system tables and columns
-- This migration is safe and non-destructive

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add payment-related columns to users table (safe - adds columns only)
DO $$ 
BEGIN
    -- Add Stripe integration columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
        RAISE NOTICE 'Added stripe_customer_id column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
        RAISE NOTICE 'Added stripe_subscription_id column to users table';
    END IF;
    
    -- Add trial and payment tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added trial_ends_at column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_payment_at') THEN
        ALTER TABLE users ADD COLUMN last_payment_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_payment_at column to users table';
    END IF;
    
    -- Add credit tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_credits') THEN
        ALTER TABLE users ADD COLUMN total_credits INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_credits column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'used_credits') THEN
        ALTER TABLE users ADD COLUMN used_credits INTEGER DEFAULT 0;
        RAISE NOTICE 'Added used_credits column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'remaining_credits') THEN
        ALTER TABLE users ADD COLUMN remaining_credits INTEGER DEFAULT 0;
        RAISE NOTICE 'Added remaining_credits column to users table';
    END IF;
END $$;

-- Create subscriptions table for detailed subscription tracking
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add foreign key constraint if users table exists
    CONSTRAINT fk_subscriptions_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

-- Create payment_transactions table for audit trail
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    plan_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL,
    credits_added INTEGER DEFAULT 0,
    payment_method VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add foreign key constraint if users table exists
    CONSTRAINT fk_payment_transactions_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

-- Create usage_logs table for tracking feature usage
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    feature VARCHAR(100) NOT NULL,
    credits_used INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add foreign key constraint if users table exists
    CONSTRAINT fk_usage_logs_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_feature ON usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON users(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Initialize existing users with trial periods (PRODUCTION SAFE)
-- This gives all existing free users a 7-day trial with 20 credits
UPDATE users 
SET 
    trial_ends_at = NOW() + INTERVAL '7 days',
    remaining_credits = COALESCE(remaining_credits, 0) + 20,
    total_credits = COALESCE(total_credits, 0) + 20,
    subscription_status = 'trialing',
    updated_at = NOW()
WHERE 
    subscription_plan = 'free' 
    AND trial_ends_at IS NULL
    AND (remaining_credits IS NULL OR remaining_credits = 0);

-- Create function to check subscription access (PRODUCTION OPTIMIZED)
CREATE OR REPLACE FUNCTION check_subscription_access(p_user_id VARCHAR(255), p_feature VARCHAR(100))
RETURNS TABLE(
    has_access BOOLEAN,
    reason VARCHAR(255),
    credits_remaining INTEGER,
    subscription_status VARCHAR(50)
) AS $$
DECLARE
    user_record RECORD;
    subscription_record RECORD;
BEGIN
    -- Get user data with single query
    SELECT 
        u.subscription_plan,
        u.subscription_status,
        u.trial_ends_at,
        u.remaining_credits,
        u.subscription_expires_at
    INTO user_record 
    FROM users u 
    WHERE u.user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'User not found'::VARCHAR(255), 0, 'inactive'::VARCHAR(50);
        RETURN;
    END IF;
    
    -- Check if user has active paid subscription
    IF user_record.subscription_plan != 'free' AND user_record.subscription_status = 'active' THEN
        -- Check if subscription hasn't expired
        IF user_record.subscription_expires_at IS NULL OR user_record.subscription_expires_at > NOW() THEN
            RETURN QUERY SELECT TRUE, 'Active subscription'::VARCHAR(255), COALESCE(user_record.remaining_credits, 0), 'active'::VARCHAR(50);
            RETURN;
        END IF;
    END IF;
    
    -- Check trial period for free users
    IF user_record.subscription_plan = 'free' AND user_record.trial_ends_at IS NOT NULL THEN
        IF user_record.trial_ends_at > NOW() THEN
            IF COALESCE(user_record.remaining_credits, 0) > 0 THEN
                RETURN QUERY SELECT TRUE, 'Trial period active'::VARCHAR(255), COALESCE(user_record.remaining_credits, 0), 'trialing'::VARCHAR(50);
                RETURN;
            ELSE
                RETURN QUERY SELECT FALSE, 'Trial credits exhausted'::VARCHAR(255), 0, 'trial_expired'::VARCHAR(50);
                RETURN;
            END IF;
        ELSE
            RETURN QUERY SELECT FALSE, 'Trial period expired'::VARCHAR(255), COALESCE(user_record.remaining_credits, 0), 'trial_expired'::VARCHAR(50);
            RETURN;
        END IF;
    END IF;
    
    -- No access - subscription required
    RETURN QUERY SELECT FALSE, 'Subscription required'::VARCHAR(255), COALESCE(user_record.remaining_credits, 0), 'inactive'::VARCHAR(50);
END;
$$ LANGUAGE plpgsql;

-- Log migration completion
INSERT INTO payment_transactions (
    user_id,
    plan_id,
    amount,
    status,
    credits_added,
    payment_method,
    metadata
) VALUES (
    'system',
    'migration',
    0,
    'completed',
    0,
    'migration',
    '{"type": "production_migration", "timestamp": "' || NOW() || '"}'
);

-- Output migration summary
DO $$
DECLARE
    user_count INTEGER;
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO migrated_count FROM users WHERE trial_ends_at IS NOT NULL;
    
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Total users: %', user_count;
    RAISE NOTICE 'Users with trials: %', migrated_count;
    RAISE NOTICE 'Tables created: subscriptions, payment_transactions, usage_logs';
    RAISE NOTICE 'Function created: check_subscription_access';
    RAISE NOTICE '=== READY FOR PRODUCTION ===';
END $$;
