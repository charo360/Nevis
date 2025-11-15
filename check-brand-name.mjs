import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkBrandName() {
  try {
    // Query for brands for the test user
    const { data: brands, error } = await supabase
      .from('brand_profiles')
      .select('id, user_id, business_name, name')
      .eq('user_id', '7ad13e7a-9f14-4f25-a53e-d86d0e21076d')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching brands:', error);
      return;
    }

    console.log('\n📊 Brand Data Check:');
    console.log('='.repeat(60));
    
    if (!brands || brands.length === 0) {
      console.log('❌ No brands found for this user');
      return;
    }

    brands.forEach((brand, index) => {
      console.log(`\nBrand ${index + 1}:`);
      console.log(`  ID: ${brand.id}`);
      console.log(`  business_name: "${brand.business_name}"`);
      console.log(`  name: "${brand.name || 'NULL'}"`);
      console.log(`  Is business_name empty? ${!brand.business_name}`);
      console.log(`  Is business_name null? ${brand.business_name === null}`);
    });

    console.log('\n' + '='.repeat(60));

    // Test the API endpoint
    if (brands.length > 0) {
      console.log('\n🔍 Testing API endpoint for first brand...');
      const brandId = brands[0].id;
      
      const response = await fetch(`http://localhost:3000/api/brand-profiles/${brandId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const apiData = await response.json();
        console.log('\n✅ API Response:');
        console.log(`  businessName: "${apiData.businessName}"`);
        console.log(`  name: "${apiData.name || 'undefined'}"`);
        console.log(`  Is businessName truthy? ${!!apiData.businessName}`);
      } else {
        console.log(`❌ API request failed: ${response.status}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBrandName();
