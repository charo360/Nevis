import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nrfceylvtiwpqsoxurrv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI5ODY3MywiZXhwIjoyMDcyODc0NjczfQ.R6x0E0YbYxOyDRCBzpHjzYxj-JuPdvuuv8JfHJhYMhM'
);

const targetEmail = 'sm1761a@american.edu';

console.log('🔍 Deep debugging brand visibility issue');
console.log('═'.repeat(70));

// 1. Get auth user
const { data: authUsers } = await supabase.auth.admin.listUsers();
const authUser = authUsers.users.find(u => u.email === targetEmail);

if (!authUser) {
  console.log('❌ User not found');
  process.exit(1);
}

console.log('\n1️⃣ AUTH USER INFO:');
console.log('   ID:', authUser.id);
console.log('   Email:', authUser.email);
console.log('   Email Confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No');
console.log('   Last Sign In:', authUser.last_sign_in_at);

// 2. Check users table
console.log('\n2️⃣ USERS TABLE:');
const { data: usersData, error: usersError } = await supabase
  .from('users')
  .select('*')
  .eq('email', targetEmail);

if (usersError) {
  console.log('   ❌ Error:', usersError.message);
} else if (!usersData || usersData.length === 0) {
  console.log('   ⚠️  No records found');
} else {
  usersData.forEach(u => {
    console.log('   - ID:', u.id);
    console.log('     user_id:', u.user_id);
    console.log('     email:', u.email);
    console.log('     Auth ID match:', u.user_id === authUser.id ? '✅' : '❌');
  });
}

// 3. Check brand_profiles with different queries
console.log('\n3️⃣ BRAND PROFILES QUERIES:');

// Query 1: By auth user ID
console.log('\n   Query 1: By auth user.id');
const { data: brands1, error: error1 } = await supabase
  .from('brand_profiles')
  .select('*')
  .eq('user_id', authUser.id);

console.log('   Results:', brands1?.length || 0, 'brands');
if (error1) console.log('   Error:', error1.message);
if (brands1 && brands1.length > 0) {
  brands1.forEach(b => console.log('      -', b.business_name, '| Active:', b.is_active));
}

// Query 2: By auth user ID + is_active = true
console.log('\n   Query 2: By auth user.id + is_active = true');
const { data: brands2, error: error2 } = await supabase
  .from('brand_profiles')
  .select('*')
  .eq('user_id', authUser.id)
  .eq('is_active', true);

console.log('   Results:', brands2?.length || 0, 'brands');
if (error2) console.log('   Error:', error2.message);
if (brands2 && brands2.length > 0) {
  brands2.forEach(b => console.log('      -', b.business_name));
}

// 4. Check RLS policies
console.log('\n4️⃣ RLS POLICIES CHECK:');
const { data: policies, error: policiesError } = await supabase
  .rpc('pg_policies', {})
  .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

if (!policiesError && policies) {
  console.log('   Policies found:', policies.length);
} else {
  console.log('   ⚠️  Cannot check policies directly');
}

// Try with anon key (simulating client-side access)
console.log('\n5️⃣ CLIENT-SIDE ACCESS SIMULATION:');
const anonSupabase = createClient(
  'https://nrfceylvtiwpqsoxurrv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyOTg2NzMsImV4cCI6MjA3Mjg3NDY3M30.pnUnU4WI6ALRyTmasYVqzjl3JDjhXsGBJFVwPWzsKfk'
);

// Try to sign in
const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({
  email: targetEmail,
  password: 'temporary-for-test' // This will fail but we can check the response
});

console.log('   Sign-in attempt (to check user accessibility)');
if (signInError) {
  console.log('   Note: Sign-in failed (expected without password)');
  console.log('   Error:', signInError.message);
}

// 6. Check table permissions
console.log('\n6️⃣ TABLE STRUCTURE:');
const { data: tableInfo, error: tableError } = await supabase
  .from('brand_profiles')
  .select('*')
  .limit(1);

if (tableError) {
  console.log('   ❌ Error accessing table:', tableError.message);
} else {
  console.log('   ✅ Table accessible');
  if (tableInfo && tableInfo.length > 0) {
    console.log('   Columns:', Object.keys(tableInfo[0]).join(', '));
  }
}

// 7. Summary
console.log('\n═'.repeat(70));
console.log('📊 SUMMARY:');
console.log('   Auth User ID:', authUser.id);
console.log('   Total Brands (server-side):', brands1?.length || 0);
console.log('   Active Brands (server-side):', brands2?.length || 0);

if (brands2 && brands2.length > 0) {
  console.log('\n✅ Brands ARE accessible with service role key');
  console.log('⚠️  Issue is likely with:');
  console.log('   1. RLS policies blocking client-side access');
  console.log('   2. Client-side code using wrong user_id');
  console.log('   3. Session/token issue in browser');
} else {
  console.log('\n❌ No brands found even with service role');
  console.log('⚠️  Issue is likely with data storage');
}

console.log('\n💡 Next steps:');
console.log('   1. Check browser console for errors');
console.log('   2. Check Network tab for API calls');
console.log('   3. Verify RLS policies on brand_profiles table');
console.log('   4. Check if brands are being fetched with correct user_id');
