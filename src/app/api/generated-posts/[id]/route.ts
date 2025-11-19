// API routes for individual generated post management - using Supabase
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper function to upload data URL to Supabase Storage
async function uploadDataUrlToSupabase(dataUrl: string, userId: string, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Convert data URL to buffer
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      return { success: false, error: 'Invalid data URL format' };
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Supabase Storage
    const uploadPath = `public/${fileName}`;

    const { data, error } = await supabase.storage
      .from('nevis-storage')
      .upload(uploadPath, buffer, {
        contentType: 'image/png',
        upsert: true,
        duplex: 'half'
      });

    if (error) {
      console.error('❌ Supabase Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('nevis-storage')
      .getPublicUrl(uploadPath);

    console.log('✅ Image uploaded to Supabase Storage:', publicUrl);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('❌ Upload error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// PUT /api/generated-posts/[id] - Update generated post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updatedPost = await request.json();

    console.log('📝 [UpdatePost] Updating post:', id);

    // Get Supabase client
    const supabase = await createClient();

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Process images - upload data URLs to Supabase Storage
    let processedPost = { ...updatedPost };

    // Upload main image if it's a data URL
    if (processedPost.imageUrl && typeof processedPost.imageUrl === 'string' && processedPost.imageUrl.startsWith('data:')) {
      console.log('📤 Uploading edited main image to Supabase Storage...');
      const imageResult = await uploadDataUrlToSupabase(
        processedPost.imageUrl,
        userId,
        `post-${id}-edited-${Date.now()}.png`
      );

      if (imageResult.success && imageResult.url) {
        processedPost.imageUrl = imageResult.url;
        console.log('✅ Main image uploaded:', imageResult.url);
      } else {
        console.error('❌ Failed to upload main image:', imageResult.error);
      }
    }

    // Upload variant images if they're data URLs
    if (Array.isArray(processedPost.variants) && processedPost.variants.length > 0) {
      const updatedVariants: any[] = [];
      for (let i = 0; i < processedPost.variants.length; i++) {
        const variant = processedPost.variants[i];
        if (variant.imageUrl && typeof variant.imageUrl === 'string' && variant.imageUrl.startsWith('data:')) {
          console.log(`📤 Uploading edited variant ${i} image to Supabase Storage...`);
          const variantResult = await uploadDataUrlToSupabase(
            variant.imageUrl,
            userId,
            `post-${id}-variant-${i}-edited-${Date.now()}.png`
          );
          if (variantResult.success && variantResult.url) {
            updatedVariants.push({ ...variant, imageUrl: variantResult.url });
            console.log(`✅ Variant ${i} image uploaded:`, variantResult.url);
          } else {
            console.error(`❌ Failed to upload variant ${i} image:`, variantResult.error);
            updatedVariants.push(variant);
          }
        } else {
          updatedVariants.push(variant);
        }
      }
      processedPost.variants = updatedVariants;
    }

    // Prepare update data for Supabase
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only update fields that are provided
    if (processedPost.imageUrl) updateData.image_url = processedPost.imageUrl;
    if (processedPost.content) updateData.content = typeof processedPost.content === 'string' ? processedPost.content : processedPost.content.text || '';
    if (processedPost.hashtags) updateData.hashtags = processedPost.hashtags;
    if (processedPost.variants) updateData.variants = processedPost.variants;
    if (processedPost.status) updateData.status = processedPost.status;
    if (processedPost.catchyWords) updateData.catchy_words = processedPost.catchyWords;
    if (processedPost.subheadline) updateData.subheadline = processedPost.subheadline;
    if (processedPost.callToAction) updateData.call_to_action = processedPost.callToAction;

    // Update in Supabase
    const { data, error } = await supabase
      .from('generated_posts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Ensure user owns this post
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      return NextResponse.json(
        { error: `Failed to update post: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Post updated successfully in database');

    return NextResponse.json({
      success: true,
      post: data
    });

  } catch (error) {
    console.error('❌ Error updating generated post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/generated-posts/[id] - Delete generated post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // This endpoint is disabled - using Supabase instead
    return NextResponse.json(
      { error: 'This endpoint is disabled - using Supabase storage instead' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error deleting generated post:', error);
    return NextResponse.json(
      { error: 'Endpoint disabled - using Supabase storage' },
      { status: 503 }
    );
  }
}
