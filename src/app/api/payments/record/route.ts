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

    // Check for existing payment (idempotency)
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single()

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: 'Payment already recorded',
        paymentId: existingPayment.id
      })
    }

    const plan = getPlanById(planId)
    const creditsToAdd = plan ? plan.credits : 0

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    try {
      // Get current user credits
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('total_credits, used_credits, remaining_credits')
        .eq('user_id', userId)
        .single()

      if (userError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const currentTotal = user.total_credits || 0
      const currentUsed = user.used_credits || 0
      const currentRemaining = user.remaining_credits || 0

      const newTotal = currentTotal + creditsToAdd
      const newRemaining = currentRemaining + creditsToAdd

      // Process payment transaction atomically
      const { error: transactionError } = await supabase.rpc('process_payment_transaction', {
        p_user_id: userId,
        p_stripe_session_id: sessionId,
        p_plan_id: planId,
        p_amount: amount,
        p_currency: currency,
        p_credits_added: creditsToAdd,
        p_payment_method: paymentMethod || 'card',
        p_new_total_credits: newTotal,
        p_new_remaining_credits: newRemaining,
        p_balance_before: currentRemaining
      })

      if (transactionError) {
        console.error('❌ Payment transaction failed:', transactionError)
        return NextResponse.json({
          error: 'Failed to process payment',
          details: transactionError.message
        }, { status: 500 })
      }

      console.log('✅ Payment recorded successfully:', {
        userId,
        planId,
        creditsAdded,
        newTotal,
        newRemaining
      })

    } catch (e: any) {
      console.error('❌ Payment recording error:', e)
      return NextResponse.json({
        error: 'Failed to record payment',
        details: e.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded and credits added successfully',
      creditsAdded,
      newTotal,
      newRemaining
    })

  } catch (error: any) {
    console.error('❌ Payment recording error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
