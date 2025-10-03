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

  // Validate that essential keys exist (webhook secret is optional)
  if (!secretKey || !publishableKey) {
    throw new Error(
      `Missing Stripe configuration for ${isProduction ? 'production' : 'development'} environment. ` +
      'Please ensure STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY are set.'
    );
  }

  if (!webhookSecret) {
    console.warn('⚠️ Stripe webhook secret (STRIPE_WEBHOOK_SECRET) is not set. Webhook signature verification will be disabled.');
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
    const secretKeyPrefix = secretKey ? `${secretKey.substring(0, 12)}...` : 'not set';
    const publishableKeyPrefix = publishableKey ? `${publishableKey.substring(0, 12)}...` : 'not set';
    const webhookSecretPrefix = webhookSecret ? `${webhookSecret.substring(0, 12)}...` : 'not set';

    console.log(`🔧 Stripe Configuration:`, {
      environment: config.environment,
      isLive: config.isLive,
      secretKeyPrefix,
      publishableKeyPrefix,
      webhookSecretPrefix
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
      'try-free': 'price_1SDqaWELJu3kIHjxZQBntjuO',     // Try Agent Free (prod)
  'starter': 'price_1SDqfQELJu3kIHjxzHWPNMPs',       // Starter Agent (prod)
      'growth': 'price_1SDqiKELJu3kIHjx0LWHBgfV',        // Growth Agent (prod)
      'pro': 'price_1SDqloELJu3kIHjxU187qSj1',           // Pro Agent (prod)
      'enterprise': 'price_1SDqp4ELJu3kIHjx7oLcQwzh'     // Enterprise Agent (prod)
    };
  } else {
    // Test/Development price IDs (actual working test mode IDs from your Stripe account)
    return {
      'try-free': 'price_1SEDxyRn8roP0mgSNyhZjbqx',      // Try Agent Free (Dev/Sandbox)
      'starter': 'price_1SEE1ORn8roP0mgSS9mlHCa9',        // Starter Agent (Dev/Sandbox)
      'growth': 'price_1SEDzFRn8roP0mgSnReS2Y44',         // Growth Agent (Dev/Sandbox)
      'pro': 'price_1SEDzvRn8roP0mgSqC1sLrl8',            // Pro Agent (Dev/Sandbox)
      'enterprise': 'price_1SEE0bRn8roP0mgSun2Cz4TH'      // Enterprise Agent (Dev/Sandbox)
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

/**
 * Validate that configured Stripe price IDs are present (best-effort runtime check)
 * This uses the current server Stripe key to attempt a simple retrieval of each price id.
 * Useful to detect missing price IDs in production and surface a helpful log message.
 */
export async function validateStripePrices(stripeClient?: any) {
  try {
    const prices = getStripePrices();
    const ids = Object.values(prices).filter(Boolean) as string[];
    if (!ids.length) return { ok: true, missing: [] };

    const s = stripeClient;
    if (!s) return { ok: false, error: 'stripe client not provided' };

    const missing: string[] = [];
    for (const id of ids) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await s.prices.retrieve(id);
      } catch (err: any) {
        missing.push(id);
      }
    }

    return { ok: missing.length === 0, missing };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export default getStripeConfig;