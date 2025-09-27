-- Payment System Enhancement Migration
-- This migration adds subscription management without breaking existing functionality

-- Add subscription management fields to users table (if not exists)
DO $$ 
BEGIN
    -- Add subscription fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_payment_at') THEN
        ALTER TABLE users ADD COLUMN last_payment_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add credit tracking fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_credits') THEN
        ALTER TABLE users ADD COLUMN total_credits INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'used_credits') THEN
        ALTER TABLE users ADD COLUMN used_credits INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'remaining_credits') THEN
        ALTER TABLE users ADD COLUMN remaining_credits INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create subscriptions table for detailed subscription tracking
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_transactions table for audit trail
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    plan_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL,
    credits_added INTEGER DEFAULT 0,
    payment_method VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_logs table for tracking feature usage
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL, -- 'revo-1.0', 'revo-1.5', 'revo-2.0'
    credits_used INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_feature ON usage_logs(feature);

-- Set default trial period for existing users (7 days from now)
UPDATE users 
SET trial_ends_at = NOW() + INTERVAL '7 days',
    remaining_credits = COALESCE(remaining_credits, 10)
WHERE trial_ends_at IS NULL 
AND subscription_plan = 'free';

-- Create function to check subscription status
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
    -- Get user data
    SELECT * INTO user_record FROM users WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'User not found', 0, 'inactive'::VARCHAR(50);
        RETURN;
    END IF;
    
    -- Get active subscription
    SELECT * INTO subscription_record 
    FROM subscriptions 
    WHERE user_id = p_user_id 
    AND status IN ('active', 'trialing')
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Check if user has active subscription
    IF subscription_record.id IS NOT NULL THEN
        -- Check if subscription is still valid
        IF subscription_record.current_period_end > NOW() OR subscription_record.trial_end > NOW() THEN
            RETURN QUERY SELECT TRUE, 'Active subscription', user_record.remaining_credits, subscription_record.status;
            RETURN;
        END IF;
    END IF;
    
    -- Check trial period for free users
    IF user_record.subscription_plan = 'free' AND user_record.trial_ends_at > NOW() THEN
        IF user_record.remaining_credits > 0 THEN
            RETURN QUERY SELECT TRUE, 'Trial period active', user_record.remaining_credits, 'trialing'::VARCHAR(50);
            RETURN;
        ELSE
            RETURN QUERY SELECT FALSE, 'Trial credits exhausted', 0, 'trial_expired'::VARCHAR(50);
            RETURN;
        END IF;
    END IF;
    
    -- No access
    RETURN QUERY SELECT FALSE, 'Subscription required', user_record.remaining_credits, 'inactive'::VARCHAR(50);
END;
$$ LANGUAGE plpgsql;
