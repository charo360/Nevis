import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPlanById } from '@/lib/secure-pricing';
import { getStripeConfig } from '@/lib/stripe-config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get environment-aware Stripe configuration
const stripeConfig = getStripeConfig();

// Initialize Stripe with environment-appropriate keys  
const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-09-30' as Stripe.LatestApiVersion
});

const webhookSecret = stripeConfig.webhookSecret;

// GET handler for webhook health check
export async function GET(req: NextRequest) {
  const secretPrefix = webhookSecret ? webhookSecret.substring(0, 8) + '...' : 'NOT_SET';
  
  return NextResponse.json({ 
    status: 'active',
    message: 'Stripe webhook endpoint is operational',
    timestamp: new Date().toISOString(),
    environment: stripeConfig.environment,
    isLive: stripeConfig.isLive,
    webhook_configured: !!webhookSecret,
    webhook_secret_prefix: secretPrefix,
    secret_key_prefix: stripeConfig.secretKey.substring(0, 8) + '...'
  });
}

export async function POST(req: NextRequest) {
  console.log(`🔧 Webhook Request - Environment: ${stripeConfig.environment} (${stripeConfig.isLive ? 'LIVE' : 'TEST'})`);
  console.log(`🔑 Webhook Secret Status: ${webhookSecret ? 'CONFIGURED' : 'MISSING'} (${webhookSecret?.length || 0} chars)`);

  if (!webhookSecret) {
    console.error(`❌ Webhook secret not configured for ${stripeConfig.environment} environment`);
    console.error(`Expected environment variable: ${stripeConfig.environment === 'production' ? 'STRIPE_WEBHOOK_SECRET_LIVE' : 'STRIPE_WEBHOOK_SECRET_TEST'}`);
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('✅ Webhook signature verified successfully');
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', {
      error: err.message,
      signature_provided: !!signature,
      webhook_secret_configured: !!webhookSecret,
      webhook_secret_prefix: webhookSecret ? webhookSecret.substring(0, 12) + '...' : 'NOT_SET',
      body_length: body.length,
      environment: stripeConfig.environment
    });
    return NextResponse.json({ 
      error: 'Invalid signature',
      debug: process.env.NODE_ENV === 'development' ? {
        webhook_secret_prefix: webhookSecret ? webhookSecret.substring(0, 12) + '...' : 'NOT_SET',
        environment: stripeConfig.environment
      } : undefined
    }, { status: 400 });
  }

  console.log('🎯 Received Stripe webhook:', event.type);
  console.log('📋 Event data preview:', {
    id: event.id,
    type: event.type,
    object_id: (event.data.object as any).id,
    created: event.created
  });
  
  // Enhanced debugging for payment events
  if (event.type.startsWith('payment_intent') || event.type.includes('session.completed')) {
    const obj = event.data.object as any;
    console.log('💳 Payment Event Debug:', {
      payment_intent_id: obj.id,
      session_id: obj.id,
      metadata: obj.metadata,
      status: obj.status,
      amount: obj.amount_total || obj.amount
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🎉 Processing checkout session completed');
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.payment_failed':
        console.error('❌ Payment failed, updating status');
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      // Note: We only handle checkout.session.completed for payment success
      // because it contains all the metadata we need. payment_intent.succeeded
      // is fired before checkout.session.completed but lacks session metadata
      case 'payment_intent.succeeded':
        console.log('💰 Payment intent succeeded (handled by checkout.session.completed)');
        break;

      default:
        console.log('🔄 Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Processing completed checkout session:', session.id);
  console.log('📋 Session data:', {
    client_reference_id: session.client_reference_id,
    metadata: session.metadata,
    amount_total: session.amount_total,
    currency: session.currency,
    payment_status: session.payment_status
  });

  // Try to get userId from client_reference_id or metadata
  const userId = session.client_reference_id || session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId) {
    console.error('❌ Missing userId in session. client_reference_id:', session.client_reference_id, 'metadata.userId:', session.metadata?.userId);
    return;
  }

  if (!planId) {
    console.error('❌ Missing planId in session metadata:', session.metadata);
    return;
  }

  const plan = getPlanById(planId);

  if (!plan) {
    console.error('❌ Invalid plan ID:', planId);
    return;
  }

  console.log('✅ Found plan:', { planId, credits: plan.credits, name: plan.name });

  try {
    // Check if payment already processed (idempotency) - critical for preventing duplicates
    console.log('🔍 Searching for existing payment with session_id:', session.id);
    
    const { data: existingPayment, error: existingError } = await supabase
      .from('payment_transactions')
      .select('id, status, credits_added, stripe_session_id, created_at')
      .eq('stripe_session_id', session.id)
      .maybeSingle();
      
    console.log('📊 Database search result:', {
      found: !!existingPayment,
      error: !!existingError,
      payment_id: existingPayment?.id,
      current_status: existingPayment?.status,
      created_at: existingPayment?.created_at
    });

    if (existingError) {
      console.error('❌ Error checking existing payment:', existingError);
    }

    if (existingPayment) {
      if (existingPayment.status === 'completed') {
        console.log('⚠️ Payment already completed, skipping:', session.id);
        return;
      } else {
        console.log('📝 Found pending payment, updating to completed:', existingPayment.id);
        // Update existing pending payment to completed
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({ 
            status: 'completed',
            credits_added: plan.credits
          })
          .eq('id', existingPayment.id);

        if (updateError) {
          console.error('❌ Failed to update existing payment:', updateError);
          return;
        }

        console.log('✅ Updated existing payment to completed:', existingPayment.id);
        await updateUserCredits(userId, plan.credits);
        return;
      }
    }

    // If no existing payment found, this is an error - payments should always be created during checkout
    console.error('❌ No existing payment transaction found for session:', session.id);
    console.error('💡 This indicates a problem with the checkout flow - payment should be created before webhook');
    
    // Let's try to find it by different criteria
    console.log('🔍 Searching for payment by payment_intent_id:', session.payment_intent);
    
    const { data: paymentByIntent, error: intentError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('stripe_payment_intent_id', session.payment_intent)
      .maybeSingle();

    if (paymentByIntent) {
      console.log('✅ Found payment by payment_intent_id, updating:', paymentByIntent.id);
      
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          credits_added: plan.credits,
          stripe_session_id: session.id  // Update with correct session ID
        })
        .eq('id', paymentByIntent.id);

      if (updateError) {
        console.error('❌ Failed to update payment by intent ID:', updateError);
        return;
      }

      console.log('✅ Updated payment via payment_intent_id');
      await updateUserCredits(userId, plan.credits);
      return;
    }
    
    console.error('❌ Could not find payment transaction by session_id OR payment_intent_id');
    console.error('🚨 This should never happen - investigate checkout flow!');
    return;

  } catch (error: any) {
    console.error('❌ Error processing payment:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('💰 Processing payment intent succeeded:', paymentIntent.id);

  try {
    // Find the payment transaction by payment intent ID or session ID
    let { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    // If not found by payment intent ID, try to find by session ID from metadata
    if (transactionError || !transaction) {
      const sessionId = paymentIntent.metadata?.session_id;
      if (sessionId) {
        const { data: sessionTransaction, error: sessionError } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .single();

        if (!sessionError && sessionTransaction) {
          transaction = sessionTransaction;
          // Update the transaction with the payment intent ID
          await supabase
            .from('payment_transactions')
            .update({ stripe_payment_intent_id: paymentIntent.id })
            .eq('id', transaction.id);
        }
      }
    }

    if (!transaction) {
      console.error('❌ No transaction found for payment intent:', paymentIntent.id);
      return;
    }

    if (transaction.status === 'completed') {
      console.log('⚠️ Payment already processed for intent:', paymentIntent.id);
      return;
    }

    // Update payment status to completed
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({ 
        status: 'completed',
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('❌ Failed to update payment status:', updateError);
      return;
    }

    console.log('✅ Payment status updated to completed for intent:', paymentIntent.id);

  } catch (error: any) {
    console.error('❌ Error processing payment intent:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Processing payment intent failed:', paymentIntent.id);

  try {
    // Update payment transaction status to failed
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({ 
        status: 'failed',
        stripe_payment_intent_id: paymentIntent.id
      })
      .or(`stripe_payment_intent_id.eq.${paymentIntent.id},stripe_session_id.eq.${paymentIntent.metadata?.session_id || 'null'}`);

    if (updateError) {
      console.error('❌ Failed to update payment transaction status to failed:', updateError);
    } else {
      console.log('✅ Payment transaction marked as failed for payment intent:', paymentIntent.id);
    }

  } catch (error: any) {
    console.error('❌ Error processing payment intent failure:', error);
    throw error;
  }
}

async function updateUserCredits(userId: string, creditsToAdd: number) {
  console.log('💳 Updating user credits:', { userId, creditsToAdd });

  try {
    // Use the database function to add credits to user account
    const { data, error } = await supabase.rpc('add_credits_to_user', {
      p_user_id: userId,
      p_credits_to_add: creditsToAdd,
      p_payment_amount: 1 // Indicates this is from a payment
    });

    if (error) {
      console.error('❌ Failed to add credits to user:', error);
      throw error;
    }

    console.log('✅ User credits updated successfully via database function:', {
      userId,
      creditsAdded: creditsToAdd
    });

    // Verify the update by fetching current credits
    const { data: updatedCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('total_credits, remaining_credits, used_credits')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.warn('⚠️ Could not verify credit update:', fetchError);
    } else {
      console.log('✅ Credit update verified:', {
        total: updatedCredits.total_credits,
        remaining: updatedCredits.remaining_credits,
        used: updatedCredits.used_credits
      });
    }

  } catch (error) {
    console.error('❌ Error in updateUserCredits:', error);
    throw error;
  }
}
