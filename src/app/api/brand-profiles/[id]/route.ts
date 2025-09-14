// API routes for individual brand profile management
import { NextRequest, NextResponse } from 'next/server';
import { brandProfileMongoService } from '@/lib/mongodb/services/brand-profile-service';
import { verifyToken } from '@/lib/auth/jwt';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for logo uploads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to upload logo data URL to Supabase Storage
async function uploadLogoToSupabase(logoDataUrl: string, userId: string, brandName: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('📤 Uploading brand logo to Supabase Storage for:', brandName);

    // Convert data URL to buffer
    const base64Data = logoDataUrl.split(',')[1];
    if (!base64Data) {
      return { success: false, error: 'Invalid logo data URL format' };
    }
    
    const buffer = Buffer.from(base64Data, 'base64');
    console.log(`📦 Logo buffer size: ${buffer.length} bytes`);

    // Create upload path for logo
    const timestamp = Date.now();
    const safeBrandName = brandName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const uploadPath = `brands/${userId}/logos/${safeBrandName}-${timestamp}.png`;
    console.log(`🎯 Logo upload path: ${uploadPath}`);
    
    const { data, error } = await supabase.storage
      .from('nevis-storage')
      .upload(uploadPath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('❌ Logo upload error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Logo upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('nevis-storage')
      .getPublicUrl(uploadPath);

    console.log('✅ Brand logo uploaded to Supabase Storage:', publicUrl);
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const profileId = params.id;

    const profile = await brandProfileMongoService.loadBrandProfile(profileId);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if the profile belongs to the authenticated user
    if (profile.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(profile);
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { id: profileId } = await params;
    const updates = await request.json();
    
    console.log('📋 Processing brand profile update:', {
      profileId,
      businessName: updates.businessName,
      hasLogoDataUrl: !!updates.logoDataUrl,
      logoDataLength: updates.logoDataUrl?.length || 0
    });

    // Verify the profile belongs to the authenticated user
    const existingProfile = await brandProfileMongoService.loadBrandProfile(profileId);
    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (existingProfile.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Process logo upload if logoDataUrl is provided in updates
    let processedUpdates = { ...updates };
    
    if (updates.logoDataUrl && updates.logoDataUrl.startsWith('data:')) {
      console.log('📤 Processing logo upload for brand update:', updates.businessName || existingProfile.businessName);
      
      const logoResult = await uploadLogoToSupabase(
        updates.logoDataUrl,
        decoded.userId,
        updates.businessName || existingProfile.businessName || 'brand'
      );
      
      if (logoResult.success && logoResult.url) {
        // Replace logoDataUrl with the Supabase storage URL
        processedUpdates.logoUrl = logoResult.url;
        // Remove the large base64 data to save database space
        delete processedUpdates.logoDataUrl;
        console.log('✅ Logo uploaded successfully in update, using storage URL:', logoResult.url);
      } else {
        console.error('❌ Logo upload failed in update:', logoResult.error);
        // Keep the logoDataUrl as fallback, but warn about it
        console.warn('⚠️  Using logoDataUrl as fallback in update - this may cause performance issues');
      }
    }

    console.log('💾 Updating brand profile in MongoDB:', {
      profileId,
      hasLogoUrl: !!processedUpdates.logoUrl,
      hasLogoDataUrl: !!processedUpdates.logoDataUrl
    });

    await brandProfileMongoService.updateBrandProfile(profileId, processedUpdates);
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { id: profileId } = await params;

    // Verify the profile belongs to the authenticated user
    const existingProfile = await brandProfileMongoService.loadBrandProfile(profileId);
    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (existingProfile.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await brandProfileMongoService.deleteBrandProfile(profileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete brand profile' },
      { status: 500 }
    );
  }
}
