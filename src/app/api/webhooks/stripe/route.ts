import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPlanById } from '@/lib/secure-pricing';
import { getStripeConfig } from '@/lib/stripe-config';

// Critical: Tell Next.js to use Node.js runtime and force dynamic rendering
// This ensures the raw request body is available for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get environment-aware Stripe configuration
const stripeConfig = getStripeConfig();

// Initialize Stripe with environment-appropriate keys  
const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2024-06-20'
});

const webhookSecret = stripeConfig.webhookSecret;

// GET handler for webhook health check and diagnostics
export async function GET(req: NextRequest) {
  const secretPrefix = webhookSecret ? webhookSecret.substring(0, 12) + '...' : 'NOT_SET';
  
  return NextResponse.json({ 
    status: 'active',
    message: 'Stripe webhook endpoint is operational',
    version: '1.0.1',
    timestamp: new Date().toISOString(),
    environment: stripeConfig.environment,
    isLive: stripeConfig.isLive,
    webhook_configured: !!webhookSecret,
    webhook_secret_prefix: secretPrefix,
    secret_key_prefix: stripeConfig.secretKey.substring(0, 12) + '...',
    diagnostics: {
      NODE_ENV: process.env.NODE_ENV,
      has_STRIPE_WEBHOOK_SECRET_LIVE: !!process.env.STRIPE_WEBHOOK_SECRET_LIVE,
      has_STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      expected_env_var: stripeConfig.environment === 'production' ? 'STRIPE_WEBHOOK_SECRET_LIVE' : 'STRIPE_WEBHOOK_SECRET_TEST',
      webhook_secret_length: webhookSecret?.length || 0,
      webhook_secret_format_valid: webhookSecret?.startsWith('whsec_') || false
    }
  });
}

export async function POST(req: NextRequest) {

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

  
  // Enhanced debugging for payment events
  if (event.type.startsWith('payment_intent') || event.type.includes('session.completed')) {
    const obj = event.data.object as any;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
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
        break;

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {

  // Try to get userId from client_reference_id or metadata
  const userId = session.client_reference_id || session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId) {
    console.error('❌ Missing userId in session. client_reference_id:', session.client_reference_id, 'metadata.userId:', session.metadata?.userId);
    console.error('📋 FULL Session object for debugging:', JSON.stringify(session, null, 2));
    return;
  }

  if (!planId) {
    console.error('❌ Missing planId in session metadata:', session.metadata);
    console.error('📋 FULL Session object for debugging:', JSON.stringify(session, null, 2));
    return;
  }

  const plan = getPlanById(planId);

  if (!plan) {
    console.error('❌ Invalid plan ID:', planId);
    console.error('📋 FULL Session object for debugging:', JSON.stringify(session, null, 2));
    return;
  }

  try {
    // Use the new idempotent payment processing function

    const { data: paymentResult, error: paymentError } = await supabase.rpc('process_payment_with_idempotency', {
      p_stripe_session_id: session.id,
      p_user_id: userId,
      p_plan_id: planId,
      p_amount: (session.amount_total || 0) / 100, // Convert from cents
      p_credits_to_add: plan.credits
    });

    if (paymentError) {
      console.error('❌ Payment processing RPC error:', paymentError);
      console.error('❌ Error details:', JSON.stringify(paymentError, null, 2));
      throw new Error(`Payment processing failed: ${paymentError.message || paymentError.hint || 'Unknown error'}`);
    }

    if (!paymentResult || !Array.isArray(paymentResult) || paymentResult.length === 0) {
      console.error('❌ No payment result returned from Supabase RPC!', { paymentResult });
      throw new Error('No payment result returned from Supabase RPC');
    }

    const result = paymentResult[0];

    if (!result) {
      console.error('❌ Supabase RPC returned empty result object!', { paymentResult });
      throw new Error('Supabase RPC returned empty result object');
    }

    if (result.was_duplicate) {
    } else {
    }

    return;

  } catch (error: any) {
    console.error('❌ Error processing payment:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {

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

  } catch (error: any) {
    console.error('❌ Error processing payment intent:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {

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
    }

  } catch (error: any) {
    console.error('❌ Error processing payment intent failure:', error);
    throw error;
  }
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {

  try {
    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
    
    // Find payment transaction by charge ID or payment intent
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .or(`stripe_charge_id.eq.${chargeId},stripe_payment_intent_id.eq.${dispute.payment_intent}`)
      .single();

    if (error || !transaction) {
      console.error('❌ Transaction not found for dispute:', dispute.id);
      return;
    }

    // Mark transaction as disputed
    await supabase
      .from('payment_transactions')
      .update({ 
        status: 'disputed',
        metadata: { 
          ...transaction.metadata, 
          dispute_id: dispute.id,
          dispute_reason: dispute.reason,
          dispute_amount: dispute.amount,
          dispute_created: dispute.created
        }
      })
      .eq('id', transaction.id);

  } catch (error: any) {
    console.error('❌ Error handling dispute:', error);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {

  try {
    // Find payment transaction
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .or(`stripe_charge_id.eq.${charge.id},stripe_payment_intent_id.eq.${charge.payment_intent}`)
      .single();

    if (error || !transaction) {
      console.error('❌ Transaction not found for refund:', charge.id);
      return;
    }

    const refundAmount = charge.amount_refunded;
    const isFullRefund = charge.refunded;

    // Update transaction status
    await supabase
      .from('payment_transactions')
      .update({ 
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        metadata: { 
          ...transaction.metadata, 
          refund_amount: refundAmount,
          refund_status: isFullRefund ? 'full' : 'partial',
          refunded_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);

    // If credits were added, consider deducting them (business logic decision)
    if (isFullRefund && transaction.credits_added > 0) {
      // TODO: Implement credit reversal logic if needed
    }

  } catch (error: any) {
    console.error('❌ Error handling refund:', error);
  }
}

async function updateUserCredits(userId: string, creditsToAdd: number) {

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

    // Verify the update by fetching current credits
    const { data: updatedCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('total_credits, remaining_credits, used_credits')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.warn('⚠️ Could not verify credit update:', fetchError);
    } else {
    }

  } catch (error) {
    console.error('❌ Error in updateUserCredits:', error);
    throw error;
  }
}
