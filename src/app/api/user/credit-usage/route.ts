import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with cookies for auth
    const cookieStore = cookies();
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Create service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get credit usage history for the user
    const { data: usage, error } = await supabaseAdmin
      .from('credit_usage_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching credit usage:', error);
      return NextResponse.json({ error: 'Failed to fetch credit usage' }, { status: 500 });
    }

    // Transform the data for the frontend
    const formattedUsage = (usage || []).map(item => ({
      date: item.created_at,
      credits_used: item.credits_used,
      feature: item.feature || 'Content Generation'
    }));

    return NextResponse.json(formattedUsage);

  } catch (error) {
    console.error('Error in credit usage API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with cookies for auth
    const cookieStore = cookies();
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { creditsUsed, feature, details } = body;

    if (!creditsUsed) {
      return NextResponse.json({ error: 'Credits used required' }, { status: 400 });
    }

    // Create service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Use the database function to use credits
    const { data: success, error } = await supabaseAdmin.rpc('use_credits', {
      p_user_id: user.id,
      p_credits_to_use: creditsUsed,
      p_feature: feature || 'Content Generation',
      p_details: details || {}
    });

    if (error) {
      console.error('Error using credits:', error);
      return NextResponse.json({ error: 'Failed to use credits' }, { status: 500 });
    }

    if (!success) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    return NextResponse.json({ success: true, credits_used: creditsUsed });

  } catch (error) {
    console.error('Error in credit usage API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}