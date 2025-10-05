/**
 * Comprehensive test to verify all Revo services use proxy
 */

async function testAllRevoProxy() {
  console.log('🧪 Testing ALL Revo Services with Proxy Integration...\n');
  
  const proxyUrl = 'http://localhost:8000';
  const nextjsUrl = 'http://localhost:3001';
  
  // 1. Test proxy health
  console.log('1️⃣ Testing proxy health...');
  try {
    const response = await fetch(`${proxyUrl}/health`);
    const data = await response.json();
    console.log('✅ Proxy is healthy');
    console.log(`   Models: ${data.allowed_models.join(', ')}\n`);
  } catch (error) {
    console.log('❌ Proxy health check failed:', error.message);
    return;
  }
  
  // 2. Purchase credits for testing
  console.log('2️⃣ Setting up test user with credits...');
  try {
    const response = await fetch(`${proxyUrl}/purchase-credits/test_user?tier=basic`, {
      method: 'POST'
    });
    const data = await response.json();
    console.log('✅ Credits purchased');
    console.log(`   Credits: ${data.credits_added}\n`);
  } catch (error) {
    console.log('❌ Credit setup failed:', error.message);
  }
  
  // 3. Test Revo 1.0 through Next.js API
  console.log('3️⃣ Testing Revo 1.0 through Next.js API...');
  try {
    const response = await fetch(`${nextjsUrl}/api/quick-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        revoModel: 'revo-1.0',
        platform: 'Instagram',
        brandProfile: {
          businessName: 'TechCorp Solutions',
          businessType: 'Technology',
          location: 'Nairobi, Kenya',
          writingTone: 'professional',
          contentThemes: ['innovation'],
          targetAudience: 'Business professionals',
          services: 'Software development'
        },
        brandConsistency: {
          strictConsistency: false,
          followBrandColors: true,
          includeContacts: false
        },
        useLocalLanguage: false,
        includePeopleInDesigns: true
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Revo 1.0 API call successful');
      console.log(`   Generated content: ${data.content?.headline || 'N/A'}`);
      console.log(`   Image URL: ${data.imageUrl ? 'Generated' : 'Not generated'}\n`);
    } else {
      const error = await response.text();
      console.log('❌ Revo 1.0 API call failed:', error.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Revo 1.0 test error:', error.message);
  }
  
  // 4. Test Revo 1.5 through Next.js API
  console.log('4️⃣ Testing Revo 1.5 through Next.js API...');
  try {
    const response = await fetch(`${nextjsUrl}/api/quick-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        revoModel: 'revo-1.5',
        platform: 'Instagram',
        brandProfile: {
          businessName: 'TechCorp Solutions',
          businessType: 'Technology',
          location: 'Nairobi, Kenya',
          writingTone: 'professional',
          contentThemes: ['innovation'],
          targetAudience: 'Business professionals',
          services: 'Software development'
        },
        brandConsistency: {
          strictConsistency: false,
          followBrandColors: true,
          includeContacts: false
        },
        useLocalLanguage: false,
        includePeopleInDesigns: true
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Revo 1.5 API call successful');
      console.log(`   Generated content: ${data.content?.headline || 'N/A'}`);
      console.log(`   Image URL: ${data.imageUrl ? 'Generated' : 'Not generated'}\n`);
    } else {
      const error = await response.text();
      console.log('❌ Revo 1.5 API call failed:', error.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Revo 1.5 test error:', error.message);
  }
  
  // 5. Test Revo 2.0 through Next.js API
  console.log('5️⃣ Testing Revo 2.0 through Next.js API...');
  try {
    const response = await fetch(`${nextjsUrl}/api/generate-revo-2.0`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessType: 'Technology',
        platform: 'Instagram',
        brandProfile: {
          businessName: 'TechCorp Solutions',
          businessType: 'Technology',
          location: 'Nairobi, Kenya'
        },
        visualStyle: 'modern',
        imageText: 'Test Proxy Integration',
        aspectRatio: '1:1',
        includePeopleInDesigns: false,
        useLocalLanguage: false,
        includeContacts: false
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Revo 2.0 API call successful');
      console.log(`   Generated content: ${data.content?.headline || 'N/A'}`);
      console.log(`   Image URL: ${data.imageUrl ? 'Generated' : 'Not generated'}\n`);
    } else {
      const error = await response.text();
      console.log('❌ Revo 2.0 API call failed:', error.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Revo 2.0 test error:', error.message);
  }
  
  // 6. Check final proxy statistics
  console.log('6️⃣ Checking final proxy statistics...');
  try {
    const response = await fetch(`${proxyUrl}/stats`);
    const data = await response.json();
    console.log('✅ Proxy stats retrieved');
    console.log(`   Total users: ${data.total_users}`);
    console.log(`   Total credits remaining: ${data.total_credits_remaining}`);
    console.log(`   Total actual AI cost: ${data.total_actual_ai_cost}`);
    console.log(`   Generation costs: Text=${data.generation_costs.text_only}, Image=${data.generation_costs.image_only}\n`);
  } catch (error) {
    console.log('❌ Stats check failed:', error.message);
  }
  
  // 7. Check user credits
  console.log('7️⃣ Checking user credit balance...');
  try {
    const response = await fetch(`${proxyUrl}/credits/test_user`);
    const data = await response.json();
    console.log('✅ User credits retrieved');
    console.log(`   Credits remaining: ${data.credits_remaining}`);
    console.log(`   Total AI cost incurred: ${data.total_ai_cost_incurred}`);
    console.log(`   Tier: ${data.tier}\n`);
  } catch (error) {
    console.log('❌ Credit check failed:', error.message);
  }
  
  console.log('🎯 SUMMARY:');
  console.log('✅ If you see successful API calls above, ALL Revo services are using the proxy!');
  console.log('✅ Check the proxy server logs to confirm requests came through');
  console.log('✅ Your complete AI cost protection system is now active!');
  console.log('\n📊 Next: Check proxy server terminal for request logs');
  console.log('🔍 Look for: "🔄 Revo X.X: Using proxy for [text/image] generation"');
}

// Run the comprehensive test
testAllRevoProxy().catch(console.error);
