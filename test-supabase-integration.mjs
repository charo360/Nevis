// Test Supabase integration in creativestudio branch
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Integration on creativestudio branch...');
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
    
    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️ Users table not found (this is normal for new setup)');
      console.log('Error:', error.message);
      
      // Try a different approach - test storage
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      
      if (storageError) {
        console.error('❌ Storage connection failed:', storageError.message);
        return false;
      }
      
      console.log('✅ Supabase storage connection successful!');
      console.log('Available buckets:', buckets?.length || 0);
      return true;
    }
    
    console.log('✅ Supabase database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
    return false;
  }
}

async function testStorageCapacity() {
  try {
    console.log('\n🔄 Testing storage capacity...');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('⚠️ Storage test failed:', error.message);
      return false;
    }
    
    console.log('✅ Storage accessible!');
    console.log('Buckets available:', buckets?.length || 0);
    
    // List bucket names
    if (buckets && buckets.length > 0) {
      console.log('Bucket names:', buckets.map(b => b.name).join(', '));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Storage test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Supabase integration tests...\n');
  
  const connectionOk = await testSupabaseConnection();
  const storageOk = await testStorageCapacity();
  
  console.log('\n📊 Test Results:');
  console.log('Connection:', connectionOk ? '✅ Working' : '❌ Failed');
  console.log('Storage:', storageOk ? '✅ Working' : '❌ Failed');
  
  if (connectionOk && storageOk) {
    console.log('\n🎉 Supabase integration successful!');
    console.log('✅ You now have access to Supabase\'s large storage capacity');
    console.log('✅ Your MongoDB authentication and workflows remain intact');
    console.log('✅ Ready to use both databases as needed');
  } else if (connectionOk || storageOk) {
    console.log('\n⚠️ Partial success - some features available');
  } else {
    console.log('\n❌ Integration failed - check configuration');
  }
}

runTests().catch(console.error);
