import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreditService } from '@/lib/credits/credit-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify using Supabase admin
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.id;

    // 1. Create user_credits record with 10 free credits (idempotent)
    try {
      const { data: existingCredits } = await supabase
        .from('user_credits')
        .select('user_id, total_credits')
        .eq('user_id', userId)
        .single();

      if (!existingCredits) {
        // User has no credits record - grant 10 free credits
        const { data: newCredits, error: credError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            total_credits: 10,
            remaining_credits: 10,
            used_credits: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (credError) {
          console.error('❌ Error creating user credits:', credError);
        } else {

          // Record free trial transaction (optional, non-blocking)
          try {
            await supabase.from('payment_transactions').insert({
              user_id: userId,
              plan_id: 'try_agent_free',
              amount: 0.00,
              status: 'completed',
              credits_added: 10,
              stripe_session_id: `free_trial_${userId}`,
              created_at: new Date().toISOString(),
            });
          } catch (txErr) {
            console.warn('⚠️ Could not record free trial transaction (non-critical)');
          }
        }
      } else {
      }
    } catch (e) {
      console.error('❌ Error in credit initialization:', e);
    }

    // 2. Set default plan to try-free in users table (if table exists)
    try {
      await supabase.from('users').upsert({ 
        user_id: userId,
        email: user.email,
        subscription_plan: 'try-free', 
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id'
      });
    } catch (e) {
      console.warn('⚠️ Could not set subscription_plan (users table may not exist):', e.message);
    }

    return NextResponse.json({ ok: true, userId, creditsGranted: true });
  } catch (err: any) {
    console.error('Initialization failed', err);
    return NextResponse.json({ error: 'Initialization failed' }, { status: 500 });
  }
}
