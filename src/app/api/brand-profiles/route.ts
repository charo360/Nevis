// API routes for brand profile management (Supabase)
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/supabase-jwt';
import { supabase } from '@/lib/supabase/config';

// GET /api/brand-profiles - Load user's brand profiles
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getAuthenticatedUser(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('🔄 Loading brand profiles for user:', user.userId);

    // Load brands from Supabase
    const { data: profiles, error } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error loading brands:', error);
      return NextResponse.json(
        { error: 'Failed to load brand profiles' },
        { status: 500 }
      );
    }

    console.log('✅ Loaded', profiles?.length || 0, 'brand profiles');
    return NextResponse.json(profiles || []);
  } catch (error) {
    console.error('❌ Error loading brand profiles:', error);
    return NextResponse.json(
      { error: 'Failed to load brand profiles' },
      { status: 500 }
    );
  }
}

// POST /api/brand-profiles - Create new brand profile
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getAuthenticatedUser(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const profile = await request.json();
    console.log('🔄 Creating brand profile for user:', user.userId);
    console.log('📝 Profile data received:', JSON.stringify(profile, null, 2));

    // First, ensure user exists in public.users table
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.userId)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist in public.users, create them
      console.log('👤 Creating user profile in public.users table');
      const { error: userCreateError } = await supabase
        .from('users')
        .insert({
          id: user.userId,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userCreateError) {
        console.error('❌ Failed to create user profile:', userCreateError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
    } else if (userCheckError) {
      console.error('❌ Error checking user existence:', userCheckError);
      return NextResponse.json(
        { error: 'Database error checking user' },
        { status: 500 }
      );
    }

    // Create brand profile in Supabase (matching the schema)
    const { data: newProfile, error } = await supabase
      .from('brands')
      .insert({
        user_id: user.userId,
        business_name: profile.businessName || profile.name,
        business_type: profile.businessType || 'Other',
        description: profile.description,
        location: profile.location,
        target_audience: profile.targetAudience,
        brand_voice: profile.brandVoice,
        logo_url: profile.logoUrl,
        primary_color: profile.primaryColor || profile.brandColors?.primary,
        secondary_color: profile.secondaryColor || profile.brandColors?.secondary,
        website: profile.website,
        social_media: profile.socialMedia || {}
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating brand:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: `Failed to create brand profile: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Brand profile created:', newProfile.id);
    return NextResponse.json({
      id: newProfile.id,
      profile: newProfile
    });
  } catch (error) {
    console.error('❌ Error creating brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to create brand profile' },
      { status: 500 }
    );
  }
}
