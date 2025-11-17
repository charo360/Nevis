/**
 * OpenAI Health Check API
 * 
 * GET /api/openai/health
 * Returns the health status of all configured OpenAI API keys
 */

import { NextResponse } from 'next/server';
import { EnhancedOpenAIClient } from '@/lib/services/openai-client-enhanced';

export async function GET() {
  try {
    // Get health status of all API keys
    const keyHealthStatus = EnhancedOpenAIClient.getKeyHealthStatus();
    
    // Calculate overall health metrics
    const totalKeys = keyHealthStatus.length;
    const healthyKeys = keyHealthStatus.filter(key => key.isHealthy).length;
    const rateLimitedKeys = keyHealthStatus.filter(key => 
      key.rateLimitResetTime && new Date() < key.rateLimitResetTime
    ).length;
    
    // Calculate success rates
    const overallStats = keyHealthStatus.reduce((acc, key) => {
      acc.totalRequests += key.totalRequests;
      acc.totalSuccesses += key.successCount;
      acc.totalErrors += key.errorCount;
      return acc;
    }, { totalRequests: 0, totalSuccesses: 0, totalErrors: 0 });
    
    const successRate = overallStats.totalRequests > 0 
      ? (overallStats.totalSuccesses / overallStats.totalRequests) * 100 
      : 100;

    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyKeys === totalKeys) {
      overallStatus = 'healthy';
    } else if (healthyKeys > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    // Format key details for response (hide sensitive parts of API keys)
    const keyDetails = keyHealthStatus.map(key => ({
      keyId: key.keyId,
      isHealthy: key.isHealthy,
      lastUsed: key.lastUsed,
      errorCount: key.errorCount,
      successCount: key.successCount,
      totalRequests: key.totalRequests,
      successRate: key.totalRequests > 0 ? (key.successCount / key.totalRequests) * 100 : 100,
      lastError: key.lastError,
      isRateLimited: key.rateLimitResetTime ? new Date() < key.rateLimitResetTime : false,
      rateLimitResetTime: key.rateLimitResetTime
    }));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overallStatus,
      summary: {
        totalKeys,
        healthyKeys,
        rateLimitedKeys,
        unhealthyKeys: totalKeys - healthyKeys,
        overallSuccessRate: Math.round(successRate * 100) / 100
      },
      statistics: {
        totalRequests: overallStats.totalRequests,
        totalSuccesses: overallStats.totalSuccesses,
        totalErrors: overallStats.totalErrors,
        successRate: Math.round(successRate * 100) / 100
      },
      keys: keyDetails,
      configuration: {
        fallbackEnabled: process.env.OPENAI_FALLBACK_ENABLED === 'true',
        keyRotationEnabled: process.env.OPENAI_KEY_ROTATION_ENABLED === 'true',
        healthCheckInterval: process.env.OPENAI_HEALTH_CHECK_INTERVAL || '300000'
      }
    });

  } catch (error) {
    console.error('❌ [OpenAI Health Check] Failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/openai/health
 * Trigger a manual health check of all API keys
 */
export async function POST() {
  try {
    // Get a direct client to trigger health check
    const client = EnhancedOpenAIClient.getDirectClient();
    
    // Perform a simple test operation
    await client.models.list();
    
    // Get updated health status
    const keyHealthStatus = EnhancedOpenAIClient.getKeyHealthStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Health check completed',
      timestamp: new Date().toISOString(),
      testedKeys: keyHealthStatus.length,
      healthyKeys: keyHealthStatus.filter(key => key.isHealthy).length
    });

  } catch (error) {
    console.error('❌ [OpenAI Health Check] Manual check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
