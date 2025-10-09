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

    const userId = user.id;

    // Create service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user credits from database
    const { data: userCredits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (creditsError && creditsError.code !== 'PGRST116') {
      console.error('Error fetching user credits:', creditsError);
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }

    // If no credits record exists, create default
    if (!userCredits) {
      const { data: newCredits, error: createError } = await supabaseAdmin
        .from('user_credits')
        .insert([{
          user_id: userId,
          total_credits: 0,
          remaining_credits: 0,
          used_credits: 0
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user credits:', createError);
        return NextResponse.json({ error: 'Failed to initialize credits' }, { status: 500 });
      }

      return NextResponse.json(newCredits);
    }

    return NextResponse.json(userCredits);

  } catch (error) {
    console.error('Error in credits API:', error);
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
    const { creditsToAdd } = body;

    if (!creditsToAdd) {
      return NextResponse.json({ error: 'Credits to add required' }, { status: 400 });
    }

    // Create service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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