#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCreditTransactionsTable() {
  console.log('📊 Creating credit_transactions table...\n');

  // Create the credit_transactions table
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.credit_transactions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('addition', 'deduction')),
          amount INTEGER NOT NULL,
          balance_before INTEGER NOT NULL,
          balance_after INTEGER NOT NULL,
          reason TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(type);
    `
  });

  if (error) {
    console.error('❌ Error creating table:', error);
    console.log('\n⚠️ Since RPC might not be available, you need to run this SQL directly in Supabase Dashboard:');
    console.log('\n' + '='.repeat(80));
    console.log(`
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('addition', 'deduction')),
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(type);
    `);
    console.log('='.repeat(80) + '\n');
  } else {
    console.log('✅ Table created successfully!');
  }
}

createCreditTransactionsTable();
