#!/usr/bin/env tsx

/**
 * Comprehensive Performance Test for Revo 2.0 Optimization
 * Tests both original and optimized versions to measure improvements
 */

import { generateWithRevo20 } from '../src/ai/revo-2.0-service';
import { generateWithRevo20Optimized } from '../src/ai/revo-2.0-optimized';
import { revoPerformanceOptimizer } from '../src/ai/performance/revo-performance-optimizer';

// Test configuration
const TEST_BUSINESS_PROFILE = {
  businessName: 'Paya Finance',
  businessType: 'fintech',
  description: 'Digital banking and payment solutions for Kenya',
  location: 'Nairobi, Kenya',
  website: 'https://paya.co.ke',
  targetAudience: 'Small business owners and entrepreneurs in Kenya',
  keyFeatures: ['Mobile banking', 'Instant payments', 'Buy now pay later', 'Business accounts'],
  competitiveAdvantages: ['No credit checks', 'Instant account opening', 'Local language support'],
  services: ['Digital banking', 'Payment processing', 'BNPL services', 'Business loans'],
  industry: 'Financial Technology'
};

const TEST_OPTIONS = {
  brandProfile: TEST_BUSINESS_PROFILE,
  businessType: 'fintech',
  platform: 'instagram',
  targetAudience: 'Small business owners in Kenya',
  useLocalLanguage: true,
  aspectRatio: '1:1'
};

interface PerformanceTestResult {
  version: string;
  success: boolean;
  totalTime: number;
  contentQuality: number;
  error?: string;
  breakdown?: {
    businessIntelligence?: number;
    contentGeneration?: number;
    imageGeneration?: number;
    validation?: number;
  };
  cacheMetrics?: {
    hits: number;
    misses: number;
  };
}

async function runPerformanceTest(): Promise<void> {
  console.log('🚀 REVO 2.0 PERFORMANCE OPTIMIZATION TEST');
  console.log('=' .repeat(60));
  console.log(`📊 Testing business: ${TEST_BUSINESS_PROFILE.businessName}`);
  console.log(`🎯 Platform: ${TEST_OPTIONS.platform}`);
  console.log(`📍 Location: ${TEST_BUSINESS_PROFILE.location}`);
  console.log('');

  const results: PerformanceTestResult[] = [];

  // Test 1: Original Revo 2.0 (baseline)
  console.log('🔍 TEST 1: Original Revo 2.0 (Baseline)');
  console.log('-'.repeat(40));
  
  const originalResult = await testOriginalRevo20();
  results.push(originalResult);
  
  console.log('');

  // Test 2: Optimized Revo 2.0 (first run - cache miss)
  console.log('⚡ TEST 2: Optimized Revo 2.0 (First Run - Cache Miss)');
  console.log('-'.repeat(40));
  
  // Clear caches to ensure fair comparison
  revoPerformanceOptimizer.clearCaches();
  
  const optimizedResult1 = await testOptimizedRevo20('Optimized (Cache Miss)');
  results.push(optimizedResult1);
  
  console.log('');

  // Test 3: Optimized Revo 2.0 (second run - cache hit)
  console.log('🚀 TEST 3: Optimized Revo 2.0 (Second Run - Cache Hit)');
  console.log('-'.repeat(40));
  
  const optimizedResult2 = await testOptimizedRevo20('Optimized (Cache Hit)');
  results.push(optimizedResult2);
  
  console.log('');

  // Performance Analysis
  console.log('📊 PERFORMANCE ANALYSIS');
  console.log('=' .repeat(60));
  
  displayResults(results);
  
  console.log('');
  console.log('🎯 OPTIMIZATION RECOMMENDATIONS');
  console.log('=' .repeat(60));
  
  generateRecommendations(results);
}

async function testOriginalRevo20(): Promise<PerformanceTestResult> {
  const startTime = Date.now();
  
  try {
    console.log('⏳ Running original Revo 2.0 generation...');
    
    const result = await generateWithRevo20(TEST_OPTIONS);
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ Original completed in ${totalTime}ms`);
    console.log(`📝 Generated headline: "${result.headline}"`);
    console.log(`🎯 Quality score: ${result.qualityScore}`);
    
    return {
      version: 'Original',
      success: true,
      totalTime,
      contentQuality: result.qualityScore,
      breakdown: {
        // Original doesn't provide detailed breakdown
        contentGeneration: totalTime * 0.8, // Estimate
        imageGeneration: totalTime * 0.2
      }
    };
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Original failed after ${totalTime}ms:`, error);
    
    return {
      version: 'Original',
      success: false,
      totalTime,
      contentQuality: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testOptimizedRevo20(version: string): Promise<PerformanceTestResult> {
  const startTime = Date.now();
  
  try {
    console.log('⏳ Running optimized Revo 2.0 generation...');
    
    const result = await generateWithRevo20Optimized(TEST_OPTIONS);
    const totalTime = Date.now() - startTime;
    const metrics = revoPerformanceOptimizer.getMetrics();
    
    console.log(`✅ Optimized completed in ${totalTime}ms`);
    console.log(`📝 Generated headline: "${result.headline}"`);
    console.log(`🎯 Quality score: ${result.qualityScore}`);
    console.log(`💾 Cache hits: ${metrics.cacheHits}, misses: ${metrics.cacheMisses}`);
    
    return {
      version,
      success: true,
      totalTime,
      contentQuality: result.qualityScore,
      breakdown: {
        businessIntelligence: metrics.businessIntelligence,
        contentGeneration: metrics.contentGeneration,
        imageGeneration: metrics.imageGeneration,
        validation: metrics.validation
      },
      cacheMetrics: {
        hits: metrics.cacheHits,
        misses: metrics.cacheMisses
      }
    };
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Optimized failed after ${totalTime}ms:`, error);
    
    return {
      version,
      success: false,
      totalTime,
      contentQuality: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function displayResults(results: PerformanceTestResult[]): void {
  console.log('| Version | Success | Time (ms) | Time (s) | Quality | Cache H/M |');
  console.log('|---------|---------|-----------|----------|---------|-----------|');
  
  results.forEach(result => {
    const timeSeconds = (result.totalTime / 1000).toFixed(1);
    const cacheInfo = result.cacheMetrics 
      ? `${result.cacheMetrics.hits}/${result.cacheMetrics.misses}`
      : 'N/A';
    
    console.log(`| ${result.version.padEnd(7)} | ${result.success ? '✅' : '❌'} | ${result.totalTime.toString().padStart(9)} | ${timeSeconds.padStart(8)} | ${result.contentQuality.toFixed(1).padStart(7)} | ${cacheInfo.padStart(9)} |`);
  });
  
  console.log('');
  
  // Calculate improvements
  const original = results.find(r => r.version === 'Original');
  const optimizedMiss = results.find(r => r.version === 'Optimized (Cache Miss)');
  const optimizedHit = results.find(r => r.version === 'Optimized (Cache Hit)');
  
  if (original && optimizedMiss) {
    const improvementMiss = ((original.totalTime - optimizedMiss.totalTime) / original.totalTime * 100);
    console.log(`📈 Speed improvement (cache miss): ${improvementMiss.toFixed(1)}%`);
  }
  
  if (original && optimizedHit) {
    const improvementHit = ((original.totalTime - optimizedHit.totalTime) / original.totalTime * 100);
    console.log(`🚀 Speed improvement (cache hit): ${improvementHit.toFixed(1)}%`);
  }
  
  if (optimizedMiss && optimizedHit) {
    const cacheImprovement = ((optimizedMiss.totalTime - optimizedHit.totalTime) / optimizedMiss.totalTime * 100);
    console.log(`💾 Cache effectiveness: ${cacheImprovement.toFixed(1)}% faster`);
  }
}

function generateRecommendations(results: PerformanceTestResult[]): void {
  const original = results.find(r => r.version === 'Original');
  const optimized = results.find(r => r.version.includes('Optimized'));
  
  if (!original || !optimized) {
    console.log('❌ Cannot generate recommendations - missing test results');
    return;
  }
  
  const targetTime = 15000; // 15 seconds target
  
  if (optimized.totalTime <= targetTime) {
    console.log(`✅ TARGET ACHIEVED: Optimized version (${(optimized.totalTime/1000).toFixed(1)}s) meets the <15s target!`);
  } else {
    console.log(`⚠️ TARGET MISSED: Optimized version (${(optimized.totalTime/1000).toFixed(1)}s) exceeds 15s target`);
    
    const additionalReduction = optimized.totalTime - targetTime;
    console.log(`🎯 Need additional ${(additionalReduction/1000).toFixed(1)}s reduction to meet target`);
  }
  
  console.log('');
  console.log('💡 OPTIMIZATION OPPORTUNITIES:');
  
  if (optimized.breakdown) {
    const breakdown = optimized.breakdown;
    
    if (breakdown.contentGeneration && breakdown.contentGeneration > 5000) {
      console.log('- 🤖 Content generation still slow - consider more aggressive prompt optimization');
    }
    
    if (breakdown.businessIntelligence && breakdown.businessIntelligence > 3000) {
      console.log('- 🧠 Business intelligence gathering slow - improve caching strategy');
    }
    
    if (breakdown.imageGeneration && breakdown.imageGeneration > 8000) {
      console.log('- 🎨 Image generation slow - consider image caching or faster models');
    }
  }
  
  if (optimized.cacheMetrics && optimized.cacheMetrics.misses > optimized.cacheMetrics.hits) {
    console.log('- 💾 Low cache hit rate - consider longer TTL or better cache keys');
  }
  
  const qualityDrop = original.contentQuality - optimized.contentQuality;
  if (qualityDrop > 0.3) {
    console.log(`- 📉 Quality drop detected (${qualityDrop.toFixed(1)}) - review validation optimizations`);
  }
  
  console.log('');
  console.log('🎉 OPTIMIZATION SUCCESS METRICS:');
  console.log(`- Speed improvement: ${((original.totalTime - optimized.totalTime) / original.totalTime * 100).toFixed(1)}%`);
  console.log(`- Quality retention: ${((optimized.contentQuality / original.contentQuality) * 100).toFixed(1)}%`);
  console.log(`- Target achievement: ${optimized.totalTime <= targetTime ? 'YES ✅' : 'NO ❌'}`);
}

// Run the test
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}

export { runPerformanceTest };
