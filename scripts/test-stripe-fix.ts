#!/usr/bin/env tsx

/**
 * Test Stripe Classification Fix
 */

import { EnhancedSimpleScraper } from '../src/ai/website-analyzer/enhanced-simple-scraper';

async function testStripeFix() {
  console.log('🧪 TESTING STRIPE CLASSIFICATION FIX\n');
  
  const scraper = new EnhancedSimpleScraper();
  
  try {
    console.log('🏢 Testing: Stripe (Finance/Payment Company)');
    console.log('🌐 URL: https://stripe.com');
    console.log('-'.repeat(50));
    
    const analysis = await scraper.analyzeWebsiteComprehensively('https://stripe.com');
    
    const businessType = analysis.businessIntelligence.businessType;
    const industry = analysis.businessIntelligence.industry;
    
    console.log(`📊 **CLASSIFICATION RESULTS:**`);
    console.log(`   Business Type: ${businessType} ${businessType === 'finance' ? '✅' : '❌'} (expected: finance)`);
    console.log(`   Industry: ${industry} ${industry === 'Financial Services' ? '✅' : '❌'} (expected: Financial Services)`);
    
    if (businessType === 'finance') {
      console.log('\n🎉 **SUCCESS:** Stripe classification fix is working!');
    } else {
      console.log('\n⚠️  **NEEDS MORE TUNING:** Stripe still classified incorrectly');
      console.log(`   Current: ${businessType} -> ${industry}`);
      console.log(`   Expected: finance -> Financial Services`);
    }
    
  } catch (error) {
    console.log(`❌ **ERROR:** ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Run the test
if (require.main === module) {
  testStripeFix().catch(console.error);
}

export { testStripeFix };
