/**
 * Simplified Pure AI-Driven Content Generator
 * ZERO hardcoding - AI makes ALL decisions based on intelligent prompts
 */

import { generateText } from '@/ai/google-ai-direct';

export interface PureAIRequest {
  businessType: string;
  businessName: string;
  services: string;
  platform: string;
  contentType: 'headline' | 'cta' | 'caption' | 'subheadline' | 'all';
  targetAudience?: string;
  location?: string;
  websiteUrl?: string;
  recentContent?: string[]; // Recent content to avoid repetition
  brandContext?: {
    colors?: string[];
    personality?: string;
    values?: string[];
  };
}

export interface PureAIResponse {
  business_analysis: {
    product_intelligence: string;
    cultural_context: string;
    emotional_drivers: string;
    natural_scenarios: string;
    competitive_advantage: string;
    content_format: string;
  };
  content: {
    headline: string;
    subheadline: string;
    cta: string;
    caption: string;
    hashtags: string[];
  };
  performance_prediction: {
    engagement_score: number;
    conversion_probability: string;
    viral_potential: string;
    cultural_resonance: string;
  };
  strategic_reasoning: string;
  confidence: number;

  // Legacy fields for backward compatibility
  headline: string;
  subheadline: string;
  cta: string;
  caption: string;
  hashtags: string[];
  reasoning: string;
}

export class PureAIContentGenerator {

  /**
   * Generate ALL content using pure AI intelligence - NO hardcoded rules
   */
  static async generateContent(request: PureAIRequest): Promise<PureAIResponse> {
    const prompt = this.buildPureAIPrompt(request);

    // Check for API keys before attempting generation
    const geminiKey = process.env.GEMINI_API_KEY_REVO_1_5 || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    
    if (!geminiKey) {
      const errorMsg = '🚫 [Pure AI] No Gemini API key found. Required keys: GEMINI_API_KEY_REVO_1_5, GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_GENAI_API_KEY';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('🧠 [Pure AI] Generating content with zero hardcoding...');
      console.log('🔑 [Pure AI] API Key check:', {
        hasGeminiKey: !!process.env.GEMINI_API_KEY_REVO_1_5,
        hasBackupKey: !!process.env.GEMINI_API_KEY,
        hasGoogleKey: !!process.env.GOOGLE_API_KEY,
        hasGenAIKey: !!process.env.GOOGLE_GENAI_API_KEY,
        keyPrefix: geminiKey.substring(0, 10) + '...'
      });

      const response = await generateText(prompt, {
        temperature: 0.8, // Slightly lower for more consistent responses
        maxOutputTokens: 3000 // Increase token limit for complete responses
      });

      console.log('✅ [Pure AI] Raw response received:', {
        responseLength: response.text?.length || 0,
        responsePreview: response.text?.substring(0, 200) + '...'
      });

      // Debug: Log the full response for debugging
      console.log('🔍 [Pure AI] Full response for debugging:', response.text);

      const parsed = this.parseAIResponse(response.text);

      // Handle both new structured format and legacy format
      const content = parsed.content || parsed;
      const businessAnalysis = parsed.business_analysis || {};
      const performancePrediction = parsed.performance_prediction || {};

      // Validate required fields and check for repetitive patterns
      if (!content.headline || !content.cta || !content.caption) {
        console.error('❌ [Pure AI] Missing required fields:', {
          hasHeadline: !!content.headline,
          hasCta: !!content.cta,
          hasCaption: !!content.caption,
          parsedContent: content
        });
        throw new Error('AI response missing required fields (headline, cta, or caption)');
      }

      // Check for repetitive "Upgrade" patterns that indicate fallback content
      const contentText = `${content.headline} ${content.subheadline} ${content.caption}`.toLowerCase();
      const repetitivePatterns = ['upgrade', 'transform', 'revolutionize', 'solutions', 'excellence'];
      const hasRepetitiveContent = repetitivePatterns.some(pattern => 
        contentText.split(pattern).length > 2 // Pattern appears more than once
      );

      if (hasRepetitiveContent) {
        console.warn('⚠️ [Pure AI] Detected repetitive patterns, regenerating...');
        // Retry with different temperature
        const retryResponse = await generateText(prompt + '\n\nIMPORTANT: Avoid repetitive words like "upgrade", "transform", "solutions". Be creative and specific.', {
          temperature: 0.95,
          maxOutputTokens: 2000
        });
        const retryParsed = this.parseAIResponse(retryResponse.text);
        const retryContent = retryParsed.content || retryParsed;
        
        if (retryContent.headline && retryContent.cta && retryContent.caption) {
          console.log('✅ [Pure AI] Retry successful, using retry content');
          return this.formatResponse(retryParsed, retryContent, businessAnalysis, performancePrediction);
        }
      }

      return this.formatResponse(parsed, content, businessAnalysis, performancePrediction);

    } catch (error) {
      console.error('❌ [Pure AI] Content generation failed:', error);
      console.error('❌ [Pure AI] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        businessName: request.businessName,
        businessType: request.businessType,
        platform: request.platform
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle specific error types with user-friendly messages
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
        throw new Error('😅 Revo is experiencing high demand right now! Please try again in a few minutes or switch to Revo 2.0.');
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('API key')) {
        throw new Error('🔧 Revo is having a technical hiccup. Please try Revo 2.0 while we fix this!');
      }
      
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        throw new Error('🔧 Revo is having a technical hiccup. Please try Revo 2.0 while we fix this!');
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('ECONNRESET')) {
        throw new Error('🌐 Connection hiccup! Please try again in a moment.');
      }
      
      throw new Error('😅 Revo is having some trouble right now! Try Revo 2.0 for great results while we get things sorted out.');
    }
  }

  /**
   * Build intelligent prompt that lets AI make ALL decisions
   */
  private static buildPureAIPrompt(request: PureAIRequest): string {
    const {
      businessType,
      businessName,
      services,
      platform,
      targetAudience,
      location,
      websiteUrl,
      recentContent,
      brandContext
    } = request;

    const recentContentText = recentContent && recentContent.length > 0
      ? `\nRECENT CONTENT TO AVOID REPEATING:\n${recentContent.map((content, i) => `${i + 1}. ${content}`).join('\n')}\n`
      : '';

    const brandContextText = brandContext
      ? `\nBRAND CONTEXT:\n- Colors: ${brandContext.colors?.join(', ') || 'Not specified'}\n- Personality: ${brandContext.personality || 'Not specified'}\n- Values: ${brandContext.values?.join(', ') || 'Not specified'}\n`
      : '';

    return `You are a marketing expert. Create compelling content for ${businessName} (${businessType}) on ${platform}.

Business Details:
- Name: ${businessName}
- Type: ${businessType}
- Services: ${services}
- Location: ${location || 'Not specified'}
- Target Audience: ${targetAudience || 'General'}
- Platform: ${platform}
${brandContextText}${recentContentText}

Analyze this business deeply and create content that will drive real results. Think about:
- What makes this business unique?
- What problems do they solve?
- What emotional triggers will work for their audience?
- What cultural factors matter in their location?
- What content format will work best on ${platform}?

Create content that feels authentic, specific to this business, and designed to convert.

CRITICAL: You must respond with ONLY valid JSON. No markdown, no explanations, no code blocks, no additional text. The response must start with { and end with }. Use this exact format:
{
  "business_analysis": {
    "product_intelligence": "Your analysis of their products/services",
    "cultural_context": "Cultural insights for their location",
    "emotional_drivers": "Key emotional triggers for their audience",
    "natural_scenarios": "Real-world usage scenarios",
    "competitive_advantage": "What makes them unique",
    "content_format": "Best content approach for this business"
  },
  "content": {
    "headline": "Your compelling headline",
    "subheadline": "Your supporting subheadline",
    "cta": "Your call-to-action",
    "caption": "Your engaging caption",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
  },
  "performance_prediction": {
    "engagement_score": 8,
    "conversion_probability": "High",
    "viral_potential": "Medium",
    "cultural_resonance": "High"
  },
  "strategic_reasoning": "Your strategic thinking",
  "confidence": 9
}

Generate EXACTLY ${platform === 'Instagram' ? '5' : '3'} hashtags. Be creative and specific to this business.`;
  }

  /**
   * Parse AI response - handles various response formats
   */
  private static parseAIResponse(response: string): any {
    try {
      console.log('🔍 [Pure AI] Parsing response, length:', response.length);
      
      // Clean the response to extract JSON
      let cleanResponse = response.trim();

      // Remove markdown code blocks if present
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        console.log('🔍 [Pure AI] Removed markdown code blocks');
      } else if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/g, '');
        console.log('🔍 [Pure AI] Removed generic code blocks');
      }

      // Find JSON object
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');

      console.log('🔍 [Pure AI] JSON boundaries:', { jsonStart, jsonEnd, cleanResponseLength: cleanResponse.length });

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        let extractedJson = cleanResponse.substring(jsonStart, jsonEnd + 1);
        console.log('🔍 [Pure AI] Extracted JSON length:', extractedJson.length);
        console.log('🔍 [Pure AI] Extracted JSON preview:', extractedJson.substring(0, 200) + '...');
        
        // Try to fix common JSON issues
        try {
          // Remove any trailing text after the last }
          const lastBraceIndex = extractedJson.lastIndexOf('}');
          if (lastBraceIndex !== -1) {
            extractedJson = extractedJson.substring(0, lastBraceIndex + 1);
          }
          
          const parsed = JSON.parse(extractedJson);
          console.log('✅ [Pure AI] JSON parsing successful');
          return parsed;
        } catch (parseError) {
          console.error('❌ [Pure AI] JSON parse error:', parseError.message);
          console.error('❌ [Pure AI] Error position:', parseError.message.match(/position (\d+)/)?.[1]);
          console.error('❌ [Pure AI] Extracted JSON length:', extractedJson.length);
          
          // Try to fix common JSON issues
          try {
            // Remove any incomplete trailing content
            const lines = extractedJson.split('\n');
            let fixedJson = '';
            let braceCount = 0;
            let inString = false;
            let escapeNext = false;
            
            for (const line of lines) {
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (escapeNext) {
                  fixedJson += char;
                  escapeNext = false;
                  continue;
                }
                
                if (char === '\\') {
                  escapeNext = true;
                  fixedJson += char;
                  continue;
                }
                
                if (char === '"' && !escapeNext) {
                  inString = !inString;
                }
                
                if (!inString) {
                  if (char === '{') braceCount++;
                  if (char === '}') braceCount--;
                }
                
                fixedJson += char;
                
                // Stop if we've closed all braces
                if (braceCount === 0 && !inString && char === '}') {
                  break;
                }
              }
              
              if (braceCount === 0) break;
              fixedJson += '\n';
            }
            
            console.log('🔧 [Pure AI] Attempting to fix JSON...');
            const fixedParsed = JSON.parse(fixedJson);
            console.log('✅ [Pure AI] Fixed JSON parsing successful');
            return fixedParsed;
            
          } catch (fixError) {
            console.error('❌ [Pure AI] JSON fix failed:', fixError.message);
            console.error('❌ [Pure AI] Original JSON:', extractedJson);
            throw new Error(`JSON parsing failed: ${parseError.message}`);
          }
        }
      }

      console.error('❌ [Pure AI] No valid JSON found in response');
      console.error('❌ [Pure AI] Clean response:', cleanResponse);
      throw new Error('No valid JSON found in response');

    } catch (error) {
      console.error('❌ [Pure AI] Failed to parse AI response:', error);
      console.error('❌ [Pure AI] Raw response:', response);
      throw new Error(`Pure AI response parsing failed. The AI response format was invalid.`);
    }
  }

  /**
   * Generate content using Pure AI approach with OpenAI backend (fallback)
   */
  static async generateContentWithOpenAI(request: PureAIRequest): Promise<PureAIResponse> {
    const prompt = this.buildPureAIPrompt(request);

    // Check for OpenAI API key before attempting generation
    if (!process.env.OPENAI_API_KEY) {
      const errorMsg = '🚫 [Pure AI OpenAI] No OpenAI API key found. Required key: OPENAI_API_KEY';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      console.log('🧠 [Pure AI OpenAI] Generating content with OpenAI backend...');
      console.log('🔑 [Pure AI OpenAI] API Key check:', {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        keyPrefix: process.env.OPENAI_API_KEY.substring(0, 10) + '...'
      });

      // Use OpenAI with the same Pure AI prompt
      const OpenAI = (await import('openai')).default;

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert marketing strategist with deep cultural intelligence and story-mining capabilities. Always respond in valid JSON format as specified in the prompt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      });

      const responseText = response.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const parsed = this.parseAIResponse(responseText);

      // Handle both new structured format and legacy format
      const content = parsed.content || parsed;
      const businessAnalysis = parsed.business_analysis || {};
      const performancePrediction = parsed.performance_prediction || {};

      // Validate required fields
      if (!content.headline || !content.cta || !content.caption) {
        throw new Error('AI response missing required fields (headline, cta, or caption)');
      }

      return this.formatResponse(parsed, content, businessAnalysis, performancePrediction);

    } catch (error) {
      console.error('❌ [Pure AI OpenAI] Content generation failed:', error);
      console.error('❌ [Pure AI OpenAI] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        businessName: request.businessName,
        businessType: request.businessType,
        platform: request.platform
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle specific error types with user-friendly messages
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
        throw new Error('😅 Revo is experiencing high demand right now! Please try again in a few minutes or switch to Revo 2.0.');
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('API key')) {
        throw new Error('🔧 Revo is having a technical hiccup. Please try Revo 2.0 while we fix this!');
      }
      
      throw new Error('😅 Revo is having some trouble right now! Try Revo 2.0 for great results while we get things sorted out.');
    }
  }

  /**
   * Format the response into the expected structure
   */
  private static formatResponse(
    parsed: any,
    content: any,
    businessAnalysis: any,
    performancePrediction: any
  ): PureAIResponse {
    return {
      // New structured format
      business_analysis: businessAnalysis,
      content: content,
      performance_prediction: performancePrediction,
      strategic_reasoning: parsed.strategic_reasoning || 'Strategic reasoning not provided',
      confidence: parsed.confidence || 8,

      // Legacy fields for backward compatibility
      headline: content.headline,
      subheadline: content.subheadline,
      cta: content.cta,
      caption: content.caption,
      hashtags: content.hashtags,
      reasoning: parsed.strategic_reasoning || 'Strategic reasoning not provided'
    };
  }
}
