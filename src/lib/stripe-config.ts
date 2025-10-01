/**
 * Environment-aware Stripe configuration
 * Automatically detects environment and uses appropriate keys
 * Senior Engineer Implementation - Secure and Production Ready
 */

interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  environment: 'development' | 'production';
  isLive: boolean;
}

/**
 * Get Stripe configuration based on environment
 * - Development: Uses test keys (sk_test_*, pk_test_*)
 * - Production: Uses live keys (sk_live_*, pk_live_*)
 */
export function getStripeConfig(): StripeConfig {
  const nodeEnv = process.env.NODE_ENV;
  const isProduction = nodeEnv === 'production';
  
  // Get keys from environment
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Validate that keys exist
  if (!secretKey || !publishableKey || !webhookSecret) {
    throw new Error(
      `Missing Stripe configuration for ${isProduction ? 'production' : 'development'} environment. ` +
      'Please check your environment variables.'
    );
  }

  // Validate key format matches environment
  const expectedSecretPrefix = isProduction ? 'sk_live_' : 'sk_test_';
  const expectedPublishablePrefix = isProduction ? 'pk_live_' : 'pk_test_';

  if (!secretKey.startsWith(expectedSecretPrefix)) {
    console.warn(
      `⚠️  Stripe secret key doesn't match environment. ` +
      `Expected ${expectedSecretPrefix} but got ${secretKey.substring(0, 8)}...`
    );
  }

  if (!publishableKey.startsWith(expectedPublishablePrefix)) {
    console.warn(
      `⚠️  Stripe publishable key doesn't match environment. ` +
      `Expected ${expectedPublishablePrefix} but got ${publishableKey.substring(0, 8)}...`
    );
  }

  const config: StripeConfig = {
    secretKey,
    publishableKey,
    webhookSecret,
    environment: isProduction ? 'production' : 'development',
    isLive: isProduction && secretKey.startsWith('sk_live_')
  };

  // Log configuration (without exposing keys)
  console.log(`🔧 Stripe Configuration:`, {
    environment: config.environment,
    isLive: config.isLive,
    secretKeyPrefix: secretKey.substring(0, 12) + '...',
    publishableKeyPrefix: publishableKey.substring(0, 12) + '...',
    webhookSecretPrefix: webhookSecret.substring(0, 12) + '...'
  });

  return config;
}

/**
 * Get environment-aware price IDs for products
 * Different price IDs for test vs live mode
 */
export function getStripePrices() {
  const { isLive } = getStripeConfig();
  
  if (isLive) {
    // Production/Live price IDs - Real live price IDs from Stripe Dashboard
    return {
      'try-free': 'price_1SCjDVCXEBwbxwozB5a6oXUp',     // Try Agent Free
      'starter': 'price_1SDUAiCXEBwbxwozr788ke9X',       // Starter Agent
      'growth': 'price_1SCjJlCXEBwbxwozhKzAtCH1',        // Growth Agent
      'pro': 'price_1SCjMpCXEBwbxwozhT1RWAYP',           // Pro Agent
      'enterprise': 'price_1SCjPgCXEBwbxwozjCNWanOY'     // Enterprise Agent
    };
  } else {
    // Test/Development price IDs (actual working test mode IDs from your Stripe account)
    return {
      'try-free': 'price_1SCkZMCik0ZJySexGFq9FtxO',      // Try Agent Free (Test)
      'starter': 'price_1SCwe1Cik0ZJySexYVYW97uQ',        // Starter Agent (Test)
      'growth': 'price_1SCkefCik0ZJySexBO34LAsl',         // Growth Agent (Test)
      'pro': 'price_1SCkhJCik0ZJySexgkXpFKTO',            // Pro Agent (Test)
      'enterprise': 'price_1SCkjkCik0ZJySexpx9RGhu3'      // Enterprise Agent (Test)
    };
  }
}

/**
 * Get environment-aware success and cancel URLs
 */
export function getCheckoutUrls() {
  const { environment } = getStripeConfig();
  
  const baseUrl = environment === 'production' 
    ? 'https://crevo.app'
    : 'http://localhost:3001';
    
  return {
    successUrl: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${baseUrl}/cancel`
  };
}

export default getStripeConfig;