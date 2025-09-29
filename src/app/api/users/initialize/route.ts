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

    // Ensure subscription_plan is free
    try {
      await supabase.from('users').update({ subscription_plan: 'free', subscription_status: 'active' }).eq('user_id', userId);
    } catch (e) {
      console.warn('Failed to set subscription_plan to free', e);
    }

    // Initialize free credits (server-side)
    try {
      await CreditService.initializeFreeCredits(userId);
    } catch (e) {
      console.warn('Failed to initialize free credits for user', userId, e);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Initialization failed', err);
    return NextResponse.json({ error: 'Initialization failed' }, { status: 500 });
  }
}
