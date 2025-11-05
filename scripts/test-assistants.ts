/**
 * Test OpenAI Assistants Script
 *
 * This script tests the Multi-Assistant Architecture for Revo 2.0
 * by generating content for different business types and comparing quality.
 *
 * Usage:
 *   npx tsx scripts/test-assistants.ts
 *
 * Requirements:
 *   - OPENAI_API_KEY must be set in environment
 *   - Assistant IDs must be configured in .env.local
 */

// IMPORTANT: Load environment variables BEFORE importing modules
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

// Now import after env vars are loaded
const { assistantManager } = require('../src/ai/assistants');

/**
 * Test brand profiles for different business types
 */
const TEST_BRANDS = {
  retail: {
    businessName: 'TechHub Electronics',
    businessType: 'Electronics Store',
    description: 'Leading electronics retailer in Nairobi offering smartphones, laptops, and accessories',
    location: 'Nairobi, Kenya',
    services: ['Smartphone Sales', 'Laptop Sales', 'Accessories', 'Warranty Services'],
    targetAudience: 'Tech-savvy consumers aged 18-45',
    productCatalog: [
      { name: 'iPhone 15 Pro', price: 'KES 145,000', discount: '12% off' },
      { name: 'Samsung Galaxy S24', price: 'KES 98,000', discount: '15% off' },
      { name: 'MacBook Air M3', price: 'KES 165,000', discount: '10% off' },
    ],
  },

  finance: {
    businessName: 'Paya Finance',
    businessType: 'Financial Services',
    description: 'Digital payment solutions and Buy Now Pay Later services for modern consumers',
    location: 'Nairobi, Kenya',
    services: [
      { serviceName: 'Buy Now Pay Later', description: 'Split payments into 4 installments' },
      { serviceName: 'Digital Wallet', description: 'Secure mobile payments' },
      { serviceName: 'Bill Payments', description: 'Pay utilities and services' },
    ],
    targetAudience: 'Young professionals aged 25-40',
  },
};

/**
 * Test concepts for content generation
 */
const TEST_CONCEPTS = {
  retail: {
    concept: 'Modern smartphone showcase with sleek product display',
    imagePrompt: 'iPhone 15 Pro in titanium finish, professional product photography, clean background',
  },

  finance: {
    concept: 'Young professional using mobile payment app confidently',
    imagePrompt: 'Person holding smartphone showing payment app, modern urban setting, natural lighting',
  },
};

/**
 * Test a single assistant
 */
async function testAssistant(businessType: 'retail' | 'finance') {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing ${businessType.toUpperCase()} Assistant`);
  console.log('='.repeat(60));

  // Check if assistant is available
  if (!assistantManager.isAvailable(businessType)) {
    console.log(`❌ ${businessType} assistant not available`);
    console.log(`   Please run: npx ts-node scripts/create-assistants.ts`);
    console.log(`   Then add the assistant ID to .env.local`);
    return null;
  }

  const brandProfile = TEST_BRANDS[businessType];
  const concept = TEST_CONCEPTS[businessType];

  console.log(`\n📋 Test Parameters:`);
  console.log(`   Business: ${brandProfile.businessName}`);
  console.log(`   Type: ${brandProfile.businessType}`);
  console.log(`   Location: ${brandProfile.location}`);
  console.log(`   Platform: Instagram`);

  const request: AssistantContentRequest = {
    businessType: businessType,
    brandProfile: brandProfile,
    concept: concept,
    imagePrompt: concept.imagePrompt,
    platform: 'Instagram',
    useLocalLanguage: false,
  };

  console.log(`\n⏳ Generating content...`);
  const startTime = Date.now();

  try {
    const response = await assistantManager.generateContent(request);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Generation successful in ${duration}ms`);
    console.log(`\n📊 Generated Content:\n`);
    console.log(`   Headline: "${response.headline}"`);
    console.log(`   Subheadline: "${response.subheadline}"`);
    console.log(`   Caption: "${response.caption}"`);
    console.log(`   CTA: "${response.cta}"`);
    console.log(`   Hashtags: ${response.hashtags.join(', ')}`);

    // Quality analysis
    console.log(`\n🔍 Quality Analysis:`);
    analyzeQuality(businessType, response);

    return { response, duration };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Generation failed after ${duration}ms`);
    console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * Analyze content quality
 */
function analyzeQuality(businessType: string, response: any) {
  const checks: Array<{ name: string; passed: boolean; reason?: string }> = [];

  if (businessType === 'retail') {
    // Retail-specific checks
    checks.push({
      name: 'Product specificity',
      passed: /iPhone|Samsung|MacBook|Galaxy|Pro|Air/i.test(response.headline + response.caption),
      reason: 'Should mention specific products',
    });

    checks.push({
      name: 'Pricing included',
      passed: /KES|price|\d+,\d+|save|off|discount/i.test(response.caption),
      reason: 'Should include pricing or savings',
    });

    checks.push({
      name: 'Transactional CTA',
      passed: /shop|buy|order|get|purchase/i.test(response.cta.toLowerCase()),
      reason: 'Should use transactional CTA',
    });

    checks.push({
      name: 'Urgency element',
      passed: /limited|only|left|today|now|hurry|sale|offer/i.test(response.caption.toLowerCase()),
      reason: 'Should create urgency',
    });

  } else if (businessType === 'finance') {
    // Finance-specific checks
    checks.push({
      name: 'Trust language',
      passed: /secure|safe|protected|encrypted|trusted|bank/i.test(response.caption.toLowerCase()),
      reason: 'Should emphasize security/trust',
    });

    checks.push({
      name: 'Specific benefits',
      passed: /\d+%|installment|payment|fee|interest|save/i.test(response.caption.toLowerCase()),
      reason: 'Should quantify financial benefits',
    });

    checks.push({
      name: 'Low-friction CTA',
      passed: /learn|check|calculate|get|see|discover/i.test(response.cta.toLowerCase()),
      reason: 'Should use informational CTA',
    });

    checks.push({
      name: 'Transparency',
      passed: /no hidden|clear|transparent|simple|easy/i.test(response.caption.toLowerCase()),
      reason: 'Should emphasize transparency',
    });
  }

  // Universal checks
  checks.push({
    name: 'Headline length',
    passed: response.headline.split(' ').length <= 8,
    reason: 'Headline should be 4-6 words (max 8)',
  });

  checks.push({
    name: 'Caption length',
    passed: response.caption.split(' ').length >= 30 && response.caption.split(' ').length <= 120,
    reason: 'Caption should be 50-100 words',
  });

  checks.push({
    name: 'Hashtag count',
    passed: response.hashtags.length >= 3 && response.hashtags.length <= 5,
    reason: 'Should have 3-5 hashtags',
  });

  // Print results
  const passed = checks.filter(c => c.passed).length;
  const total = checks.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`   Quality Score: ${passed}/${total} (${percentage}%)\n`);

  checks.forEach(check => {
    const icon = check.passed ? '✓' : '✗';
    const status = check.passed ? 'PASS' : 'FAIL';
    console.log(`   ${icon} ${check.name}: ${status}`);
    if (!check.passed && check.reason) {
      console.log(`      → ${check.reason}`);
    }
  });
}

/**
 * Compare assistant vs adaptive framework
 */
async function compareApproaches() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 COMPARISON: Multi-Assistant vs Adaptive Framework`);
  console.log('='.repeat(60));

  console.log(`\nThis comparison will be available once both systems are running.`);
  console.log(`For now, we're testing the Multi-Assistant Architecture only.\n`);

  console.log(`To enable comparison:`);
  console.log(`1. Set ASSISTANT_ROLLOUT_RETAIL=50 in .env.local`);
  console.log(`2. Set ASSISTANT_ROLLOUT_FINANCE=50 in .env.local`);
  console.log(`3. Generate multiple posts and compare quality scores`);
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Multi-Assistant Architecture Test Suite');
  console.log('='.repeat(60));

  // Check API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.error('\n❌ Error: OPENAI_API_KEY not configured');
    console.error('Please add your OpenAI API key to .env.local');
    console.error('Get your key from: https://platform.openai.com/api-keys\n');
    process.exit(1);
  }

  console.log(`\n✅ OpenAI API key configured`);
  console.log(`\nTesting ${Object.keys(TEST_BRANDS).length} business types...\n`);

  // Test each assistant
  const results: Record<string, any> = {};

  for (const businessType of Object.keys(TEST_BRANDS) as Array<'retail' | 'finance'>) {
    const result = await testAssistant(businessType);
    results[businessType] = result;

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log('='.repeat(60));

  const successful = Object.values(results).filter(r => r !== null).length;
  const total = Object.keys(results).length;

  console.log(`\n✅ Successful: ${successful}/${total}`);

  if (successful > 0) {
    const avgDuration = Object.values(results)
      .filter(r => r !== null)
      .reduce((sum: number, r: any) => sum + r.duration, 0) / successful;

    console.log(`⏱️  Average Duration: ${Math.round(avgDuration)}ms`);
  }

  console.log(`\n${'='.repeat(60)}`);

  // Comparison info
  await compareApproaches();

  console.log(`\n✅ Testing complete!`);
  console.log(`\n📋 Next Steps:`);
  console.log(`1. Review the generated content quality`);
  console.log(`2. Adjust assistant instructions if needed`);
  console.log(`3. Enable gradual rollout: ASSISTANT_ROLLOUT_RETAIL=10`);
  console.log(`4. Monitor quality in production`);
  console.log(`5. Gradually increase rollout percentage\n`);
}

// Run tests
runTests().catch(console.error);

