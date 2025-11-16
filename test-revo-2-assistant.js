/**
 * Test Revo 2.0 with Assistant to verify it's being used
 */

require('dotenv').config({ path: '.env.local' });

async function testRevo2WithAssistant() {
  console.log('🤖 Testing Revo 2.0 Assistant Integration');
  console.log('==========================================');
  
  const testBrand = {
    id: 'test-retail-brand',
    businessName: 'TechHub Electronics',
    businessType: 'retail',
    industry: 'Electronics Retail',
    description: 'Modern electronics store selling smartphones, laptops, and accessories',
    services: [
      { name: 'Smartphones', description: 'Latest iPhone, Samsung, and Android phones' },
      { name: 'Laptops', description: 'MacBooks, HP, Dell laptops' },
      { name: 'Accessories', description: 'Cases, chargers, headphones' }
    ],
    keyFeatures: 'Smartphones, Laptops, Accessories',
    competitiveAdvantages: 'Lipa Polepole payment plans, Free delivery, 1-year warranty',
    targetAudience: 'Tech-savvy consumers, students, professionals',
    brandPersonality: 'Modern, innovative, customer-focused',
    contentThemes: 'Innovation, Affordability, Quality',
    location: 'Nairobi, Kenya'
  };
  
  console.log('\n📋 Test Brand:', testBrand.businessName);
  console.log(`   Type: ${testBrand.businessType}`);
  console.log(`   Features: ${testBrand.keyFeatures}`);
  
  try {
    console.log('\n🎬 Generating content with Revo 2.0...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/generate-revo-2.0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brandProfile: testBrand,
        platform: 'instagram',
        tone: 'confident'
      })
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`⏱️  Response time: ${executionTime}ms`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Error details:', JSON.stringify(errorData, null, 2));
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Content generated');
      console.log('\n📝 Generated Content:');
      console.log(`   Headline: ${result.headline}`);
      console.log(`   Caption: ${result.caption?.substring(0, 100)}...`);
      console.log(`   CTA: ${result.cta}`);
      console.log(`   Hashtags: ${result.hashtags?.slice(0, 5).join(', ')}`);
      
      // Check metadata for assistant usage
      if (result.metadata) {
        console.log('\n🔍 Generation Metadata:');
        console.log(`   Model Used: ${result.metadata.modelUsed || 'not specified'}`);
        console.log(`   Generation Method: ${result.metadata.generationMethod || 'not specified'}`);
        
        if (result.metadata.generationMethod?.includes('assistant') || 
            result.metadata.generationMethod?.includes('Assistant')) {
          console.log('\n✅ CONFIRMED: Using Assistant Architecture!');
        } else if (result.metadata.generationMethod?.includes('adaptive') || 
                   result.metadata.generationMethod?.includes('fallback')) {
          console.log('\n⚠️  WARNING: Using Adaptive Framework (Fallback)');
        }
      }
      
      console.log('\n✅ Test completed successfully!');
      
    } else {
      console.error('❌ Generation failed:', result.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🚀 Starting Revo 2.0 Assistant Test');
testRevo2WithAssistant().catch(console.error);
