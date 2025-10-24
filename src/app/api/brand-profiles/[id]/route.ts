// API route for fetching a single brand profile
import { NextRequest, NextResponse } from 'next/server';
import { brandProfileSupabaseService } from '@/lib/supabase/services/brand-profile-service';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase clients
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to verify Supabase auth token and get user
async function verifySupabaseAuth(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization token required', status: 401 };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    return { user, userId: user.id };
  } catch (error) {
    return { error: 'Token verification failed', status: 401 };
  }
}

// GET /api/brand-profiles/[id] - Load a single brand profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifySupabaseAuth(request.headers.get('authorization'));

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const brandId = params.id;
    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching brand profile:', brandId);

    // Fetch the brand profile directly from database
    const { data: brandData, error: brandError } = await supabaseService
      .from('brand_profiles')
      .select('*')
      .eq('id', brandId)
      .eq('user_id', authResult.userId!)
      .single();

    if (brandError) {
      console.error('❌ Error fetching brand profile:', brandError);
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    if (!brandData) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ Brand profile fetched successfully:', brandData.business_name);
    console.log('✅ Website URL:', brandData.website_url);

    // Convert to CompleteBrandProfile format
    const profile = brandProfileSupabaseService.rowToProfile(brandData);

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error loading brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to load brand profile' },
      { status: 500 }
    );
  }
}

// PUT /api/brand-profiles/[id] - Update a single brand profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifySupabaseAuth(request.headers.get('authorization'));

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const brandId = params.id;
    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      );
    }

    const updates = await request.json();
    console.log('🔄 Updating brand profile:', brandId, updates);
    console.log('🔄 User ID:', authResult.userId);

    // 🎨 ENHANCED DEBUG LOGGING FOR COLOR UPDATES
    if (updates.primaryColor || updates.accentColor || updates.backgroundColor) {
      console.log('🎨 [Brand Profile Update] Color changes detected:', {
        primaryColor: updates.primaryColor,
        accentColor: updates.accentColor,
        backgroundColor: updates.backgroundColor,
        brandId: brandId,
        timestamp: new Date().toISOString()
      });
    }

    // First, check if the brand profile exists
    const { data: existingBrand, error: fetchError } = await supabaseService
      .from('brand_profiles')
      .select('*')
      .eq('id', brandId)
      .eq('user_id', authResult.userId!)
      .single();

    if (fetchError || !existingBrand) {
      console.error('❌ Brand profile not found:', fetchError);
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ Brand profile found:', existingBrand.business_name);

    // Update the brand profile using the service
    await brandProfileSupabaseService.updateBrandProfile(brandId, updates);
    console.log('✅ [Brand Profile Update] Database update completed');

    // Fetch the updated profile
    const { data: updatedBrandData, error: fetchUpdatedError } = await supabaseService
      .from('brand_profiles')
      .select('*')
      .eq('id', brandId)
      .eq('user_id', authResult.userId!)
      .single();

    if (fetchUpdatedError || !updatedBrandData) {
      console.error('❌ Failed to fetch updated profile:', fetchUpdatedError);
      return NextResponse.json(
        { error: 'Failed to fetch updated profile' },
        { status: 500 }
      );
    }

    // Convert to CompleteBrandProfile format
    const updatedProfile = brandProfileSupabaseService.rowToProfile(updatedBrandData);

    console.log('✅ Brand profile updated successfully:', updatedProfile.businessName);

    // 🎨 LOG FINAL COLOR VALUES AFTER UPDATE
    if (updates.primaryColor || updates.accentColor || updates.backgroundColor) {
      console.log('🎨 [Brand Profile Update] Final colors after update:', {
        primaryColor: updatedProfile.primaryColor,
        accentColor: updatedProfile.accentColor,
        backgroundColor: updatedProfile.backgroundColor,
        brandId: brandId,
        updateSuccessful: true
      });
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to update brand profile' },
      { status: 500 }
    );
  }
}