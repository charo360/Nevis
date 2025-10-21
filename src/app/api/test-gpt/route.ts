import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { businessName = "Test Business", industry = "Technology" } = await request.json();

    // Check if OpenAI API key exists
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "OpenAI API key not found",
        hasApiKey: false
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Test GPT content generation
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a social media content expert. Generate unique, engaging content for ${businessName} in the ${industry} industry. NEVER use generic words like "Transform", "Unlock", "Discover", or template phrases. Be specific and creative.`
        },
        {
          role: "user",
          content: `Create a unique headline for ${businessName} that showcases their ${industry} expertise. Make it specific to their business, not generic.`
        }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    const generatedContent = completion.choices[0]?.message?.content;
    

    // Check for common fallback indicators
    const fallbackIndicators = ["Transform", "Unlock", "Discover", "Revolutionize", "Elevate"];
    const containsFallback = fallbackIndicators.some(word => 
      generatedContent?.toLowerCase().includes(word.toLowerCase())
    );

    return NextResponse.json({
      success: true,
      hasApiKey: true,
      apiKeyPreview: apiKey.substring(0, 10) + "...",
      model: "gpt-4o",
      generatedContent,
      containsFallbackWords: containsFallback,
      fallbackWordsFound: fallbackIndicators.filter(word => 
        generatedContent?.toLowerCase().includes(word.toLowerCase())
      ),
      usage: completion.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ GPT Test Error:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    });
  }
}