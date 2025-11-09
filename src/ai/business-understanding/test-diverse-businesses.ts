/**
 * Test: Deep Business Understanding with Diverse Business Types
 * 
 * Tests the system with 5 different business models to validate accuracy
 */

import { analyzeBusinessAndGetGuidelines } from './index';

// Test Case 1: B2B SaaS - Project Management Tool
const saasTest = {
  businessName: 'TaskFlow Pro',
  description: 'AI-powered project management platform for remote teams',
  industry: 'SaaS',
  about: 'TaskFlow Pro helps distributed teams collaborate efficiently with AI-driven task prioritization, automated workflows, and real-time insights.',
  mission: 'Empower remote teams to work smarter, not harder',
  products: [
    {
      name: 'TaskFlow Pro Enterprise',
      description: 'Full-featured project management for large teams',
      price: '$49/user/month',
      features: ['AI task prioritization', 'Automated workflows', 'Advanced analytics', 'Unlimited projects']
    }
  ]
};

// Test Case 2: B2B Wholesale - Coffee Supplier
const wholesaleTest = {
  businessName: 'Kenya Highland Coffee Co.',
  description: 'Premium coffee beans wholesale supplier to cafes and restaurants',
  industry: 'Food & Beverage',
  about: 'We source the finest Arabica beans from Kenyan highlands and supply to cafes, restaurants, and hotels across East Africa.',
  mission: 'Connect Kenyan coffee farmers with quality-focused businesses',
  products: [
    {
      name: 'Premium Arabica Beans',
      description: 'Single-origin beans from Nyeri highlands',
      price: 'Wholesale pricing available',
      features: ['Direct from farmers', 'Fair trade certified', 'Bulk orders', 'Consistent quality']
    }
  ]
};

// Test Case 3: Service Business - Salon
const serviceTest = {
  businessName: 'Glow Beauty Studio',
  description: 'Premium beauty salon specializing in natural hair care',
  industry: 'Beauty & Wellness',
  about: 'Glow Beauty Studio offers expert natural hair care, braiding, and styling services in a relaxing environment.',
  mission: 'Celebrate natural beauty and boost confidence',
  services: [
    {
      name: 'Natural Hair Treatments',
      description: 'Deep conditioning and scalp treatments',
      price: 'From KES 2,500'
    },
    {
      name: 'Protective Styling',
      description: 'Braids, twists, and locs',
      price: 'From KES 3,000'
    }
  ]
};

// Test Case 4: E-commerce - Fashion Retailer
const ecommerceTest = {
  businessName: 'AfroChic Fashion',
  description: 'Contemporary African fashion for modern professionals',
  industry: 'Fashion & Retail',
  about: 'AfroChic Fashion blends traditional African prints with modern designs, creating workwear and casual wear for the contemporary African professional.',
  mission: 'Celebrate African heritage through modern fashion',
  products: [
    {
      name: 'Ankara Blazers',
      description: 'Professional blazers with African print accents',
      price: 'KES 8,500',
      features: ['Tailored fit', 'Quality fabric', 'Unique designs']
    }
  ]
};

// Test Case 5: B2B Service - Accounting Firm
const b2bServiceTest = {
  businessName: 'Precision Accounting Partners',
  description: 'Accounting and tax services for small and medium businesses',
  industry: 'Professional Services',
  about: 'We provide comprehensive accounting, bookkeeping, and tax compliance services to help SMEs focus on growth while we handle the numbers.',
  mission: 'Simplify financial management for growing businesses',
  services: [
    {
      name: 'Monthly Bookkeeping',
      description: 'Complete financial record management',
      price: 'From KES 15,000/month'
    },
    {
      name: 'Tax Compliance',
      description: 'VAT, PAYE, and corporate tax filing',
      price: 'Custom pricing'
    }
  ]
};

async function testDiverseBusinesses() {
  console.log('🧪 Testing Deep Business Understanding with 5 Diverse Businesses\n');
  console.log('='.repeat(80));

  const testCases = [
    { name: 'B2B SaaS', data: saasTest },
    { name: 'B2B Wholesale', data: wholesaleTest },
    { name: 'Service Business', data: serviceTest },
    { name: 'E-commerce', data: ecommerceTest },
    { name: 'B2B Service', data: b2bServiceTest }
  ];

  const results: any[] = [];

  for (const testCase of testCases) {
    console.log(`\n\n📊 TEST: ${testCase.name} - ${testCase.data.businessName}`);
    console.log('='.repeat(80));

    try {
      const result = await analyzeBusinessAndGetGuidelines(testCase.data, {
        contentType: 'social_post',
        platform: 'instagram',
        objective: 'Generate leads and awareness'
      });

      console.log('\n✅ ANALYSIS COMPLETE');
      console.log('\nBusiness Model:', result.businessInsight.businessModel.type);
      console.log('Innovation:', result.businessInsight.innovation.keyDifferentiator);
      console.log('Target Audience:', result.businessInsight.targetAudience.primary.segment);
      console.log('Decision Maker:', result.businessInsight.targetAudience.decisionMaker);
      console.log('End User:', result.businessInsight.targetAudience.endUser);
      console.log('Core Value:', result.businessInsight.valueProposition.coreValue);
      console.log('\nContent Guidelines:');
      console.log('- Target:', result.contentGuidelines.targetAudience.who);
      console.log('- Message:', result.contentGuidelines.messaging.coreMessage);
      console.log('- Visual:', result.contentGuidelines.visual.sceneType);
      console.log('- CTA:', result.contentGuidelines.structure.cta.specific);

      results.push({
        testCase: testCase.name,
        businessName: testCase.data.businessName,
        success: true,
        insight: result.businessInsight,
        guidelines: result.contentGuidelines
      });

    } catch (error) {
      console.error(`\n❌ TEST FAILED:`, error);
      results.push({
        testCase: testCase.name,
        businessName: testCase.data.businessName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  console.log('\n\n📋 DETAILED RESULTS:\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.testCase} - ${result.businessName}`);
    if (result.success) {
      console.log(`   ✅ Business Model: ${result.insight.businessModel.type}`);
      console.log(`   ✅ Target: ${result.insight.targetAudience.primary.segment}`);
      console.log(`   ✅ Differentiator: ${result.insight.innovation.keyDifferentiator}`);
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }
    console.log('');
  });

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Testing Complete!');
  console.log('='.repeat(80));

  return results;
}

// Run tests
if (require.main === module) {
  testDiverseBusinesses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testDiverseBusinesses };
