/**
 * System Health Monitoring API
 * Real-time monitoring for 1,000+ user scalability
 */

import { NextRequest, NextResponse } from 'next/server';
import { CircuitBreakerManager } from '@/ai/utils/circuit-breaker';
import { CacheManager } from '@/ai/utils/content-cache';
import { checkRSSHealth } from '@/ai/utils/rss-direct-fetch';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Get circuit breaker stats
    const circuitBreakerManager = CircuitBreakerManager.getInstance();
    const circuitStats = circuitBreakerManager.getAllStats();
    const systemHealth = circuitBreakerManager.getSystemHealth();
    
    // Get cache stats
    const cacheManager = CacheManager.getInstance();
    const cacheStats = cacheManager.getAllStats();
    
    // Calculate total cache hit rate
    let totalHits = 0;
    let totalRequests = 0;
    
    Object.values(cacheStats).forEach(stats => {
      totalHits += stats.hits;
      totalRequests += stats.hits + stats.misses;
    });
    
    const overallCacheHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    
    // Check RSS feed health
    let rssHealth;
    try {
      rssHealth = await checkRSSHealth();
    } catch (error) {
      rssHealth = { healthy: 0, total: 0, details: [], error: error.message };
    }
    
    // System metrics
    const responseTime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage();
    
    // Calculate overall system health
    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    const healthScore = calculateHealthScore(systemHealth, overallCacheHitRate, rssHealth);
    
    if (healthScore >= 80) {
      overallStatus = 'HEALTHY';
    } else if (healthScore >= 50) {
      overallStatus = 'DEGRADED';
    } else {
      overallStatus = 'CRITICAL';
    }
    
    const healthReport = {
      status: overallStatus,
      healthScore,
      timestamp: new Date().toISOString(),
      responseTime,
      
      // Circuit Breaker Health
      circuitBreakers: {
        overall: systemHealth,
        details: circuitStats
      },
      
      // Cache Performance
      caching: {
        overallHitRate: Math.round(overallCacheHitRate * 100) / 100,
        details: cacheStats,
        totalMemoryUsage: Object.values(cacheStats).reduce((sum, stats) => sum + stats.memoryUsage, 0)
      },
      
      // RSS Feed Health
      rssFeeds: rssHealth,
      
      // System Resources
      system: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
          external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100 // MB
        },
        uptime: process.uptime()
      },
      
      // Performance Metrics
      performance: {
        apiResponseTime: responseTime,
        cacheHitRate: overallCacheHitRate,
        circuitBreakerHealth: systemHealth.overallHealth,
        rssHealthPercentage: rssHealth.total > 0 ? (rssHealth.healthy / rssHealth.total) * 100 : 0
      },
      
      // Recommendations
      recommendations: generateRecommendations(systemHealth, overallCacheHitRate, rssHealth, healthScore)
    };
    
    return NextResponse.json(healthReport);
    
  } catch (error) {
    console.error('❌ [System Health] Error generating health report:', error);
    
    return NextResponse.json({
      status: 'CRITICAL',
      healthScore: 0,
      timestamp: new Date().toISOString(),
      error: 'Failed to generate health report',
      errorMessage: error.message
    }, { status: 500 });
  }
}

/**
 * Calculate overall system health score (0-100)
 */
function calculateHealthScore(
  systemHealth: any,
  cacheHitRate: number,
  rssHealth: any
): number {
  let score = 0;
  
  // Circuit breaker health (40% weight)
  if (systemHealth.overallHealth === 'HEALTHY') {
    score += 40;
  } else if (systemHealth.overallHealth === 'DEGRADED') {
    score += 20;
  }
  
  // Cache performance (30% weight)
  if (cacheHitRate >= 80) {
    score += 30;
  } else if (cacheHitRate >= 60) {
    score += 20;
  } else if (cacheHitRate >= 40) {
    score += 10;
  }
  
  // RSS feed health (20% weight)
  const rssHealthPercentage = rssHealth.total > 0 ? (rssHealth.healthy / rssHealth.total) * 100 : 0;
  if (rssHealthPercentage >= 80) {
    score += 20;
  } else if (rssHealthPercentage >= 60) {
    score += 15;
  } else if (rssHealthPercentage >= 40) {
    score += 10;
  }
  
  // Base system availability (10% weight)
  score += 10; // If we can generate this report, basic system is working
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Generate system recommendations based on health metrics
 */
function generateRecommendations(
  systemHealth: any,
  cacheHitRate: number,
  rssHealth: any,
  healthScore: number
): string[] {
  const recommendations: string[] = [];
  
  if (healthScore < 50) {
    recommendations.push('🚨 CRITICAL: System requires immediate attention');
  } else if (healthScore < 80) {
    recommendations.push('⚠️ WARNING: System performance is degraded');
  }
  
  // Circuit breaker recommendations
  if (systemHealth.overallHealth === 'CRITICAL') {
    recommendations.push('🔴 Multiple services failing - check external API status');
  } else if (systemHealth.overallHealth === 'DEGRADED') {
    recommendations.push('🟡 Some services degraded - monitor circuit breaker status');
  }
  
  if (systemHealth.unhealthyServices.length > 0) {
    recommendations.push(`🔧 Unhealthy services: ${systemHealth.unhealthyServices.join(', ')}`);
  }
  
  // Cache recommendations
  if (cacheHitRate < 60) {
    recommendations.push('📈 Low cache hit rate - consider increasing cache TTL or size');
  } else if (cacheHitRate > 90) {
    recommendations.push('✅ Excellent cache performance - system optimized');
  }
  
  // RSS recommendations
  const rssHealthPercentage = rssHealth.total > 0 ? (rssHealth.healthy / rssHealth.total) * 100 : 0;
  if (rssHealthPercentage < 60) {
    recommendations.push('📡 RSS feed issues detected - some content sources unavailable');
  }
  
  // Memory recommendations
  const memoryUsage = process.memoryUsage();
  const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  if (memoryUsedMB > 500) {
    recommendations.push('💾 High memory usage detected - consider cache cleanup');
  }
  
  // Scalability recommendations
  if (healthScore >= 80) {
    recommendations.push('🚀 System ready for high-load production deployment');
  } else if (healthScore >= 60) {
    recommendations.push('⚡ System can handle moderate load - monitor during peak usage');
  } else {
    recommendations.push('🛠️ System needs optimization before handling high user load');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ All systems operating normally');
  }
  
  return recommendations;
}

/**
 * Reset all system components (for emergency recovery)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'reset-circuit-breakers') {
      CircuitBreakerManager.getInstance().resetAll();
      return NextResponse.json({ message: 'Circuit breakers reset successfully' });
    }
    
    if (action === 'clear-caches') {
      CacheManager.getInstance().clearAll();
      return NextResponse.json({ message: 'All caches cleared successfully' });
    }
    
    if (action === 'full-reset') {
      CircuitBreakerManager.getInstance().resetAll();
      CacheManager.getInstance().clearAll();
      return NextResponse.json({ message: 'Full system reset completed' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('❌ [System Health] Reset operation failed:', error);
    return NextResponse.json({ error: 'Reset operation failed' }, { status: 500 });
  }
}
