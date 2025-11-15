import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nrfceylvtiwpqsoxurrv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI5ODY3MywiZXhwIjoyMDcyODc0NjczfQ.R6x0E0YbYxOyDRCBzpHjzYxj-JuPdvuuv8JfHJhYMhM'
);

const targetEmail = 'sm1761a@american.edu';

console.log('🔍 Debugging brands for user:', targetEmail);
console.log('═'.repeat(60));

// Find user by email
const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.error('❌ Auth error:', authError);
  process.exit(1);
}

const user = authUsers.users.find(u => u.email === targetEmail);

if (!user) {
  console.log('❌ User not found with that email in auth.users');
  process.exit(1);
}

console.log('\n✅ Found user in auth.users:');
console.log('   Auth User ID:', user.id);
console.log('   Email:', user.email);
console.log('   Created:', user.created_at);

// Check users table
const { data: usersTableData, error: usersError } = await supabase
  .from('users')
  .select('*')
  .eq('email', targetEmail);

console.log('\n📊 Users table records:');
if (usersError) {
  console.error('   ❌ Error:', usersError);
} else if (!usersTableData || usersTableData.length === 0) {
  console.log('   ⚠️  No records found in users table');
} else {
  usersTableData.forEach(u => {
    console.log('   - user_id:', u.user_id);
    console.log('     email:', u.email);
    console.log('     name:', u.name);
  });
}

// Check brand profiles with auth user ID
console.log('\n🏢 Searching brands by auth user.id (' + user.id + '):');
const { data: brandsByAuthId, error: brandError1 } = await supabase
  .from('brand_profiles')
  .select('*')
  .eq('user_id', user.id);

if (brandError1) {
  console.error('   ❌ Error:', brandError1);
} else if (!brandsByAuthId || brandsByAuthId.length === 0) {
  console.log('   ⚠️  No brands found with this user_id');
} else {
  console.log('   ✅ Found', brandsByAuthId.length, 'brand(s):');
  brandsByAuthId.forEach(b => {
    console.log('      -', b.business_name);
    console.log('        ID:', b.id);
    console.log('        user_id:', b.user_id);
    console.log('        is_active:', b.is_active);
  });
}

// Check brand profiles with user_id from users table
if (usersTableData && usersTableData.length > 0) {
  const userId = usersTableData[0].user_id;
  console.log('\n🔍 Searching brands by users.user_id (' + userId + '):');
  
  const { data: brandsByUserId, error: brandError2 } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', userId);
    
  if (brandError2) {
    console.error('   ❌ Error:', brandError2);
  } else if (!brandsByUserId || brandsByUserId.length === 0) {
    console.log('   ⚠️  No brands found with this user_id');
  } else {
    console.log('   ✅ Found', brandsByUserId.length, 'brand(s):');
    brandsByUserId.forEach(b => {
      console.log('      -', b.business_name);
      console.log('        ID:', b.id);
      console.log('        user_id:', b.user_id);
      console.log('        is_active:', b.is_active);
    });
  }
}

// Check all brands (to see what user_ids exist)
console.log('\n📋 All brands in database (first 10):');
const { data: allBrands, error: allBrandsError } = await supabase
  .from('brand_profiles')
  .select('id, business_name, user_id, is_active')
  .order('created_at', { ascending: false })
  .limit(10);

if (allBrandsError) {
  console.error('   ❌ Error:', allBrandsError);
} else if (allBrands) {
  allBrands.forEach(b => {
    console.log('   -', b.business_name, '| user_id:', b.user_id.substring(0, 15) + '...');
  });
}

console.log('\n═'.repeat(60));
console.log('🔍 DIAGNOSIS:');
console.log('   - Auth user ID:', user.id);
if (usersTableData && usersTableData.length > 0) {
  console.log('   - Users table user_id:', usersTableData[0].user_id);
  if (user.id !== usersTableData[0].user_id) {
    console.log('   ⚠️  MISMATCH: Auth ID and users.user_id are different!');
    console.log('   This is likely why brands aren\'t showing in development.');
  }
}
