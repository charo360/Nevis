import { createClient } from '@supabase/supabase-js';

// Use ANON key (like the client does)
const supabaseClient = createClient(
  'https://nrfceylvtiwpqsoxurrv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyOTg2NzMsImV4cCI6MjA3Mjg3NDY3M30.pnUnU4WI6ALRyTmasYVqzjl3JDjhXsGBJFVwPWzsKfk'
);

// Use SERVICE key (like the server does)
const supabaseService = createClient(
  'https://nrfceylvtiwpqsoxurrv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI5ODY3MywiZXhwIjoyMDcyODc0NjczfQ.R6x0E0YbYxOyDRCBzpHjzYxj-JuPdvuuv8JfHJhYMhM'
);

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
    'https://nrfceylvtiwpqsoxurrv.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyOTg2NzMsImV4cCI6MjA3Mjg3NDY3M30.pnUnU4WI6ALRyTmasYVqzjl3JDjhXsGBJFVwPWzsKfk',
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
