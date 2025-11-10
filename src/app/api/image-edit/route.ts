/**
 * API endpoint for text-based image editing
 * POST /api/image-edit
 */

import { NextRequest, NextResponse } from 'next/server';
import { TextBasedImageEditor, ImageEditRequest, ImageEditResult } from '@/ai/image-editing/text-based-editor';
import { BrandProfile } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 [ImageEdit] Received edit request:', body);

    const {
      originalImageUrl,
      command,
      brandProfile,
      platform,
      preserveStyle = true
    } = body as {
      originalImageUrl: string;
      command: string;
      brandProfile?: BrandProfile;
      platform?: string;
      preserveStyle?: boolean;
    };

    // Validate required parameters
    if (!originalImageUrl) {
      return NextResponse.json(
        { error: 'Missing required parameter: originalImageUrl' },
        { status: 400 }
      );
    }

    if (!command) {
      return NextResponse.json(
        { error: 'Missing required parameter: command' },
        { status: 400 }
      );
    }

    // Validate the edit command
    const validation = TextBasedImageEditor.validateEditCommand(command);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Validate image URL format
    if (!originalImageUrl.startsWith('data:image/') && !originalImageUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    console.log('🎨 [ImageEdit] Processing edit command:', command);
    console.log('🖼️ [ImageEdit] Original image URL length:', originalImageUrl.length);

    // Create edit request
    const editRequest: ImageEditRequest = {
      originalImageUrl,
      command,
      brandProfile,
      platform,
      preserveStyle
    };

    // Apply the edits
    const result: ImageEditResult = await TextBasedImageEditor.applyTextEdits(editRequest);

    if (!result.success) {
      console.error('❌ [ImageEdit] Edit failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          appliedEdits: result.appliedEdits,
          processingTime: result.processingTime
        },
        { status: 400 }
      );
    }

    console.log('✅ [ImageEdit] Edit successful');
    console.log('📊 [ImageEdit] Applied edits:', result.appliedEdits);
    console.log('⏱️ [ImageEdit] Processing time:', result.processingTime, 'ms');

    // Return successful result
    return NextResponse.json({
      success: true,
      editedImageUrl: result.editedImageUrl,
      appliedEdits: result.appliedEdits,
      processingTime: result.processingTime,
      explanation: result.explanation,
      originalCommand: command
    });

  } catch (error) {
    console.error('💥 [ImageEdit] Unexpected error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Image editing failed'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
