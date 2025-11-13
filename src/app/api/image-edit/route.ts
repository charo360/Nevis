/**
 * API endpoint for AI-powered image editing with masking support
 * POST /api/image-edit
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Part, Modality } from '@google/genai';
import { BrandProfile } from '@/lib/types';

// Image asset interface
interface ImageAsset {
  id: string;
  url: string;
  base64: string;
  mimeType: string;
}

// AI edit request interface
interface AIEditRequest {
  originalImage: ImageAsset;
  prompt: string;
  mask?: ImageAsset | null;
  editType: 'ai';
}

// AI edit function using Google Gemini with proper image editing approach
const editImageWithAI = async (originalImage: ImageAsset, prompt: string, mask: ImageAsset | null): Promise<ImageAsset> => {
  // Use dedicated API key for image editing to avoid confusion with other Gemini usage
  const apiKey = process.env.GEMINI_IMAGE_EDIT_API_KEY || 
                 process.env.GOOGLE_AI_API_KEY || 
                 process.env.GOOGLE_API_KEY || 
                 process.env.GEMINI_API_KEY || 
                 process.env.GOOGLE_GENAI_API_KEY;
  
  // API key loaded successfully

  if (!apiKey) {
    throw new Error('Gemini image editing API key not configured. Please set GEMINI_IMAGE_EDIT_API_KEY (dedicated) or one of: GOOGLE_AI_API_KEY, GOOGLE_API_KEY, GEMINI_API_KEY, GOOGLE_GENAI_API_KEY');
  }

  // Use the exact same SDK and initialization as your working app
  const ai = new GoogleGenAI({ apiKey });

  console.log('🎨 [Gemini Image Edit] Starting edit with:', {
    prompt: prompt.substring(0, 100),
    hasMask: !!mask,
    imageSize: originalImage.base64.length,
    model: 'gemini-2.5-flash-image'
  });

  // Use the exact format from your working app
  const parts: Part[] = [
    { inlineData: { data: originalImage.base64, mimeType: originalImage.mimeType } },
  ];
  
  let finalPrompt = prompt;

  // First, analyze the image content to understand its structure
  const contentAnalysisPrompt = `ANALYZE this image and identify its content structure. Look for:

📝 TEXT ELEMENTS:
- Headlines/Main titles (largest, most prominent text)
- Subheadlines/Subtitles (secondary text, smaller than main title)
- Body text/Descriptions (paragraph text, smallest)
- Captions (small descriptive text)
- Call-to-action buttons/text
- Price/number information

🎨 VISUAL ELEMENTS:
- Background (solid colors, gradients, images)
- Product images/photos
- Icons and graphics
- Logos and branding elements
- Decorative elements

📐 LAYOUT STRUCTURE:
- Text hierarchy (which text is most/least important)
- Element positioning (top, center, bottom, left, right)
- Visual relationships between elements

Provide this analysis in a structured format so I can make precise edits while preserving the design integrity.

After analysis, I will receive an editing instruction: "${prompt}"

Based on your content analysis, execute the edit while:
1. Understanding which specific element to modify (headline vs subtitle vs body text)
2. Maintaining the visual hierarchy and design structure
3. Preserving all other elements exactly as they are
4. Matching the original typography and styling for text edits

CRITICAL: This is an EDIT, not a redesign. Preserve everything except the specifically requested change.`;

  // Enhanced content analysis and editing type detection
  const promptLower = prompt.toLowerCase();
  
  // Text editing detection (expanded)
  const isTextEdit = promptLower.includes('change') && (promptLower.includes('text') || promptLower.includes('to')) ||
                     promptLower.includes('replace') && promptLower.includes('with') ||
                     promptLower.includes('add text') ||
                     promptLower.includes('remove text') ||
                     promptLower.includes('delete text') ||
                     promptLower.includes('headline') ||
                     promptLower.includes('title') ||
                     promptLower.includes('subtitle') ||
                     promptLower.includes('subheadline') ||
                     promptLower.includes('caption') ||
                     promptLower.includes('body text') ||
                     promptLower.includes('description');

  // Color editing detection
  const isColorEdit = promptLower.includes('background color') ||
                      promptLower.includes('color of') ||
                      promptLower.includes('change color') ||
                      promptLower.includes('make the background');

  // Element manipulation detection
  const isElementEdit = promptLower.includes('add ') ||
                        promptLower.includes('remove ') ||
                        promptLower.includes('delete ') ||
                        promptLower.includes('move ') ||
                        promptLower.includes('resize ') ||
                        promptLower.includes('make bigger') ||
                        promptLower.includes('make smaller');

  if (mask) {
    parts.push({ inlineData: { data: mask.base64, mimeType: mask.mimeType } });
    
    if (isColorEdit) {
      // Color-specific editing prompt with mask
      finalPrompt = `You are performing a PRECISE COLOR EDITING task. Follow these STRICT rules:
1. The first image is your base. The second image is a mask showing WHITE areas to edit.
2. BLACK mask areas = DO NOT TOUCH ANY PIXEL. Preserve them EXACTLY.
3. WHITE mask areas = The ONLY place you can make color changes.

Your SPECIFIC TASK: ${prompt}

CRITICAL COLOR EDITING RULES:
- Change ONLY the color of the elements in the WHITE areas.
- PRESERVE ALL other visual properties: textures, gradients, shapes, and lighting.
- DO NOT change any text, logos, or other design elements.
- The new color should blend naturally with the existing lighting and shadows.

Return the edited image with ONLY the color changed as requested.`;
    } else if (isTextEdit) {
      // Text-specific editing prompt with mask and content analysis
      finalPrompt = `${contentAnalysisPrompt}

MASKED TEXT EDITING RULES:
1. The first image is your base. The second image is a mask showing WHITE areas to edit.
2. BLACK mask areas = DO NOT TOUCH ANY PIXEL. Preserve them EXACTLY.
3. WHITE mask areas = The ONLY place you can make text changes.

INTELLIGENT TEXT EDITING:
- Identify if you're editing a headline, subtitle, body text, or caption
- Maintain the EXACT typography hierarchy and visual importance
- Match font family, size, weight, color, and effects of the original text type
- Preserve spacing, alignment, and positioning relative to other elements
- Keep the same text style (bold, italic, etc.) as the original element
- Ensure the new text fits naturally within the design layout

Return the edited image with ONLY the specified text changed, maintaining perfect design integrity.`;
    } else {
      finalPrompt = `You are performing a precise INPAINTING task on the first image. Follow these non-negotiable rules:
1. Treat the first image as the base. You MUST preserve every pixel that is black in the mask exactly as it appears.
2. The second image is the mask: WHITE pixels = the ONLY region you may modify. BLACK pixels = DO NOT TOUCH UNDER ANY CIRCUMSTANCE.
3. Do not regenerate, redraw, crop, reframe, or alter lighting outside the white region. This is an edit, not a new composition.

Inside the white region only, apply this change exactly as written: "${prompt}".
Blend the modification seamlessly into the untouched surroundings so the transition is invisible.
Return a single edited image that matches the original resolution and aesthetic.`;
    }
  } else {
    // For non-masked editing
    if (isColorEdit) {
      // Color-specific editing prompt without mask
      finalPrompt = `CRITICAL: This is a COLOR-ONLY edit. DO NOT regenerate or redesign anything.

TASK: ${prompt}

ABSOLUTE REQUIREMENTS:
1. Take the EXACT image provided and ONLY change the specified color
2. DO NOT regenerate, redraw, or recreate ANY part of the image
3. DO NOT change text, logos, images, shapes, or layout
4. DO NOT add or remove any elements
5. ONLY apply a color filter/adjustment to the specified area
6. The output must be IDENTICAL to the input except for the color change

Think of this as applying a color filter in Photoshop - nothing else changes.

Return the SAME image with ONLY the color modified.`;
    } else if (isTextEdit) {
      // Text-specific editing prompt without mask
      finalPrompt = `${contentAnalysisPrompt}

INTELLIGENT TEXT EDITING WITHOUT MASK:
Your SPECIFIC TASK: ${prompt}

SMART TEXT MODIFICATION RULES:
1. ANALYZE the image content first to understand text hierarchy
2. IDENTIFY which text element to modify (headline, subtitle, body text, caption)
3. PRESERVE the exact typography style of that text type
4. MAINTAIN the visual hierarchy and importance level
5. KEEP all other elements completely unchanged
6. MATCH font family, size, weight, color, and effects perfectly
7. ENSURE proper spacing and alignment with surrounding elements

ABSOLUTE PRESERVATION REQUIREMENTS:
- DO NOT regenerate, redraw, or recreate ANY part of the image
- DO NOT change colors, layouts, backgrounds, or other design elements
- DO NOT add or remove any elements not mentioned in the prompt
- The output must be IDENTICAL to the input except for the specified text change

Think of this as intelligent 'find and replace' that understands design hierarchy.

Return the SAME image with ONLY the specified text intelligently modified.`;
    } else if (isElementEdit) {
      // Element manipulation editing prompt
      finalPrompt = `${contentAnalysisPrompt}

INTELLIGENT ELEMENT EDITING:
Your SPECIFIC TASK: ${prompt}

SMART ELEMENT MODIFICATION RULES:
1. ANALYZE the image content first to understand element relationships
2. IDENTIFY which specific element to modify (text, image, icon, button, etc.)
3. UNDERSTAND the element's role in the design hierarchy
4. PRESERVE all other elements and their relationships
5. MAINTAIN the overall design balance and composition
6. ENSURE modifications fit naturally within the existing layout

ELEMENT-SPECIFIC GUIDELINES:
- For ADD operations: Place new elements logically within the design flow
- For REMOVE operations: Clean up the space naturally, don't leave gaps
- For RESIZE operations: Maintain proportions and visual balance
- For MOVE operations: Preserve alignment and spacing relationships

ABSOLUTE PRESERVATION REQUIREMENTS:
- DO NOT regenerate or recreate the entire design
- DO NOT change unrelated elements or styling
- DO NOT alter the overall composition unless necessary for the edit
- The result should look like the original design with only the requested change

Return the SAME image with ONLY the specified element intelligently modified.`;
    } else {
      // General editing prompt with content analysis
      finalPrompt = `${contentAnalysisPrompt}

INTELLIGENT GENERAL EDITING:
Your SPECIFIC TASK: ${prompt}

SMART EDITING RULES:
1. ANALYZE the image content first to understand what needs to be changed
2. IDENTIFY the specific area or element that requires modification
3. PRESERVE everything else exactly as it appears
4. MAINTAIN the design integrity and visual hierarchy
5. ENSURE the edit blends seamlessly with the existing design

TECHNICAL RETOUCH REQUIREMENTS:
- Use the supplied image as the base - this is NOT a regeneration
- Apply ONLY the specific modification requested
- Preserve composition, framing, colors, lighting, and typography
- Do not introduce unrelated elements unless explicitly requested
- Do not remove elements unless the prompt explicitly says so
- Keep the final output aligned with the original image's style and quality

Return the edited image with only the requested intelligent modification.`;
    }
  }
  
  parts.push({ text: finalPrompt });

  console.log('🔧 [Debug] Parts being sent:', parts.map(p => ({
    type: p.text ? 'text' : 'image',
    textPreview: p.text?.substring(0, 50),
    hasImageData: !!p.inlineData
  })));

  // Use the exact API call structure from your working app
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/') && part.inlineData.data) {
        const base64 = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        const url = `data:${mimeType};base64,${base64}`;
        return { ...originalImage, base64, url, id: `edit_${originalImage.id}` };
      }
    }
  }
  
  // If no image was returned
  console.warn('⚠️ Gemini 2.5 Flash Image did not return an edited image.');
  throw new Error('Image editing failed. No image was returned from Gemini 2.5 Flash Image model.');
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get user authentication from cookies (same as server actions)
    let accessToken: string | undefined;
    
    try {
      const { cookies } = await import('next/headers');
      const { createServerClient } = await import('@supabase/ssr');

      const cookieStore = await cookies();

      const supabaseServer = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {
              // API routes can't modify cookies
            },
          },
        }
      );

      const { data: { session } } = await supabaseServer.auth.getSession();
      accessToken = session?.access_token;
    } catch (authError) {
      console.warn('⚠️ [ImageEdit] Authentication failed:', authError);
    }
    
    const body = await request.json();
    console.log('📝 [ImageEdit] Received edit request:', {
      editType: body.editType || 'ai',
      hasOriginalImage: !!body.originalImage,
      hasMask: !!body.mask,
      promptLength: body.prompt?.length || 0
    });

    // Determine edit type
    const editType = body.editType || 'ai';

    if (editType === 'ai') {
      // Handle AI-powered editing with masking
      const {
        originalImage,
        prompt,
        mask
      } = body as {
        originalImage: ImageAsset;
        prompt: string;
        mask?: ImageAsset | null;
      };

      // Validate required parameters for AI editing
      if (!originalImage) {
        return NextResponse.json(
          { error: 'Missing required parameter: originalImage' },
          { status: 400 }
        );
      }

      if (!prompt) {
        return NextResponse.json(
          { error: 'Missing required parameter: prompt' },
          { status: 400 }
        );
      }

      // Validate image format
      if (!originalImage.base64 || !originalImage.mimeType) {
        return NextResponse.json(
          { error: 'Invalid image format. Base64 and mimeType required.' },
          { status: 400 }
        );
      }

      console.log('🤖 [ImageEdit] Processing AI edit:', {
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        hasMask: !!mask,
        imageSize: originalImage.base64.length
      });

      try {
        // Apply AI editing
        const editedImage = await editImageWithAI(originalImage, prompt, mask || null);
        const processingTime = Date.now() - startTime;

        console.log('✅ [ImageEdit] AI edit successful');
        console.log('⏱️ [ImageEdit] Processing time:', processingTime, 'ms');

        return NextResponse.json({
          success: true,
          editedImage,
          processingTime,
          editType: 'ai',
          originalPrompt: prompt,
          hasMask: !!mask
        });

      } catch (aiError) {
        console.error('❌ [ImageEdit] AI edit failed:', aiError);
        return NextResponse.json(
          {
            success: false,
            error: aiError instanceof Error ? aiError.message : 'AI editing failed',
            editType: 'ai'
          },
          { status: 500 }
        );
      }

    } else {
      // Handle unsupported edit types
      return NextResponse.json(
        { error: 'Only AI-based editing (editType: "ai") is supported. Legacy text editing has been removed.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('💥 [ImageEdit] Unexpected error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Image editing failed',
        processingTime
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
