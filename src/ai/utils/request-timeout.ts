/**
 * Request Timeout and Retry Utilities
 * Prevents hanging requests and implements smart retry mechanisms
 * Critical for handling 1,000+ concurrent users
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface TimeoutConfig {
  timeout: number;
  abortOnTimeout: boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 30000,      // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: ['503', '502', '504', 'timeout', 'network', 'ECONNRESET', 'ETIMEDOUT']
};

/**
 * Default timeout configuration
 */
export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  timeout: 30000,       // 30 seconds
  abortOnTimeout: true
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return retryableErrors.some(retryableError => 
    errorMessage.includes(retryableError.toLowerCase()) ||
    errorCode.includes(retryableError.toLowerCase())
  );
}

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  const delay = Math.min(exponentialDelay + jitter, config.maxDelay);
  
  return Math.floor(delay);
}

/**
 * Execute a function with timeout protection
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig = DEFAULT_TIMEOUT_CONFIG
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout;
    
    // Set up timeout
    if (config.timeout > 0) {
      timeoutId = setTimeout(() => {
        if (config.abortOnTimeout) {
          controller.abort();
        }
        reject(new Error(`Operation timed out after ${config.timeout}ms`));
      }, config.timeout);
    }
    
    // Execute operation
    operation()
      .then(result => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 1) {
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // If this is the last attempt, throw the error
      if (attempt > config.maxRetries) {
        console.error(`❌ [Retry] Operation failed after ${config.maxRetries + 1} attempts:`, error.message);
        throw error;
      }
      
      // Check if error is retryable
      if (!isRetryableError(error, config.retryableErrors)) {
        console.error(`❌ [Retry] Non-retryable error on attempt ${attempt}:`, error.message);
        throw error;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, config);
      console.warn(`⏳ [Retry] Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Execute a function with both timeout and retry protection
 */
export async function withTimeoutAndRetry<T>(
  operation: () => Promise<T>,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  timeoutConfig: TimeoutConfig = DEFAULT_TIMEOUT_CONFIG
): Promise<T> {
  return withRetry(
    () => withTimeout(operation, timeoutConfig),
    retryConfig
  );
}

/**
 * Batch execute multiple operations with concurrency control
 */
export async function batchExecute<T>(
  operations: (() => Promise<T>)[],
  maxConcurrency: number = 3,
  retryConfig?: RetryConfig,
  timeoutConfig?: TimeoutConfig
): Promise<(T | Error)[]> {
  const results: (T | Error)[] = [];
  const executing: Promise<void>[] = [];
  
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    
    const executeWithProtection = async (index: number) => {
      try {
        let result: T;
        
        if (retryConfig || timeoutConfig) {
          result = await withTimeoutAndRetry(operation, retryConfig, timeoutConfig);
        } else {
          result = await operation();
        }
        
        results[index] = result;
      } catch (error) {
        console.error(`❌ [Batch] Operation ${index} failed:`, error.message);
        results[index] = error as Error;
      }
    };
    
    const promise = executeWithProtection(i);
    executing.push(promise);
    
    // Control concurrency
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      // Remove completed promises
      for (let j = executing.length - 1; j >= 0; j--) {
        if (await Promise.race([executing[j], Promise.resolve('pending')]) !== 'pending') {
          executing.splice(j, 1);
        }
      }
    }
  }
  
  // Wait for all remaining operations
  await Promise.all(executing);
  
  return results;
}

/**
 * Create a rate-limited function
 */
export function createRateLimiter(requestsPerSecond: number) {
  const queue: Array<{ resolve: Function; reject: Function; operation: Function }> = [];
  let processing = false;
  const interval = 1000 / requestsPerSecond;
  
  const processQueue = async () => {
    if (processing || queue.length === 0) return;
    
    processing = true;
    
    while (queue.length > 0) {
      const { resolve, reject, operation } = queue.shift()!;
      
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // Wait for the rate limit interval
      if (queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    processing = false;
  };
  
  return async function<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push({ resolve, reject, operation });
      processQueue();
    });
  };
}

/**
 * Request statistics tracking
 */
export class RequestStats {
  private stats = {
    total: 0,
    successful: 0,
    failed: 0,
    retried: 0,
    timedOut: 0,
    averageResponseTime: 0,
    totalResponseTime: 0
  };
  
  recordRequest(success: boolean, responseTime: number, wasRetried: boolean = false, wasTimedOut: boolean = false) {
    this.stats.total++;
    this.stats.totalResponseTime += responseTime;
    this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.total;
    
    if (success) {
      this.stats.successful++;
    } else {
      this.stats.failed++;
    }
    
    if (wasRetried) {
      this.stats.retried++;
    }
    
    if (wasTimedOut) {
      this.stats.timedOut++;
    }
  }
  
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.total > 0 ? (this.stats.successful / this.stats.total) * 100 : 0,
      failureRate: this.stats.total > 0 ? (this.stats.failed / this.stats.total) * 100 : 0,
      retryRate: this.stats.total > 0 ? (this.stats.retried / this.stats.total) * 100 : 0,
      timeoutRate: this.stats.total > 0 ? (this.stats.timedOut / this.stats.total) * 100 : 0
    };
  }
  
  reset() {
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      retried: 0,
      timedOut: 0,
      averageResponseTime: 0,
      totalResponseTime: 0
    };
  }
}
