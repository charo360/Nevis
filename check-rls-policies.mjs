import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nrfceylvtiwpqsoxurrv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI5ODY3MywiZXhwIjoyMDcyODc0NjczfQ.R6x0E0YbYxOyDRCBzpHjzYxj-JuPdvuuv8JfHJhYMhM'
);

console.log('🔒 Checking RLS policies for brand_profiles table');
console.log('═'.repeat(60));

// Check if RLS is enabled
const { data: tables, error: tableError } = await supabase
  .rpc('get_table_info', { table_name: 'brand_profiles' })
  .single()
  .catch(() => null);

if (tableError) {
  console.log('⚠️  Cannot check RLS status via RPC (this is normal)');
}

// Let's try a direct query to see what policies exist
const checkQuery = `
  SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
  FROM pg_policies 
  WHERE tablename = 'brand_profiles';
`;

console.log('\n📋 Attempting to query pg_policies...');
const { data: policies, error: policyError } = await supabase
  .rpc('exec_sql', { query: checkQuery })
  .catch(() => ({ data: null, error: null }));

if (policyError) {
  console.log('⚠️  Cannot query policies directly (need custom RPC function)');
}

// Try with anon key to simulate client behavior
const supabaseAnon = createClient(
  'https://nrfceylvtiwpqsoxurrv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNleWx2dGl3cHFzb3h1cnJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyOTg2NzMsImV4cCI6MjA3Mjg3NDY3M30.pnUnU4WI6ALRyTmasYVqzjl3JDjhXsGBJFVwPWzsKfk'
);

console.log('\n🔍 Testing query with ANON key (client-side simulation):');
const { data: anonBrands, error: anonError } = await supabaseAnon
  .from('brand_profiles')
  .select('*')
  .eq('user_id', 'dd9f93dc-08c2-4086-9359-687fa6c5897d')
  .eq('is_active', true);

console.log('   Query with anon key:');
if (anonError) {
  console.log('   ❌ ERROR:', anonError.message);
  console.log('   Code:', anonError.code);
  console.log('   Details:', anonError.details);
  console.log('   Hint:', anonError.hint);
} else {
  console.log('   ✅ SUCCESS - Found', anonBrands?.length || 0, 'brands');
  if (anonBrands && anonBrands.length > 0) {
    anonBrands.forEach(b => console.log('      -', b.business_name));
  }
}

console.log('\n═'.repeat(60));
console.log('🔍 DIAGNOSIS:');
if (anonError) {
  console.log('   ❌ RLS policies are blocking client-side queries!');
  console.log('   The anon key cannot read brand_profiles.');
  console.log('   Solution: Need to add proper RLS policies or use service role in API routes.');
} else {
  console.log('   ✅ RLS policies are working correctly.');
  console.log('   The issue must be elsewhere in the application code.');
}
