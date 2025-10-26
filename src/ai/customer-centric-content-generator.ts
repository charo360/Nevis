/**
 * Customer-Centric Content Generator
 * Focuses on customer outcomes, not company features
 * Follows the winning formula: Hook → Promise → Proof → CTA
 */

import type { BrandProfile, Platform } from '@/lib/types';
import { getVertexAIClient } from '@/lib/services/vertex-ai-client';

interface CustomerCentricContent {
  hook: string;           // Grab attention with specific problem/benefit
  promise: string;        // What outcome/result you deliver
  proof: string;          // Why they should believe you
  cta: string;           // One clear next step
  headline: string;       // Compelling headline
  subheadline: string;    // Supporting subheadline
  caption: string;        // Full caption combining all elements
  hashtags: string[];     // Relevant hashtags
}

interface BusinessOutcome {
  problem: string;        // What pain point we solve
  solution: string;       // How we solve it
  result: string;         // What outcome they get
  proof: string;          // Why they should believe us
  urgency: string;        // Why act now
}

export class CustomerCentricContentGenerator {

  /**
   * Generate customer-focused content using the winning formula
   */
  static async generateContent(
    brandProfile: BrandProfile,
    platform: Platform,
    trendingData: any = {},
    useLocalLanguage: boolean = false,
    adConcept?: {
      name: string;
      setting: { category: string; description: string; };
      customer: { type: string; description: string; };
      visualStyle: { style: string; description: string; };
      benefit: { type: string; message: string; };
      emotionalTone: { tone: string; description: string; };
      format: { technique: string; structure: string; };
    }
  ): Promise<CustomerCentricContent> {

    console.log('🎯 [Customer-Centric] Starting outcome-focused content generation');

    // Step 1: AI-powered business outcome analysis (NO HARDCODING)
    const businessOutcome = await this.identifyBusinessOutcome(brandProfile);

    console.log('🧠 [Customer-Centric] AI identified business outcome:', {
      problem: businessOutcome.problem.substring(0, 40) + '...',
      result: businessOutcome.result.substring(0, 40) + '...'
    });

    // Step 2: Create customer-focused prompt using winning formula
    const prompt = this.buildCustomerCentricPrompt(
      brandProfile,
      platform,
      businessOutcome,
      trendingData,
      useLocalLanguage,
      adConcept
    );

    try {
      const result = await getVertexAIClient().generateText(prompt, 'gemini-2.5-flash', {
        temperature: 0.8,
        maxOutputTokens: 1000
      });

      const response = result.text;
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        console.log('✅ [Customer-Centric] Generated outcome-focused content:', {
          hook: parsed.hook?.substring(0, 50) + '...',
          promise: parsed.promise?.substring(0, 50) + '...',
          proof: parsed.proof?.substring(0, 50) + '...'
        });

        return {
          hook: parsed.hook || businessOutcome.problem,
          promise: parsed.promise || businessOutcome.result,
          proof: parsed.proof || businessOutcome.proof,
          cta: parsed.cta || this.getActionableCTA(brandProfile.businessType, businessOutcome),
          headline: parsed.headline || parsed.hook,
          subheadline: parsed.subheadline || parsed.promise,
          caption: parsed.caption || `${parsed.hook} ${parsed.promise} ${parsed.proof} ${parsed.cta}`,
          hashtags: parsed.hashtags || this.generateRelevantHashtags(brandProfile, platform, businessOutcome)
        };
      }

      // Fallback with business outcome structure
      return this.createFallbackContent(brandProfile, businessOutcome, platform);

    } catch (error) {
      console.error('❌ [Customer-Centric] Generation failed:', error);
      return this.createFallbackContent(brandProfile, businessOutcome, platform);
    }
  }

  /**
   * AI-powered business outcome analysis - NO HARDCODING
   * Uses AI to dynamically identify customer problems and outcomes
   */
  private static async identifyBusinessOutcome(brandProfile: BrandProfile): Promise<BusinessOutcome> {
    const businessType = brandProfile.businessType || 'professional services';
    const businessName = brandProfile.businessName || 'Our Company';
    const location = brandProfile.location || 'local area';
    const services = brandProfile.services || [];
    const websiteUrl = brandProfile.websiteUrl || '';

    // Randomly select content approach for variety
    const contentApproaches = ['Story', 'Education', 'Promo', 'Testimonial', 'Lifestyle'];
    const selectedApproach = contentApproaches[Math.floor(Math.random() * contentApproaches.length)];

    // AI prompt to force ULTRA-SPECIFIC, CONCRETE customer thinking with varied approaches
    const analysisPrompt = `You are a customer research expert analyzing ${businessName} (${businessType} in ${location}).

CONTENT APPROACH: Create a ${selectedApproach} style analysis.

${selectedApproach === 'Story' ? 'Focus on a specific customer journey - before struggling, after succeeding.' : ''}
${selectedApproach === 'Education' ? 'Focus on teaching customers something valuable they didn\'t know.' : ''}
${selectedApproach === 'Promo' ? 'Focus on a specific offer or promotion with clear value.' : ''}
${selectedApproach === 'Testimonial' ? 'Focus on a specific customer success story with real results.' : ''}
${selectedApproach === 'Lifestyle' ? 'Focus on how this business improves daily life with specific scenarios.' : ''}

MISSION: Identify the #1 most frustrating problem their customers face and the exact measurable outcome they deliver.

BUSINESS CONTEXT:
- Company: ${businessName}
- Industry: ${businessType}
- Location: ${location}
- Services: ${services.join(', ') || 'Not specified'}
- Website: ${websiteUrl || 'Not provided'}

ULTRA-SPECIFIC REQUIREMENTS:
1. PROBLEM must be a SPECIFIC frustration with details (not "need better X")
2. RESULT must include EXACT numbers (hours, days, %, KES, etc.)
3. PROOF must have CONCRETE evidence (customer count, success rate, guarantee)
4. NO GENERIC WORDS: Avoid "better", "quality", "proven", "superior", "solutions"
5. INCLUDE BEFORE/AFTER: Show the contrast between customer's situation before and after

CUSTOMER PAIN RESEARCH:
For ${businessType} businesses in ${location}, what is the #1 specific problem that:
- Costs them time/money daily?
- Keeps them frustrated?
- They would pay to solve immediately?

BEFORE/AFTER FRAMEWORK:
BEFORE: What specific struggle/frustration/waste does the customer experience?
AFTER: What specific improvement/result/benefit do they get?

YOUR TASK: Create SPECIFIC analysis for ${businessName} using ${selectedApproach} approach with clear before/after contrast.

Format as JSON:
{
  "problem": "Specific customer frustration as question with details (BEFORE situation)",
  "solution": "Exact mechanism/process ${businessName} uses to solve it",
  "result": "Measurable outcome with specific numbers/timeframes (AFTER situation)",
  "proof": "Concrete evidence with numbers, testimonials, or guarantees",
  "urgency": "Specific reason to act now (limited time, spots, price, etc.)",
  "approach": "${selectedApproach}"
}`;

    try {
      const result = await getVertexAIClient().generateText(analysisPrompt, 'gemini-2.5-flash', {
        temperature: 0.7,
        maxOutputTokens: 500
      });

      const response = result.text;
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate that we got specific, non-generic content
        const hasSpecificProblem = parsed.problem && !parsed.problem.toLowerCase().includes('better') && !parsed.problem.toLowerCase().includes('quality');
        const hasSpecificResult = parsed.result && (parsed.result.includes('%') || parsed.result.includes('hour') || parsed.result.includes('day') || /\d/.test(parsed.result));
        const hasSpecificProof = parsed.proof && /\d/.test(parsed.proof);

        if (hasSpecificProblem && hasSpecificResult && hasSpecificProof) {
          return {
            problem: parsed.problem,
            solution: parsed.solution || 'our specialized approach',
            result: parsed.result,
            proof: parsed.proof,
            urgency: parsed.urgency || 'limited availability'
          };
        } else {
          console.warn('⚠️ [Customer-Centric] AI generated generic content, rejecting:', parsed);
          throw new Error('AI generated generic content - failing to force better analysis');
        }
      }
    } catch (error) {
      console.error('❌ [Customer-Centric] AI outcome analysis failed:', error);
    }

    // AI-powered fallback - still dynamic, not hardcoded
    return this.generateDynamicFallback(brandProfile);
  }

  /**
   * Generate specific fallback avoiding generic language - NO WORD SALAD
   * CRITICAL: If AI analysis fails, we should fail gracefully, not generate bad content
   */
  private static generateDynamicFallback(brandProfile: BrandProfile): BusinessOutcome {
    // Instead of generating bad fallback content, throw an error
    // This forces the system to use a different approach or fail gracefully
    throw new Error('AI business analysis failed - cannot generate customer-centric content without proper analysis');
  }

  /**
   * Build customer-centric prompt using the winning formula
   */
  private static buildCustomerCentricPrompt(
    brandProfile: BrandProfile,
    platform: Platform,
    businessOutcome: BusinessOutcome,
    trendingData: any,
    useLocalLanguage: boolean,
    adConcept?: {
      name: string;
      setting: { category: string; description: string; };
      customer: { type: string; description: string; };
      visualStyle: { style: string; description: string; };
      benefit: { type: string; message: string; };
      emotionalTone: { tone: string; description: string; };
      format: { technique: string; structure: string; };
    }
  ): string {

    const businessName = brandProfile.businessName || 'Our Company';
    const location = brandProfile.location || 'your area';
    const businessType = brandProfile.businessType || 'professional services';

    return `You are a direct response copywriter. Create a high-converting ${platform} ad for ${businessName}.

${adConcept ? `
🎯 6-DIMENSIONAL AD CONCEPT: ${adConcept.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SETTING:     ${adConcept.setting.category} - ${adConcept.setting.description}
CUSTOMER:    ${adConcept.customer.type} - ${adConcept.customer.description}
STYLE:       ${adConcept.visualStyle.style} - ${adConcept.visualStyle.description}
BENEFIT:     ${adConcept.benefit.type} - ${adConcept.benefit.message}
TONE:        ${adConcept.emotionalTone.tone} - ${adConcept.emotionalTone.description}
FORMAT:      ${adConcept.format.technique} - ${adConcept.format.structure}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTENT STRATEGY BASED ON 6D CONCEPT:
- SETTING: Create content that fits the ${adConcept.setting.category} environment
- CUSTOMER: Target ${adConcept.customer.type} specifically with relevant messaging
- BENEFIT: Focus on ${adConcept.benefit.type} benefits (${adConcept.benefit.message})
- TONE: Use ${adConcept.emotionalTone.tone} emotional tone (${adConcept.emotionalTone.description})
- FORMAT: Structure content as ${adConcept.format.technique} (${adConcept.format.structure})

CRITICAL: Your content must integrate ALL 6 dimensions cohesively to create a unified ad concept.
` : `
CONTENT APPROACH: ${businessOutcome.approach || 'Story'} style
${businessOutcome.approach === 'Story' ? 'Tell a specific customer journey - show the before/after transformation.' : ''}
${businessOutcome.approach === 'Education' ? 'Teach customers something valuable they didn\'t know about their problem.' : ''}
${businessOutcome.approach === 'Promo' ? 'Present a specific offer or promotion with clear value and urgency.' : ''}
${businessOutcome.approach === 'Testimonial' ? 'Feature a specific customer success story with real results.' : ''}
`}
${businessOutcome.approach === 'Lifestyle' ? 'Show how this business improves daily life with specific scenarios.' : ''}

CRITICAL MISSION: Address a SPECIFIC customer problem with MEASURABLE outcomes using BEFORE/AFTER contrast.

CUSTOMER RESEARCH INSIGHTS:
- BEFORE Problem: ${businessOutcome.problem}
- Solution Method: ${businessOutcome.solution}
- AFTER Result: ${businessOutcome.result}
- Concrete Proof: ${businessOutcome.proof}
- Urgency Factor: ${businessOutcome.urgency}

BEFORE/AFTER FRAMEWORK:
Show the clear contrast between customer's frustrating BEFORE situation and their improved AFTER situation.

MANDATORY REQUIREMENTS:
1. NO TEMPLATES: Create completely original content based on the specific business context
2. NO WORD SALAD: Don't repeat the same words/phrases multiple times
3. NO EMPTY CLAIMS: Every claim needs specific proof (numbers, testimonials, guarantees)
4. NO VAGUE LANGUAGE: Be specific about WHO, WHAT, WHEN, HOW MUCH
5. DYNAMIC CTA: Create a contextually appropriate call-to-action (not generic "Contact Us")

WINNING FORMULA:
1. HOOK: Specific customer frustration (BEFORE situation with details)
2. PROMISE: Exact measurable result (AFTER situation with numbers)
3. PROOF: Concrete evidence (customer count, success rate, guarantee, testimonial)
4. CTA: Contextually appropriate action that matches the urgency and business type

EXAMPLES OF BEFORE/AFTER CONTRAST:
❌ VAGUE: "Need better financial solutions? Get superior results."
✅ SPECIFIC: "BEFORE: Waiting 7 days for payments. AFTER: Get paid in 24 hours with Paya."

❌ VAGUE: "Quality healthcare for your family."
✅ SPECIFIC: "BEFORE: 3-hour hospital queues. AFTER: See a doctor in 15 minutes from home."

${useLocalLanguage ? `
🌍 CRITICAL LOCAL LANGUAGE INTEGRATION FOR ${location.toUpperCase()}:
- MANDATORY: Mix English (70%) with local language elements (30%)
- NATURAL INTEGRATION: Don't force it - only add when it flows naturally
- CONTEXTUAL USE: Match local language to business type and audience
- VARIETY: Use different local phrases for each generation (avoid repetition)

📍 LOCATION-SPECIFIC LANGUAGE ELEMENTS:
${this.getLocationSpecificLanguageInstructions(location)}

🎯 INTEGRATION EXAMPLES:
- Headlines: "Quality Tech Solutions" → "Quality Tech Solutions, Karibu!" (Kenya)
- Subheadlines: "Fast delivery across the city" → "Fast delivery across Nairobi, Haraka sana!"
- Captions: Mix English sentences with local expressions naturally
- CTAs: Use local action words when appropriate

⚠️ CRITICAL: Local language should enhance, not confuse. Keep it natural and contextual.
` : ''}

CTA INSTRUCTIONS:
Create a specific, actionable CTA that matches:
- The business type (${businessType})
- The urgency factor (${businessOutcome.urgency})
- The content approach (${businessOutcome.approach || 'Story'})
Examples: "Apply Today", "Book Free Consultation", "Start 7-Day Trial", "Get Instant Quote"

QUALITY CHECKLIST - Your response MUST pass these tests:
✅ Does it show clear BEFORE/AFTER contrast?
✅ Does the hook address a SPECIFIC frustration (not generic "need better X")?
✅ Does the promise include MEASURABLE outcomes (time, money, percentage)?
✅ Does the proof include CONCRETE evidence (numbers, testimonials, guarantees)?
✅ Is the CTA contextually appropriate and actionable (not generic)?
✅ Are you avoiding word repetition and circular logic?
✅ Would a 12-year-old understand exactly what problem you solve and what they get?

Format as JSON:
{
  "hook": "Specific customer frustration or desired outcome with numbers/details",
  "promise": "Exact measurable result with timeframe/amount/percentage",
  "proof": "Concrete evidence - customer count, success rate, guarantee, testimonial",
  "cta": "Clear action with urgency/incentive - not generic 'Contact Us'",
  "headline": "Hook + Promise combined naturally (avoid word repetition)",
  "subheadline": "Proof element that builds credibility and trust",
  "caption": "Natural flow: Problem → Solution → Proof → Action (no word salad)",
  "hashtags": ["#outcome-focused", "#specific-to-business", "#local-relevant"]
}`;
  }

  /**
   * Generate AI-driven CTA - NO TEMPLATES, completely dynamic
   * Let AI determine the best call-to-action based on context
   */
  private static getActionableCTA(businessType?: string, businessOutcome?: BusinessOutcome): string {
    // Let AI handle CTA generation in the main prompt - no hardcoded templates
    // This is just a fallback that should rarely be used
    return 'Learn More';
  }

  /**
   * FIXED: Get location-specific language instructions for proper local language integration
   */
  private static getLocationSpecificLanguageInstructions(location: string): string {
    const locationKey = location.toLowerCase();

    if (locationKey.includes('kenya')) {
      return `- SWAHILI ELEMENTS: "Karibu" (welcome), "Asante" (thank you), "Haraka" (fast), "Poa" (cool/good), "Mambo" (what's up)
- BUSINESS CONTEXT: "Biashara" (business), "Huduma" (service), "Kazi" (work), "Pesa" (money)
- GREETINGS: "Jambo" (hello), "Habari" (how are you), "Sawa" (okay/fine)
- EXPRESSIONS: "Hakuna matata" (no problem), "Pole pole" (slowly/carefully), "Twende" (let's go)`;
    }

    if (locationKey.includes('nigeria')) {
      return `- PIDGIN ELEMENTS: "How far?" (how are you), "Wetin dey happen?" (what's happening), "No wahala" (no problem)
- BUSINESS CONTEXT: "Business dey boom" (business is booming), "Make we go" (let's go), "Sharp sharp" (quickly)
- GREETINGS: "Bawo" (Yoruba hello), "Ndewo" (Igbo hello), "Sannu" (Hausa hello)
- EXPRESSIONS: "E go better" (it will be better), "God dey" (God is there), "Correct" (right/good)`;
    }

    if (locationKey.includes('ghana')) {
      return `- TWI ELEMENTS: "Akwaaba" (welcome), "Medaase" (thank you), "Yie" (good), "Adwo" (peace)
- BUSINESS CONTEXT: "Adwuma" (work), "Sika" (money), "Dwuma" (business)
- GREETINGS: "Maakye" (good morning), "Maaha" (good afternoon)
- EXPRESSIONS: "Ɛyɛ" (it's good), "Ampa" (truly), "Sɛ ɛyɛ a" (if it's good)`;
    }

    if (locationKey.includes('south africa')) {
      return `- MIXED ELEMENTS: "Howzit" (how are you), "Sharp" (good), "Lekker" (nice), "Eish" (expression)
- BUSINESS CONTEXT: "Bakkie" (pickup truck), "Robot" (traffic light), "Braai" (barbecue)
- GREETINGS: "Sawubona" (Zulu hello), "Dumela" (Sotho hello)
- EXPRESSIONS: "Ag man" (oh man), "Just now" (later), "Now now" (soon)`;
    }

    if (locationKey.includes('india')) {
      return `- HINDI ELEMENTS: "Namaste" (hello), "Dhanyawad" (thank you), "Accha" (good), "Jaldi" (quickly)
- BUSINESS CONTEXT: "Vyavasaya" (business), "Seva" (service), "Kaam" (work)
- GREETINGS: "Namaskar" (respectful hello), "Sat Sri Akal" (Punjabi hello)
- EXPRESSIONS: "Bahut accha" (very good), "Chalo" (let's go), "Kya baat hai" (what's the matter)`;
    }

    return `- Use appropriate local language elements for ${location}
- Mix naturally with English for authentic feel
- Focus on greetings, business terms, and common expressions
- Keep it contextual and business-appropriate`;
  }

  /**
   * Generate contextual hashtags based on business and outcomes - DYNAMIC
   */
  private static generateRelevantHashtags(brandProfile: BrandProfile, platform: Platform, businessOutcome?: BusinessOutcome): string[] {
    const businessType = brandProfile.businessType?.toLowerCase() || '';
    const location = brandProfile.location?.toLowerCase() || '';

    // Start with outcome-focused hashtags
    const baseHashtags: string[] = [];

    // Add outcome-based hashtags if available
    if (businessOutcome?.result) {
      const result = businessOutcome.result.toLowerCase();
      if (result.includes('faster')) baseHashtags.push('#faster');
      if (result.includes('save') || result.includes('cost')) baseHashtags.push('#savings');
      if (result.includes('grow') || result.includes('increase')) baseHashtags.push('#growth');
      if (result.includes('time')) baseHashtags.push('#timesaver');
      if (result.includes('quality')) baseHashtags.push('#quality');
    }

    // Add business-context hashtags
    if (businessType.includes('financial')) baseHashtags.push('#fintech', '#business');
    if (businessType.includes('restaurant')) baseHashtags.push('#food', '#dining');
    if (businessType.includes('retail')) baseHashtags.push('#shopping', '#deals');
    if (businessType.includes('healthcare')) baseHashtags.push('#health', '#wellness');
    if (businessType.includes('fitness')) baseHashtags.push('#fitness', '#results');
    if (businessType.includes('education')) baseHashtags.push('#education', '#career');

    // Add location context
    if (location.includes('nairobi')) baseHashtags.push('#Nairobi');
    if (location.includes('kenya')) baseHashtags.push('#Kenya');
    if (location) baseHashtags.push('#local');

    // Ensure we have at least some hashtags
    if (baseHashtags.length === 0) {
      baseHashtags.push('#results', '#professional', '#trusted');
    }

    return baseHashtags.slice(0, 5); // Limit to 5 hashtags
  }

  /**
   * Create fallback content with business outcome structure
   */
  private static createFallbackContent(
    brandProfile: BrandProfile,
    businessOutcome: BusinessOutcome,
    platform: Platform
  ): CustomerCentricContent {

    const cta = this.getActionableCTA(brandProfile.businessType, businessOutcome);

    return {
      hook: businessOutcome.problem,
      promise: businessOutcome.result,
      proof: businessOutcome.proof,
      cta: cta,
      headline: `${businessOutcome.problem.replace('?', '')} ${businessOutcome.result}`,
      subheadline: businessOutcome.proof,
      caption: `${businessOutcome.problem} ${businessOutcome.result}. ${businessOutcome.proof}. ${cta}!`,
      hashtags: this.generateRelevantHashtags(brandProfile, platform, businessOutcome)
    };
  }
}
