/**
 * Apply Creative Assets Migration
 * Creates the creative_assets table in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Starting creative_assets migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250101_creative_assets.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📝 Executing SQL...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct execution (for newer Supabase versions)
      console.log('⚠️  exec_sql function not found, trying direct execution...\n');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: execError } = await supabase.rpc('exec', { sql: statement });
          if (execError) {
            console.error('❌ Error executing statement:', execError);
          }
        }
      }
    }

    // Verify the table was created
    console.log('\n✅ Verifying table creation...');
    const { data: tableData, error: tableError } = await supabase
      .from('creative_assets')
      .select('count')
      .limit(0);

    if (tableError) {
      console.error('❌ Table verification failed:', tableError.message);
      console.log('\n⚠️  The table may not have been created successfully.');
      console.log('Please run this SQL manually in your Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/nrfceylvtiwpqsoxurrv/sql/new\n');
      console.log(migrationSQL);
    } else {
      console.log('✅ Table created successfully!');
      console.log('✅ creative_assets table is ready to use');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📋 Manual Migration Instructions:');
    console.log('1. Go to: https://supabase.com/dashboard/project/nrfceylvtiwpqsoxurrv/sql/new');
    console.log('2. Copy the contents of: supabase/migrations/20250101_creative_assets.sql');
    console.log('3. Paste and run the SQL in the Supabase SQL Editor');
    process.exit(1);
  }
}

applyMigration();
