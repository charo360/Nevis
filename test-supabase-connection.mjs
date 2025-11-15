#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseKey);
console.log('Service Key length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n1️⃣ Testing basic query...');
    const { data, error } = await supabase
      .from('users')
      .select('user_id')
      .limit(1);

    if (error) {
      console.error('❌ Query failed:', error);
      return false;
    }

    console.log('✅ Database query successful');

    console.log('\n2️⃣ Testing storage...');
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets();

    if (storageError) {
      console.error('❌ Storage check failed:', storageError);
      return false;
    }

    console.log('✅ Storage accessible');
    console.log('   Buckets:', buckets.map(b => b.name).join(', '));

    console.log('\n3️⃣ Testing credit_transactions table...');
    const { data: txData, error: txError } = await supabase
      .from('credit_transactions')
      .select('id')
      .limit(1);

    if (txError) {
      console.error('❌ credit_transactions table not accessible:', txError);
    } else {
      console.log('✅ credit_transactions table exists and is accessible');
    }

    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

testConnection();
