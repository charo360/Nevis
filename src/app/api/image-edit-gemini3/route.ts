/**
 * API endpoint for AI-powered image editing using Gemini 3 Pro
 * POST /api/image-edit-gemini3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiAPIClient } from '@/lib/services/gemini-api-client';

// Configure route for large payloads
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

// Note: Body size limit is configured in next.config.js
// api.bodyParser.sizeLimit = '50mb'

interface ImageAsset {
  id: string;
  url: string;
  base64: string;
  mimeType: string;
}

interface EditRequest {
  originalImage: ImageAsset;
  prompt: string;
  mask?: ImageAsset | null;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageSize?: '256' | '512' | '1K' | '2K';
}

export async function POST(request: NextRequest) {
  try {
    const body: EditRequest = await request.json();
    const { originalImage, prompt, mask, aspectRatio, imageSize } = body;

    if (!originalImage || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: originalImage and prompt' },
        { status: 400 }
      );
    }

    console.log('🎨 [Gemini 3 Pro Edit] Starting image edit:', {
      prompt: prompt.substring(0, 100),
      hasMask: !!mask,
      aspectRatio: aspectRatio || 'original',
      imageSize: imageSize || '1K'
    });

    // Build enhanced editing prompt
    const enhancedPrompt = buildEditingPrompt(prompt, !!mask);

    // Convert base64 to data URL format
    const sourceImageDataUrl = `data:${originalImage.mimeType};base64,${originalImage.base64}`;
    const maskImageDataUrl = mask ? `data:${mask.mimeType};base64,${mask.base64}` : undefined;

    // Use Gemini 3 Pro for editing
    const result = await getGeminiAPIClient().editImage(
      enhancedPrompt,
      sourceImageDataUrl,
      'gemini-3-pro-image-preview',
      {
        temperature: 0.7,
        aspectRatio,
        imageSize: imageSize || '1K',
        maskImage: maskImageDataUrl
      }
    );

    // Return edited image
    const editedImage: ImageAsset = {
      id: `edited-${Date.now()}`,
      url: `data:${result.mimeType};base64,${result.imageData}`,
      base64: result.imageData,
      mimeType: result.mimeType
    };

    console.log('✅ [Gemini 3 Pro Edit] Image edited successfully');

    return NextResponse.json({
      success: true,
      editedImage,
      model: 'gemini-3-pro-image-preview'
    });

  } catch (error) {
    console.error('❌ [Gemini 3 Pro Edit] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Image editing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function buildEditingPrompt(userPrompt: string, hasMask: boolean): string {
  const promptLower = userPrompt.toLowerCase();
  
  // Detect editing type
  const isTextEdit = promptLower.includes('change') && (promptLower.includes('text') || promptLower.includes('to')) ||
                     promptLower.includes('replace') && promptLower.includes('with') ||
                     promptLower.includes('headline') ||
                     promptLower.includes('title') ||
                     promptLower.includes('subtitle');

  const isColorEdit = promptLower.includes('background color') ||
                      promptLower.includes('color of') ||
                      promptLower.includes('change color');

  let enhancedPrompt = '';

  if (hasMask) {
    // With mask - selective editing
    if (isTextEdit) {
      enhancedPrompt = `PRECISE TEXT EDITING TASK:

The first image is the original. The second image is a mask (WHITE = edit area, BLACK = preserve).

Your task: ${userPrompt}

CRITICAL RULES:
1. Edit ONLY the text in WHITE mask areas
2. Preserve EVERYTHING in BLACK mask areas (do not touch any pixel)
3. Match the original font style, size, weight, and color
4. Maintain text alignment and positioning
5. Keep the same visual hierarchy and design structure
6. Ensure new text fits naturally in the layout

Return the edited image with ONLY the specified text changed.`;
    } else if (isColorEdit) {
      enhancedPrompt = `PRECISE COLOR EDITING TASK:

The first image is the original. The second image is a mask (WHITE = edit area, BLACK = preserve).

Your task: ${userPrompt}

CRITICAL RULES:
1. Change ONLY the color in WHITE mask areas
2. Preserve EVERYTHING in BLACK mask areas (do not touch any pixel)
3. Maintain textures, gradients, and lighting
4. Do not change text, logos, or other elements
5. Blend the new color naturally with existing shadows and highlights

Return the edited image with ONLY the color changed as requested.`;
    } else {
      enhancedPrompt = `PRECISE IMAGE EDITING TASK:

The first image is the original. The second image is a mask (WHITE = edit area, BLACK = preserve).

Your task: ${userPrompt}

CRITICAL RULES:
1. Edit ONLY the areas marked in WHITE on the mask
2. Preserve EVERYTHING in BLACK mask areas (do not touch any pixel)
3. Maintain the overall design structure and visual hierarchy
4. Match the style and quality of the original image
5. Ensure edits blend naturally with the rest of the image

Return the edited image with ONLY the masked areas modified.`;
    }
  } else {
    // Without mask - general editing
    if (isTextEdit) {
      enhancedPrompt = `TEXT EDITING TASK:

Your task: ${userPrompt}

CRITICAL RULES:
1. Identify and change ONLY the specified text
2. Preserve all other design elements exactly as they are
3. Match the original font style, size, weight, and color
4. Maintain text alignment and positioning
5. Keep the same visual hierarchy
6. Do not redesign - only edit the specified text

Return the image with ONLY the text changed as requested.`;
    } else if (isColorEdit) {
      enhancedPrompt = `COLOR EDITING TASK:

Your task: ${userPrompt}

CRITICAL RULES:
1. Change ONLY the specified color
2. Preserve all other design elements
3. Maintain textures, gradients, and lighting
4. Do not change text, logos, or layout
5. Blend the new color naturally

Return the image with ONLY the color changed as requested.`;
    } else {
      enhancedPrompt = `IMAGE EDITING TASK:

Your task: ${userPrompt}

CRITICAL RULES:
1. Make ONLY the requested changes
2. Preserve the overall design structure
3. Maintain visual hierarchy and style
4. Do not redesign - only edit as specified
5. Ensure edits blend naturally

Return the edited image with ONLY the requested changes applied.`;
    }
  }

  return enhancedPrompt;
}
