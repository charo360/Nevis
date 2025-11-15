import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase API Keys');
console.log('═'.repeat(60));

console.log('\n📍 URL:', url);
console.log('🔑 Service Role Key:');
console.log('   Exists:', !!serviceKey);
console.log('   Length:', serviceKey?.length);
console.log('   Starts with:', serviceKey?.substring(0, 50));
console.log('   Ends with:', serviceKey?.substring(serviceKey.length - 20));

console.log('\n🔑 Anon Key:');
console.log('   Exists:', !!anonKey);
console.log('   Length:', anonKey?.length);
console.log('   Starts with:', anonKey?.substring(0, 50));

console.log('\n🧪 Testing Service Role Key...');
try {
  const supabase = createClient(url, serviceKey);
  
  // Try a simple query
  const { data, error } = await supabase
    .from('brand_profiles')
    .select('count')
    .limit(1);
  
  if (error) {
    console.error('❌ Query failed:', error.message);
    console.error('   Code:', error.code);
    console.error('   Status:', error.status);
  } else {
    console.log('✅ Service key works! Query successful');
  }
} catch (err) {
  console.error('❌ Exception:', err.message);
}

console.log('\n🧪 Testing Anon Key...');
try {
  const supabase = createClient(url, anonKey);
  
  // Try a simple query
  const { data, error } = await supabase
    .from('brand_profiles')
    .select('count')
    .limit(1);
  
  if (error) {
    console.error('❌ Query failed:', error.message);
  } else {
    console.log('✅ Anon key works! Query successful');
  }
} catch (err) {
  console.error('❌ Exception:', err.message);
}
