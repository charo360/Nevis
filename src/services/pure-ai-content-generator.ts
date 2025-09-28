/**
 * Pure AI-Driven Content Generator
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
  recentContent?: string[]; // Recent content to avoid repetition
  brandContext?: {
    colors?: string[];
    personality?: string;
    values?: string[];
  };
}

export interface PureAIResponse {
  headline: string;
  subheadline: string;
  cta: string;
  caption: string;
  hashtags: string[];
  reasoning: string;
  confidence: number;
}

export class PureAIContentGenerator {

  /**
   * Generate ALL content using pure AI intelligence - NO hardcoded rules
   */
  static async generateContent(request: PureAIRequest): Promise<PureAIResponse> {
    const prompt = this.buildPureAIPrompt(request);

    try {
      console.log('🧠 [Pure AI] Generating content with zero hardcoding...');

      const response = await generateText(prompt, {
        temperature: 0.8,
        maxOutputTokens: 1000
      });

      const parsed = this.parseAIResponse(response.text);

      // Validate required fields
      if (!parsed.headline || !parsed.cta || !parsed.caption) {
        throw new Error('AI response missing required fields (headline, cta, or caption)');
      }

      return {
        headline: parsed.headline || 'Business Excellence',
        subheadline: parsed.subheadline || 'Professional services you can trust',
        cta: parsed.cta || 'Get Started',
        caption: parsed.caption || 'Discover exceptional service and quality.',
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#business', '#quality', '#professional'],
        reasoning: parsed.reasoning || 'AI-generated content based on business analysis',
        confidence: parsed.confidence || 8
      };

    } catch (error) {
      console.error('❌ [Pure AI] Content generation failed:', error);
      console.error('❌ [Pure AI] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        businessName: request.businessName,
        businessType: request.businessType
      });
      throw new Error(`Pure AI content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      recentContent,
      brandContext
    } = request;

    const recentContentText = recentContent && recentContent.length > 0
      ? `\nRECENT CONTENT TO AVOID REPEATING:\n${recentContent.map((content, i) => `${i + 1}. ${content}`).join('\n')}\n`
      : '';

    const brandContextText = brandContext
      ? `\nBRAND CONTEXT:\n- Colors: ${brandContext.colors?.join(', ') || 'Not specified'}\n- Personality: ${brandContext.personality || 'Not specified'}\n- Values: ${brandContext.values?.join(', ') || 'Not specified'}\n`
      : '';

    return `
You are an expert marketing strategist and copywriter. Analyze this business and create compelling marketing content.

BUSINESS TO ANALYZE:
- Business Name: ${businessName}
- Business Type: ${businessType}
- Services/Products: ${services}
- Target Platform: ${platform}
- Target Audience: ${targetAudience || 'General audience'}
- Location: ${location || 'Not specified'}
${brandContextText}${recentContentText}

YOUR TASK:
Analyze this business deeply and create marketing content that will resonate with their specific audience and drive their primary business goals.

INTELLIGENT ANALYSIS REQUIRED:
1. **Business Model Analysis**: What is their primary revenue model? How do customers typically engage with this type of business?

2. **Customer Journey Mapping**: What action would a potential customer naturally take next? (booking, purchasing, signing up, calling, visiting, etc.)

3. **Value Proposition Identification**: What unique value does this specific business provide? What problems do they solve?

4. **Audience Psychology**: What motivates their target audience? What are their pain points, desires, and decision-making factors?

5. **Platform Optimization**: How should content be adapted for ${platform}? What works best on this platform?

6. **Competitive Differentiation**: What would make this business stand out from competitors?

7. **Content Variety**: How can we avoid repetition and create fresh, engaging content?

CONTENT CREATION GUIDELINES:
- **BE INTELLIGENT**: Make smart decisions based on your analysis, not generic templates
- **BE SPECIFIC**: Tailor everything to THIS exact business and their unique context
- **BE VARIED**: If recent content exists, create something completely different in approach and language
- **BE STRATEGIC**: Every word should serve the business goal and audience needs
- **BE AUTHENTIC**: Make it sound natural and genuine, not like generic marketing copy
- **BE ACTIONABLE**: Create clear next steps that match how customers actually engage with this business

PLATFORM-SPECIFIC CONSIDERATIONS:
- Analyze ${platform} best practices and adapt content accordingly
- Consider character limits, visual elements, and user behavior on this platform
- Optimize for how people consume content on ${platform}

CONTENT REQUIREMENTS:
1. **HEADLINE** (4-8 words): Attention-grabbing, benefit-focused, specific to this business
2. **SUBHEADLINE** (8-20 words): Explains the value proposition, builds on headline
3. **CALL-TO-ACTION** (2-4 words): Matches their primary conversion goal, platform-appropriate
4. **CAPTION** (2-4 sentences): Engaging story that connects with audience, includes business value
5. **HASHTAGS** (8-15 tags): Mix of business-specific, location-based, and trending tags
6. **REASONING**: Explain your strategic thinking and decisions
7. **CONFIDENCE** (1-10): How confident you are in this content strategy

CRITICAL REQUIREMENTS:
- NO generic marketing speak or clichés
- NO repetition of recent content approaches
- NO one-size-fits-all solutions
- EVERY element must be strategically chosen for THIS business
- Content must feel authentic and natural, not promotional
- CTA must match what customers actually do with this business type

Think step by step:
1. Analyze the business model and customer behavior
2. Identify the unique value proposition
3. Determine the optimal conversion action
4. Create content that guides customers naturally toward that action
5. Ensure everything feels authentic and business-specific

Respond in JSON format:
{
  "headline": "Your strategic headline here",
  "subheadline": "Your supporting subheadline here", 
  "cta": "Your conversion-focused CTA here",
  "caption": "Your engaging caption here",
  "hashtags": ["#specific", "#relevant", "#hashtags"],
  "reasoning": "Explain your strategic thinking and why you made these specific choices",
  "confidence": 8
}

Make every decision based on intelligent analysis, not hardcoded rules. Be creative, strategic, and business-specific.
`;
  }

  /**
   * Parse AI response - handles various response formats
   */
  private static parseAIResponse(response: string): any {
    try {
      // Clean the response to extract JSON
      let cleanResponse = response.trim();

      // Remove markdown code blocks if present
      if (cleanResponse.includes('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/g, '');
      }

      // Find JSON object
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const extractedJson = cleanResponse.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(extractedJson);
      }

      throw new Error('No valid JSON found in response');

    } catch (error) {
      console.error('❌ [Pure AI] Failed to parse AI response:', error);
      console.error('❌ [Pure AI] Raw response:', response);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Generate specific content type (for backward compatibility)
   */
  static async generateSpecificContent(
    request: PureAIRequest,
    contentType: 'headline' | 'cta' | 'caption' | 'subheadline'
  ): Promise<string> {
    const fullContent = await this.generateContent({
      ...request,
      contentType
    });

    switch (contentType) {
      case 'headline': return fullContent.headline;
      case 'cta': return fullContent.cta;
      case 'caption': return fullContent.caption;
      case 'subheadline': return fullContent.subheadline;
      default: return fullContent.headline;
    }
  }
}
