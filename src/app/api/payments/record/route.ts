import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabase } from '@/lib/supabase/client'
import { getPlanById } from '@/lib/pricing-data'

interface Body {
  idToken?: string
  sessionId: string
  planId: string
  amount: number
  currency: string
  paymentMethod?: string
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json()
    const { idToken, sessionId, planId, amount, currency, paymentMethod } = body

    if (!idToken) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (!sessionId || !planId || !amount || !currency) return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 })

    // Verify user
    const decoded = verifyToken(idToken)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const userId = decoded.userId

    const plan = getPlanById(planId)
    const creditsToAdd = plan ? plan.credits : 0

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    try {
      // Use the new idempotent payment processing function
      console.log('💳 Processing manual payment with idempotency protection...');
      
      const { data: paymentResult, error: paymentError } = await supabase.rpc('process_payment_with_idempotency', {
        p_stripe_session_id: sessionId,
        p_stripe_payment_intent_id: null, // Manual payments might not have this
        p_user_id: userId,
        p_plan_id: planId,
        p_amount: amount,
        p_currency: currency,
        p_credits_to_add: creditsToAdd,
        p_payment_method: paymentMethod || 'card',
        p_source: 'manual_record'
      });

      if (paymentError) {
        console.error('❌ Payment processing failed:', paymentError);
        return NextResponse.json({
          error: 'Failed to process payment',
          details: paymentError.message
        }, { status: 500 })
      }

      const result = paymentResult[0];

      if (result.was_duplicate) {
        console.log('⚠️ Duplicate payment detected:', {
          session_id: sessionId,
          payment_id: result.payment_id,
          message: 'Payment was already recorded'
        });
        
        return NextResponse.json({
          success: true,
          message: 'Payment already recorded',
          paymentId: result.payment_id,
          creditsAdded: 0, // No credits added since it was duplicate
          isDuplicate: true
        })
      }

      console.log('✅ Payment recorded successfully:', {
        userId,
        planId,
        creditsAdded: result.credits_added,
        newTotal: result.new_total_credits,
        newRemaining: result.new_remaining_credits
      })

      return NextResponse.json({
        success: true,
        message: 'Payment recorded and credits added successfully',
        paymentId: result.payment_id,
        creditsAdded: result.credits_added,
        newTotal: result.new_total_credits,
        newRemaining: result.new_remaining_credits,
        isDuplicate: false
      })

    } catch (e: any) {
      console.error('❌ Payment recording error:', e)
      return NextResponse.json({
        error: 'Failed to record payment',
        details: e.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Payment recording error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
