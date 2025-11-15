import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Use ANON key (like the client does)
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Use SERVICE key (like the server does)
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const targetEmail = 'sm1761a@american.edu';
const userId = 'dd9f93dc-08c2-4086-9359-687fa6c5897d';

console.log('🧪 Testing Client vs Server queries');
console.log('═'.repeat(60));

// First, sign in as the user to get a proper auth token
console.log('\n1️⃣ Attempting to sign in as user...');
const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
  email: targetEmail,
  password: 'test-password-if-exists' // We'll try to sign in
});

let authToken = null;
if (signInData?.session) {
  authToken = signInData.session.access_token;
  console.log('✅ Signed in successfully');
  console.log('   User ID:', signInData.user.id);
} else {
  console.log('⚠️  Could not sign in (expected if password unknown)');
  console.log('   We will test with service role key instead');
}

// Test 1: Query with SERVICE role (bypasses RLS)
console.log('\n2️⃣ Testing with SERVICE role key (should work):');
const { data: serviceData, error: serviceError } = await supabaseService
  .from('brand_profiles')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true);

if (serviceError) {
  console.error('❌ Error:', serviceError);
} else {
  console.log('✅ Found', serviceData?.length || 0, 'brands');
  serviceData?.forEach(b => console.log('   -', b.business_name));
}

// Test 2: Query with ANON key WITHOUT auth (will fail if RLS is enabled)
console.log('\n3️⃣ Testing with ANON key WITHOUT authentication:');
const { data: anonData, error: anonError } = await supabaseClient
  .from('brand_profiles')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true);

if (anonError) {
  console.error('❌ Error:', anonError.message);
  console.log('   This is likely due to RLS policies requiring authentication');
} else {
  console.log('✅ Found', anonData?.length || 0, 'brands');
  anonData?.forEach(b => console.log('   -', b.business_name));
}

// Test 3: Query with ANON key WITH auth token (if we got one)
if (authToken) {
  console.log('\n4️⃣ Testing with ANON key WITH authentication token:');
  
  const authenticatedClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    }
  );
  
  const { data: authData, error: authError } = await authenticatedClient
    .from('brand_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (authError) {
    console.error('❌ Error:', authError.message);
  } else {
    console.log('✅ Found', authData?.length || 0, 'brands');
    authData?.forEach(b => console.log('   -', b.business_name));
  }
}

// Check RLS status
console.log('\n5️⃣ Checking RLS status on brand_profiles table:');
const { data: rlsData, error: rlsError } = await supabaseService
  .from('pg_tables')
  .select('tablename, rowsecurity')
  .eq('schemaname', 'public')
  .eq('tablename', 'brand_profiles')
  .single();

if (rlsError) {
  console.log('⚠️  Could not check RLS status:', rlsError.message);
} else {
  console.log('   RLS enabled:', rlsData?.rowsecurity || false);
}

console.log('\n═'.repeat(60));
console.log('🔍 DIAGNOSIS:');
console.log('If service role works but anon key fails,');
console.log('then RLS policies are blocking client-side access.');
console.log('Solution: Check RLS policies or use server-side queries.');
