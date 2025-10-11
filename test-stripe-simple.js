const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

// Use your test key directly
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' // Use a valid API version
});

async function testStripeConnection() {
  try {
    console.log('Testing Stripe connection...');
    console.log('Using key prefix:', (process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY || '').substring(0, 12) + '...');
    
    // Test 1: Simple API call
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe API connection works');
    console.log('Account ID:', account.id);
    
    // Test 2: Create a simple checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Test Product' },
            unit_amount: 999, // $9.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3001/success',
      cancel_url: 'http://localhost:3001/cancel',
      metadata: { test: 'true', userId: 'test-user' },
    });
    
    console.log('✅ Checkout session created successfully');
    console.log('Session ID:', session.id);
    console.log('Session URL:', session.url);
    
    return session;
    
  } catch (error) {
    console.error('❌ Stripe error:', error.message);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    if (error.headers) {
      console.error('Request ID:', error.headers['request-id']);
    }
    return null;
  }
}

testStripeConnection().then(() => {
  console.log('Test completed');
}).catch(err => {
  console.error('Test failed:', err);
});