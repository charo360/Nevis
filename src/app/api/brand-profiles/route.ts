// API routes for brand profile management
import { NextRequest, NextResponse } from 'next/server';
import { brandProfileSupabaseService } from '@/lib/supabase/services/brand-profile-service';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase clients
// Use service-role client for storage/DB operations
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// Use anon client for verifying user JWTs
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
    // Verify the token using Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
    if (error || !user) {
      return { error: 'Invalid or expired token', status: 401 };
    }
    
    return { user, userId: user.id };
  } catch (error) {
    return { error: 'Token verification failed', status: 401 };
  }
}

// Helper function to upload logo data URL to Supabase Storage
async function uploadLogoToSupabase(logoDataUrl: string, userId: string, brandName: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {

    // Convert data URL to buffer
    const base64Data = logoDataUrl.split(',')[1];
    if (!base64Data) {
      return { success: false, error: 'Invalid logo data URL format' };
    }
    
    const buffer = Buffer.from(base64Data, 'base64');

    // Create upload path for logo
    const timestamp = Date.now();
    const safeBrandName = brandName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const uploadPath = `brands/${userId}/logos/${safeBrandName}-${timestamp}.png`;
    
    const { data, error } = await supabaseService.storage
      .from('nevis-storage')
      .upload(uploadPath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('❌ Logo upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseService.storage
      .from('nevis-storage')
      .getPublicUrl(uploadPath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('❌ Logo upload error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// GET /api/brand-profiles - Load user's brand profiles
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifySupabaseAuth(request.headers.get('authorization'));
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const profiles = await brandProfileSupabaseService.loadBrandProfiles(authResult.userId!);
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error loading brand profiles:', error);
    return NextResponse.json(
      { error: 'Failed to load brand profiles' },
      { status: 500 }
    );
  }
}

// POST /api/brand-profiles - Create new brand profile
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifySupabaseAuth(request.headers.get('authorization'));
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const profile = await request.json();

    // Process logo upload if logoDataUrl is provided
    let processedProfile = { ...profile };
    if (profile.logoDataUrl && profile.logoDataUrl.startsWith('data:')) {
      const logoResult = await uploadLogoToSupabase(
        profile.logoDataUrl,
        authResult.userId!,
        profile.businessName || 'brand'
      );
      if (logoResult.success && logoResult.url) {
        processedProfile.logoUrl = logoResult.url;
        delete processedProfile.logoDataUrl;
      } else {
        console.error('❌ Logo upload failed:', logoResult.error);
        console.warn('⚠️  Using logoDataUrl as fallback - this may cause performance issues');
      }
    }

    // Use authenticated user ID instead of trusting the request body
    const profileWithUserId = {
      ...processedProfile,
      userId: authResult.userId!,
    };

    try {
      const profileId = await brandProfileSupabaseService.saveBrandProfile(profileWithUserId);
      return NextResponse.json({ id: profileId });
    } catch (saveError) {
      console.error('Error saving brand profile (inner):', saveError);
      return NextResponse.json(
        { error: saveError instanceof Error ? saveError.message : String(saveError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving brand profile (outer):', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
