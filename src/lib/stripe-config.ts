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
 * - Development: Uses test keys (sk_test_*, pk_test_*) with _TEST suffix
 * - Production: Uses live keys (sk_live_*, pk_live_*) or regular env vars
 */
export function getStripeConfig(): StripeConfig {
  const nodeEnv = process.env.NODE_ENV;
  const isProduction = nodeEnv === 'production';
  
  let secretKey: string;
  let publishableKey: string;
  let webhookSecret: string;

  if (isProduction) {
    // Production environment - use live keys or main env vars
    secretKey = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY || '';
    publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET || '';
  } else {
    // Development environment - prefer _TEST suffixed keys, fallback to main
    secretKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY || '';
    publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  // Validate that essential keys exist
  if (!secretKey || !publishableKey) {
    throw new Error(
      `Missing Stripe configuration for ${isProduction ? 'production' : 'development'} environment.\n` +
      `Expected keys: ${isProduction ? 'STRIPE_SECRET_KEY_LIVE, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE' : 'STRIPE_SECRET_KEY_TEST, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST'}\n` +
      `Or fallback: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    );
  }

  if (!webhookSecret) {
    console.warn(`⚠️ Stripe webhook secret is not set for ${isProduction ? 'production' : 'development'} environment.`);
    console.warn(`Expected: ${isProduction ? 'STRIPE_WEBHOOK_SECRET_LIVE' : 'STRIPE_WEBHOOK_SECRET_TEST'} or STRIPE_WEBHOOK_SECRET`);
  }

  // Validate key format matches environment
  const expectedSecretPrefix = isProduction ? 'sk_live_' : 'sk_test_';
  const expectedPublishablePrefix = isProduction ? 'pk_live_' : 'pk_test_';
  const expectedWebhookPrefix = 'whsec_';

  if (!secretKey.startsWith(expectedSecretPrefix)) {
    console.warn(
      `⚠️ Stripe secret key doesn't match ${isProduction ? 'production' : 'development'} environment.\n` +
      `Expected: ${expectedSecretPrefix}... but got: ${secretKey.substring(0, 8)}...`
    );
  }

  if (!publishableKey.startsWith(expectedPublishablePrefix)) {
    console.warn(
      `⚠️ Stripe publishable key doesn't match ${isProduction ? 'production' : 'development'} environment.\n` +
      `Expected: ${expectedPublishablePrefix}... but got: ${publishableKey.substring(0, 8)}...`
    );
  }

  if (webhookSecret && !webhookSecret.startsWith(expectedWebhookPrefix)) {
    console.warn(
      `⚠️ Stripe webhook secret format invalid. Expected: ${expectedWebhookPrefix}... but got: ${webhookSecret.substring(0, 8)}...`
    );
  }

  const config: StripeConfig = {
    secretKey,
    publishableKey,
    webhookSecret,
    environment: isProduction ? 'production' : 'development',
    isLive: isProduction && secretKey.startsWith('sk_live_')
  };

  // Log configuration (without exposing actual keys)
  const secretKeyPrefix = secretKey ? `${secretKey.substring(0, 12)}...` : 'not set';
  const publishableKeyPrefix = publishableKey ? `${publishableKey.substring(0, 12)}...` : 'not set';
  const webhookSecretPrefix = webhookSecret ? `${webhookSecret.substring(0, 12)}...` : 'not set';

  console.log(`🔧 Stripe Configuration Loaded:`, {
    environment: config.environment,
    isLive: config.isLive,
    secretKey: secretKeyPrefix,
    publishableKey: publishableKeyPrefix,
    webhookSecret: webhookSecretPrefix
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
  'starter': 'price_1SDqfQELJu3kIHjxzHWPNMPs',       // Starter Agent TEST PRICE $0.50 (prod)
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