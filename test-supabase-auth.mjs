// Test Supabase authentication
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Authentication...');
console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Supabase Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  try {
    console.log('\n🔄 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
    return false;
  }
}

async function testAuth() {
  try {
    console.log('\n🔄 Testing authentication...');
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth session error:', error.message);
      return false;
    }
    
    if (session) {
      console.log('✅ Active session found:', session.user.email);
    } else {
      console.log('📱 No active session (this is normal)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const connectionOk = await testSupabaseConnection();
  const authOk = await testAuth();
  
  console.log('\n📊 Test Results:');
  console.log('Connection:', connectionOk ? '✅ Working' : '❌ Failed');
  console.log('Authentication:', authOk ? '✅ Working' : '❌ Failed');
  
  if (connectionOk && authOk) {
    console.log('\n🎉 Supabase is ready to use!');
  } else {
    console.log('\n⚠️ Some issues detected. Check configuration.');
  }
}

runTests().catch(console.error);
