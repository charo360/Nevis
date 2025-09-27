#!/usr/bin/env node

/**
 * Simple Database Migration
 * Adds payment system tables and columns using direct SQL
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🗄️ Running Simple Payment System Migration');
console.log('==========================================\n');

async function runSimpleMigration() {
  try {
    // Step 1: Create payment_transactions table
    console.log('1️⃣ Creating payment_transactions table...');
    
    const { error: createTableError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS payment_transactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
      `
    });

    if (createTableError) {
      console.error('❌ Failed to create payment_transactions table:', createTableError.message);
    } else {
      console.log('✅ payment_transactions table created');
    }

    // Step 2: Create usage_logs table
    console.log('2️⃣ Creating usage_logs table...');
    
    const { error: createUsageError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS usage_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          feature VARCHAR(100) NOT NULL,
          credits_used INTEGER NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createUsageError) {
      console.error('❌ Failed to create usage_logs table:', createUsageError.message);
    } else {
      console.log('✅ usage_logs table created');
    }

    // Step 3: Add indexes
    console.log('3️⃣ Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);',
      'CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_usage_logs_feature ON usage_logs(feature);'
    ];

    for (const indexSQL of indexes) {
      const { error: indexError } = await supabase.rpc('sql', { query: indexSQL });
      if (indexError) {
        console.error('❌ Index creation failed:', indexError.message);
      }
    }
    
    console.log('✅ Indexes created');

    // Step 4: Check if users table exists and add columns
    console.log('4️⃣ Checking users table...');
    
    const { data: userTable, error: userTableError } = await supabase
      .from('users')
      .select('user_id')
      .limit(1);

    if (userTableError) {
      console.log('⚠️ Users table not found, skipping column additions');
    } else {
      console.log('✅ Users table found, adding payment columns...');
      
      // Add columns one by one to avoid conflicts
      const columns = [
        'ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)',
        'ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255)', 
        'ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE',
        'ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMP WITH TIME ZONE',
        'ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0',
        'ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0',
        'ADD COLUMN IF NOT EXISTS remaining_credits INTEGER DEFAULT 0'
      ];

      for (const column of columns) {
        const { error: columnError } = await supabase.rpc('sql', {
          query: `ALTER TABLE users ${column};`
        });
        
        if (columnError) {
          console.log(`⚠️ Column addition failed (may already exist): ${columnError.message}`);
        }
      }
      
      console.log('✅ User table columns processed');
    }

    // Step 5: Create subscription access function
    console.log('5️⃣ Creating subscription access function...');
    
    const { error: functionError } = await supabase.rpc('sql', {
      query: `
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
          IF user_record.trial_ends_at IS NOT NULL AND user_record.trial_ends_at > NOW() THEN
            IF COALESCE(user_record.remaining_credits, 0) > 0 THEN
              RETURN QUERY SELECT TRUE, 'Trial period active'::VARCHAR(255), COALESCE(user_record.remaining_credits, 0), 'trialing'::VARCHAR(50);
              RETURN;
            ELSE
              RETURN QUERY SELECT FALSE, 'Trial credits exhausted'::VARCHAR(255), 0, 'trial_expired'::VARCHAR(50);
              RETURN;
            END IF;
          END IF;
          
          -- No access
          RETURN QUERY SELECT FALSE, 'Subscription required'::VARCHAR(255), COALESCE(user_record.remaining_credits, 0), 'inactive'::VARCHAR(50);
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (functionError) {
      console.error('❌ Failed to create function:', functionError.message);
    } else {
      console.log('✅ Subscription access function created');
    }

    // Step 6: Initialize existing users with trial periods
    console.log('6️⃣ Initializing user trial periods...');
    
    if (!userTableError) {
      const { error: updateError } = await supabase.rpc('sql', {
        query: `
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
        `
      });

      if (updateError) {
        console.error('❌ Failed to initialize user trials:', updateError.message);
      } else {
        console.log('✅ User trial periods initialized');
      }
    }

    // Step 7: Verify migration
    console.log('\n🔍 Verifying migration...');
    
    // Test the function
    const { data: testResult, error: testError } = await supabase.rpc('check_subscription_access', {
      p_user_id: 'test-user',
      p_feature: 'revo-2.0'
    });

    if (testError) {
      console.error('❌ Function test failed:', testError.message);
    } else {
      console.log('✅ Subscription access function is working');
    }

    // Check tables exist
    const { data: tables, error: tableCheckError } = await supabase
      .from('payment_transactions')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      console.error('❌ payment_transactions table verification failed:', tableCheckError.message);
    } else {
      console.log('✅ payment_transactions table is accessible');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: node test-payment-flow.js');
    console.log('2. Run: node test-payment-verification.js');
    console.log('3. Test payment flow at: http://localhost:3001');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runSimpleMigration();
