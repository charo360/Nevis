const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    // Test basic connection by checking users table
    const { data, error } = await supabase
      .from('users')
      .select('user_id')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }

    console.log('✅ Connection successful!');
    console.log('Users table accessible:', data ? 'Yes' : 'No data');
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  
  if (connected) {
    console.log('');
    console.log('🎯 DATABASE MIGRATION REQUIRED');
    console.log('');
    console.log('Please run the following SQL commands in your Supabase SQL Editor:');
    console.log('(Go to https://supabase.com/dashboard → Your Project → SQL Editor)');
    console.log('');
    console.log('-- 1. Add credit columns to users table');
    console.log('ALTER TABLE users');
    console.log('ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS remaining_credits INTEGER DEFAULT 0;');
    console.log('');
    console.log('-- 2. Create payments table');
    console.log('CREATE TABLE IF NOT EXISTS payments (');
    console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,');
    console.log('  stripe_session_id TEXT UNIQUE NOT NULL,');
    console.log('  plan_id TEXT NOT NULL,');
    console.log('  amount DECIMAL(10,2) NOT NULL,');
    console.log('  currency TEXT NOT NULL DEFAULT \'usd\',');
    console.log('  credits_added INTEGER NOT NULL,');
    console.log('  payment_method TEXT,');
    console.log('  status TEXT DEFAULT \'completed\',');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('-- 3. Create credit_transactions table');
    console.log('CREATE TABLE IF NOT EXISTS credit_transactions (');
    console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,');
    console.log('  type TEXT NOT NULL CHECK (type IN (\'addition\', \'deduction\')),');
    console.log('  amount INTEGER NOT NULL,');
    console.log('  balance_before INTEGER NOT NULL,');
    console.log('  balance_after INTEGER NOT NULL,');
    console.log('  reason TEXT,');
    console.log('  metadata JSONB,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('-- 4. Create indexes for performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_session_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);');
    console.log('');
    console.log('-- 5. Create database function for atomic payment processing');
    console.log('CREATE OR REPLACE FUNCTION process_payment_transaction(');
    console.log('  p_user_id UUID,');
    console.log('  p_stripe_session_id TEXT,');
    console.log('  p_plan_id TEXT,');
    console.log('  p_amount DECIMAL,');
    console.log('  p_currency TEXT,');
    console.log('  p_credits_added INTEGER,');
    console.log('  p_payment_method TEXT,');
    console.log('  p_new_total_credits INTEGER,');
    console.log('  p_new_remaining_credits INTEGER,');
    console.log('  p_balance_before INTEGER');
    console.log(') RETURNS VOID AS $$');
    console.log('BEGIN');
    console.log('  -- Insert payment record');
    console.log('  INSERT INTO payments (');
    console.log('    user_id, stripe_session_id, plan_id, amount, currency,');
    console.log('    credits_added, payment_method, status');
    console.log('  ) VALUES (');
    console.log('    p_user_id, p_stripe_session_id, p_plan_id, p_amount, p_currency,');
    console.log('    p_credits_added, p_payment_method, \'completed\'');
    console.log('  );');
    console.log('');
    console.log('  -- Update user credits');
    console.log('  UPDATE users SET');
    console.log('    total_credits = p_new_total_credits,');
    console.log('    remaining_credits = p_new_remaining_credits,');
    console.log('    updated_at = NOW()');
    console.log('  WHERE user_id = p_user_id;');
    console.log('');
    console.log('  -- Log credit transaction');
    console.log('  INSERT INTO credit_transactions (');
    console.log('    user_id, type, amount, balance_before, balance_after, reason');
    console.log('  ) VALUES (');
    console.log('    p_user_id, \'addition\', p_credits_added, p_balance_before, p_new_remaining_credits, \'payment\'');
    console.log('  );');
    console.log('END;');
    console.log('$$ LANGUAGE plpgsql;');
    console.log('');
    console.log('-- 6. Enable RLS policies (optional, for security)');
    console.log('ALTER TABLE payments ENABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('-- Create RLS policies');
    console.log('CREATE POLICY "Users can view their own payments" ON payments');
    console.log('  FOR SELECT USING (auth.uid() = user_id);');
    console.log('');
    console.log('CREATE POLICY "Users can view their own credit transactions" ON credit_transactions');
    console.log('  FOR SELECT USING (auth.uid() = user_id);');
    console.log('');
    console.log('🎉 After running these commands, your payment system will be ready!');
  }
}

main();
