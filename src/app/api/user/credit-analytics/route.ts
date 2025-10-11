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

    // Get detailed analytics for the user
    const { data: analytics, error } = await supabaseAdmin
      .from('credit_usage_history')
      .select(`
        model_version,
        credits_used,
        feature,
        generation_type,
        created_at,
        result_success
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching credit analytics:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Calculate comprehensive statistics
    const stats = {
      total_generations: analytics?.length || 0,
      by_model: {} as Record<string, {
        generations: number;
        total_credits: number;
        success_rate: number;
        avg_credits: number;
      }>,
      by_date: {} as Record<string, {
        generations: number;
        credits_used: number;
      }>,
      recent_activity: analytics?.slice(0, 20) || [],
    };

    // Process model-specific stats
    analytics?.forEach((usage) => {
      const model = usage.model_version;
      if (!stats.by_model[model]) {
        stats.by_model[model] = {
          generations: 0,
          total_credits: 0,
          success_rate: 0,
          avg_credits: 0,
        };
      }

      stats.by_model[model].generations++;
      stats.by_model[model].total_credits += usage.credits_used;
      
      // Calculate success rate
      const modelUsages = analytics.filter(u => u.model_version === model);
      const successCount = modelUsages.filter(u => u.result_success).length;
      stats.by_model[model].success_rate = modelUsages.length > 0 
        ? (successCount / modelUsages.length) * 100 
        : 0;
      
      // Calculate average credits
      stats.by_model[model].avg_credits = stats.by_model[model].total_credits / stats.by_model[model].generations;

      // Process daily stats
      const date = new Date(usage.created_at).toISOString().split('T')[0];
      if (!stats.by_date[date]) {
        stats.by_date[date] = { generations: 0, credits_used: 0 };
      }
      stats.by_date[date].generations++;
      stats.by_date[date].credits_used += usage.credits_used;
    });

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error in credit analytics API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}