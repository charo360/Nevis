#!/usr/bin/env node

// Comprehensive cleanup script that handles foreign key constraints
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

console.log('🧹 Comprehensive cleanup for sarcharo@gmail.com...\n');

async function comprehensiveCleanup() {
  try {
    console.log('1️⃣ Finding orphaned users table record...');
    
    const { data: orphanedUsers, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', EMAIL);
    
    if (userError) {
      console.log('❌ Error finding orphaned users:', userError.message);
      return;
    }
    
    if (!orphanedUsers || orphanedUsers.length === 0) {
      console.log('✅ No orphaned users found');
      return;
    }
    
    const orphanedUser = orphanedUsers[0];
    console.log('✅ Found orphaned user:', orphanedUser.id);
    
    console.log('\n2️⃣ Checking for associated brand profiles...');
    
    const { data: brandProfiles, error: brandError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', orphanedUser.id);
    
    if (brandError) {
      console.log('❌ Error checking brand profiles:', brandError.message);
      return;
    }
    
    console.log(`✅ Found ${brandProfiles?.length || 0} brand profiles to clean up`);
    
    if (brandProfiles && brandProfiles.length > 0) {
      console.log('\n3️⃣ Deleting brand profiles...');
      
      for (const profile of brandProfiles) {
        console.log(`   - Deleting brand profile: ${profile.business_name || 'Unnamed'}`);
        
        const { error: deleteError } = await supabase
          .from('brand_profiles')
          .delete()
          .eq('id', profile.id);
        
        if (deleteError) {
          console.log(`   ❌ Failed to delete brand profile ${profile.id}:`, deleteError.message);
        } else {
          console.log(`   ✅ Deleted brand profile ${profile.id}`);
        }
      }
    }
    
    console.log('\n4️⃣ Deleting orphaned users record...');
    
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', orphanedUser.id);
    
    if (deleteUserError) {
      console.log('❌ Failed to delete orphaned user:', deleteUserError.message);
      return;
    }
    
    console.log('✅ Orphaned users record deleted');
    
    console.log('\n5️⃣ Verifying cleanup...');
    
    const { data: verifyUsers } = await supabase
      .from('users')
      .select('*')
      .eq('email', EMAIL);
    
    const { data: verifyProfiles } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', orphanedUser.id);
    
    if (verifyUsers && verifyUsers.length === 0 && verifyProfiles && verifyProfiles.length === 0) {
      console.log('✅ Cleanup completed successfully!');
      console.log('💡 You should now be able to create your account with sarcharo@gmail.com');
      
      console.log('\n🎯 Next steps:');
      console.log('1. Go to http://localhost:3001/auth');
      console.log('2. Click the "Sign Up" tab');
      console.log('3. Create your account with sarcharo@gmail.com');
      console.log('4. Or run: node create-account-simple.js');
      
    } else {
      console.log('⚠️ Cleanup may not be complete');
      if (verifyUsers && verifyUsers.length > 0) {
        console.log(`   - Still found ${verifyUsers.length} users records`);
      }
      if (verifyProfiles && verifyProfiles.length > 0) {
        console.log(`   - Still found ${verifyProfiles.length} brand profiles`);
      }
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

async function main() {
  await comprehensiveCleanup();
}

main().catch(console.error);