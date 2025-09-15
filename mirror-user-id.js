#!/usr/bin/env node

// Mirror users.id into users.user_id for legacy FK compatibility
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 Mirroring users.id -> users.user_id for all rows with NULL user_id...');

async function mirrorUserIds() {
  try {
    // 1) Fetch all users with NULL user_id
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, user_id')
      .is('user_id', null);

    if (error) {
      console.error('❌ Failed to fetch users:', error.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('✅ Nothing to update. All rows already have user_id set.');
      return;
    }

    console.log(`📋 Found ${users.length} users with NULL user_id. Updating...`);

    // 2) Update each row to set user_id = id
    let updated = 0;
    for (const u of users) {
      const { error: updErr } = await supabase
        .from('users')
        .update({ user_id: u.id })
        .eq('id', u.id);

      if (updErr) {
        console.error(`❌ Failed to update ${u.email} (${u.id}):`, updErr.message);
      } else {
        updated++;
        console.log(`✅ Updated user_id for ${u.email} -> ${u.id}`);
      }
    }

    console.log(`\n🎉 Completed. Updated ${updated}/${users.length} rows.`);
  } catch (err) {
    console.error('❌ Mirror process failed:', err);
    process.exit(1);
  }
}

mirrorUserIds().catch(console.error);
