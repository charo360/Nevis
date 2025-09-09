// API routes for individual brand profile management
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/supabase-jwt';
import { createClient } from '@supabase/supabase-js';

// Create admin client for database operations (bypasses RLS)
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

// GET /api/brand-profiles/[id] - Get brand profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getAuthenticatedUser(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const profileId = params.id;

    // Load brand from Supabase using admin client
    const { data: profile, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.userId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Transform snake_case to camelCase for UI compatibility
    const transformedProfile = {
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
    };

    return NextResponse.json(transformedProfile);
  } catch (error) {
    console.error('Error getting brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to get brand profile' },
      { status: 500 }
    );
  }
}

// PUT /api/brand-profiles/[id] - Update brand profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getAuthenticatedUser(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { id: profileId } = await params;
    const updates = await request.json();

    console.log('🔄 Updating brand profile:', profileId, 'for user:', user.userId);

    // Process logo upload to Supabase Storage if it's a data URL
    if (updates.logoDataUrl && updates.logoDataUrl.startsWith('data:')) {
      console.log('📤 Uploading updated brand logo to Supabase Storage...');
      const logoResult = await uploadLogoToSupabase(
        updates.logoDataUrl,
        user.userId,
        `brand-${profileId}-${Date.now()}.png`
      );

      if (logoResult.success && logoResult.url) {
        updates.logoDataUrl = logoResult.url;
        console.log('✅ Updated brand logo uploaded to Supabase Storage');
      } else {
        console.error('❌ Failed to upload updated brand logo:', logoResult.error);
        // Continue with original data URL as fallback
      }
    }

    // Verify the profile exists and belongs to the authenticated user
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.userId)
      .single();

    if (fetchError || !existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Transform camelCase to snake_case for database storage
    const dbUpdates: any = {};
    if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
    if (updates.businessType !== undefined) dbUpdates.business_type = updates.businessType;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.targetAudience !== undefined) dbUpdates.target_audience = updates.targetAudience;
    if (updates.brandVoice !== undefined) dbUpdates.brand_voice = updates.brandVoice;
    if (updates.logoDataUrl !== undefined) dbUpdates.logo_url = updates.logoDataUrl;
    if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor;
    if (updates.secondaryColor !== undefined) dbUpdates.secondary_color = updates.secondaryColor;
    if (updates.website !== undefined) dbUpdates.website = updates.website;
    if (updates.socialMedia !== undefined) dbUpdates.social_media = updates.socialMedia;

    // Update the profile in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('brands')
      .update(dbUpdates)
      .eq('id', profileId)
      .eq('user_id', user.userId);

    if (updateError) {
      console.error('❌ Supabase error updating brand:', updateError);
      return NextResponse.json(
        { error: 'Failed to update brand profile' },
        { status: 500 }
      );
    }

    console.log('✅ Brand profile updated successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to update brand profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/brand-profiles/[id] - Delete brand profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getAuthenticatedUser(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { id: profileId } = await params;

    console.log('🔄 Deleting brand profile:', profileId, 'for user:', user.userId);

    // Verify the profile exists and belongs to the authenticated user
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.userId)
      .single();

    if (fetchError || !existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Delete the profile from Supabase
    const { error: deleteError } = await supabaseAdmin
      .from('brands')
      .delete()
      .eq('id', profileId)
      .eq('user_id', user.userId);

    if (deleteError) {
      console.error('❌ Supabase error deleting brand:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete brand profile' },
        { status: 500 }
      );
    }

    console.log('✅ Brand profile deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete brand profile' },
      { status: 500 }
    );
  }
}
