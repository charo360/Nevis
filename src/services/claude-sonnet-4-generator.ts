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
  // In-memory diversity memory: last N outputs per brand+platform
  private static recentOutputs: Record<string, Array<{ headline: string; subheadline: string; cta: string; caption: string }>> = {};

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

  private static keyFor(request: ClaudeContentRequest) {
    return `${request.businessName}::${request.platform}`.toLowerCase();
  }

  private static normalize(text: string): string[] {
    const stop = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'for', 'of', 'in', 'on', 'with', 'at', 'by', 'from', 'your', 'you', 'our', 'their', 'is', 'are', 'be', 'this', 'that', 'it', 'as']);
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w && !stop.has(w));
  }

  private static jaccard(a: string, b: string): number {
    const A = new Set(this.normalize(a));
    const B = new Set(this.normalize(b));
    if (A.size === 0 && B.size === 0) return 0;
    let inter = 0;
    for (const w of A) if (B.has(w)) inter++;
    const union = A.size + B.size - inter;
    return union === 0 ? 0 : inter / union;
  }

  private static corporateBuzzwords = [
    'seamless', 'reimagined', 'unleashed', 'cutting-edge', 'innovative solutions', 'empower', 'world-class', 'redefine', 'experience the future', 'next-gen', 'best-in-class', 'synergy', 'holistic', 'reimagine', 'revolutionize', 'frictionless'
  ];

  private static containsBuzzwords(text: string): string[] {
    const lower = (text || '').toLowerCase();
    return this.corporateBuzzwords.filter(b => lower.includes(b));
  }

  private static getAvoidSnippet(request: ClaudeContentRequest): string {
    const key = this.keyFor(request);
    const prev = this.recentOutputs[key] || [];
    if (prev.length === 0) return '';
    const last3 = prev.slice(-3);
    const lines: string[] = [];
    lines.push('DO NOT REPEAT OR PARAPHRASE any of the following previous content (avoid their vocabulary, structure, phrases):');
    last3.forEach((o, i) => {
      lines.push(`- Prev#${i + 1} Headline: "${o.headline}"`);
      if (o.subheadline) lines.push(`- Prev#${i + 1} Sub: "${o.subheadline}"`);
      lines.push(`- Prev#${i + 1} CTA: "${o.cta}"`);
    });
    return lines.join('\n');
  }

  private static rememberOutput(request: ClaudeContentRequest, out: { headline: string; subheadline: string; cta: string; caption: string }) {
    const key = this.keyFor(request);
    const arr = this.recentOutputs[key] || (this.recentOutputs[key] = []);
    arr.push(out);
    if (arr.length > 8) arr.shift();
  }

  private static tooSimilar(request: ClaudeContentRequest, out: { headline: string; subheadline: string; caption: string }): { similar: boolean; reasons: string[] } {
    const key = this.keyFor(request);
    const prev = this.recentOutputs[key] || [];
    const reasons: string[] = [];
    for (const p of prev) {
      const hSim = this.jaccard(out.headline, p.headline);
      const sSim = this.jaccard(out.subheadline || '', p.subheadline || '');
      const cSim = this.jaccard(out.caption || '', p.caption || '');
      if (hSim > 0.55) reasons.push(`Headline too similar (${(hSim * 100).toFixed(0)}%) to "${p.headline}"`);
      if (sSim > 0.5) reasons.push(`Subheadline too similar (${(sSim * 100).toFixed(0)}%)`);
      if (cSim > 0.4) reasons.push(`Caption too similar (${(cSim * 100).toFixed(0)}%)`);
      if (reasons.length) break;
    }
    const buzz = [...this.containsBuzzwords(out.headline), ...this.containsBuzzwords(out.subheadline || ''), ...this.containsBuzzwords(out.caption || '')];
    if (buzz.length) reasons.push(`Contains corporate buzzwords: ${Array.from(new Set(buzz)).join(', ')}`);
    return { similar: reasons.length > 0, reasons };
  }

  /**
   * Generate content using Claude Sonnet 4 ONLY - NO FALLBACKS
   */
  static async generateContent(request: ClaudeContentRequest): Promise<ClaudeContentResponse> {
    console.log('🧠 [Claude Sonnet 4] Generating content for:', {
      businessName: request.businessName,
      businessType: request.businessType,
      platform: request.platform,
      location: request.location,
      useLocalLanguage: request.useLocalLanguage
    });

    // Platform-specific hashtag count
    const hashtagCount = request.platform.toLowerCase() === 'instagram' ? 5 : 3;

    const anthropic = this.getAnthropicClient();
    const prompt = this.buildClaudePrompt(request, hashtagCount, this.getAvoidSnippet(request));

    // Log prompt details for debugging
    console.log('🔍 [Claude Sonnet 4] Prompt length:', prompt.length);
    console.log('🔍 [Claude Sonnet 4] Prompt preview (first 500 chars):', prompt.substring(0, 500) + '...');
    console.log('🔍 [Claude Sonnet 4] Prompt preview (last 500 chars):', '...' + prompt.substring(prompt.length - 500));

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000, // Increased for longer responses
      temperature: 0.98, // Even higher temperature for maximum creativity
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

    // Parse JSON response with improved error handling
    let jsonContent = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonContent.includes('```json')) {
      const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
    } else if (jsonContent.includes('```')) {
      const jsonMatch = jsonContent.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
    }

    // Handle multiple JSON objects - take the first complete one
    const jsonStart = jsonContent.indexOf('{');
    if (jsonStart === -1) {
      throw new Error('No JSON object found in Claude response');
    }

    // Find the end of the first complete JSON object
    let braceCount = 0;
    let jsonEnd = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = jsonStart; i < jsonContent.length; i++) {
      const char = jsonContent[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
      }
    }

    if (jsonEnd === -1) {
      throw new Error('Incomplete JSON object in Claude response');
    }

    jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
    console.log('🔍 [Claude Sonnet 4] Extracted first JSON object:', jsonContent.substring(0, 200) + '...');

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('❌ [Claude Sonnet 4] JSON parse error:', parseError);
      console.error('❌ [Claude Sonnet 4] Raw content:', jsonContent);
      throw new Error(`Failed to parse Claude response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

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

    // Diversity check and optional single retry
    let { similar, reasons } = this.tooSimilar(request, { headline: parsed.headline, subheadline: parsed.subheadline || '', caption: parsed.caption || '' });
    if (similar) {
      console.warn('⚠️ [Claude Sonnet 4] Similarity/buzzword issues detected, retrying once with stronger constraints:', reasons);
      const avoid = (this.getAvoidSnippet(request) ? this.getAvoidSnippet(request) + '\n' : '') +
        'Additional reasons to avoid: ' + reasons.join('; ');
      const retryPrompt = this.buildClaudePrompt(request, hashtagCount, avoid);
      console.log('🔁 [Claude Sonnet 4] Retrying with updated prompt (length):', retryPrompt.length);
      const retryResp = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.98,
        messages: [{ role: 'user', content: retryPrompt }]
      });
      const retryContent = retryResp.content[0];
      if (retryContent.type === 'text') {
        let retryText = retryContent.text.trim();
        if (retryText.includes('```json')) {
          const m = retryText.match(/```json\s*([\s\S]*?)\s*```/);
          if (m) retryText = m[1].trim();
        } else if (retryText.includes('```')) {
          const m = retryText.match(/```\s*([\s\S]*?)\s*```/);
          if (m) retryText = m[1].trim();
        }
        const s = retryText.indexOf('{');
        let e = -1, bc = 0, ins = false, esc = false;
        for (let i = s; i < retryText.length; i++) {
          const ch = retryText[i];
          if (esc) { esc = false; continue; }
          if (ch === '\\') { esc = true; continue; }
          if (ch === '"') { ins = !ins; continue; }
          if (!ins) {
            if (ch === '{') bc++;
            else if (ch === '}') { bc--; if (bc === 0) { e = i; break; } }
          }
        }
        if (s !== -1 && e !== -1) {
          const retryJson = retryText.substring(s, e + 1);
          try {
            const p2 = JSON.parse(retryJson);
            if (p2.hashtags && p2.hashtags.length !== hashtagCount) {
              if (p2.hashtags.length > hashtagCount) p2.hashtags = p2.hashtags.slice(0, hashtagCount);
            }
            parsed = p2;
            ({ similar, reasons } = this.tooSimilar(request, { headline: parsed.headline, subheadline: parsed.subheadline || '', caption: parsed.caption || '' }));
          } catch { }
        }
      }
    }

    if (similar) {
      console.warn('⚠️ [Claude Sonnet 4] Still similar after retry:', reasons);
    } else {
      this.rememberOutput(request, { headline: parsed.headline, subheadline: parsed.subheadline || '', cta: parsed.cta, caption: parsed.caption || '' });
    }

    return {
      headline: parsed.headline,
      subheadline: parsed.subheadline || `Quality ${request.businessType.toLowerCase()} services`,
      cta: parsed.cta,
      caption: parsed.caption,
      hashtags: parsed.hashtags || []
    };
  }



  private static buildClaudePrompt(request: ClaudeContentRequest, hashtagCount: number, avoidSnippet?: string): string {
    const languageInstruction = request.useLocalLanguage && request.location
      ? `- Use English with natural local language elements appropriate for ${request.location} (mix English with local language for authentic feel)`
      : `- Use English only, do not use local language`;

    const brandContextText = request.brandContext
      ? `\nBrand Context:\n- Colors: ${request.brandContext.colors?.join(', ') || 'Not specified'}\n- Personality: ${request.brandContext.personality || 'Not specified'}\n- Values: ${request.brandContext.values || 'Not specified'}`
      : '';

    // EXTREME RANDOMIZATION FOR VARIETY
    const randomSeed = Math.floor(Math.random() * 100000);
    const timestamp = Date.now();
    const sessionId = Math.random().toString(36).substring(2, 15);

    // Multiple creative personality types to force different approaches
    const creativePersonalities = [
      "disruptive innovator who challenges conventional thinking",
      "empathetic storyteller who connects deeply with human emotions",
      "data-driven strategist who focuses on measurable outcomes",
      "cultural anthropologist who understands local nuances",
      "conversion psychologist who triggers specific behaviors",
      "brand architect who builds lasting emotional connections",
      "community builder who emphasizes social impact",
      "trend forecaster who spots emerging opportunities",
      "problem-solving detective who uncovers hidden pain points",
      "creative rebel who breaks marketing rules for impact"
    ];

    const selectedPersonality = creativePersonalities[Math.floor(Math.random() * creativePersonalities.length)];

    // Different content angles to force variety
    const contentAngles = [
      "Focus on the transformation story - before vs after",
      "Highlight the unique innovation that sets this apart",
      "Emphasize the community impact and social good",
      "Show the expertise and authority in the field",
      "Focus on the convenience and time-saving benefits",
      "Highlight the emotional satisfaction customers get",
      "Emphasize the status and prestige associated",
      "Focus on the problem-solving capabilities",
      "Show the future vision and forward-thinking approach",
      "Highlight the personal touch and human connection"
    ];

    // 15 enforced content formats to avoid templates
    const contentFormats = [
      'Problem/Solution',
      'Feature Focus',
      'Humor/Relatable',
      'Comparison',
      'Social Proof (generic, no names)',
      'How-To (3-step)',
      'Myth vs Fact',
      'FAQ (3 Q&A)',
      'Data Point Insight',
      'Limited-Time Offer (ethical, no fake scarcity)',
      'Community Spotlight (no real names)',
      'Local Slang/Language Mix',
      'Micro Case Study (no names)',
      'Objection Handling',
      'Checklist (short, practical)'
    ];

    const selectedAngle = contentAngles[Math.floor(Math.random() * contentAngles.length)];
    const selectedFormat = contentFormats[Math.floor(Math.random() * contentFormats.length)];

    // Banned phrases from previous generations to prevent repetition
    const bannedPhrases = [
      "Money Moves", "Your Fingertips", "At Your", "Built in", "App Idea",
      "Smart Money Moves", "Nairobi's Hustlers", "Transform your business",
      "Digital Journey", "Growth Stories", "Move Millions", "Latest Tech",
      "Flexible Payment", "Delivered Today", "Rising entrepreneurs",
      "Secure digital payments", "Management tools designed"
    ];

    return `🎯 CREATIVE SESSION #${randomSeed} | TIMESTAMP: ${timestamp} | SESSION: ${sessionId}

🚨 EXTREME ANTI-REPETITION PROTOCOL ACTIVATED 🚨

MANDATORY UNIQUENESS DIRECTIVE: You are a ${selectedPersonality} creating COMPLETELY ORIGINAL content.

CREATIVE ANGLE FOR THIS SESSION: ${selectedAngle}

FORMAT FOR THIS SESSION: ${selectedFormat}

⚠️ CRITICAL REPETITION WARNING ⚠️
The following phrases are ABSOLUTELY BANNED and must NEVER appear in your response:
${bannedPhrases.map(phrase => `❌ "${phrase}"`).join('\n')}
${avoidSnippet ? `\n🚫 AVOID THESE PREVIOUS PATTERNS:\n${avoidSnippet}\n` : ''}
🎯 UNIQUENESS REQUIREMENTS:
- Every word choice must be deliberate and different
- Headlines must use completely different structures and vocabulary
- Subheadlines must approach the value proposition from new angles
- CTAs must vary in tone, urgency, and approach
- Captions must tell different stories with different emotional hooks
- NO phrase, structure, or pattern can repeat from previous sessions

🔄 VARIETY ENFORCEMENT:
- Use synonyms and alternative expressions
- Vary sentence structures and lengths
- Change emotional appeals and psychological triggers
- Rotate between different cultural references
- Alternate between formal and casual tones
- Mix different persuasion techniques

You are an expert marketing strategist with deep cultural intelligence and story-mining capabilities. Create compelling marketing content that drives real business results.

BUSINESS TO ANALYZE:
- Business Name: ${request.businessName}
- Business Type: ${request.businessType}
- Services/Products: ${request.services}
- Target Platform: ${request.platform}
- Target Audience: ${request.targetAudience || 'General audience'}
- Location: ${request.location || 'Not specified'}
- Website/Social: Not provided
${brandContextText}

ADVANCED INTELLIGENCE ANALYSIS REQUIRED:

1. **STORY MINING & NARRATIVE EXTRACTION** (For Deep Understanding):

   **PURPOSE**: Extract these details to create SPECIFIC, AUTHENTIC, COMPELLING content. Just avoid mentioning real founder names since visuals are AI-generated.

   Research Questions (Extract Real Details):
   - What's the compelling SPECIFIC mission behind this business?
   - What EXACT problem does this business solve?
   - What UNIQUE innovation or approach distinguishes them?
   - What MEASURABLE impact are they having?
   - What REAL transformation stories do customers have?

   **CONTENT APPROACH**:
   ✅ **BE SPECIFIC AND REAL** (Based on Provided Information ONLY):
      - Extract actual business details from given materials
      - Use ONLY statistics/achievements provided by the business
      - Reference locations where they actually operate
      - Mention features/services they explicitly offer
      - Include certifications ONLY if stated by business
      - Use impact data ONLY if provided

   🚨 **NEVER FABRICATE OR ASSUME**:
      - Don't invent statistics or customer numbers
      - Don't add certifications not mentioned
      - Don't claim geographic reach not stated
      - Don't make up partnerships or awards
      - Don't exaggerate capabilities
      - If information is missing, focus on benefits without specific claims

   ❌ **ONLY AVOID**:
      - Specific founder/owner names (e.g., "Francis Thoya", "John Smith")
      - Personal founder stories requiring showing real people
      - Named customer testimonials (use "customers", "members" instead)

   ✅ **PERFECTLY ACCEPTABLE TO SAY**:
      - "Created by a ${request.location} entrepreneur to fight malnutrition"
      - "Built by local innovators who saw businesses struggling"
      - "Started by local entrepreneurs who wanted to reduce waste"
      - "This ${request.location}-based team noticed a market gap and..."
      - Specific mission based on business type and services
      - Real impact based on provided information only
      - Actual innovation based on services offered

2. **CULTURAL INTELLIGENCE INTEGRATION**:
   - What are the specific cultural values in ${request.location}?
   - How do people communicate in this region? (formal vs casual, language mixing)
   - What local challenges/opportunities does this business address?
   - What cultural symbols, references, or expressions resonate here?
   - How do trust signals work in this cultural context?

3. **EMOTIONAL PSYCHOLOGY MAPPING**:
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
   For ${request.platform}:
   - What content formats perform best?
   - What psychological triggers work on this platform?
   - How do users consume content here?
   - What visual/text balance is optimal?
   - What engagement patterns should we optimize for?
   - What cultural trends are relevant on this platform?

7. **CONVERSION PATHWAY ANALYSIS**:
   - What is the most natural next step for a prospect?
   - How do customers in this industry typically make decisions?
   - What friction points need to be addressed?
   - What trust signals are required for conversion?
   - What urgency factors naturally exist?

CONTENT CREATION FRAMEWORK:

**🚨 CRITICAL AUTHENTICITY REQUIREMENT**:
Since all images are AI-generated, content must be SPECIFIC and REAL about the business, but NEVER mention actual people's names.

❌ **NEVER Include**:
- Specific founder names (e.g., "Meet Francis Thoya", "John Smith created")
- Named customer testimonials (e.g., "Sarah from Nairobi says")
- Claims requiring real people's faces/identities

✅ **ALWAYS Be SPECIFIC About** (ONLY if verified from business information):
- Exact business mission and purpose (from their description)
- Real statistics and achievements (ONLY if provided by business)
- Actual location and community context (where they actually operate)
- Specific problems solved (based on their actual services)
- Unique innovations (that they actually claim/have)
- Measurable impact (ONLY if business provides these numbers)
- Real certifications (ONLY if explicitly mentioned by business)

🚨 **CRITICAL: NEVER FABRICATE OR ASSUME**:
- ❌ Don't add certifications not mentioned
- ❌ Don't invent statistics (e.g., "10,000+ customers" if not provided)
- ❌ Don't claim geographic coverage not mentioned
- ❌ Don't add features/benefits not explicitly stated
- ❌ Don't make up partnerships, awards, or credentials

✅ **ONLY USE INFORMATION THAT IS**:
- Explicitly stated in business description
- Clearly mentioned in provided materials
- Verifiable from given information
- If unsure, focus on general benefits without specific claims

**AUTHENTICITY REQUIREMENTS**:
- **BE SPECIFIC AND REAL**: Use actual business details, real context, specific locations, authentic value
- **NOT GENERIC TEMPLATES**: Every detail should reflect the actual business, not template marketing speak
- **DEEP UNDERSTANDING**: Sound like someone who intimately knows this specific business and industry
- **LOCAL AUTHENTICITY**: Include real cultural nuances, local expressions, specific community context
- **COMPELLING NARRATIVES**: Tell the real story of innovation, problem-solving, and impact
- **NO REPETITION**: Each piece must feel fresh, use different angles, vary language and approach

CONTENT OUTPUTS REQUIRED:

1. **STRATEGIC HEADLINE** (4-8 words):
   - Must solve a specific problem or fulfill a desire
   - Should reference local context or cultural values where relevant
   - Include emotional hook that stops the scroll
   - Differentiate from generic competitor messaging

2. **COMPELLING SUBHEADLINE** (8-25 words):
   - Expand on headline with specific value proposition
   - Include social proof, credentials, or unique advantage
   - Address main objection or concern
   - Create curiosity or urgency

3. **CONVERSION-FOCUSED CTA** (2-5 words):
   - Match natural customer behavior for this business type
   - Remove friction and create easy next step
   - Include urgency or incentive where appropriate
   - Use culturally appropriate language

4. **ENGAGING CAPTION** (3-6 sentences):
   - Tell a micro-story that illustrates the value
   - Include customer transformation or business impact
   - Connect emotionally with target audience challenges
   - Naturally lead to the CTA without being pushy

5. **STRATEGIC HASHTAGS** (exactly ${hashtagCount} tags):
   - Mix of business-specific, location-based, industry, and trending tags
   - Include niche hashtags for target audience
   - Add cultural or local hashtags where relevant
   - Balance reach with relevance

**CRITICAL INSTRUCTIONS:**
- NEVER use generic marketing templates or clichés
- ALWAYS extract and leverage the business mission (not personal stories)
- ALWAYS integrate cultural context and local relevance
- ALWAYS create emotional connection through product value, not founder stories
- ALWAYS show natural product/service integration
- ALWAYS differentiate from what competitors are saying
- ALWAYS match content to platform psychology
- ALWAYS optimize for the specific conversion goal
- **NEVER mention specific founder names, customer names, or real individuals**
- **NEVER create content requiring real testimonials or personal stories**

Think like a master storyteller, cultural anthropologist, and conversion psychologist combined.

Respond in JSON format with ONLY these fields:
{
  "format": "${selectedFormat}",
  "headline": "Strategic, culturally-relevant headline (4-8 words)",
  "subheadline": "Value-driven, specific subheadline (8-25 words)",
  "cta": "Natural, conversion-focused call-to-action (2-5 words)",
  "caption": "Story-driven, emotionally engaging caption (3-6 sentences)",
  "hashtags": [${Array(hashtagCount).fill('"#strategic"').join(', ')}]
}

Remember:
- Use ONLY verified information from business materials
- Be specific where you have facts, general where you don't
- NEVER fabricate statistics, certifications, or credentials
- Authentic, fact-based content gets results; fabricated claims destroy trust`;
  }
}
