import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPlanById } from '@/lib/secure-pricing';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Environment-specific configuration
const getStripeConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY_TEST || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_TEST || '',
      apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
      environment: 'TEST'
    };
  } else {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion,
      environment: 'PRODUCTION'
    };
  }
};

const stripeConfig = getStripeConfig();

// Initialize Stripe with proper configuration
const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: stripeConfig.apiVersion
});

const webhookSecret = stripeConfig.webhookSecret;

// Helper function for environment prefix
const getEnvironmentPrefix = () => {
  return stripeConfig.environment === 'TEST' ? '[TEST] ' : '';
};

// Disable body parsing for Stripe webhooks (critical for signature verification)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET handler for webhook verification and health check
export async function GET(req: NextRequest) {
  console.log(`🔍 GET request to webhook endpoint - Environment: ${stripeConfig.environment}`);
  return NextResponse.json({ 
    status: 'active',
    message: 'Stripe webhook endpoint is operational',
    environment: stripeConfig.environment,
    timestamp: new Date().toISOString(),
    supportedMethods: ['POST', 'GET', 'OPTIONS']
  }, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(req: NextRequest) {
  console.log(`🔧 OPTIONS request to webhook endpoint`);
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
      'Access-Control-Max-Age': '86400'
    },
  });
}

// Main webhook handler
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ Missing Stripe signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!webhookSecret) {
    console.error('❌ Missing webhook secret configuration');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const sessionId = paymentIntent.metadata?.session_id;
        
        if (sessionId) {
          console.log(`${getEnvironmentPrefix()}✅ Payment succeeded for session: ${sessionId}`);
          
          // Update payment status in database
          const { error: updateError } = await supabase
            .from('payment_transactions')
            .update({ 
              status: 'completed',
              stripe_payment_intent_id: paymentIntent.id
            })
            .eq('stripe_session_id', sessionId);

          if (updateError) {
            console.error('❌ Error updating payment status:', updateError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
          }

          console.log(`${getEnvironmentPrefix()}📝 Payment status updated to completed for session: ${sessionId}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const sessionId = paymentIntent.metadata?.session_id;
        
        if (sessionId) {
          console.log(`${getEnvironmentPrefix()}❌ Payment failed for session: ${sessionId}`);
          
          // Update payment status to failed
          const { error: updateError } = await supabase
            .from('payment_transactions')
            .update({ 
              status: 'failed',
              stripe_payment_intent_id: paymentIntent.id
            })
            .eq('stripe_session_id', sessionId);

          if (updateError) {
            console.error('❌ Error updating payment status to failed:', updateError);
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log(`${getEnvironmentPrefix()}🎉 Checkout session completed: ${session.id}`);
        
        // Additional session completion logic can be added here
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log(`${getEnvironmentPrefix()}💸 Charge refunded: ${charge.id}`);
        
        // Handle refund logic here
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        console.log(`${getEnvironmentPrefix()}⚖️ Dispute created: ${dispute.id}`);
        
        // Handle dispute logic here
        break;
      }

      default:
        console.log(`${getEnvironmentPrefix()}ℹ️ Unhandled event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ 
      received: true, 
      event_type: event.type,
      environment: stripeConfig.environment 
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle other HTTP methods with appropriate responses
export async function PUT(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Method not allowed',
    message: 'PUT method is not supported for webhook endpoints' 
  }, { status: 405 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Method not allowed',
    message: 'DELETE method is not supported for webhook endpoints' 
  }, { status: 405 });
}

export async function PATCH(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Method not allowed',
    message: 'PATCH method is not supported for webhook endpoints' 
  }, { status: 405 });
}