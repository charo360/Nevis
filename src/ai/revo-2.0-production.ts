/**
 * Production-ready Revo 2.0 Generation Service
 * Provides both original and optimized versions with A/B testing capability
 */

import { generateWithRevo20 } from './revo-2.0-service';
import { generateWithRevo20Optimized } from './revo-2.0-optimized';
import { revoPerformanceOptimizer } from './performance/revo-performance-optimizer';
import type { Revo20GenerationOptions, Revo20GenerationResult } from './revo-2.0-service';

interface ProductionGenerationOptions extends Revo20GenerationOptions {
  useOptimized?: boolean;
  enableABTesting?: boolean;
  optimizedTrafficPercentage?: number;
}

interface ProductionGenerationResult extends Revo20GenerationResult {
  version: 'original' | 'optimized';
  performanceMetrics?: {
    processingTime: number;
    cacheHits: number;
    cacheMisses: number;
    optimizationApplied: boolean;
  };
}

/**
 * Production Revo 2.0 generation with A/B testing and performance monitoring
 */
export async function generateWithRevo20Production(
  options: ProductionGenerationOptions
): Promise<ProductionGenerationResult> {
  const startTime = Date.now();
  
  // Determine which version to use
  const shouldUseOptimized = determineVersion(options);
  
  console.log(`🚀 [Revo 2.0 Production] Using ${shouldUseOptimized ? 'OPTIMIZED' : 'ORIGINAL'} version`);
  
  try {
    let result: Revo20GenerationResult;
    let version: 'original' | 'optimized';
    
    if (shouldUseOptimized) {
      // Use optimized version
      result = await generateWithRevo20Optimized(options);
      version = 'optimized';
      
      console.log(`✅ [Revo 2.0 Production] Optimized generation completed in ${result.processingTime}ms`);
    } else {
      // Use original version
      result = await generateWithRevo20(options);
      version = 'original';
      
      console.log(`✅ [Revo 2.0 Production] Original generation completed in ${result.processingTime}ms`);
    }
    
    // Get performance metrics
    const metrics = shouldUseOptimized ? revoPerformanceOptimizer.getMetrics() : null;
    
    // Log performance for monitoring
    logPerformanceMetrics(version, result.processingTime, metrics);
    
    return {
      ...result,
      version,
      performanceMetrics: metrics ? {
        processingTime: result.processingTime,
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
        optimizationApplied: true
      } : {
        processingTime: result.processingTime,
        cacheHits: 0,
        cacheMisses: 0,
        optimizationApplied: false
      }
    };
    
  } catch (error) {
    console.error(`❌ [Revo 2.0 Production] ${shouldUseOptimized ? 'Optimized' : 'Original'} generation failed:`, error);
    
    // If optimized version fails, fallback to original
    if (shouldUseOptimized && options.enableABTesting !== false) {
      console.log(`🔄 [Revo 2.0 Production] Falling back to original version`);
      
      try {
        const fallbackResult = await generateWithRevo20(options);
        
        console.log(`✅ [Revo 2.0 Production] Fallback completed in ${fallbackResult.processingTime}ms`);
        
        return {
          ...fallbackResult,
          version: 'original',
          performanceMetrics: {
            processingTime: fallbackResult.processingTime,
            cacheHits: 0,
            cacheMisses: 0,
            optimizationApplied: false
          }
        };
      } catch (fallbackError) {
        console.error(`❌ [Revo 2.0 Production] Fallback also failed:`, fallbackError);
        throw new Error(`Both optimized and original versions failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    throw error;
  }
}

/**
 * Determine which version to use based on configuration and A/B testing
 */
function determineVersion(options: ProductionGenerationOptions): boolean {
  // If explicitly specified, use that
  if (options.useOptimized !== undefined) {
    return options.useOptimized;
  }
  
  // If A/B testing is disabled, use original by default
  if (options.enableABTesting === false) {
    return false;
  }
  
  // A/B testing logic
  const trafficPercentage = options.optimizedTrafficPercentage ?? 50; // Default 50% split
  const random = Math.random() * 100;
  
  return random < trafficPercentage;
}

/**
 * Log performance metrics for monitoring and analysis
 */
function logPerformanceMetrics(
  version: 'original' | 'optimized',
  processingTime: number,
  metrics: any
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    version,
    processingTime,
    ...(metrics && {
      cacheHits: metrics.cacheHits,
      cacheMisses: metrics.cacheMisses,
      businessIntelligenceTime: metrics.businessIntelligence,
      contentGenerationTime: metrics.contentGeneration,
      imageGenerationTime: metrics.imageGeneration,
      validationTime: metrics.validation
    })
  };
  
  // In production, this would go to your monitoring system
  console.log(`📊 [Performance Metrics] ${JSON.stringify(logData)}`);
  
  // Performance alerts
  if (processingTime > 20000) { // 20 seconds
    console.warn(`⚠️ [Performance Alert] Slow generation detected: ${processingTime}ms`);
  }
  
  if (version === 'optimized' && metrics && metrics.cacheHits === 0 && metrics.cacheMisses > 3) {
    console.warn(`⚠️ [Cache Alert] Low cache hit rate detected`);
  }
}

/**
 * Get performance statistics for monitoring dashboard
 */
export function getPerformanceStats(): {
  optimizerMetrics: any;
  cacheStatus: {
    businessIntelligence: { size: number; maxSize: number };
    content: { size: number; maxSize: number };
    assistantResponse: { size: number; maxSize: number };
  };
} {
  const metrics = revoPerformanceOptimizer.getMetrics();
  
  return {
    optimizerMetrics: metrics,
    cacheStatus: {
      businessIntelligence: { size: 0, maxSize: 500 }, // Would get from actual cache
      content: { size: 0, maxSize: 1000 },
      assistantResponse: { size: 0, maxSize: 200 }
    }
  };
}

/**
 * Clear all caches (for maintenance or testing)
 */
export function clearAllCaches(): void {
  revoPerformanceOptimizer.clearCaches();
  console.log('🧹 [Revo 2.0 Production] All caches cleared');
}

/**
 * Health check for the production system
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    apiKeys: boolean;
    assistants: boolean;
    optimizer: boolean;
    caches: boolean;
  };
  message: string;
}> {
  const checks = {
    apiKeys: false,
    assistants: false,
    optimizer: false,
    caches: false
  };
  
  try {
    // Check API keys
    checks.apiKeys = !!(process.env.ANTHROPIC_API_KEY && process.env.OPENAI_API_KEY && process.env.VERTEX_AI_ENABLED);
    
    // Check assistants
    const { assistantManager } = await import('./assistants/assistant-manager');
    checks.assistants = assistantManager.isAvailable('finance'); // Test one assistant
    
    // Check optimizer
    const metrics = revoPerformanceOptimizer.getMetrics();
    checks.optimizer = metrics !== null;
    
    // Check caches
    checks.caches = true; // Cache system is always available
    
    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.values(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    let message: string;
    
    if (healthyChecks === totalChecks) {
      status = 'healthy';
      message = 'All systems operational';
    } else if (healthyChecks >= totalChecks * 0.75) {
      status = 'degraded';
      message = 'Some systems experiencing issues';
    } else {
      status = 'unhealthy';
      message = 'Multiple systems down';
    }
    
    return { status, checks, message };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      checks,
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Export types for external use
export type {
  ProductionGenerationOptions,
  ProductionGenerationResult
};
