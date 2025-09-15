#!/usr/bin/env node

// Script to inspect the foreign key constraint details
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Inspecting foreign key constraint details...\n');

async function inspectForeignKey() {
  try {
    console.log('1️⃣ Getting table schema information...');
    
    // Get information about the brand_profiles table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'brand_profiles' });
    
    if (tableError) {
      console.log('❌ Could not get table info via RPC, trying direct query...');
      
      // Try a different approach - query PostgreSQL system tables directly
      const { data: constraintInfo, error: constraintError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'brand_profiles')
        .eq('constraint_type', 'FOREIGN KEY');
      
      if (constraintError) {
        console.log('❌ Could not query constraints:', constraintError.message);
      } else {
        console.log('📋 Foreign key constraints on brand_profiles:', constraintInfo);
      }
    } else {
      console.log('📋 Table info:', tableInfo);
    }
    
    console.log('\n2️⃣ Querying constraint details directly...');
    
    // Try to get foreign key constraint details
    const constraintQuery = `
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'brand_profiles'
        AND kcu.column_name = 'user_id';
    `;
    
    try {
      const { data: fkDetails, error: fkError } = await supabase.rpc('execute_sql', { 
        sql: constraintQuery 
      });
      
      if (fkError) {
        console.log('❌ Could not execute SQL query:', fkError.message);
      } else {
        console.log('📋 Foreign key details:', fkDetails);
      }
    } catch (sqlErr) {
      console.log('❌ SQL execution failed:', sqlErr.message);
      
      // Fallback: let's check what tables actually exist that might be referenced
      console.log('\n3️⃣ Checking what tables exist that might be referenced...');
      
      const possibleTables = ['users', 'profiles', 'user_profiles', 'auth_users'];
      
      for (const tableName of possibleTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('id')
            .limit(1);
          
          if (error) {
            console.log(`❌ Table '${tableName}' does not exist or is not accessible`);
          } else {
            console.log(`✅ Table '${tableName}' exists and is accessible`);
            
            // Check if our test user exists in this table
            const testUserId = '54879fcb-77e0-4db4-be10-57d3e988b026';
            const { data: userExists, error: userError } = await supabase
              .from(tableName)
              .select('id')
              .eq('id', testUserId)
              .single();
            
            if (!userError && userExists) {
              console.log(`  ✅ Test user exists in '${tableName}'`);
            } else {
              console.log(`  ❌ Test user does NOT exist in '${tableName}'`);
            }
          }
        } catch (err) {
          console.log(`❌ Error checking table '${tableName}':`, err.message);
        }
      }
    }
    
    console.log('\n4️⃣ Trying to create brand profile with minimal data...');
    
    // Try the absolute minimum required fields
    const minimalProfile = {
      user_id: '54879fcb-77e0-4db4-be10-57d3e988b026',
      business_name: 'Minimal Test',
      business_type: 'Test',
      is_active: true
    };
    
    const { data: minimalInsert, error: minimalError } = await supabase
      .from('brand_profiles')
      .insert(minimalProfile)
      .select('id')
      .single();
    
    if (minimalError) {
      console.log('❌ Minimal insertion failed:', minimalError.message);
      console.log('🔍 Error details:', JSON.stringify(minimalError, null, 2));
    } else {
      console.log('✅ Minimal insertion succeeded! ID:', minimalInsert.id);
      
      // Clean up
      await supabase.from('brand_profiles').delete().eq('id', minimalInsert.id);
      console.log('🧹 Cleaned up minimal test profile');
    }
    
    console.log('\n5️⃣ Checking if there are any existing brand profiles...');
    
    const { data: existingProfiles, error: existingError } = await supabase
      .from('brand_profiles')
      .select('*')
      .limit(5);
    
    if (existingError) {
      console.log('❌ Could not query existing profiles:', existingError.message);
    } else {
      console.log(`📋 Found ${existingProfiles.length} existing profiles:`);
      existingProfiles.forEach(profile => {
        console.log(`  - ${profile.business_name} (user_id: ${profile.user_id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

async function main() {
  await inspectForeignKey();
}

main().catch(console.error);