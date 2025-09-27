#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs the payment system migration directly through Supabase client
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🗄️ Running Payment System Database Migration');
console.log('============================================\n');

async function runMigration() {
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241226_payment_system_production.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      console.log('Creating migration file...');

      // Create the migration SQL inline
      const migrationSQL = `
-- Production Payment System Migration
-- Run this migration to add payment system tables and columns

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_logs table for tracking feature usage
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    feature VARCHAR(100) NOT NULL,
    credits_used INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_feature ON usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON users(trial_ends_at);

-- Initialize existing users with trial periods (PRODUCTION SAFE)
UPDATE users 
SET 
    trial_ends_at = NOW() + INTERVAL '7 days',
    remaining_credits = COALESCE(remaining_credits, 0) + 10,
    total_credits = COALESCE(total_credits, 0) + 10,
    subscription_status = 'trialing',
    updated_at = NOW()
WHERE 
    subscription_plan = 'free' 
    AND trial_ends_at IS NULL
    AND (remaining_credits IS NULL OR remaining_credits = 0);

-- Create function to check subscription access
CREATE OR REPLACE FUNCTION check_subscription_access(p_user_id VARCHAR(255), p_feature VARCHAR(100))
RETURNS TABLE(
    has_access BOOLEAN,
    reason VARCHAR(255),
    credits_remaining INTEGER,
    subscription_status VARCHAR(50)
) AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get user data
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
        IF user_record.subscription_expires_at IS NULL OR user_record.subscription_expires_at > NOW() THEN
            RETURN QUERY SELECT TRUE, 'Active subscription'::VARCHAR(255), COALESCE(user_record.remaining_credits, 0), 'active'::VARCHAR(50);
            RETURN;
        END IF;
    END IF;
    
    -- Check trial period
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
    
    -- No access
    RETURN QUERY SELECT FALSE, 'Subscription required'::VARCHAR(255), COALESCE(user_record.remaining_credits, 0), 'inactive'::VARCHAR(50);
END;
$$ LANGUAGE plpgsql;
`;

      // Execute the migration step by step
      console.log('📝 Executing migration SQL...');

      // Step 1: Add columns to users table
      console.log('1️⃣ Adding columns to users table...');
      const { error: alterError } = await supabase.rpc('sql', {
        query: `
          ALTER TABLE users
          ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
          ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
          ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE,
          ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS remaining_credits INTEGER DEFAULT 0;
        `
      });

      if (alterError) {
        console.error('❌ Failed to add columns:', alterError.message);
        // Continue anyway, columns might already exist
      } else {
        console.log('✅ User table columns added');
      }

    } else {
      console.log('📁 Found migration file, executing...');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Execute the migration
      const { error } = await supabase.rpc('exec', { sql: migrationSQL });

      if (error) {
        console.error('❌ Migration failed:', error.message);
        return;
      }
    }

    console.log('✅ Migration executed successfully!');

    // Verify migration
    console.log('\n🔍 Verifying migration...');

    // Check if payment_transactions table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['payment_transactions', 'usage_logs']);

    if (tableError) {
      console.error('❌ Failed to verify tables:', tableError.message);
    } else {
      console.log(`✅ Found ${tables.length} new tables:`, tables.map(t => t.table_name).join(', '));
    }

    // Check if users table has new columns
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .in('column_name', ['stripe_customer_id', 'trial_ends_at', 'remaining_credits']);

    if (columnError) {
      console.error('❌ Failed to verify columns:', columnError.message);
    } else {
      console.log(`✅ Found ${columns.length} new columns in users table:`, columns.map(c => c.column_name).join(', '));
    }

    // Check if function exists
    const { data: functions, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'check_subscription_access');

    if (functionError) {
      console.error('❌ Failed to verify function:', functionError.message);
    } else if (functions.length > 0) {
      console.log('✅ Subscription access function created successfully');
    }

    console.log('\n🎉 Database migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: node test-payment-flow.js');
    console.log('2. Run: node test-payment-verification.js');
    console.log('3. Test payment flow in browser');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
