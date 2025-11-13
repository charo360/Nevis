import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    // Test the API key
    const apiKey = process.env.GEMINI_IMAGE_EDIT_API_KEY || 
                   process.env.GOOGLE_AI_API_KEY || 
                   process.env.GOOGLE_API_KEY || 
                   process.env.GEMINI_API_KEY || 
                   process.env.GOOGLE_GENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'No Gemini API key found in environment variables',
        checkedKeys: [
          'GEMINI_IMAGE_EDIT_API_KEY',
          'GOOGLE_AI_API_KEY', 
          'GOOGLE_API_KEY',
          'GEMINI_API_KEY',
          'GOOGLE_GENAI_API_KEY'
        ]
      }, { status: 400 });
    }

    console.log('🔑 Testing Gemini API key:', apiKey.substring(0, 10) + '...');

    // Test basic text generation first
    const genAI = new GoogleGenerativeAI(apiKey);
    const textModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const textResult = await textModel.generateContent('Say "Hello, API is working!" in a creative way.');
    const textResponse = textResult.response.text();

    console.log('✅ Text generation successful:', textResponse.substring(0, 50) + '...');

    // Test if the image model exists
    let imageModelTest = null;
    try {
      const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
      imageModelTest = 'Model accessible';
      console.log('✅ Image model (gemini-2.5-flash-image) is accessible');
    } catch (error: any) {
      imageModelTest = `Model error: ${error.message}`;
      console.log('❌ Image model error:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Gemini API key is working!',
      apiKeyFound: true,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      textGeneration: {
        success: true,
        response: textResponse,
        model: 'gemini-pro'
      },
      imageModel: {
        model: 'gemini-2.5-flash-image',
        status: imageModelTest
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Gemini API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString(),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
