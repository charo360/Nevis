import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client with cookie handling
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Create service role client for database operations
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

    // Get credit usage history for the user with model tracking
    const { data: usage, error } = await supabaseAdmin
      .from('credit_usage_history')
      .select(`
        id,
        user_id,
        credits_used,
        feature,
        model_version,
        generation_type,
        prompt_text,
        result_success,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching credit usage:', error);
      return NextResponse.json({ error: 'Failed to fetch credit usage' }, { status: 500 });
    }

    // Transform the data for the frontend
    const formattedUsage = (usage || []).map(item => ({
      id: item.id,
      date: item.created_at,
      credits_used: item.credits_used,
      feature: item.feature || 'Content Generation',
      model_version: item.model_version || 'revo-2.0',
      model_cost: item.model_cost || item.credits_used,
      generation_type: item.generation_type || 'design',
      user_id: item.user_id,
    }));

    return NextResponse.json(formattedUsage, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

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
    const { 
      model_version, 
      feature = 'design_generation',
      generation_type = 'image',
      details = {}
    } = body;

    if (!model_version) {
      return NextResponse.json({ error: 'Model version required' }, { status: 400 });
    }

    // Define model costs based on Revo versions
    const MODEL_COSTS = {
      'revo-1.0': 2,
      'revo-1.5': 3,
      'revo-2.0': 4,
    };

    const creditsToDeduct = MODEL_COSTS[model_version as keyof typeof MODEL_COSTS];
    if (!creditsToDeduct) {
      return NextResponse.json({ error: 'Invalid model version' }, { status: 400 });
    }

    // Create service role client for database operations
    const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

    // First, check if user has sufficient credits
    const { data: userCredits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('remaining_credits')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !userCredits) {
      return NextResponse.json({ error: 'Failed to check credit balance' }, { status: 500 });
    }

    if (userCredits.remaining_credits < creditsToDeduct) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        required: creditsToDeduct,
        available: userCredits.remaining_credits,
        model_version: model_version
      }, { status: 402 }); // Payment Required
    }

    // Use the enhanced database function to use credits with model tracking
    const { data: result, error } = await supabaseAdmin.rpc('use_credits_with_model', {
      p_user_id: user.id,
      p_credits_to_use: creditsToDeduct,
      p_feature: feature,
      p_model_version: model_version,
      p_generation_type: generation_type,
      p_prompt_text: body.prompt_text || null,
      p_result_success: body.result_success !== false
    });

    if (error) {
      console.error('Error using credits:', error);
      return NextResponse.json({ error: 'Failed to use credits' }, { status: 500 });
    }

    const usageResult = result?.[0];
    if (!usageResult?.success) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        available: usageResult?.remaining_credits || 0,
        required: creditsToDeduct,
        model_version: model_version
      }, { status: 402 });
    }

    return NextResponse.json({ 
      success: true, 
      credits_used: usageResult.credits_used,
      model_version: usageResult.model_version,
      remaining_credits: usageResult.remaining_credits,
      used_credits: usageResult.used_credits,
    });

  } catch (error) {
    console.error('Error in credit usage API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}