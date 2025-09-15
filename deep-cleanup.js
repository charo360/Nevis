#!/usr/bin/env node

// Deep cleanup script to find all references to the orphaned user
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMAIL = 'sarcharo@gmail.com';
const ORPHANED_USER_ID = 'd44fe121-343f-45e5-a90d-6f479552dd3f';

console.log('🔍 Deep cleanup analysis for sarcharo@gmail.com...\n');

async function findAllReferences() {
  try {
    console.log('1️⃣ Checking brand_profiles table (all queries)...');
    
    // Try different ways to query brand_profiles
    const queries = [
      { name: 'by user_id', filter: { user_id: ORPHANED_USER_ID } },
      { name: 'by email', filter: {} }, // We'll add where clause manually
    ];
    
    for (const query of queries) {
      console.log(`   - Query ${query.name}:`);
      try {
        let supabaseQuery = supabase.from('brand_profiles').select('*');
        
        if (query.name === 'by user_id') {
          supabaseQuery = supabaseQuery.eq('user_id', ORPHANED_USER_ID);
        }
        
        const { data, error } = await supabaseQuery;
        
        if (error) {
          console.log(`     ❌ Error: ${error.message}`);
        } else {
          console.log(`     ✅ Found ${data?.length || 0} records`);
          if (data && data.length > 0) {
            data.forEach((record, index) => {
              console.log(`       - Record ${index + 1}: ID=${record.id}, user_id=${record.user_id}, business_name=${record.business_name || 'Unnamed'}`);
            });
          }
        }
      } catch (err) {
        console.log(`     ❌ Query failed: ${err.message}`);
      }
    }
    
    console.log('\n2️⃣ Checking for other tables that might reference users...');
    
    // List of potential tables that might reference users
    const potentialTables = [
      'generated_posts',
      'user_settings', 
      'social_connections',
      'artifacts',
      'user_sessions'
    ];
    
    for (const table of potentialTables) {
      console.log(`   - Checking ${table}:`);
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', ORPHANED_USER_ID)
          .limit(5);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`     ℹ️ Table doesn't exist`);
          } else {
            console.log(`     ❌ Error: ${error.message}`);
          }
        } else {
          console.log(`     ✅ Found ${data?.length || 0} records`);
          if (data && data.length > 0) {
            data.forEach((record, index) => {
              console.log(`       - Record ${index + 1}: ID=${record.id}`);
            });
          }
        }
      } catch (err) {
        console.log(`     ❌ Query failed: ${err.message}`);
      }
    }
    
    console.log('\n3️⃣ Trying alternative cleanup methods...');
    
    // Method 1: Force delete with CASCADE (if supported)
    console.log('   - Method 1: Raw SQL delete (if RPC is available)...');
    
    try {
      const { data, error } = await supabase.rpc('delete_user_cascade', {
        user_id_to_delete: ORPHANED_USER_ID
      });
      
      if (error) {
        console.log(`     ❌ RPC method not available: ${error.message}`);
      } else {
        console.log(`     ✅ RPC delete successful`);
        return true;
      }
    } catch (err) {
      console.log(`     ❌ RPC method failed: ${err.message}`);
    }
    
    // Method 2: Direct brand_profiles deletion with different filters
    console.log('   - Method 2: Force delete brand profiles...');
    
    try {
      const { error } = await supabase
        .from('brand_profiles')
        .delete()
        .or(`user_id.eq.${ORPHANED_USER_ID}`);
      
      if (error) {
        console.log(`     ❌ Force brand profiles delete failed: ${error.message}`);
      } else {
        console.log(`     ✅ Force brand profiles delete successful`);
        
        // Now try to delete the user
        const { error: userError } = await supabase
          .from('users')
          .delete()
          .eq('id', ORPHANED_USER_ID);
        
        if (userError) {
          console.log(`     ❌ User delete still failed: ${userError.message}`);
        } else {
          console.log(`     ✅ User deleted successfully!`);
          return true;
        }
      }
    } catch (err) {
      console.log(`     ❌ Force delete method failed: ${err.message}`);
    }
    
    // Method 3: Update instead of delete (change email to make it available)
    console.log('   - Method 3: Update email to free up sarcharo@gmail.com...');
    
    try {
      const newEmail = `orphaned-${Date.now()}@deleted.local`;
      const { error } = await supabase
        .from('users')
        .update({ email: newEmail })
        .eq('id', ORPHANED_USER_ID);
      
      if (error) {
        console.log(`     ❌ Email update failed: ${error.message}`);
      } else {
        console.log(`     ✅ Email updated to ${newEmail}`);
        console.log(`     💡 The email sarcharo@gmail.com should now be available`);
        return true;
      }
    } catch (err) {
      console.log(`     ❌ Email update method failed: ${err.message}`);
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Deep cleanup analysis failed:', error);
    return false;
  }
}

async function testAccountCreation() {
  console.log('\n4️⃣ Testing account creation...');
  
  try {
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data, error } = await supabaseClient.auth.signUp({
      email: EMAIL,
      password: 'nevisai2024!',
      options: {
        data: {
          display_name: 'Sarcharo',
          full_name: 'Sarcharo'
        }
      }
    });
    
    if (error) {
      console.log('❌ Account creation still fails:', error.message);
      return false;
    } else {
      console.log('✅ Account creation successful!');
      console.log('🆔 User ID:', data.user?.id);
      
      // Clean up test user
      await supabase.auth.admin.deleteUser(data.user.id);
      console.log('🧹 Test user cleaned up');
      
      return true;
    }
  } catch (err) {
    console.log('❌ Account creation test failed:', err.message);
    return false;
  }
}

async function main() {
  const cleanupSuccess = await findAllReferences();
  
  if (cleanupSuccess) {
    console.log('\n🎉 Cleanup appears successful! Testing account creation...');
    const testSuccess = await testAccountCreation();
    
    if (testSuccess) {
      console.log('\n✅ SUCCESS! You can now create your account:');
      console.log('1. Go to http://localhost:3001/auth');
      console.log('2. Use the Sign Up tab');
      console.log('3. Email: sarcharo@gmail.com');
      console.log('4. Password: nevisai2024! (or choose your own)');
    }
  } else {
    console.log('\n⚠️ Cleanup methods didn\'t work. Alternative options:');
    console.log('1. Use a different email like sarcharo+nevis@gmail.com');
    console.log('2. Manually delete the orphaned records in Supabase dashboard');
    console.log('3. Contact Supabase support if this is a recurring issue');
  }
}

main().catch(console.error);