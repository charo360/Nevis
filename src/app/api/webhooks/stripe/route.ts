import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPlanById } from '@/lib/secure-pricing';
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
    const { data: existingPayment, error: existingError } = await supabase
      .from('payment_transactions')
      .select('id, status, credits_added')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

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

    // If no existing payment found, create new one
    console.log('💳 Creating new payment transaction for session:', session.id);

    // First update user credits
    await updateUserCredits(userId, plan.credits);

    // Then create the payment transaction record
    const { data: newPayment, error: createError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount: (session.amount_total || 0) / 100, // Convert from cents
        status: 'completed', // Mark as completed immediately
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        credits_added: plan.credits,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create payment transaction:', createError);
      return;
    }

    console.log('✅ Payment transaction created successfully:', newPayment)

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

  // Get current user credits
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('total_credits, remaining_credits')
    .eq('user_id', userId)
    .single();

  if (userError || !user) {
    console.error('❌ User not found for credit update:', userId, userError);
    throw new Error(`User not found: ${userId}`);
  }

  const currentTotal = user.total_credits || 0;
  const currentRemaining = user.remaining_credits || 0;

  const newTotal = currentTotal + creditsToAdd;
  const newRemaining = currentRemaining + creditsToAdd;

  // Update user credits
  const { error: updateError } = await supabase
    .from('users')
    .update({
      total_credits: newTotal,
      remaining_credits: newRemaining,
      last_payment_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('❌ Failed to update user credits:', updateError);
    throw updateError;
  }

  console.log('✅ User credits updated successfully:', {
    userId,
    creditsAdded: creditsToAdd,
    newTotal,
    newRemaining
  });
}
