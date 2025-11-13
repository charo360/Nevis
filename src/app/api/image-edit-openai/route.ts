import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
}

// Convert base64 to File object for OpenAI API
function base64ToFile(base64: string, mimeType: string, filename: string): File {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

// AI edit function using OpenAI DALL-E
const editImageWithOpenAI = async (originalImage: ImageAsset, prompt: string, mask: ImageAsset | null): Promise<ImageAsset> => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  const openai = new OpenAI({ apiKey });

  try {
    // Convert images to File objects
    const imageFile = base64ToFile(originalImage.base64, originalImage.mimeType, 'original.png');
    
    let response;
    
    if (mask) {
      // Use image editing with mask
      const maskFile = base64ToFile(mask.base64, mask.mimeType, 'mask.png');
      
      response = await openai.images.edit({
        image: imageFile,
        mask: maskFile,
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      });
    } else {
      // Use image variation/editing without mask
      response = await openai.images.createVariation({
        image: imageFile,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      });
    }

    if (response.data && response.data.length > 0 && response.data[0].b64_json) {
      const base64 = response.data[0].b64_json;
      const mimeType = 'image/png';
      const url = `data:${mimeType};base64,${base64}`;
      
      return {
        ...originalImage,
        base64,
        url,
        id: `edit_${originalImage.id}_${Date.now()}`
      };
    }
    
    throw new Error('OpenAI did not return an edited image');
    
  } catch (error: any) {
    console.error('OpenAI image editing error:', error);
    throw new Error(`OpenAI image editing failed: ${error.message}`);
  }
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { originalImage, prompt, mask }: AIEditRequest = body;

    if (!originalImage || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: originalImage and prompt' },
        { status: 400 }
      );
    }

    console.log('🎨 [OpenAI Image Edit] Starting image editing:', {
      imageId: originalImage.id,
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      hasMask: !!mask,
      timestamp: new Date().toISOString()
    });

    // Edit the image using OpenAI
    const editedImage = await editImageWithOpenAI(originalImage, prompt, mask);

    const duration = Date.now() - startTime;

    console.log('✅ [OpenAI Image Edit] Image editing completed:', {
      originalId: originalImage.id,
      editedId: editedImage.id,
      duration: `${duration}ms`,
      success: true
    });

    return NextResponse.json({
      success: true,
      editedImage,
      duration,
      message: 'Image edited successfully using OpenAI DALL-E'
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error('❌ [OpenAI Image Edit] Error:', {
      error: error.message,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        error: error.message || 'Image editing failed',
        duration,
        success: false
      },
      { status: 500 }
    );
  }
}
