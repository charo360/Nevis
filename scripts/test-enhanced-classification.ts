#!/usr/bin/env tsx

/**
 * Test Enhanced Business Type Classification and Service/Product Detection
 * 
 * This script tests the improved business type classification accuracy
 * and enhanced service/product detection capabilities.
 */

import { EnhancedSimpleScraper } from '../src/ai/website-analyzer/enhanced-simple-scraper';

interface TestCase {
  name: string;
  url: string;
  expectedBusinessType: string;
  expectedIndustry: string;
  minServices: number;
  minProducts: number;
}

const testCases: TestCase[] = [
  {
    name: 'Mailchimp (SaaS)',
    url: 'https://mailchimp.com',
    expectedBusinessType: 'saas',
    expectedIndustry: 'Software as a Service',
    minServices: 5,
    minProducts: 3
  },
  {
    name: 'Slack (SaaS)',
    url: 'https://slack.com',
    expectedBusinessType: 'saas',
    expectedIndustry: 'Software as a Service',
    minServices: 4,
    minProducts: 2
  },
  {
    name: 'Shopify (E-commerce)',
    url: 'https://shopify.com',
    expectedBusinessType: 'ecommerce',
    expectedIndustry: 'E-commerce & Retail',
    minServices: 6,
    minProducts: 4
  },
  {
    name: 'Stripe (Finance/SaaS)',
    url: 'https://stripe.com',
    expectedBusinessType: 'finance',
    expectedIndustry: 'Financial Services',
    minServices: 8,
    minProducts: 5
  },
  {
    name: 'GitHub (Technology)',
    url: 'https://github.com',
    expectedBusinessType: 'technology',
    expectedIndustry: 'Technology & Software',
    minServices: 5,
    minProducts: 3
  }
];

async function testEnhancedClassification() {
  console.log('🧪 TESTING ENHANCED BUSINESS TYPE CLASSIFICATION & SERVICE/PRODUCT DETECTION\n');
  console.log('=' .repeat(80));

  const scraper = new EnhancedSimpleScraper();
  let totalTests = 0;
  let passedTests = 0;
  const results: any[] = [];

  for (const testCase of testCases) {
    console.log(`\n🏢 TESTING: ${testCase.name}`);
    console.log(`🌐 URL: ${testCase.url}`);
    console.log('-'.repeat(60));

    try {
      const startTime = Date.now();
      const analysis = await scraper.analyzeWebsiteComprehensively(testCase.url);
      const processingTime = Date.now() - startTime;

      const businessType = analysis.businessIntelligence.businessType;
      const industry = analysis.businessIntelligence.industry;
      const services = analysis.businessIntelligence.services;
      const products = analysis.businessIntelligence.products;

      // Test results
      const businessTypeCorrect = businessType === testCase.expectedBusinessType;
      const industryCorrect = industry === testCase.expectedIndustry;
      const servicesAdequate = services.length >= testCase.minServices;
      const productsAdequate = products.length >= testCase.minProducts;

      totalTests += 4; // 4 tests per case
      if (businessTypeCorrect) passedTests++;
      if (industryCorrect) passedTests++;
      if (servicesAdequate) passedTests++;
      if (productsAdequate) passedTests++;

      console.log(`📊 **CLASSIFICATION RESULTS:**`);
      console.log(`   Business Type: ${businessType} ${businessTypeCorrect ? '✅' : '❌'} (expected: ${testCase.expectedBusinessType})`);
      console.log(`   Industry: ${industry} ${industryCorrect ? '✅' : '❌'} (expected: ${testCase.expectedIndustry})`);
      
      console.log(`\n📋 **SERVICE DETECTION:**`);
      console.log(`   Services Found: ${services.length} ${servicesAdequate ? '✅' : '❌'} (min expected: ${testCase.minServices})`);
      if (services.length > 0) {
        console.log(`   Top Services:`);
        services.slice(0, 5).forEach((service, i) => {
          console.log(`     ${i + 1}. ${service.name} (${service.category})`);
        });
      }

      console.log(`\n🛍️ **PRODUCT DETECTION:**`);
      console.log(`   Products Found: ${products.length} ${productsAdequate ? '✅' : '❌'} (min expected: ${testCase.minProducts})`);
      if (products.length > 0) {
        console.log(`   Top Products:`);
        products.slice(0, 5).forEach((product, i) => {
          console.log(`     ${i + 1}. ${product.name}${product.price ? ` - ${product.price}` : ''}`);
        });
      }

      console.log(`\n⏱️  Processing Time: ${processingTime}ms`);
      console.log(`📊 Data Completeness: ${analysis.analysisMetadata.dataCompleteness}%`);
      console.log(`🎯 Confidence Score: ${analysis.analysisMetadata.confidenceScore}%`);

      results.push({
        name: testCase.name,
        businessType,
        businessTypeCorrect,
        industry,
        industryCorrect,
        servicesCount: services.length,
        servicesAdequate,
        productsCount: products.length,
        productsAdequate,
        processingTime,
        dataCompleteness: analysis.analysisMetadata.dataCompleteness,
        confidenceScore: analysis.analysisMetadata.confidenceScore
      });

    } catch (error) {
      console.log(`❌ **ERROR:** ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        name: testCase.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 **ENHANCED CLASSIFICATION TEST SUMMARY**');
  console.log('='.repeat(80));

  const successRate = (passedTests / totalTests) * 100;
  console.log(`\n🎯 **Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests} tests passed)**\n`);

  // Detailed breakdown
  console.log('📋 **Detailed Results:**');
  console.log('| Website | Business Type | Industry | Services | Products | Time |');
  console.log('|---------|---------------|----------|----------|----------|------|');
  
  results.forEach(result => {
    if (result.error) {
      console.log(`| ${result.name} | ❌ ERROR | ❌ ERROR | ❌ ERROR | ❌ ERROR | - |`);
    } else {
      const btIcon = result.businessTypeCorrect ? '✅' : '❌';
      const indIcon = result.industryCorrect ? '✅' : '❌';
      const svcIcon = result.servicesAdequate ? '✅' : '❌';
      const prodIcon = result.productsAdequate ? '✅' : '❌';
      console.log(`| ${result.name} | ${btIcon} ${result.businessType} | ${indIcon} | ${svcIcon} ${result.servicesCount} | ${prodIcon} ${result.productsCount} | ${result.processingTime}ms |`);
    }
  });

  // Performance metrics
  const validResults = results.filter(r => !r.error);
  if (validResults.length > 0) {
    const avgTime = validResults.reduce((sum, r) => sum + r.processingTime, 0) / validResults.length;
    const avgCompleteness = validResults.reduce((sum, r) => sum + r.dataCompleteness, 0) / validResults.length;
    const avgConfidence = validResults.reduce((sum, r) => sum + r.confidenceScore, 0) / validResults.length;

    console.log(`\n📈 **Performance Metrics:**`);
    console.log(`   Average Processing Time: ${avgTime.toFixed(0)}ms`);
    console.log(`   Average Data Completeness: ${avgCompleteness.toFixed(1)}%`);
    console.log(`   Average Confidence Score: ${avgConfidence.toFixed(1)}%`);
  }

  // Improvement recommendations
  console.log(`\n💡 **Improvement Analysis:**`);
  
  const businessTypeAccuracy = results.filter(r => r.businessTypeCorrect).length / results.filter(r => !r.error).length * 100;
  const industryAccuracy = results.filter(r => r.industryCorrect).length / results.filter(r => !r.error).length * 100;
  const serviceDetectionRate = results.filter(r => r.servicesAdequate).length / results.filter(r => !r.error).length * 100;
  const productDetectionRate = results.filter(r => r.productsAdequate).length / results.filter(r => !r.error).length * 100;

  console.log(`   Business Type Classification: ${businessTypeAccuracy.toFixed(1)}% accuracy`);
  console.log(`   Industry Classification: ${industryAccuracy.toFixed(1)}% accuracy`);
  console.log(`   Service Detection: ${serviceDetectionRate.toFixed(1)}% adequate`);
  console.log(`   Product Detection: ${productDetectionRate.toFixed(1)}% adequate`);

  if (businessTypeAccuracy < 80) {
    console.log(`   ⚠️  Business type classification needs improvement`);
  }
  if (serviceDetectionRate < 80) {
    console.log(`   ⚠️  Service detection patterns need enhancement`);
  }
  if (productDetectionRate < 80) {
    console.log(`   ⚠️  Product detection patterns need enhancement`);
  }

  console.log(`\n🎉 **Enhanced classification testing complete!**`);
  
  if (successRate >= 75) {
    console.log(`✅ **EXCELLENT:** Classification improvements are working well!`);
  } else if (successRate >= 50) {
    console.log(`⚠️  **GOOD:** Classification improvements show progress, but need refinement.`);
  } else {
    console.log(`❌ **NEEDS WORK:** Classification improvements require significant refinement.`);
  }
}

// Run the test
if (require.main === module) {
  testEnhancedClassification().catch(console.error);
}

export { testEnhancedClassification };
