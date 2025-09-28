// scripts/check-stripe-prices.js
// Usage: node scripts/check-stripe-prices.js price_123 price_456

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const Stripe = require('stripe');

async function main() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error('Missing STRIPE_SECRET_KEY in .env.local or environment');
    process.exit(2);
  }

  const stripe = new Stripe(secret, { apiVersion: '2025-07-30.basil' });
  const ids = process.argv.slice(2);
  if (!ids || ids.length === 0) {
    console.error('Please pass one or more price IDs as arguments.');
    console.error('Example: node scripts/check-stripe-prices.js price_abc price_def');
    process.exit(2);
  }

  for (const id of ids) {
    try {
      const price = await stripe.prices.retrieve(id);
      // Print a concise summary
      console.log(`FOUND: ${id} — ${price.unit_amount} ${price.currency} (recurring: ${!!price.recurring}) product: ${price.product}`);
    } catch (err) {
      console.log(`ERROR: ${id} — ${err && err.message ? err.message : String(err)}`);
    }
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e && e.message ? e.message : e);
  process.exit(1);
});
