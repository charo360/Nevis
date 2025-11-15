import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nrfceylvtiwpqsoxurrv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI5ODY3MywiZXhwIjoyMDcyODc0NjczfQ.R6x0E0YbYxOyDRCBzpHjzYxj-JuPdvuuv8JfHJhYMhM'
);

const targetEmail = 'sm1761a@american.edu';

console.log('🔧 Fixing user_id in users table for:', targetEmail);
console.log('═'.repeat(60));

// Find user by email in auth
const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.error('❌ Auth error:', authError);
  process.exit(1);
}

const user = authUsers.users.find(u => u.email === targetEmail);

if (!user) {
  console.log('❌ User not found in auth.users');
  process.exit(1);
}

console.log('✅ Found user in auth.users');
console.log('   Auth User ID:', user.id);

// Check current state in users table
const { data: currentUserData, error: selectError } = await supabase
  .from('users')
  .select('*')
  .eq('email', targetEmail)
  .single();

if (selectError && selectError.code !== 'PGRST116') {
  console.error('❌ Error checking users table:', selectError);
  process.exit(1);
}

if (!currentUserData) {
  console.log('\n⚠️  No record in users table, creating one...');
  
  const { data: insertedData, error: insertError } = await supabase
    .from('users')
    .insert({
      user_id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.display_name || '',
      created_at: user.created_at,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error creating user record:', insertError);
    process.exit(1);
  }

  console.log('✅ Created user record with user_id:', insertedData.user_id);
} else {
  console.log('\n📊 Current users table record:');
  console.log('   user_id:', currentUserData.user_id || 'null');
  console.log('   email:', currentUserData.email);
  
  if (!currentUserData.user_id || currentUserData.user_id !== user.id) {
    console.log('\n🔧 Updating user_id to match auth.users.id...');
    
    const { data: updatedData, error: updateError } = await supabase
      .from('users')
      .update({
        user_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('email', targetEmail)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user_id:', updateError);
      process.exit(1);
    }

    console.log('✅ Updated user_id to:', updatedData.user_id);
  } else {
    console.log('✅ user_id already matches auth.users.id');
  }
}

// Verify brands are now accessible
console.log('\n🏢 Verifying brand access...');
const { data: brands, error: brandError } = await supabase
  .from('brand_profiles')
  .select('business_name, id')
  .eq('user_id', user.id);

if (brandError) {
  console.error('❌ Error fetching brands:', brandError);
} else {
  console.log('✅ User now has access to', brands.length, 'brand(s):');
  brands.forEach(b => console.log('   -', b.business_name));
}

console.log('\n═'.repeat(60));
console.log('✅ Fix completed! Please refresh your development app.');
