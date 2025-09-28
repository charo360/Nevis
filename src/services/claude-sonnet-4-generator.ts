/**
 * Claude Sonnet 4 Content Generator
 * Primary content generation system for Revo 1.5 - NO FALLBACKS
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeContentRequest {
  businessType: string;
  businessName: string;
  services: string;
  platform: string;
  targetAudience?: string;
  location?: string;
  useLocalLanguage?: boolean;
  brandContext?: {
    colors?: string[];
    personality?: string;
    values?: string[];
  };
}

export interface ClaudeContentResponse {
  headline: string;
  subheadline: string;
  cta: string;
  caption: string;
  hashtags: string[];
}

export class ClaudeSonnet4Generator {
  private static anthropic: Anthropic;

  private static getAnthropicClient(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude Sonnet 4');
      }
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  /**
   * Generate content using Claude Sonnet 4 - Primary and ONLY method for Revo 1.5
   */
  static async generateContent(request: ClaudeContentRequest): Promise<ClaudeContentResponse> {
    console.log('🧠 [Claude Sonnet 4] Generating content for:', {
      businessName: request.businessName,
      businessType: request.businessType,
      platform: request.platform,
      location: request.location,
      useLocalLanguage: request.useLocalLanguage
    });

    const anthropic = this.getAnthropicClient();
    
    // Platform-specific hashtag count
    const hashtagCount = request.platform.toLowerCase() === 'instagram' ? 5 : 3;
    
    const prompt = this.buildClaudePrompt(request, hashtagCount);

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.8,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const responseText = content.text;
      console.log('✅ [Claude Sonnet 4] Raw response received:', responseText.substring(0, 200) + '...');

      // Parse JSON response
      let jsonContent = responseText;
      if (responseText.includes('```json')) {
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      } else if (responseText.includes('```')) {
        const jsonMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      }

      const parsed = JSON.parse(jsonContent);

      // Validate required fields
      if (!parsed.headline || !parsed.cta || !parsed.caption) {
        throw new Error('Claude response missing required fields (headline, cta, or caption)');
      }

      // Ensure correct hashtag count
      if (parsed.hashtags && parsed.hashtags.length !== hashtagCount) {
        if (parsed.hashtags.length > hashtagCount) {
          parsed.hashtags = parsed.hashtags.slice(0, hashtagCount);
        } else {
          // Add relevant hashtags to reach required count
          const additionalHashtags = [
            `#${request.businessType.toLowerCase().replace(/\s+/g, '')}`,
            '#local',
            '#business',
            '#quality',
            '#professional',
            '#service'
          ];
          
          while (parsed.hashtags.length < hashtagCount && additionalHashtags.length > 0) {
            const tag = additionalHashtags.shift();
            if (tag && !parsed.hashtags.includes(tag)) {
              parsed.hashtags.push(tag);
            }
          }
        }
      }

      console.log('✅ [Claude Sonnet 4] Content generated successfully:', {
        headline: parsed.headline,
        subheadline: parsed.subheadline?.substring(0, 50) + '...',
        cta: parsed.cta,
        hashtagCount: parsed.hashtags?.length || 0,
        platform: request.platform
      });

      return {
        headline: parsed.headline,
        subheadline: parsed.subheadline || `Quality ${request.businessType.toLowerCase()} services`,
        cta: parsed.cta,
        caption: parsed.caption,
        hashtags: parsed.hashtags || []
      };

    } catch (error) {
      console.error('❌ [Claude Sonnet 4] Content generation failed:', error);
      throw new Error(`Claude Sonnet 4 content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static buildClaudePrompt(request: ClaudeContentRequest, hashtagCount: number): string {
    const languageInstruction = request.useLocalLanguage && request.location
      ? `- Use English with natural local language elements appropriate for ${request.location} (mix English with local language for authentic feel)`
      : `- Use English only, do not use local language`;

    return `Create engaging ${request.platform} content for ${request.businessName}, a ${request.businessType} business.

Business Context:
- Name: ${request.businessName}
- Type: ${request.businessType}
- Services: ${request.services}
- Location: ${request.location || 'Local area'}
- Target Audience: ${request.targetAudience || 'General customers'}
${languageInstruction}

Content Requirements:
1. Create a compelling headline (4-8 words) that highlights a key benefit or value proposition
2. Write a supporting subheadline (8-15 words) that explains how the business delivers this benefit
3. Generate a clear call-to-action (2-4 words) appropriate for this specific business type
4. Write an engaging caption (2-3 sentences) that connects with the target audience
5. Create exactly ${hashtagCount} relevant hashtags for ${request.platform}

CRITICAL GUIDELINES:
- NO generic marketing language like "upgrade", "transform", "solutions", "excellence"
- NO repetitive patterns or template phrases
- Focus on specific benefits this business provides to customers
- Use natural, conversational language that feels authentic
- Make content business-specific, not generic
- Vary your approach - be creative and unique
- Consider the local context when relevant

CONTENT STYLE:
- Headlines should be attention-grabbing and benefit-focused
- Subheadlines should explain the "how" - how the business delivers the benefit
- CTAs should match what customers actually do with this business type
- Captions should feel like authentic customer communication
- Hashtags should be discoverable and relevant to the lifestyle/industry

Respond in JSON format:
{
  "headline": "Compelling benefit-focused headline",
  "subheadline": "How the business delivers this benefit",
  "cta": "Natural action for this business",
  "caption": "Engaging, authentic caption that connects with customers",
  "hashtags": [${Array(hashtagCount).fill('"#relevant"').join(', ')}]
}`;
  }
}
