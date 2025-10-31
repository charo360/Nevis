import { NextRequest, NextResponse } from 'next/server';
import { generateCreativeAssetAction } from '@/app/actions';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Test endpoint for Creative Studio
 * Verifies it uses the same models and credits as Quick Content
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user using cookies (same as the action)
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized - Please log in',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      prompt,
      outputType = 'image',
      referenceAssetUrl = null,
      useBrandProfile = false,
      brandProfile = null,
      maskDataUrl = null,
      aspectRatio = '16:9',
      preferredModel = 'gemini-2.5-flash-image-preview', // Default to Revo 2.0
      designColors = null
    } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Get user's current credits before generation
    const { data: creditsBefore } = await supabase
      .from('user_credits')
      .select('remaining_credits, total_credits, used_credits')
      .eq('user_id', user.id)
      .single();

    console.log('📊 [Creative Studio Test] Credits before:', {
      userId: user.id,
      remaining: creditsBefore?.remaining_credits || 0,
      total: creditsBefore?.total_credits || 0,
      used: creditsBefore?.used_credits || 0
    });

    // Determine expected model version and cost (matching the action logic)
    let modelVersion: 'revo-1.0' | 'revo-1.5' | 'revo-2.0' = 'revo-1.5';
    if (preferredModel) {
      if (preferredModel.includes('revo-2.0')) {
        modelVersion = 'revo-2.0';
      } else if (preferredModel.includes('revo-1.0')) {
        modelVersion = 'revo-1.0';
      } else if (preferredModel.includes('revo-1.5')) {
        modelVersion = 'revo-1.5';
      } else if (preferredModel.includes('2.5') || preferredModel.includes('gemini-2.5')) {
        modelVersion = 'revo-2.0';
      }
    }
    const expectedCost = modelVersion === 'revo-2.0' ? 4 : modelVersion === 'revo-1.5' ? 3 : 2;

    console.log('🎯 [Creative Studio Test] Model mapping:', {
      preferredModel,
      modelVersion,
      expectedCost,
      feature: 'image_generation',
      generationType: 'creative_studio'
    });

    // Call the Creative Studio action
    const result = await generateCreativeAssetAction(
      prompt,
      outputType,
      referenceAssetUrl,
      useBrandProfile,
      brandProfile,
      maskDataUrl,
      aspectRatio,
      preferredModel,
      designColors
    );

    // Get user's credits after generation
    const { data: creditsAfter } = await supabase
      .from('user_credits')
      .select('remaining_credits, total_credits, used_credits')
      .eq('user_id', user.id)
      .single();

    // Calculate credits used
    const creditsUsed = (creditsBefore?.remaining_credits || 0) - (creditsAfter?.remaining_credits || 0);

    console.log('📊 [Creative Studio Test] Credits after:', {
      userId: user.id,
      remaining: creditsAfter?.remaining_credits || 0,
      total: creditsAfter?.total_credits || 0,
      used: creditsAfter?.used_credits || 0,
      creditsUsed,
      expectedCost
    });

    // Get latest credit usage record
    const { data: usageRecord } = await supabase
      .from('credit_usage_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('feature', 'image_generation')
      .eq('generation_type', 'creative_studio')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      result: {
        imageUrl: result.imageUrl,
        videoUrl: result.videoUrl,
        aiExplanation: result.aiExplanation,
        timestamp: new Date().toISOString()
      },
      credits: {
        before: {
          remaining: creditsBefore?.remaining_credits || 0,
          total: creditsBefore?.total_credits || 0,
          used: creditsBefore?.used_credits || 0
        },
        after: {
          remaining: creditsAfter?.remaining_credits || 0,
          total: creditsAfter?.total_credits || 0,
          used: creditsAfter?.used_credits || 0
        },
        used: creditsUsed,
        expectedCost,
        modelVersion
      },
      usageRecord: usageRecord ? {
        credits_used: usageRecord.credits_used,
        model_version: usageRecord.model_version,
        feature: usageRecord.feature,
        generation_type: usageRecord.generation_type,
        created_at: usageRecord.created_at
      } : null,
      metadata: {
        preferredModel,
        modelVersion,
        feature: 'image_generation',
        generationType: 'creative_studio'
      }
    });
    
  } catch (error) {
    console.error('❌ [Creative Studio Test] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
