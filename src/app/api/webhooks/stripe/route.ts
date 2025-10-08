import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPlanById } from '@/lib/pricing-data';
import { SubscriptionService } from '@/lib/subscription/subscription-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// GET handler for webhook health check
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    status: 'active',
    message: 'Stripe webhook endpoint is operational',
    timestamp: new Date().toISOString(),
    webhook_configured: !!webhookSecret
  });
}

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
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
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('🎯 Received Stripe webhook:', event.type);
  console.log('📋 Event data preview:', {
    id: event.id,
    type: event.type,
    object_id: event.data.object.id,
    created: event.created
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        console.log('💰 Payment succeeded:', event.data.object.id);
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        console.error('❌ Payment failed:', event.data.object);
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
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

  const { client_reference_id: userId, metadata } = session;

  if (!userId || !metadata?.planId) {
    console.error('❌ Missing userId or planId in session metadata');
    return;
  }

  const planId = metadata.planId;
  const plan = getPlanById(planId);

  if (!plan) {
    console.error('❌ Invalid plan ID:', planId);
    return;
  }

  try {
    // Check if payment already processed (idempotency)
    const { data: existingPayment } = await supabase
      .from('payment_transactions')
      .select('id, status')
      .eq('stripe_session_id', session.id)
      .single();

    if (existingPayment && existingPayment.status === 'completed') {
      console.log('⚠️ Payment already processed:', session.id);
      return;
    }

    // Get current user credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_credits, used_credits, remaining_credits')
      .eq('user_id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userId, userError);
      return;
    }

    const currentTotal = user.total_credits || 0;
    const currentUsed = user.used_credits || 0;
    const currentRemaining = user.remaining_credits || 0;

    const newTotal = currentTotal + plan.credits;
    const newRemaining = currentRemaining + plan.credits;

    // Start transaction
    const { error: transactionError } = await supabase.rpc('process_payment_transaction', {
      p_user_id: userId,
      p_stripe_session_id: session.id,
      p_plan_id: planId,
      p_amount: (session.amount_total || 0) / 100, // Convert from cents
      p_currency: session.currency || 'usd',
      p_credits_added: plan.credits,
      p_payment_method: session.payment_method_types?.[0] || 'card',
      p_new_total_credits: newTotal,
      p_new_remaining_credits: newRemaining,
      p_balance_before: currentRemaining
    });

    if (transactionError) {
      console.error('❌ Transaction failed:', transactionError);
      return;
    }

    console.log('✅ Payment processed successfully:', {
      userId,
      planId,
      creditsAdded: plan.credits,
      newTotal,
      newRemaining
    });

    // Also update the payment_transactions row (created when the checkout session was started)
    try {
      await supabase
        .from('payment_transactions')
        .update({ status: 'completed', credits_added: plan.credits })
        .eq('stripe_session_id', session.id);
      console.log('✅ payment_transactions updated for session:', session.id);
    } catch (updateErr) {
      console.warn('⚠️ Failed to update payment_transactions for session:', session.id, updateErr);
    }

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
