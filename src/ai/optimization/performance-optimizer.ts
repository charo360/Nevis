/**
 * Performance Optimizer for Revo 2.0
 * 
 * Optimizes the assistant-first content-design integration pipeline
 * for better performance, reliability, and resource efficiency.
 */

export interface PerformanceMetrics {
  totalDuration: number;
  businessIntelligenceDuration: number;
  assistantGenerationDuration: number;
  validationDuration: number;
  synchronizationDuration: number;
  imageGenerationDuration: number;
  memoryUsage: number;
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface OptimizationResult {
  originalMetrics: PerformanceMetrics;
  optimizedMetrics: PerformanceMetrics;
  improvements: {
    durationReduction: number;
    apiCallReduction: number;
    cacheEfficiency: number;
  };
  recommendations: string[];
}

/**
 * Performance Optimizer Class
 * Implements caching, parallel processing, and resource optimization
 */
export class PerformanceOptimizer {
  private businessIntelligenceCache = new Map<string, any>();
  private conceptCache = new Map<string, any>();
  private validationCache = new Map<string, any>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  /**
   * Optimize business intelligence gathering with caching
   */
  async optimizeBusinessIntelligence(
    request: any,
    originalFunction: (req: any) => Promise<any>
  ): Promise<any> {
    const cacheKey = this.generateCacheKey('bi', request);
    
    // Check cache first
    const cached = this.getCachedResult(this.businessIntelligenceCache, cacheKey);
    if (cached) {
      console.log(`⚡ [Performance] Business intelligence cache hit for ${request.brandProfile.businessName}`);
      return cached;
    }

    // Generate and cache result
    const startTime = Date.now();
    const result = await originalFunction(request);
    const duration = Date.now() - startTime;
    
    this.setCachedResult(this.businessIntelligenceCache, cacheKey, result);
    console.log(`💾 [Performance] Business intelligence cached (${duration}ms)`);
    
    return result;
  }

  /**
   * Optimize creative concept generation with intelligent caching
   */
  async optimizeConceptGeneration(
    request: any,
    originalFunction: (req: any) => Promise<any>
  ): Promise<any> {
    const cacheKey = this.generateCacheKey('concept', request);
    
    // Check cache with variation tolerance
    const cached = this.getCachedResult(this.conceptCache, cacheKey);
    if (cached && this.shouldReuseConcept(request, cached)) {
      console.log(`⚡ [Performance] Creative concept cache hit`);
      return this.varyConceptForFreshness(cached, request);
    }

    // Generate new concept
    const result = await originalFunction(request);
    this.setCachedResult(this.conceptCache, cacheKey, result);
    
    return result;
  }

  /**
   * Optimize validation with result caching
   */
  async optimizeValidation(
    content: any,
    context: any,
    originalFunction: (content: any, context: any) => Promise<any>
  ): Promise<any> {
    const cacheKey = this.generateValidationCacheKey(content, context);
    
    const cached = this.getCachedResult(this.validationCache, cacheKey);
    if (cached) {
      console.log(`⚡ [Performance] Validation cache hit`);
      return cached;
    }

    const result = await originalFunction(content, context);
    this.setCachedResult(this.validationCache, cacheKey, result);
    
    return result;
  }

  /**
   * Optimize parallel processing for independent operations
   */
  async optimizeParallelProcessing(operations: {
    businessIntelligence?: () => Promise<any>;
    conceptGeneration?: () => Promise<any>;
    assistantPreparation?: () => Promise<any>;
  }): Promise<any> {
    console.log(`🚀 [Performance] Running ${Object.keys(operations).length} operations in parallel`);
    
    const startTime = Date.now();
    
    // Run independent operations in parallel
    const results = await Promise.allSettled([
      operations.businessIntelligence?.() || Promise.resolve(null),
      operations.conceptGeneration?.() || Promise.resolve(null),
      operations.assistantPreparation?.() || Promise.resolve(null)
    ]);

    const duration = Date.now() - startTime;
    console.log(`⚡ [Performance] Parallel processing completed in ${duration}ms`);

    // Extract results and handle any failures
    const [biResult, conceptResult, assistantResult] = results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    );

    return {
      businessIntelligence: biResult,
      concept: conceptResult,
      assistantPreparation: assistantResult
    };
  }

  /**
   * Optimize memory usage by cleaning up old cache entries
   */
  optimizeMemoryUsage(): void {
    const now = Date.now();
    let cleanedEntries = 0;

    // Clean business intelligence cache
    cleanedEntries += this.cleanCache(this.businessIntelligenceCache, now);
    
    // Clean concept cache
    cleanedEntries += this.cleanCache(this.conceptCache, now);
    
    // Clean validation cache
    cleanedEntries += this.cleanCache(this.validationCache, now);

    if (cleanedEntries > 0) {
      console.log(`🧹 [Performance] Cleaned ${cleanedEntries} expired cache entries`);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log(`♻️ [Performance] Garbage collection triggered`);
    }
  }

  /**
   * Optimize API calls by batching and deduplication
   */
  async optimizeApiCalls<T>(
    requests: Array<{ key: string; call: () => Promise<T> }>
  ): Promise<Map<string, T>> {
    console.log(`📞 [Performance] Optimizing ${requests.length} API calls`);
    
    // Deduplicate requests by key
    const uniqueRequests = new Map<string, () => Promise<T>>();
    requests.forEach(req => {
      if (!uniqueRequests.has(req.key)) {
        uniqueRequests.set(req.key, req.call);
      }
    });

    console.log(`📞 [Performance] Deduplicated to ${uniqueRequests.size} unique API calls`);

    // Batch execute unique requests
    const results = new Map<string, T>();
    const promises = Array.from(uniqueRequests.entries()).map(async ([key, call]) => {
      try {
        const result = await call();
        results.set(key, result);
      } catch (error) {
        console.warn(`⚠️ [Performance] API call failed for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    
    return results;
  }

  /**
   * Monitor and report performance metrics
   */
  createPerformanceMonitor(): {
    start: () => void;
    checkpoint: (name: string) => void;
    finish: () => PerformanceMetrics;
  } {
    const startTime = Date.now();
    const checkpoints: { [key: string]: number } = {};
    let apiCalls = 0;
    let cacheHits = 0;
    let cacheMisses = 0;

    return {
      start: () => {
        checkpoints.start = Date.now();
      },
      
      checkpoint: (name: string) => {
        checkpoints[name] = Date.now();
      },
      
      finish: () => {
        const totalDuration = Date.now() - startTime;
        
        return {
          totalDuration,
          businessIntelligenceDuration: checkpoints.businessIntelligence - checkpoints.start || 0,
          assistantGenerationDuration: checkpoints.assistantGeneration - (checkpoints.businessIntelligence || checkpoints.start) || 0,
          validationDuration: checkpoints.validation - (checkpoints.assistantGeneration || checkpoints.start) || 0,
          synchronizationDuration: checkpoints.synchronization - (checkpoints.validation || checkpoints.start) || 0,
          imageGenerationDuration: checkpoints.imageGeneration - (checkpoints.synchronization || checkpoints.start) || 0,
          memoryUsage: process.memoryUsage().heapUsed,
          apiCalls,
          cacheHits,
          cacheMisses
        };
      }
    };
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(metrics: PerformanceMetrics): {
    summary: string;
    bottlenecks: string[];
    recommendations: string[];
  } {
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    // Analyze duration bottlenecks
    if (metrics.businessIntelligenceDuration > 30000) {
      bottlenecks.push('Business intelligence generation is slow (>30s)');
      recommendations.push('Implement more aggressive caching for business intelligence');
    }

    if (metrics.assistantGenerationDuration > 60000) {
      bottlenecks.push('Assistant generation is slow (>60s)');
      recommendations.push('Consider assistant optimization or timeout reduction');
    }

    if (metrics.imageGenerationDuration > 20000) {
      bottlenecks.push('Image generation is slow (>20s)');
      recommendations.push('Optimize image prompts or consider alternative image generation');
    }

    // Analyze cache efficiency
    const cacheEfficiency = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);
    if (cacheEfficiency < 0.3) {
      bottlenecks.push('Low cache efficiency (<30%)');
      recommendations.push('Review cache key generation and timeout policies');
    }

    // Analyze memory usage
    if (metrics.memoryUsage > 500 * 1024 * 1024) { // 500MB
      bottlenecks.push('High memory usage (>500MB)');
      recommendations.push('Implement more frequent cache cleanup and memory optimization');
    }

    // Generate summary
    const summary = `Total: ${metrics.totalDuration}ms, API calls: ${metrics.apiCalls}, Cache efficiency: ${(cacheEfficiency * 100).toFixed(1)}%`;

    return {
      summary,
      bottlenecks,
      recommendations
    };
  }

  // Private helper methods
  private generateCacheKey(type: string, request: any): string {
    const keyData = {
      type,
      businessName: request.brandProfile?.businessName,
      businessType: request.businessType,
      platform: request.platform,
      location: request.brandProfile?.location
    };
    
    return JSON.stringify(keyData);
  }

  private generateValidationCacheKey(content: any, context: any): string {
    const keyData = {
      headline: content.headline,
      businessType: context.businessType,
      platform: context.platform
    };
    
    return JSON.stringify(keyData);
  }

  private getCachedResult(cache: Map<string, any>, key: string): any {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    if (cached) {
      cache.delete(key); // Remove expired entry
    }
    
    return null;
  }

  private setCachedResult(cache: Map<string, any>, key: string, data: any): void {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private shouldReuseConcept(request: any, cached: any): boolean {
    // Allow concept reuse for same business type and platform
    // but add some variation to prevent exact repetition
    return Math.random() > 0.3; // 70% reuse rate
  }

  private varyConceptForFreshness(cached: any, request: any): any {
    // Add slight variations to cached concepts for freshness
    const variations = [
      'with modern twist',
      'with authentic approach',
      'with innovative angle',
      'with customer-focused perspective'
    ];
    
    const variation = variations[Math.floor(Math.random() * variations.length)];
    
    return {
      ...cached,
      concept: `${cached.concept} ${variation}`,
      visualTheme: `${cached.visualTheme} - refreshed`,
      timestamp: Date.now()
    };
  }

  private cleanCache(cache: Map<string, any>, now: number): number {
    let cleaned = 0;
    
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();
