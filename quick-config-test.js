// Simple test to verify the new configuration
require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

async function quickTest() {
  console.log('🔧 Quick Configuration Test');
  console.log('============================\n');

  // Test Stripe with new price IDs
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  
  console.log('📋 Testing your updated price IDs:');
  const priceIds = [
    { id: 'price_1SCkjkCik0ZJySexpx9RGhu3', name: 'Enterprise Agent' },
    { id: 'price_1SCkhJCik0ZJySexgkXpFKTO', name: 'Pro Agent' },
    { id: 'price_1SCkefCik0ZJySexBO34LAsl', name: 'Growth Agent' },
    { id: 'price_1SCwe1Cik0ZJySexYVYW97uQ', name: 'Starter Agent (NEW)' },
    { id: 'price_1SCkZMCik0ZJySexGFq9FtxO', name: 'Try Agent Free' }
  ];

  for (const { id, name } of priceIds) {
    try {
      const price = await stripe.prices.retrieve(id);
      console.log(`✅ ${name}: $${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
    } catch (error) {
      console.log(`❌ ${name}: NOT FOUND (${id})`);
    }
  }

  // Test Supabase payment_transactions table
  console.log('\n📊 Testing payment_transactions table:');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Database error:', error.message);
    } else {
      console.log('✅ payment_transactions table accessible');
      
      // Show expected schema vs actual
      const expectedFields = ['id', 'user_id', 'stripe_session_id', 'plan_id', 'amount', 'status', 'credits_added', 'created_at'];
      const actualFields = data.length > 0 ? Object.keys(data[0]) : [];
      
      console.log('📋 Expected fields:', expectedFields.join(', '));
      console.log('📋 Available fields:', actualFields.length > 0 ? actualFields.join(', ') : 'No records to check schema');
      
      const missingFields = expectedFields.filter(field => !actualFields.includes(field));
      if (missingFields.length > 0 && actualFields.length > 0) {
        console.log('⚠️  Missing fields:', missingFields.join(', '));
      }
    }
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
  }

  console.log('\n🎯 Configuration test complete!');
}

quickTest();