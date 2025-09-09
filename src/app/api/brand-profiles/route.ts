// API routes for brand profile management (Supabase)
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/supabase-jwt';
import { supabase } from '@/lib/supabase/config';
import { createClient } from '@supabase/supabase-js';

// Create admin client for user creation (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to upload data URL to Supabase Storage
async function uploadLogoToSupabase(dataUrl: string, userId: string, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Convert data URL to buffer
    const base64Data = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Supabase Storage
    const filePath = `brand-logos/${userId}/${fileName}`;
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('❌ Supabase Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log('✅ Logo uploaded to Supabase Storage:', publicUrl);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('❌ Logo upload error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

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

    // Load brands from Supabase using admin client to bypass RLS
    const { data: profiles, error } = await supabaseAdmin
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

    // Transform snake_case to camelCase for UI compatibility
    const transformedProfiles = profiles?.map(profile => ({
      ...profile,
      businessName: profile.business_name,
      businessType: profile.business_type,
      logoDataUrl: profile.logo_url,
      primaryColor: profile.primary_color,
      secondaryColor: profile.secondary_color,
      targetAudience: profile.target_audience,
      brandVoice: profile.brand_voice,
      socialMedia: profile.social_media,
      services: [], // Initialize empty services array since it's not stored in Supabase yet
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    })) || [];

    return NextResponse.json(transformedProfiles);
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

    // Process logo upload to Supabase Storage if it's a data URL
    let logoUrl = profile.logoUrl || profile.logoDataUrl;
    if (logoUrl && logoUrl.startsWith('data:')) {
      console.log('📤 Uploading brand logo to Supabase Storage...');
      const logoResult = await uploadLogoToSupabase(
        logoUrl,
        user.userId,
        `brand-${Date.now()}.png`
      );

      if (logoResult.success && logoResult.url) {
        logoUrl = logoResult.url;
        console.log('✅ Brand logo uploaded to Supabase Storage');
      } else {
        console.error('❌ Failed to upload brand logo:', logoResult.error);
        // Continue with original data URL as fallback
      }
    }

    // First, ensure user exists in public.users table
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.userId)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist in public.users, create them using admin client
      console.log('👤 Creating user profile in public.users table');
      console.log('👤 User data:', { id: user.userId, email: user.email });

      const { data: newUser, error: userCreateError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.userId,
          email: user.email,
          full_name: user.displayName || null,
          avatar_url: user.photoURL || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userCreateError) {
        console.error('❌ Failed to create user profile:', userCreateError);
        console.error('❌ Error details:', {
          code: userCreateError.code,
          message: userCreateError.message,
          details: userCreateError.details,
          hint: userCreateError.hint
        });
        return NextResponse.json(
          { error: `Failed to create user profile: ${userCreateError.message}` },
          { status: 500 }
        );
      }

      console.log('✅ User profile created successfully:', newUser.id);
    } else if (userCheckError) {
      console.error('❌ Error checking user existence:', userCheckError);
      return NextResponse.json(
        { error: `Database error checking user: ${userCheckError.message}` },
        { status: 500 }
      );
    } else {
      console.log('✅ User already exists in database:', existingUser.id);
    }

    // Create brand profile in Supabase (matching the schema) using admin client to bypass RLS
    const { data: newProfile, error } = await supabaseAdmin
      .from('brands')
      .insert({
        user_id: user.userId,
        business_name: profile.businessName || profile.name,
        business_type: profile.businessType || 'Other',
        description: profile.description,
        location: profile.location,
        target_audience: profile.targetAudience,
        brand_voice: profile.brandVoice,
        logo_url: logoUrl,
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

    // Transform snake_case to camelCase for UI compatibility
    const transformedProfile = {
      ...newProfile,
      businessName: newProfile.business_name,
      businessType: newProfile.business_type,
      logoDataUrl: newProfile.logo_url,
      primaryColor: newProfile.primary_color,
      secondaryColor: newProfile.secondary_color,
      targetAudience: newProfile.target_audience,
      brandVoice: newProfile.brand_voice,
      socialMedia: newProfile.social_media,
      services: [], // Initialize empty services array since it's not stored in Supabase yet
      createdAt: newProfile.created_at,
      updatedAt: newProfile.updated_at
    };

    return NextResponse.json({
      id: newProfile.id,
      profile: transformedProfile
    });
  } catch (error) {
    console.error('❌ Error creating brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to create brand profile' },
      { status: 500 }
    );
  }
}
