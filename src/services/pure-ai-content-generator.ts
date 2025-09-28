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

    try {
      console.log('🧠 [Pure AI] Generating content with zero hardcoding...');

      const response = await generateText(prompt, {
        temperature: 0.8,
        maxOutputTokens: 1000
      });

      const parsed = this.parseAIResponse(response.text);

      // Handle both new structured format and legacy format
      const content = parsed.content || parsed;
      const businessAnalysis = parsed.business_analysis || {};
      const performancePrediction = parsed.performance_prediction || {};

      // Validate required fields
      if (!content.headline || !content.cta || !content.caption) {
        throw new Error('AI response missing required fields (headline, cta, or caption)');
      }

      return {
        // New structured format
        business_analysis: {
          product_intelligence: businessAnalysis.product_intelligence || 'Business analysis not provided',
          cultural_context: businessAnalysis.cultural_context || 'Cultural context not analyzed',
          emotional_drivers: businessAnalysis.emotional_drivers || 'Emotional drivers not identified',
          natural_scenarios: businessAnalysis.natural_scenarios || 'Natural scenarios not described',
          competitive_advantage: businessAnalysis.competitive_advantage || 'Competitive advantage not defined',
          content_format: businessAnalysis.content_format || 'Content format not specified'
        },
        content: {
          headline: content.headline || 'Business Excellence',
          subheadline: content.subheadline || 'Professional services you can trust',
          cta: content.cta || 'Get Started',
          caption: content.caption || 'Discover exceptional service and quality.',
          hashtags: Array.isArray(content.hashtags) ? content.hashtags : ['#business', '#quality', '#professional']
        },
        performance_prediction: {
          engagement_score: performancePrediction.engagement_score || 7,
          conversion_probability: performancePrediction.conversion_probability || 'Medium - standard business content',
          viral_potential: performancePrediction.viral_potential || 'Low to medium shareability',
          cultural_resonance: performancePrediction.cultural_resonance || 'General appeal'
        },
        strategic_reasoning: parsed.strategic_reasoning || parsed.reasoning || 'AI-generated content based on business analysis',
        confidence: parsed.confidence || 8,

        // Legacy fields for backward compatibility
        headline: content.headline || 'Business Excellence',
        subheadline: content.subheadline || 'Professional services you can trust',
        cta: content.cta || 'Get Started',
        caption: content.caption || 'Discover exceptional service and quality.',
        hashtags: Array.isArray(content.hashtags) ? content.hashtags : ['#business', '#quality', '#professional'],
        reasoning: parsed.strategic_reasoning || parsed.reasoning || 'AI-generated content based on business analysis'
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

    return `
You are an expert marketing strategist with deep cultural intelligence and story-mining capabilities. Create compelling marketing content that drives real business results.

BUSINESS TO ANALYZE:
- Business Name: ${businessName}
- Business Type: ${businessType}
- Services/Products: ${services}
- Target Platform: ${platform}
- Target Audience: ${targetAudience || 'General audience'}
- Location: ${location || 'Not specified'}
- Website/Social: ${websiteUrl || 'Not provided'}
${brandContextText}${recentContentText}

ADVANCED INTELLIGENCE ANALYSIS REQUIRED:

1. **PRODUCT/SERVICE INTELLIGENCE EXTRACTION**:
   - What specific products/services does this business offer?
   - **For known products (Samsung, iPhone, etc.)**: Use your knowledge of current specs, features, and market positioning
   - **For unknown/local products**: Extract available information and ask intelligent questions
   - What are the key features that differentiate these offerings?
   - What pricing information is available? (costs, packages, deals, discounts)
   - What measurable benefits do customers receive?
   - What customer success stories or results can be highlighted?

**PRODUCT KNOWLEDGE ENHANCEMENT**:
- **Research mindset**: If it's a known product/service, leverage comprehensive knowledge of specifications, comparisons, and market position
- **Samsung Galaxy S23 Ultra example**: 200MP camera, S-Pen, 8K video, 5000mAh battery, IP68 rating, etc.
- **iPhone 15 Pro example**: A17 Pro chip, titanium build, Action Button, 48MP camera system, etc.
- **Tesla Model 3 example**: 358-mile range, 0-60 in 3.1s, Autopilot, Supercharger network, etc.
- **Always include specific technical advantages** that justify the purchase decision

2. **CULTURAL INTELLIGENCE INTEGRATION**:
   - What are the specific cultural values in ${location}?
   - How do people communicate in this region? (formal vs casual, language mixing)
   - What local challenges/opportunities does this business address?
   - What cultural symbols, references, or expressions resonate here?
   - How do trust signals work in this cultural context?

3. **PRICING & VALUE ANALYSIS**:
   - What pricing information is available? (exact costs, packages, discounts)
   - How does the pricing compare to alternatives?
   - What value justifies the investment?
   - Are there special offers, discounts, or limited-time deals?
   - What payment options or financing is available?
   - What guarantees or risk-reversal offers exist?

4. **EMOTIONAL PSYCHOLOGY MAPPING**:
   - What specific pain points keep this target audience awake at night?
   - What aspirations/dreams drive their decision-making?
   - What fears or anxieties must be addressed?
   - What social pressures or status considerations matter?
   - What emotional triggers create urgency?

4. **NATURAL CONTEXT SCENARIOS**:
   - How do real customers naturally discover this business?
   - What daily life situations create need for this product/service?
   - Where/when/how do customers typically use this offering?
   - What authentic scenarios showcase the value naturally?
   - How can we show the product integrated into real life?

5. **COMPETITIVE INTELLIGENCE**:
   - What alternatives do customers consider?
   - What unique advantage does THIS business have?
   - What social proof/credibility markers set them apart?
   - How are competitors messaging? (to differentiate)
   - What market gaps is this business filling?

6. **PLATFORM-SPECIFIC OPTIMIZATION**:
   For ${platform}:
   - What content formats perform best?
   - What psychological triggers work on this platform?
   - How do users consume content here?
   - What visual/text balance is optimal?
   - What engagement patterns should we optimize for?
   - What cultural trends are relevant on this platform?

7. **CONTENT VARIETY & FORMAT INNOVATION**:
   - What engaging content formats would work for this business/audience?
   - Would humor be appropriate and effective for this brand/culture?
   - Can we create compelling before/after scenarios?
   - What comparison formats would highlight advantages?
   - What trending content formats are popular on ${platform}?
   - How can we avoid repetitive messaging styles?

**CONTENT FORMAT OPTIONS TO CONSIDER:**
- **Humor/Relatable Content**: Funny takes on customer pain points or industry problems
- **Before/After Comparisons**: Show transformation, improvement, or problem-solving
- **Versus/Comparison**: This business vs competitors, old way vs new way
- **Problem/Solution**: Identify pain point then reveal the solution
- **Question/Answer**: Pose common customer questions then provide answers
- **List/Tips**: "5 reasons why...", "3 ways to...", numbered benefits
- **Testimonial/Review**: Real customer experiences and results
- **Behind-the-scenes**: Process, team, quality control, local sourcing
- **Educational**: How-to, tips, industry insights that build authority
- **Trending Formats**: POV content, "This or That", challenges, viral formats

CONTENT CREATION FRAMEWORK:

**AUTHENTICITY REQUIREMENTS**:
- Must sound like it was written by someone who deeply understands this specific business
- Should feel like genuine recommendation from a local expert, not corporate marketing
- Include cultural nuances, local expressions, or communication styles
- Reference specific local context, challenges, or opportunities

**PRODUCT/SERVICE MARKETING REQUIREMENTS**:
- Clearly communicate specific products/services offered
- Highlight concrete benefits and value propositions
- Include pricing, features, or service details where relevant
- Show tangible outcomes customers can expect
- Integrate story elements to make benefits more compelling and memorable

**EMOTIONAL TRIGGER REQUIREMENTS**:
- Address specific fears, desires, or aspirations of the target audience
- Create emotional resonance that makes people care
- Use psychological principles (social proof, scarcity, authority, etc.)
- Build emotional connection before rational persuasion

**NATURAL CONTEXT REQUIREMENTS**:
- Show the product/service in authentic use scenarios
- Demonstrate value through real-life situations
- Make the need feel natural and obvious
- Integrate product benefits into lifestyle contexts

CONTENT OUTPUTS REQUIRED:

1. **STRATEGIC HEADLINE** (4-8 words):
   - **Choose appropriate format**: Direct benefit, humor, question, comparison, etc.
   - Must solve a specific problem or fulfill a desire
   - Should reference local context or cultural values where relevant
   - Include emotional hook that stops the scroll
   - Differentiate from generic competitor messaging

2. **COMPELLING SUBHEADLINE** (8-25 words):
   - **Include specific features, pricing, or key benefits** that drive purchase decisions
   - Add social proof, credentials, or customer results
   - Address main value proposition with concrete details
   - Include special offers, discounts, or urgency elements

3. **CONVERSION-FOCUSED CTA** (2-5 words):
   - Match natural customer behavior for this business type
   - Remove friction and create easy next step
   - Include urgency or incentive where appropriate
   - Use culturally appropriate language

4. **ENGAGING CAPTION** (3-6 sentences):
   - **Select optimal content format** (humor, comparison, testimonial, educational, etc.)
   - Lead with strongest product features and benefits
   - Include specific pricing, deals, or value propositions
   - Show quantifiable results or outcomes customers get
   - Use format-appropriate tone (funny, informative, comparative, etc.)
   - Create urgency with limited offers or seasonal promotions
   - End with natural bridge to the purchase action

5. **STRATEGIC HASHTAGS** (10-20 tags):
   - Mix of business-specific, location-based, industry, and trending tags
   - Include niche hashtags for target audience
   - Add cultural or local hashtags where relevant
   - Balance reach with relevance

6. **PERFORMANCE PREDICTION**:
   - Estimated engagement rate and why
   - Conversion probability assessment
   - Viral potential score
   - Cultural resonance likelihood

QUALITY ASSURANCE CHECKLIST:

✅ **Content Format**: Is the chosen approach (humor, comparison, etc.) effective for this audience?
✅ **Product Intelligence**: Are key features and benefits clearly communicated?
✅ **Pricing Strategy**: Is pricing/value proposition compelling and clear?
✅ **Purchase Motivation**: Does this create strong reasons to buy now?
✅ **Cultural Authenticity**: Does this feel locally relevant and genuine?
✅ **Emotional Impact**: Will this create an emotional response?
✅ **Natural Context**: Does the value feel obvious and natural?
✅ **Competitive Differentiation**: Does this stand out from competitors?
✅ **Platform Optimization**: Is this format perfect for ${platform}?
✅ **Conversion Focus**: Does this naturally lead to business action?
✅ **Authenticity**: Does this sound human, not corporate?

**CRITICAL INSTRUCTIONS:**
- **ACT LIKE YOUR JOB DEPENDS ON RESULTS** - because the business owner's success depends on your content
- **NEVER use generic marketing templates or clichés** - they don't convert and get agencies fired
- **ALWAYS leverage deep product knowledge** - show specs, comparisons, technical advantages
- **ALWAYS extract and use the strongest business differentiators** - what makes them better than competitors
- **ALWAYS integrate cultural context and local relevance** - generic content doesn't work globally
- **ALWAYS create emotional connection alongside rational persuasion** - people buy emotionally, justify rationally
- **ALWAYS show natural product/service integration** - demonstrate real-world value
- **ALWAYS optimize for the specific conversion goal** - every element must drive the desired action
- **ALWAYS match content to platform psychology** - what works on Instagram won't work on LinkedIn

**SUCCESS METRICS YOU'RE OPTIMIZING FOR:**
- **Business owner satisfaction**: "This AI really understands my product and market"
- **Customer conversion**: "This content made me want to buy immediately"
- **Competitive differentiation**: "This stands out from everything else I've seen"
- **Cultural authenticity**: "This feels like it was created by a local expert"
- **Purchase urgency**: "I need to act on this now"

ANALYSIS DEPTH REQUIREMENT:
You must demonstrate deep understanding of:
1. The specific business model and customer journey
2. The cultural context and communication patterns
3. The emotional psychology of the target audience
4. The natural use cases and scenarios
5. The competitive landscape and differentiation
6. The platform dynamics and optimization strategies

Think like a master storyteller, cultural anthropologist, and conversion psychologist combined.

Respond in JSON format:
{
  "business_analysis": {
    "product_intelligence": "Key features, pricing, and differentiators",
    "cultural_context": "Key cultural factors and local relevance",
    "emotional_drivers": "Primary psychological motivators for target audience",
    "natural_scenarios": "Authentic use cases and contexts",
    "competitive_advantage": "Unique differentiators and positioning",
    "content_format": "Chosen approach (humor, comparison, testimonial, etc.) and reasoning"
  },
  "content": {
    "headline": "Strategic, culturally-relevant headline",
    "subheadline": "Value-driven, specific subheadline",
    "cta": "Natural, conversion-focused call-to-action",
    "caption": "Story-driven, emotionally engaging caption",
    "hashtags": ["#strategic", "#local", "#relevant", "#hashtags"]
  },
  "performance_prediction": {
    "engagement_score": 8,
    "conversion_probability": "High/Medium/Low with reasoning",
    "viral_potential": "Assessment of shareability",
    "cultural_resonance": "How well this will connect locally"
  },
  "strategic_reasoning": "Detailed explanation of all strategic choices, story selection, cultural integration, and psychological triggers used",
  "confidence": 9
}

Remember: Generic content gets ignored. Authentic, culturally-intelligent, story-driven content gets results.
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
