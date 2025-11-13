/**
 * OpenAI Retry Manager - Enhanced Retry Logic for OpenAI Assistant Operations
 * 
 * Provides robust retry mechanisms with exponential backoff, circuit breaker pattern,
 * and intelligent error handling for OpenAI API operations.
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeoutMs: number;
  retryableErrors: string[];
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

/**
 * Default retry configuration for OpenAI operations
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  timeoutMs: 120000, // 2 minutes
  retryableErrors: [
    'rate_limit_exceeded',
    'server_error',
    'timeout',
    'network_error',
    'service_unavailable',
    'internal_server_error',
    'bad_gateway',
    'gateway_timeout',
    'too_many_requests',
    'connection_error',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN'
  ]
};

/**
 * Circuit breaker to prevent cascade failures
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeMs = 60000 // 1 minute
  ) {}

  canExecute(): boolean {
    if (this.state === 'closed') return true;
    
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeMs) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    
    // half-open state
    return true;
  }

  onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Enhanced OpenAI Retry Manager
 */
export class OpenAIRetryManager {
  private circuitBreaker = new CircuitBreaker();
  
  constructor(private config: RetryConfig = DEFAULT_RETRY_CONFIG) {}

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const config = { ...this.config, ...customConfig };
    const startTime = Date.now();
    let lastError: Error;

    // Check circuit breaker
    if (!this.circuitBreaker.canExecute()) {
      return {
        success: false,
        error: new Error(`Circuit breaker is open for ${operationName}. Service temporarily unavailable.`),
        attempts: 0,
        totalTime: 0
      };
    }

    console.log(`🔄 [OpenAI Retry] Starting ${operationName} with retry config:`, {
      maxRetries: config.maxRetries,
      timeout: config.timeoutMs,
      circuitBreakerState: this.circuitBreaker.getState()
    });

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        // Add timeout wrapper
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), config.timeoutMs)
          )
        ]);

        const totalTime = Date.now() - startTime;
        console.log(`✅ [OpenAI Retry] ${operationName} succeeded on attempt ${attempt} in ${totalTime}ms`);
        
        this.circuitBreaker.onSuccess();
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const totalTime = Date.now() - startTime;

        console.warn(`⚠️ [OpenAI Retry] ${operationName} failed on attempt ${attempt}:`, {
          error: lastError.message,
          type: lastError.constructor.name,
          totalTime
        });

        // Check if error is retryable
        const isRetryable = this.isRetryableError(lastError);
        const isLastAttempt = attempt > config.maxRetries;

        if (!isRetryable || isLastAttempt) {
          console.error(`❌ [OpenAI Retry] ${operationName} failed permanently:`, {
            retryable: isRetryable,
            attempts: attempt,
            totalTime,
            error: lastError.message
          });

          this.circuitBreaker.onFailure();
          return {
            success: false,
            error: lastError,
            attempts: attempt,
            totalTime
          };
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelayMs
        );

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        const finalDelay = delay + jitter;

        console.log(`⏳ [OpenAI Retry] Retrying ${operationName} in ${Math.round(finalDelay)}ms (attempt ${attempt + 1}/${config.maxRetries + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, finalDelay));
      }
    }

    // This should never be reached, but just in case
    const totalTime = Date.now() - startTime;
    this.circuitBreaker.onFailure();
    return {
      success: false,
      error: lastError!,
      attempts: config.maxRetries + 1,
      totalTime
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.constructor.name.toLowerCase();
    
    // Check against retryable error patterns
    return this.config.retryableErrors.some(pattern => 
      errorMessage.includes(pattern.toLowerCase()) || 
      errorName.includes(pattern.toLowerCase())
    );
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): { state: string; failures: number } {
    return {
      state: this.circuitBreaker.getState(),
      failures: (this.circuitBreaker as any).failures
    };
  }

  /**
   * Reset circuit breaker (for manual recovery)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.onSuccess();
    console.log(`🔄 [OpenAI Retry] Circuit breaker manually reset`);
  }
}

/**
 * Specialized retry configurations for different OpenAI operations
 */
export const RETRY_CONFIGS = {
  // Assistant creation/management (less critical, can wait longer)
  ASSISTANT_MANAGEMENT: {
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 10000,
    timeoutMs: 60000
  },

  // Thread operations (medium priority)
  THREAD_OPERATIONS: {
    maxRetries: 4,
    baseDelayMs: 1500,
    maxDelayMs: 15000,
    timeoutMs: 90000
  },

  // Content generation (high priority, needs more retries)
  CONTENT_GENERATION: {
    maxRetries: 6,
    baseDelayMs: 1000,
    maxDelayMs: 20000,
    timeoutMs: 180000 // 3 minutes for content generation
  },

  // File operations (can be slow, need patience)
  FILE_OPERATIONS: {
    maxRetries: 5,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    timeoutMs: 300000 // 5 minutes for file uploads
  },

  // Quick operations (status checks, etc.)
  QUICK_OPERATIONS: {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    timeoutMs: 30000
  }
} as const;

/**
 * Global retry manager instances for different operation types
 */
export const openAIRetryManagers = {
  assistantManagement: new OpenAIRetryManager({ ...DEFAULT_RETRY_CONFIG, ...RETRY_CONFIGS.ASSISTANT_MANAGEMENT }),
  threadOperations: new OpenAIRetryManager({ ...DEFAULT_RETRY_CONFIG, ...RETRY_CONFIGS.THREAD_OPERATIONS }),
  contentGeneration: new OpenAIRetryManager({ ...DEFAULT_RETRY_CONFIG, ...RETRY_CONFIGS.CONTENT_GENERATION }),
  fileOperations: new OpenAIRetryManager({ ...DEFAULT_RETRY_CONFIG, ...RETRY_CONFIGS.FILE_OPERATIONS }),
  quickOperations: new OpenAIRetryManager({ ...DEFAULT_RETRY_CONFIG, ...RETRY_CONFIGS.QUICK_OPERATIONS })
};

/**
 * Utility function to wrap OpenAI operations with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  retryType: keyof typeof openAIRetryManagers = 'contentGeneration'
): Promise<T> {
  const manager = openAIRetryManagers[retryType];
  const result = await manager.executeWithRetry(operation, operationName);
  
  if (!result.success) {
    throw result.error || new Error(`${operationName} failed after ${result.attempts} attempts`);
  }
  
  return result.data!;
}

/**
 * Health check for all retry managers
 */
export function getRetryManagersHealth(): Record<string, any> {
  return Object.entries(openAIRetryManagers).reduce((health, [name, manager]) => {
    health[name] = manager.getCircuitBreakerStatus();
    return health;
  }, {} as Record<string, any>);
}
