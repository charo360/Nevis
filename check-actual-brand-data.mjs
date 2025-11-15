import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBrandData() {
  console.log('🔍 Checking brand_profiles table data...\n');

  // Query the brand_profiles table directly
  const { data: brands, error } = await supabase
    .from('brand_profiles')
    .select('id, user_id, business_name, business_type, location, is_active')
    .limit(5);

  if (error) {
    console.error('❌ Error fetching brands:', error);
    return;
  }

  console.log(`✅ Found ${brands.length} brand(s)\n`);
  
  brands.forEach((brand, index) => {
    console.log(`Brand ${index + 1}:`);
    console.log(`  ID: ${brand.id}`);
    console.log(`  User ID: ${brand.user_id}`);
    console.log(`  Business Name: "${brand.business_name}"`);
    console.log(`  Business Type: ${brand.business_type}`);
    console.log(`  Location: ${JSON.stringify(brand.location)}`);
    console.log(`  Is Active: ${brand.is_active}`);
    console.log('');
  });

  // Now check what the API returns
  console.log('🔍 Checking what /api/brand-profiles returns...\n');
  
  const testUserId = 'dd9f93dc-08c2-4086-9359-687fa6c5897d'; // sm1761a@american.edu
  
  try {
    const response = await fetch(`http://localhost:3000/api/brand-profiles?userId=${testUserId}`);
    const apiData = await response.json();
    
    console.log('API Response:', JSON.stringify(apiData, null, 2));
  } catch (error) {
    console.log('⚠️  API test skipped (dev server not running)');
    console.log('   Start server with: npm run dev');
  }
}

checkBrandData();
