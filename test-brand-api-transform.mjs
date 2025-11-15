import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Import the transform function logic
function rowToProfile(row) {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    businessType: row.business_type,
    description: row.description,
    location: typeof row.location === 'string' ?
      (JSON.parse(row.location)?.country || '') :
      (row.location?.country || ''),
    city: typeof row.location === 'string' ?
      (JSON.parse(row.location)?.city || '') :
      (row.location?.city || ''),
    contactAddress: typeof row.location === 'string' ?
      (JSON.parse(row.location)?.address || '') :
      (row.location?.address || ''),
  };
}

async function testTransform() {
  try {
    console.log('\n🔍 Testing brand profile transform...\n');

    // Fetch a brand from database
    const { data: brands, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', 'dd9f93dc-08c2-4086-9359-687fa6c5897d')
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error fetching brand:', error);
      return;
    }

    console.log('📦 Raw database row:');
    console.log('  business_name:', brands.business_name);
    console.log('  business_type:', brands.business_type);
    console.log('  location:', brands.location);
    console.log('');

    // Transform it
    const transformed = rowToProfile(brands);

    console.log('✨ Transformed profile:');
    console.log('  businessName:', transformed.businessName);
    console.log('  businessType:', transformed.businessType);
    console.log('  location:', transformed.location);
    console.log('  city:', transformed.city);
    console.log('');

    // Test the brandLabel logic from dashboard
    const brandLabel = transformed?.businessName ?? 'Unnamed Brand';
    console.log('🏷️  Dashboard brandLabel:', brandLabel);
    console.log('');

    // Check if businessName is falsy
    if (!transformed.businessName) {
      console.log('⚠️  WARNING: businessName is falsy!');
      console.log('  Type:', typeof transformed.businessName);
      console.log('  Value:', transformed.businessName);
    } else {
      console.log('✅ businessName is truthy');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTransform();
