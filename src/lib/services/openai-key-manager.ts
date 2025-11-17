/**
 * OpenAI API Key Manager - Fallback System for Multiple API Keys
 * 
 * Provides intelligent API key rotation and fallback mechanisms to ensure
 * high availability and reliability for OpenAI services.
 */

import OpenAI from 'openai';

export interface APIKeyHealth {
  key: string;
  keyId: string;
  isHealthy: boolean;
  lastUsed: Date;
  lastError?: string;
  errorCount: number;
  rateLimitResetTime?: Date;
  successCount: number;
  totalRequests: number;
}

export interface OpenAIKeyManagerConfig {
  fallbackEnabled: boolean;
  keyRotationEnabled: boolean;
  healthCheckInterval: number;
  maxErrorsBeforeDisable: number;
  keyRecoveryTime: number;
  rateLimitCooldown: number;
}

export class OpenAIKeyManager {
  private apiKeys: string[] = [];
  private keyHealth: Map<string, APIKeyHealth> = new Map();
  private currentKeyIndex: number = 0;
  private config: OpenAIKeyManagerConfig;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config?: Partial<OpenAIKeyManagerConfig>) {
    this.config = {
      fallbackEnabled: process.env.OPENAI_FALLBACK_ENABLED === 'true',
      keyRotationEnabled: process.env.OPENAI_KEY_ROTATION_ENABLED === 'true',
      healthCheckInterval: parseInt(process.env.OPENAI_HEALTH_CHECK_INTERVAL || '300000'),
      maxErrorsBeforeDisable: 5,
      keyRecoveryTime: 600000, // 10 minutes
      rateLimitCooldown: 3600000, // 1 hour
      ...config
    };

    this.loadAPIKeys();
    this.initializeHealthTracking();
    
    if (this.config.healthCheckInterval > 0) {
      this.startHealthChecking();
    }

    console.log(`🔑 [OpenAI Key Manager] Initialized with ${this.apiKeys.length} API keys`);
    console.log(`🔄 [OpenAI Key Manager] Fallback: ${this.config.fallbackEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`🔀 [OpenAI Key Manager] Rotation: ${this.config.keyRotationEnabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Load API keys from environment variables
   */
  private loadAPIKeys(): void {
    const keys: string[] = [];

    // Primary key
    if (process.env.OPENAI_API_KEY) {
      keys.push(process.env.OPENAI_API_KEY);
    }

    // Fallback keys
    for (let i = 1; i <= 10; i++) {
      const fallbackKey = process.env[`OPENAI_API_KEY_FALLBACK_${i}`];
      if (fallbackKey) {
        keys.push(fallbackKey);
      }
    }

    if (keys.length === 0) {
      throw new Error('No OpenAI API keys found in environment variables');
    }

    this.apiKeys = keys;
    console.log(`🔑 [OpenAI Key Manager] Loaded ${keys.length} API keys`);
  }

  /**
   * Initialize health tracking for all keys
   */
  private initializeHealthTracking(): void {
    this.apiKeys.forEach((key, index) => {
      const keyId = this.getKeyId(key);
      this.keyHealth.set(keyId, {
        key,
        keyId,
        isHealthy: true,
        lastUsed: new Date(),
        errorCount: 0,
        successCount: 0,
        totalRequests: 0
      });
    });
  }

  /**
   * Get a shortened key ID for logging and tracking
   */
  private getKeyId(key: string): string {
    return key.substring(0, 7) + '...' + key.substring(key.length - 4);
  }

  /**
   * Get the next healthy API key
   */
  public getHealthyKey(): string {
    if (!this.config.fallbackEnabled && this.apiKeys.length > 0) {
      return this.apiKeys[0];
    }

    // Find the next healthy key
    for (let i = 0; i < this.apiKeys.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
      const key = this.apiKeys[keyIndex];
      const keyId = this.getKeyId(key);
      const health = this.keyHealth.get(keyId);

      if (health && this.isKeyUsable(health)) {
        if (this.config.keyRotationEnabled) {
          this.currentKeyIndex = keyIndex;
        }
        return key;
      }
    }

    // If no healthy keys found, return the primary key as last resort
    console.warn('⚠️ [OpenAI Key Manager] No healthy keys found, using primary key');
    return this.apiKeys[0];
  }

  /**
   * Check if a key is usable (healthy and not rate limited)
   */
  private isKeyUsable(health: APIKeyHealth): boolean {
    if (!health.isHealthy) {
      // Check if enough time has passed for recovery
      const timeSinceLastError = Date.now() - health.lastUsed.getTime();
      if (timeSinceLastError < this.config.keyRecoveryTime) {
        return false;
      }
      // Reset health status for retry
      health.isHealthy = true;
      health.errorCount = 0;
    }

    // Check rate limit
    if (health.rateLimitResetTime && Date.now() < health.rateLimitResetTime.getTime()) {
      return false;
    }

    return true;
  }

  /**
   * Create OpenAI client with current healthy key
   */
  public createClient(): OpenAI {
    const apiKey = this.getHealthyKey();
    return new OpenAI({
      apiKey,
      timeout: 60000,
      maxRetries: 0, // We handle retries at the key level
    });
  }

  /**
   * Record successful API call
   */
  public recordSuccess(apiKey: string): void {
    const keyId = this.getKeyId(apiKey);
    const health = this.keyHealth.get(keyId);
    if (health) {
      health.successCount++;
      health.totalRequests++;
      health.lastUsed = new Date();
      health.isHealthy = true;
      // Reset error count on success
      if (health.errorCount > 0) {
        health.errorCount = Math.max(0, health.errorCount - 1);
      }
    }
  }

  /**
   * Record API call failure
   */
  public recordFailure(apiKey: string, error: Error): void {
    const keyId = this.getKeyId(apiKey);
    const health = this.keyHealth.get(keyId);
    if (health) {
      health.errorCount++;
      health.totalRequests++;
      health.lastUsed = new Date();
      health.lastError = error.message;

      // Check for rate limit errors
      if (error.message.includes('rate_limit_exceeded') || error.message.includes('429')) {
        health.rateLimitResetTime = new Date(Date.now() + this.config.rateLimitCooldown);
        console.warn(`⚠️ [OpenAI Key Manager] Rate limit hit for key ${keyId}, cooling down until ${health.rateLimitResetTime}`);
      }

      // Disable key if too many errors
      if (health.errorCount >= this.config.maxErrorsBeforeDisable) {
        health.isHealthy = false;
        console.warn(`⚠️ [OpenAI Key Manager] Key ${keyId} disabled due to ${health.errorCount} errors`);
      }
    }
  }

  /**
   * Get health status of all keys
   */
  public getHealthStatus(): APIKeyHealth[] {
    return Array.from(this.keyHealth.values());
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check on all keys
   */
  private async performHealthCheck(): Promise<void> {
    console.log('🔍 [OpenAI Key Manager] Performing health check...');
    
    for (const [keyId, health] of this.keyHealth.entries()) {
      try {
        const client = new OpenAI({ apiKey: health.key, timeout: 10000 });
        await client.models.list();
        
        if (!health.isHealthy) {
          console.log(`✅ [OpenAI Key Manager] Key ${keyId} recovered and is now healthy`);
          health.isHealthy = true;
          health.errorCount = 0;
        }
      } catch (error) {
        console.warn(`⚠️ [OpenAI Key Manager] Health check failed for key ${keyId}:`, error instanceof Error ? error.message : 'Unknown error');
        this.recordFailure(health.key, error instanceof Error ? error : new Error('Health check failed'));
      }
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }
}

// Global instance
export const openAIKeyManager = new OpenAIKeyManager();
