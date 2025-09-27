#!/usr/bin/env node

/**
 * User Access Verification Script
 * Tests that existing users maintain access after payment system deployment
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyUserAccess() {
  console.log('🔍 Verifying User Access After Migration...\n');

  try {
    // 1. Check total user count
    const { count: totalUsers, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count users: ${countError.message}`);
    }

    console.log(`📊 Total users in database: ${totalUsers}`);

    // 2. Check users with trial periods
    const { data: trialUsers, error: trialError } = await supabase
      .from('users')
      .select('user_id, email, trial_ends_at, remaining_credits, subscription_plan, subscription_status')
      .not('trial_ends_at', 'is', null);

    if (trialError) {
      throw new Error(`Failed to fetch trial users: ${trialError.message}`);
    }

    console.log(`✅ Users with trial periods: ${trialUsers.length}`);

    // 3. Check users with credits
    const { count: usersWithCredits } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('remaining_credits', 0);

    console.log(`💳 Users with remaining credits: ${usersWithCredits}`);

    // 4. Test subscription access function for sample users
    console.log('\n🧪 Testing subscription access for sample users:');
    
    const sampleUsers = trialUsers.slice(0, 3); // Test first 3 users
    
    for (const user of sampleUsers) {
      try {
        const { data: accessResult, error: accessError } = await supabase
          .rpc('check_subscription_access', {
            p_user_id: user.user_id,
            p_feature: 'revo-2.0'
          });

        if (accessError) {
          console.error(`❌ Access check failed for ${user.user_id}:`, accessError.message);
          continue;
        }

        const access = accessResult[0];
        const status = access.has_access ? '✅ HAS ACCESS' : '❌ NO ACCESS';
        
        console.log(`   ${status} - User: ${user.user_id.substring(0, 8)}...`);
        console.log(`     Reason: ${access.reason}`);
        console.log(`     Credits: ${access.credits_remaining}`);
        console.log(`     Status: ${access.subscription_status}`);
        console.log('');

      } catch (error) {
        console.error(`❌ Error testing user ${user.user_id}:`, error.message);
      }
    }

    // 5. Check for users without access (potential issues)
    console.log('🚨 Checking for users who might have lost access:');
    
    const { data: freeUsers, error: freeError } = await supabase
      .from('users')
      .select('user_id, email, trial_ends_at, remaining_credits, subscription_plan')
      .eq('subscription_plan', 'free')
      .is('trial_ends_at', null);

    if (freeError) {
      console.error('❌ Failed to check free users:', freeError.message);
    } else if (freeUsers.length > 0) {
      console.log(`⚠️  Found ${freeUsers.length} free users without trial periods:`);
      freeUsers.slice(0, 5).forEach(user => {
        console.log(`   - ${user.user_id.substring(0, 8)}... (${user.email})`);
      });
      console.log('\n💡 These users may need manual trial assignment.');
    } else {
      console.log('✅ All free users have trial periods assigned.');
    }

    // 6. Summary report
    console.log('\n📋 MIGRATION VERIFICATION SUMMARY:');
    console.log('=====================================');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Users with Trials: ${trialUsers.length} (${Math.round(trialUsers.length / totalUsers * 100)}%)`);
    console.log(`Users with Credits: ${usersWithCredits} (${Math.round(usersWithCredits / totalUsers * 100)}%)`);
    console.log(`Users without Trials: ${freeUsers?.length || 0}`);

    // 7. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (trialUsers.length / totalUsers > 0.8) {
      console.log('✅ Migration appears successful - most users have trial periods');
    } else {
      console.log('⚠️  Consider running additional migration for users without trials');
    }

    if (usersWithCredits / totalUsers > 0.8) {
      console.log('✅ Credit distribution successful - most users have credits');
    } else {
      console.log('⚠️  Some users may need additional credits');
    }

    console.log('\n🎯 Verification complete!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyUserAccess();
