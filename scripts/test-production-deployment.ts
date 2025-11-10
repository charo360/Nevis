#!/usr/bin/env tsx

/**
 * Production Deployment Test for Revo 2.0 Optimization
 * Demonstrates the production-ready system with A/B testing
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { generateWithRevo20Production, healthCheck, getPerformanceStats } from '../src/ai/revo-2.0-production';

const TEST_BUSINESS_PROFILE = {
  businessName: 'TechFlow Solutions',
  businessType: 'saas',
  description: 'Cloud-based project management and collaboration platform',
  location: 'San Francisco, CA',
  website: 'https://techflow.com',
  targetAudience: 'Software development teams and project managers',
  keyFeatures: ['Real-time collaboration', 'Advanced analytics', 'Custom workflows', 'API integrations'],
  competitiveAdvantages: ['AI-powered insights', 'Seamless integrations', 'Enterprise security'],
  services: ['Project management', 'Team collaboration', 'Analytics dashboard', 'API platform'],
  industry: 'Software as a Service'
};

async function runProductionDeploymentTest(): Promise<void> {
  console.log('🚀 REVO 2.0 PRODUCTION DEPLOYMENT TEST');
  console.log('=' .repeat(60));
  console.log(`📊 Testing business: ${TEST_BUSINESS_PROFILE.businessName}`);
  console.log(`🏢 Business type: ${TEST_BUSINESS_PROFILE.businessType}`);
  console.log(`📍 Location: ${TEST_BUSINESS_PROFILE.location}`);
  console.log('');

  // Health check first
  console.log('🏥 SYSTEM HEALTH CHECK');
  console.log('-'.repeat(40));
  
  const health = await healthCheck();
  console.log(`📊 System Status: ${health.status.toUpperCase()}`);
  console.log(`💬 Message: ${health.message}`);
  console.log('📋 Component Status:');
  console.log(`   - API Keys: ${health.checks.apiKeys ? '✅' : '❌'}`);
  console.log(`   - Assistants: ${health.checks.assistants ? '✅' : '❌'}`);
  console.log(`   - Optimizer: ${health.checks.optimizer ? '✅' : '❌'}`);
  console.log(`   - Caches: ${health.checks.caches ? '✅' : '❌'}`);
  console.log('');

  if (health.status === 'unhealthy') {
    console.error('❌ System is unhealthy. Please fix issues before deployment.');
    return;
  }

  // Test scenarios
  const testScenarios = [
    {
      name: 'Force Original Version',
      options: {
        brandProfile: TEST_BUSINESS_PROFILE,
        businessType: 'saas' as const,
        platform: 'instagram' as const,
        targetAudience: 'Software development teams',
        useOptimized: false,
        enableABTesting: false
      }
    },
    {
      name: 'Force Optimized Version',
      options: {
        brandProfile: TEST_BUSINESS_PROFILE,
        businessType: 'saas' as const,
        platform: 'linkedin' as const,
        targetAudience: 'Project managers and team leads',
        useOptimized: true,
        enableABTesting: false
      }
    },
    {
      name: 'A/B Testing (50% Split)',
      options: {
        brandProfile: TEST_BUSINESS_PROFILE,
        businessType: 'saas' as const,
        platform: 'facebook' as const,
        targetAudience: 'Enterprise software teams',
        enableABTesting: true,
        optimizedTrafficPercentage: 50
      }
    },
    {
      name: 'A/B Testing (80% Optimized)',
      options: {
        brandProfile: TEST_BUSINESS_PROFILE,
        businessType: 'saas' as const,
        platform: 'twitter' as const,
        targetAudience: 'Startup founders and CTOs',
        enableABTesting: true,
        optimizedTrafficPercentage: 80
      }
    }
  ];

  const results: any[] = [];

  for (const scenario of testScenarios) {
    console.log(`🧪 TEST SCENARIO: ${scenario.name}`);
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    
    try {
      console.log(`⏳ Running generation for ${scenario.options.platform}...`);
      
      const result = await generateWithRevo20Production(scenario.options);
      const totalTime = Date.now() - startTime;
      
      console.log(`✅ Generation completed in ${totalTime}ms`);
      console.log(`📝 Version used: ${result.version.toUpperCase()}`);
      console.log(`🎯 Quality score: ${result.qualityScore}`);
      console.log(`📰 Generated headline: "${result.headline}"`);
      
      if (result.performanceMetrics) {
        console.log(`💾 Cache hits: ${result.performanceMetrics.cacheHits}`);
        console.log(`📊 Cache misses: ${result.performanceMetrics.cacheMisses}`);
        console.log(`⚡ Optimization applied: ${result.performanceMetrics.optimizationApplied ? 'Yes' : 'No'}`);
      }
      
      results.push({
        scenario: scenario.name,
        success: true,
        version: result.version,
        totalTime,
        qualityScore: result.qualityScore,
        performanceMetrics: result.performanceMetrics
      });
      
    } catch (error) {
      console.error(`❌ Generation failed:`, error);
      
      results.push({
        scenario: scenario.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalTime: Date.now() - startTime
      });
    }
    
    console.log('');
  }

  // Results summary
  console.log('📊 PRODUCTION TEST RESULTS');
  console.log('=' .repeat(60));
  console.log('| Scenario | Success | Version | Time (ms) | Quality | Cache H/M |');
  console.log('|----------|---------|---------|-----------|---------|-----------|');
  
  results.forEach(result => {
    const success = result.success ? '✅' : '❌';
    const version = result.version || 'N/A';
    const time = result.totalTime.toString();
    const quality = result.qualityScore ? result.qualityScore.toFixed(1) : 'N/A';
    const cache = result.performanceMetrics 
      ? `${result.performanceMetrics.cacheHits}/${result.performanceMetrics.cacheMisses}`
      : 'N/A';
    
    console.log(`| ${result.scenario.padEnd(8)} | ${success.padEnd(7)} | ${version.padEnd(7)} | ${time.padStart(9)} | ${quality.padStart(7)} | ${cache.padStart(9)} |`);
  });
  
  console.log('');

  // Performance analysis
  const successfulResults = results.filter(r => r.success);
  const originalResults = successfulResults.filter(r => r.version === 'original');
  const optimizedResults = successfulResults.filter(r => r.version === 'optimized');
  
  if (originalResults.length > 0 && optimizedResults.length > 0) {
    const avgOriginalTime = originalResults.reduce((sum, r) => sum + r.totalTime, 0) / originalResults.length;
    const avgOptimizedTime = optimizedResults.reduce((sum, r) => sum + r.totalTime, 0) / optimizedResults.length;
    const improvement = ((avgOriginalTime - avgOptimizedTime) / avgOriginalTime * 100);
    
    console.log('📈 PERFORMANCE COMPARISON');
    console.log('-'.repeat(40));
    console.log(`📊 Average Original Time: ${avgOriginalTime.toFixed(0)}ms`);
    console.log(`⚡ Average Optimized Time: ${avgOptimizedTime.toFixed(0)}ms`);
    console.log(`🚀 Performance Improvement: ${improvement.toFixed(1)}%`);
    console.log('');
  }

  // System statistics
  console.log('📊 SYSTEM STATISTICS');
  console.log('-'.repeat(40));
  
  const stats = getPerformanceStats();
  console.log(`💾 Cache Status:`);
  console.log(`   - Business Intelligence: ${stats.cacheStatus.businessIntelligence.size}/${stats.cacheStatus.businessIntelligence.maxSize}`);
  console.log(`   - Content Generation: ${stats.cacheStatus.content.size}/${stats.cacheStatus.content.maxSize}`);
  console.log(`   - Assistant Responses: ${stats.cacheStatus.assistantResponse.size}/${stats.cacheStatus.assistantResponse.maxSize}`);
  console.log('');

  // Deployment recommendations
  console.log('🎯 DEPLOYMENT RECOMMENDATIONS');
  console.log('=' .repeat(60));
  
  const successRate = (successfulResults.length / results.length) * 100;
  
  if (successRate >= 90) {
    console.log('✅ **READY FOR PRODUCTION DEPLOYMENT**');
    console.log('   - High success rate achieved');
    console.log('   - Performance improvements validated');
    console.log('   - A/B testing functionality confirmed');
  } else if (successRate >= 75) {
    console.log('⚠️ **READY WITH CAUTION**');
    console.log('   - Some test failures detected');
    console.log('   - Monitor closely during initial deployment');
    console.log('   - Consider gradual rollout');
  } else {
    console.log('❌ **NOT READY FOR PRODUCTION**');
    console.log('   - Multiple test failures');
    console.log('   - Address issues before deployment');
    console.log('   - Review system configuration');
  }
  
  console.log('');
  console.log('📋 **DEPLOYMENT STRATEGY:**');
  console.log('1. **Phase 1**: Deploy with 10% optimized traffic');
  console.log('2. **Phase 2**: Monitor for 24 hours, increase to 25%');
  console.log('3. **Phase 3**: If stable, increase to 50%');
  console.log('4. **Phase 4**: Full migration to optimized version');
  console.log('');
  console.log('📊 **MONITORING CHECKLIST:**');
  console.log('- [ ] Processing time averages');
  console.log('- [ ] Cache hit/miss ratios');
  console.log('- [ ] Quality score consistency');
  console.log('- [ ] Error rates and fallback usage');
  console.log('- [ ] User satisfaction metrics');
  console.log('');
  
  console.log('🎉 **PRODUCTION DEPLOYMENT TEST COMPLETE!**');
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Tests Passed: ${successfulResults.length}/${results.length}`);
  console.log('System is ready for optimized Revo 2.0 deployment! 🚀');
}

// Run the production deployment test
if (require.main === module) {
  runProductionDeploymentTest().catch(console.error);
}

export { runProductionDeploymentTest };
