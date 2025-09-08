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

    // Create brand profile in Supabase
    const { data: newProfile, error } = await supabase
      .from('brands')
      .insert({
        user_id: user.userId,
        business_name: profile.businessName || profile.name,
        business_type: profile.businessType,
        description: profile.description,
        location: profile.location,
        target_audience: profile.targetAudience,
        brand_colors: profile.brandColors,
        logo_url: profile.logoUrl,
        website: profile.website,
        social_media: profile.socialMedia,
        is_active: profile.isActive !== false, // Default to true
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating brand:', error);
      return NextResponse.json(
        { error: 'Failed to create brand profile' },
        { status: 500 }
      );
    }

    console.log('✅ Brand profile created:', newProfile.id);
    return NextResponse.json(newProfile);
  } catch (error) {
    console.error('❌ Error creating brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to create brand profile' },
      { status: 500 }
    );
  }
}
