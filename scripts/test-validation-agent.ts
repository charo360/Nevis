/**
 * Test script for LangGraph Validation Agent
 * Demonstrates how validation prevents repetitive content
 */

import { validateContentUniqueness, AdContent } from '../src/ai/agents/validation-agent';
import { storeGeneration, getRecentGenerations, logGenerationStats, clearHistory } from '../src/ai/agents/generation-history';
import { extractContentCharacteristics } from '../src/ai/agents/validation-agent';

async function testValidationAgent() {
  console.log('🧪 Testing LangGraph Validation Agent\n');
  console.log('=' .repeat(60));

  const businessId = 'test-paya-kenya';

  // Clear any existing history
  clearHistory(businessId);

  // Test Case 1: First generation (should auto-approve)
  console.log('\n📝 TEST 1: First Generation (No History)');
  console.log('-'.repeat(60));
  
  const firstAd: AdContent = {
    headline: "Digital Banking Made Simple",
    caption: "Open account in minutes. No credit checks required. Join 1M+ Kenyans using mobile banking. Start today."
  };

  const result1 = await validateContentUniqueness(firstAd, []);
  console.log(`Result: ${result1.isUnique ? '✅ APPROVED' : '❌ REJECTED'}`);
  console.log(`Score: ${result1.similarityScore}/100\n`);

  // Store first generation
  const chars1 = extractContentCharacteristics(firstAd);
  storeGeneration(businessId, firstAd, chars1);

  // Test Case 2: Very similar content (should reject)
  console.log('\n📝 TEST 2: Very Similar Content');
  console.log('-'.repeat(60));
  
  const similarAd: AdContent = {
    headline: "Digital Banking Made Easy",
    caption: "Open your account in minutes. No credit checks needed. Join 1M+ Kenyans with mobile banking. Get started today."
  };

  const recentAds = getRecentGenerations(businessId, 10);
  const result2 = await validateContentUniqueness(similarAd, recentAds);
  console.log(`Result: ${result2.isUnique ? '✅ APPROVED' : '❌ REJECTED'}`);
  console.log(`Score: ${result2.similarityScore}/100`);
  if (!result2.isUnique) {
    console.log(`Reason: ${result2.rejectionReason}`);
    console.log(`Suggestions:`);
    result2.suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  }
  console.log('');

  // Test Case 3: Different angle (should approve)
  console.log('\n📝 TEST 3: Different Selling Angle');
  console.log('-'.repeat(60));
  
  const differentAd: AdContent = {
    headline: "Save KES 500 Monthly",
    caption: "Stop losing money to transaction fees. Bank-level security for every payment. Trusted by 500+ Kenyan businesses. Switch now."
  };

  const result3 = await validateContentUniqueness(differentAd, recentAds);
  console.log(`Result: ${result3.isUnique ? '✅ APPROVED' : '❌ REJECTED'}`);
  console.log(`Score: ${result3.similarityScore}/100\n`);

  if (result3.isUnique) {
    const chars3 = extractContentCharacteristics(differentAd);
    storeGeneration(businessId, differentAd, chars3);
  }

  // Test Case 4: Another different approach (should approve)
  console.log('\n📝 TEST 4: Problem-Solution Approach');
  console.log('-'.repeat(60));
  
  const problemSolutionAd: AdContent = {
    headline: "Skip Bank Queues Forever",
    caption: "Your supplier needs payment NOW. Three taps. Done. Instant payments that keep your business moving. No delays, no excuses."
  };

  const recentAds2 = getRecentGenerations(businessId, 10);
  const result4 = await validateContentUniqueness(problemSolutionAd, recentAds2);
  console.log(`Result: ${result4.isUnique ? '✅ APPROVED' : '❌ REJECTED'}`);
  console.log(`Score: ${result4.similarityScore}/100\n`);

  if (result4.isUnique) {
    const chars4 = extractContentCharacteristics(problemSolutionAd);
    storeGeneration(businessId, problemSolutionAd, chars4);
  }

  // Show generation statistics
  console.log('\n📊 Generation Statistics');
  console.log('='.repeat(60));
  logGenerationStats(businessId);

  // Test Case 5: Simulate validation workflow
  console.log('\n🔄 TEST 5: Simulated Validation Workflow (3 attempts)');
  console.log('='.repeat(60));

  const attempts = [
    {
      headline: "Digital Banking Made Simple",
      caption: "Open account in minutes. No credit checks. Join 1M+ Kenyans. Start today."
    },
    {
      headline: "Mobile Banking Simplified",
      caption: "Quick account setup. No credit requirements. Trusted by millions. Begin now."
    },
    {
      headline: "Instant Payments Anywhere",
      caption: "Pay suppliers in seconds. No bank visits needed. Real-time transaction tracking. Try free."
    }
  ];

  for (let i = 0; i < attempts.length; i++) {
    console.log(`\nAttempt ${i + 1}:`);
    const recent = getRecentGenerations(businessId, 10);
    const result = await validateContentUniqueness(attempts[i], recent);
    
    console.log(`  Headline: "${attempts[i].headline}"`);
    console.log(`  Result: ${result.isUnique ? '✅ APPROVED' : '❌ REJECTED'}`);
    console.log(`  Score: ${result.similarityScore}/100`);
    
    if (result.isUnique) {
      console.log(`  ✅ Content approved on attempt ${i + 1}`);
      const chars = extractContentCharacteristics(attempts[i]);
      storeGeneration(businessId, attempts[i], chars);
      break;
    } else {
      console.log(`  ❌ Too similar - trying different approach...`);
      if (result.suggestions.length > 0) {
        console.log(`  💡 Suggestion: ${result.suggestions[0]}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Validation Agent Test Complete!');
  console.log('='.repeat(60));
}

// Run tests
testValidationAgent().catch(console.error);
