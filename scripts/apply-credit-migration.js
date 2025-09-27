const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying credit system migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/014_add_credit_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);

        // Continue with other statements unless it's a critical error
        if (error.message.includes('already exists')) {
          console.log('⚠️  Object already exists, continuing...');
        } else {
          throw error;
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('🎉 Credit system migration completed successfully!');

    // Test the migration by checking if tables exist
    console.log('🔍 Verifying migration...');

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['payments', 'credit_transactions']);

    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError);
    } else {
      console.log('✅ Tables created:', tables.map(t => t.table_name));
    }

    // Check if users table has credit columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .in('column_name', ['total_credits', 'used_credits', 'remaining_credits']);

    if (columnsError) {
      console.error('❌ Error verifying columns:', columnsError);
    } else {
      console.log('✅ Credit columns added:', columns.map(c => c.column_name));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach using manual table creation
async function applyMigrationDirect() {
  try {
    console.log('🚀 Applying credit system migration (direct approach)...');

    // Check if users table exists and has the required columns
    console.log('📝 Checking users table structure...');
    const { data: userColumns, error: userColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');

    if (userColumnsError) {
      throw userColumnsError;
    }

    const existingColumns = userColumns.map(col => col.column_name);
    console.log('✅ Users table columns:', existingColumns);

    // Check if payments table exists
    console.log('📝 Checking if payments table exists...');
    const { data: paymentTable, error: paymentTableError } = await supabase
      .from('payments')
      .select('id')
      .limit(1);

    if (paymentTableError && paymentTableError.code === 'PGRST116') {
      console.log('⚠️  Payments table does not exist - needs to be created manually');
    } else {
      console.log('✅ Payments table exists');
    }

    // Check if credit_transactions table exists
    console.log('📝 Checking if credit_transactions table exists...');
    const { data: transactionTable, error: transactionTableError } = await supabase
      .from('credit_transactions')
      .select('id')
      .limit(1);

    if (transactionTableError && transactionTableError.code === 'PGRST116') {
      console.log('⚠️  Credit transactions table does not exist - needs to be created manually');
    } else {
      console.log('✅ Credit transactions table exists');
    }

    console.log('🎯 Migration status check completed');
    console.log('');
    console.log('📋 MANUAL STEPS REQUIRED:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the following SQL commands:');
    console.log('');
    console.log('-- Add credit columns to users table');
    console.log('ALTER TABLE users');
    console.log('ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS used_credits INTEGER DEFAULT 0,');
    console.log('ADD COLUMN IF NOT EXISTS remaining_credits INTEGER DEFAULT 0;');
    console.log('');
    console.log('-- Create payments table');
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
    console.log('-- Create credit_transactions table');
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
    console.log('-- Create indexes');
    console.log('CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_session_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);');
    console.log('');
    console.log('-- Create database function for atomic payment processing');
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

  } catch (error) {
    console.error('❌ Migration check failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigrationDirect();
