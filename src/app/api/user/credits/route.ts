import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Authenticate user: prefer Authorization header (Bearer JWT), fallback to cookie-based (legacy)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let userId: string | null = null;

    if (bearerToken) {
      const adminForAuth = createAdminClient(supabaseUrl, supabaseServiceKey);
      const { data: userData, error: tokenErr } = await adminForAuth.auth.getUser(bearerToken);
      if (tokenErr || !userData?.user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      userId = userData.user.id;
    } else {
      // Legacy fallback: attempt cookie-based client, but this may not have user context with current server client
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      userId = user.id;
    }

    // Create service role client for database operations
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);
    
    // Get user credits from database with real-time data
    const { data: userCredits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', userId!)
      .single();

    if (creditsError && creditsError.code !== 'PGRST116') {
      console.error('Error fetching user credits:', creditsError);
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }

    // If no credits record exists, initialize with free trial credits (idempotent)
    if (!userCredits) {
      
      try {
        // Create user credits record with 10 free credits
        const { data: newCredits, error: createError } = await supabaseAdmin
          .from('user_credits')
          .insert({
            user_id: userId,
            total_credits: 10,
            remaining_credits: 10,
            used_credits: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .onConflict('user_id')
          .ignore()
          .select()
          .single();

        if (createError) {
          console.error('Error creating user credits:', createError);
          return NextResponse.json({ error: 'Failed to initialize credits' }, { status: 500 });
        }

        // Also create a payment transaction record for the free credits (if payment_transactions table exists)
        try {
          await supabaseAdmin
            .from('payment_transactions')
            .insert({
              user_id: userId,
              plan_id: 'try_agent_free',
              amount: 0.00,
              status: 'completed',
              credits_added: 10,
              stripe_session_id: `free_trial_${userId}`,
              created_at: new Date().toISOString(),
            })
            .onConflict('stripe_session_id')
            .ignore();
        } catch (txError) {
          // Non-critical: payment_transactions may not have updated_at column or may not exist
          console.warn('⚠️ Could not create payment transaction record (non-critical):', txError);
        }

        return NextResponse.json({
          total_credits: 10,
          remaining_credits: 10,
          used_credits: 0,
          last_payment_at: new Date().toISOString(),
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      } catch (error) {
        console.error('Error during credit initialization:', error);
        return NextResponse.json({ error: 'Failed to initialize credits' }, { status: 500 });
      }
    }

    // Return existing credits
    return NextResponse.json({
      total_credits: userCredits.total_credits || 0,
      remaining_credits: userCredits.remaining_credits || 0,
      used_credits: userCredits.used_credits || 0,
      last_payment_at: userCredits.last_payment_at,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Error in credits API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Create server-side Supabase client with cookie handling
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { creditsToAdd } = body;

    if (!creditsToAdd) {
      return NextResponse.json({ error: 'Credits to add required' }, { status: 400 });
    }

    // Create service role client for database operations
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

    // Use the database function to add credits
    const { error } = await supabaseAdmin.rpc('add_credits_to_user', {
      p_user_id: user.id,
      p_credits_to_add: creditsToAdd
    });

    if (error) {
      console.error('Error updating user credits:', error);
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
    }

    // Return updated credits
    const { data: updatedCredits, error: fetchError } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated credits:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch updated credits' }, { status: 500 });
    }

    return NextResponse.json(updatedCredits);

  } catch (error) {
    console.error('Error in credits API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}