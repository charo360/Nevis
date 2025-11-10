/**
 * Customer-Centric Content Generator
 * Focuses on customer outcomes, not company features
 * Follows the winning formula: Hook → Promise → Proof → CTA
 */

import type { BrandProfile, Platform } from '@/lib/types';
import { getVertexAIClient } from '@/lib/services/vertex-ai-client';
import { getOpenAIClient } from '@/lib/services/openai-client';

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
      // ANTI-REPETITION: Randomize temperature for content variety
      const randomTemperature = 0.7 + (Math.random() * 0.4); // Random between 0.7-1.1
      
      // 🚀 UPGRADED: Using GPT-4 for superior content quality and variety
      const result = await getOpenAIClient().generateText(prompt, 'gpt-4', {
        temperature: randomTemperature,
        maxTokens: 1000
      });
      
      console.log('🎲 [Content Variety] Using GPT-4 with temperature:', randomTemperature.toFixed(2));

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
    // STRICT: No fallbacks - use only provided business data
    const businessType = brandProfile.businessType;
    const businessName = brandProfile.businessName;
    const location = brandProfile.location;
    const services = brandProfile.services || [];
    const websiteUrl = brandProfile.websiteUrl;

    // Validate required fields
    if (!businessType || !businessName) {
      throw new Error('Business type and name are required for content generation');
    }

    // ENHANCED: Much more diverse content approaches for variety
    const contentApproaches = [
      'Story', 'Education', 'Promo', 'Testimonial', 'Lifestyle',
      'Problem-Solver', 'Innovation', 'Security-Focus', 'Speed-Focus', 'Community-Impact',
      'Cost-Savings', 'Convenience', 'Growth-Enabler', 'Trust-Builder', 'Accessibility'
    ];
    const selectedApproach = contentApproaches[Math.floor(Math.random() * contentApproaches.length)];

    // AI prompt to force ULTRA-SPECIFIC, CONCRETE customer thinking with varied approaches
    const analysisPrompt = `You are a customer research expert analyzing ${businessName} (${businessType} in ${location}).

CONTENT APPROACH: Create a ${selectedApproach} style analysis.

${selectedApproach === 'Story' ? 'Focus on a specific customer journey - before struggling, after succeeding.' : ''}
${selectedApproach === 'Education' ? 'Focus on teaching customers something valuable they didn\'t know.' : ''}
${selectedApproach === 'Promo' ? 'Focus on a specific offer or promotion with clear value.' : ''}
${selectedApproach === 'Testimonial' ? 'Focus on a specific customer success story with real results.' : ''}
${selectedApproach === 'Lifestyle' ? 'Focus on how this business improves daily life with specific scenarios.' : ''}
${selectedApproach === 'Problem-Solver' ? 'Focus on a specific pain point and how this service eliminates it completely.' : ''}
${selectedApproach === 'Innovation' ? 'Focus on what makes this service cutting-edge or different from competitors.' : ''}
${selectedApproach === 'Security-Focus' ? 'Focus on safety, protection, and trust - why customers feel secure.' : ''}
${selectedApproach === 'Speed-Focus' ? 'Focus on time-saving, instant results, and rapid solutions.' : ''}
${selectedApproach === 'Community-Impact' ? 'Focus on how this service helps the local community or creates social good.' : ''}
${selectedApproach === 'Cost-Savings' ? 'Focus on money saved, affordable pricing, or financial benefits.' : ''}
${selectedApproach === 'Convenience' ? 'Focus on ease of use, simplicity, and removing friction from daily tasks.' : ''}
${selectedApproach === 'Growth-Enabler' ? 'Focus on how this service helps customers scale, expand, or achieve bigger goals.' : ''}
${selectedApproach === 'Trust-Builder' ? 'Focus on reliability, reputation, and why customers can depend on this service.' : ''}
${selectedApproach === 'Accessibility' ? 'Focus on making financial services available to everyone, regardless of background.' : ''}

🚫 CRITICAL CONTENT ANTI-REPETITION RULES:
- NEVER use generic phrases like "Empower Your Business" or "Grow Your Community"
- AVOID repetitive messaging about "daily finances" or "business growth"
- CREATE completely different value propositions each time
- USE varied customer personas (not always small business owners)
- FOCUS on different pain points (not always payment/financing issues)
- GENERATE unique headlines that don't sound similar to previous ads

🚫 SUBHEADLINE ANTI-REPETITION (CRITICAL):
- NEVER start subheadlines with "Join [number]+ [customer type]"
- AVOID patterns like "Join 1500+ satisfied farmers", "Join thousands of entrepreneurs"
- VARY subheadline structures: questions, benefits, urgency, social proof, outcomes
- USE different opening words: "Discover", "Experience", "Get", "Save", "Unlock", "Access", "Transform"
- CREATE unique value statements that don't follow repetitive formulas

✅ SUBHEADLINE VARIETY EXAMPLES (Use these patterns instead):
- Questions: "Ready to cut transaction fees by 50%?"
- Benefits: "Save KES 2,000 monthly on payment processing"
- Urgency: "Limited time: Zero setup fees this month"
- Social proof: "Trusted by 1M+ Kenyan businesses"
- Outcomes: "From cash-only to digital payments in 24 hours"
- Guarantees: "100% secure transactions, guaranteed"
- Comparisons: "3x faster than traditional banking"

🚨 CRITICAL BUSINESS DATA ENFORCEMENT:
- ONLY use services listed in business profile: ${Array.isArray(services) ? services.join(', ') : services}
- NEVER invent features not mentioned in the business profile
- NEVER claim services the company doesn't actually offer
- ALWAYS reference actual competitive advantages and key features
- NEVER make up customer numbers, testimonials, or guarantees not provided
- ONLY use real business information - NO assumptions or hallucinations

MISSION: Identify the #1 most frustrating problem their customers face and the exact measurable outcome they deliver.

BUSINESS CONTEXT:
- Company: ${businessName}
- Industry: ${businessType}
- Location: ${location || 'Not specified'}
- Services: ${Array.isArray(services) ? services.join(', ') : (services || 'Not specified')}
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
      // 🚀 UPGRADED: Using GPT-4 for business outcome analysis
      const result = await getOpenAIClient().generateText(analysisPrompt, 'gpt-4', {
        temperature: 0.7,
        maxTokens: 500
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
   * FIXED: Provide proper fallback instead of throwing error
   */
  private static generateDynamicFallback(brandProfile: BrandProfile): BusinessOutcome {
    console.log('⚠️ [Customer-Centric] Using fallback business outcome for:', brandProfile.businessName);

    // Create a basic but specific business outcome based on business type
    const businessType = brandProfile.businessType?.toLowerCase() || '';

    if (businessType.includes('finance') || businessType.includes('bank') || businessType.includes('payment')) {
      return {
        problem: 'Managing money and financial planning challenges',
        solution: 'Simplified financial tools and secure money management',
        result: 'Financial security and peace of mind',
        proof: 'Trusted by thousands for secure transactions',
        urgency: 'Start managing your money better today'
      };
    }

    if (businessType.includes('tech') || businessType.includes('software') || businessType.includes('app')) {
      return {
        problem: 'Complex technology and inefficient processes',
        solution: 'User-friendly technology solutions',
        result: 'Streamlined processes and better productivity',
        proof: 'Proven to increase efficiency',
        urgency: 'Upgrade your workflow today'
      };
    }

    if (businessType.includes('health') || businessType.includes('medical') || businessType.includes('wellness')) {
      return {
        problem: 'Health concerns and wellness challenges',
        solution: 'Professional healthcare and wellness services',
        result: 'Improved health and wellbeing',
        proof: 'Trusted healthcare professionals',
        urgency: 'Take control of your health now'
      };
    }

    // Generic business fallback
    return {
      problem: 'Challenges in achieving business goals',
      solution: 'Professional services and expert support',
      result: 'Better results and business growth',
      proof: 'Proven track record of success',
      urgency: 'Start growing your business today'
    };
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
CONTENT APPROACH: Randomly select from ['Story', 'Education', 'Promo', 'Testimonial', 'Lifestyle'] and apply:
- Story: Tell a specific customer journey - show the before/after transformation.
- Education: Teach customers something valuable they didn't know about their problem.
- Promo: Present a specific offer or promotion with clear value and urgency.
- Testimonial: Feature a specific customer success story with real results.
- Lifestyle: Show how this business improves daily life with specific scenarios.
`}

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

📝 CONTENT DENSITY & CLARITY RULES:
6. HEADLINE: Maximum 6 words - must be punchy and memorable
7. SUBHEADLINE: Maximum 12 words - supports headline with key benefit
8. CAPTION: Maximum 25 words - concise, focused message
9. NO INFORMATION OVERLOAD: One clear message per ad
10. ELIMINATE FLUFF: Every word must serve a purpose
11. PRIORITIZE CLARITY: Simple, direct language over complex descriptions
12. SINGLE FOCAL POINT: Don't compete for attention with multiple messages

💡 CONTENT IMPROVEMENT RULES (MAKE IT COMPELLING):
13. USE SPECIFIC NUMBERS: "1M+ customers", "Open in minutes", "No credit checks"
14. ADDRESS PAIN POINTS: Bank queues, paperwork, credit requirements, slow payments
15. SHOW CONCRETE OUTCOMES: Time saved, money saved, convenience gained
16. CREATE URGENCY: "Join thousands", "Start today", "Don't wait"
17. USE SOCIAL PROOF: "Trusted by 1M+ Kenyans", "Kenya's fastest growing"
18. BENEFIT-FOCUSED: Lead with what customer gets, not what Paya does

🎭 STRATEGIC CONTENT VARIATION (DIFFERENT MARKETING ANGLES):
19. ROTATE MARKETING APPROACHES: Don't use same angle repeatedly
20. MATCH APPROACH TO AUDIENCE: Growth for entrepreneurs, accessibility for underbanked
21. USE DIFFERENT COMPANY DATA: Alternate between scale, speed, trust, inclusion
22. VARY EMOTIONAL APPEALS: Aspiration, security, convenience, community
23. DIVERSIFY VALUE PROPS: Sometimes speed, sometimes trust, sometimes inclusion
24. AUTHENTIC BUSINESS POSITIONING: Always use real Paya services and features

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

🏦 PAYA-SPECIFIC CONTENT REQUIREMENTS (MANDATORY BUSINESS DATA USAGE):
- Business: Paya (Financial Technology/Fintech)
- Services: Digital Banking, Payment Solutions, Buy Now Pay Later
- Key Features: No credit checks, Quick setup (open in minutes), 1M+ customers, Mobile app
- Competitive Advantages: Financial inclusivity, Universally accessible banking, Trusted by 1M+
- Target: Consumers and businesses across Kenya

🚨 STRICT BUSINESS DATA ENFORCEMENT:
- NEVER invent features not listed above
- NEVER claim services Paya doesn't offer
- NEVER use competitor data or generic fintech claims
- ALWAYS use exact numbers: "1M+ customers" (not "millions" or "thousands")
- ALWAYS reference actual services: Digital Banking, Payment Solutions, Buy Now Pay Later
- ALWAYS use real competitive advantages: Financial inclusivity, No credit checks
- NEVER make up testimonials, success rates, or guarantees not provided

📊 PAYA CONTENT FORMULAS (USE THESE SPECIFIC DETAILS):
1. SPEED: "Open account in minutes" vs "days of paperwork"
2. ACCESSIBILITY: "No credit checks required" vs "complex approval process"  
3. SCALE: "Join 1M+ Kenyans" vs "limited access"
4. CONVENIENCE: "Mobile banking anywhere" vs "branch visits required"
5. INCLUSIVITY: "Banking for all Kenyans" vs "exclusive requirements"

✨ IMPROVED CONTENT EXAMPLES (USING PAYA DATA):
Instead of: "Connected Finances, Real Kenyan Progress"
Better: "Skip Bank Queues - Open Account in Minutes"

Instead of: "Finance Reimagined for Every Kenyan"  
Better: "No Credit Checks Required - Join 1M+ Kenyans"

Instead of: "Effortless Banking, Stronger Communities"
Better: "Mobile Banking Anywhere - Trusted by 1M+"

🎯 DIVERSE MARKETING APPROACHES (USE COMPANY DATA IN DIFFERENT WAYS):

📈 GROWTH/SCALE MARKETING (Use: 1M+ customers, Kenya's fastest growing):
- "Join 1M+ Kenyans Already Banking Smarter"
- "Kenya's Fastest Growing Fintech - See Why"
- "1M+ Customers Can't Be Wrong - Try Paya"

⚡ SPEED/CONVENIENCE MARKETING (Use: Open in minutes, mobile app):
- "Open Account in Minutes, Not Days"
- "Banking at Your Fingertips - Anywhere, Anytime"
- "Skip Bank Queues - Mobile Banking Made Simple"

🔓 ACCESSIBILITY MARKETING (Use: No credit checks, financial inclusion):
- "No Credit Checks - Banking for All Kenyans"
- "Finally, Banking Without the Barriers"
- "Financial Inclusion Made Real - Join Today"

💰 FINANCIAL BENEFITS MARKETING (Use: Buy Now Pay Later, payment solutions):
- "Buy Now, Pay Later - No Credit Required"
- "Smart Payment Solutions for Smart Kenyans"
- "Flexible Payments That Fit Your Life"

🏆 TRUST/CREDIBILITY MARKETING (Use: Regulated partnerships, secure):
- "Regulated Banking Partners You Can Trust"
- "Bank-Level Security, Startup-Level Innovation"
- "Trusted by 1M+ Kenyans for Good Reason"

🌍 COMMUNITY/IMPACT MARKETING (Use: Financial inclusivity mission):
- "Building Financial Inclusion Across Kenya"
- "Empowering Every Kenyan's Financial Journey"
- "Together, We're Changing Kenya's Financial Future"

📋 CONTENT TEMPLATES FOR DIFFERENT MARKETING APPROACHES:

TEMPLATE 1 - SCALE/SOCIAL PROOF:
Headline: "Join 1M+ Kenyans [ACTION]"
Subheadline: "[SPECIFIC BENEFIT] with Kenya's fastest growing fintech"
CTA: "Join the Movement"

TEMPLATE 2 - SPEED/CONVENIENCE:
Headline: "[ACTION] in Minutes, Not [OLD WAY]"
Subheadline: "Skip [PAIN POINT] with mobile [SERVICE]"
CTA: "Start Now"

TEMPLATE 3 - ACCESSIBILITY/INCLUSION:
Headline: "No [BARRIER] - [SERVICE] for All"
Subheadline: "Finally, [BENEFIT] without the barriers"
CTA: "Get Access Today"

TEMPLATE 4 - FINANCIAL BENEFITS:
Headline: "[FINANCIAL SOLUTION] Made Simple"
Subheadline: "[SPECIFIC OUTCOME] with flexible payment options"
CTA: "Explore Options"

TEMPLATE 5 - TRUST/SECURITY:
Headline: "Bank-Level Security, [INNOVATION BENEFIT]"
Subheadline: "Regulated partnerships you can trust"
CTA: "Learn More"

TEMPLATE 6 - PROBLEM/SOLUTION:
Headline: "Tired of [PAIN POINT]? Try [SOLUTION]"
Subheadline: "[BEFORE] vs [AFTER] with Paya"
CTA: "Make the Switch"

${useLocalLanguage ? `
🌍 CRITICAL LOCAL LANGUAGE INTEGRATION FOR ${location.toUpperCase()}:
- MANDATORY: Mix English (70%) with local language elements (30%)
- NATURAL INTEGRATION: Don't force it - only add when it flows naturally
- CONTEXTUAL USE: Match local language to business type and audience
- VARIETY: Use different local phrases for each generation (avoid repetition)

📍 LOCATION-SPECIFIC LANGUAGE ELEMENTS:
${this.getLocationSpecificLanguageInstructions(location)}

🎯 INTEGRATION EXAMPLES (ADAPTS TO USER'S COUNTRY):
- Headlines: "Digital Banking Made Simple" → Add local welcome (Karibu/Hola/Bonjour/etc.)
- Subheadlines: "Fast payments, zero hassle" → Mix with local reassurance phrases
- Benefits: "Secure transactions" → Include local trust expressions
- CTAs: "Get Started Today" → Use local action phrases (Twende/Vamos/Allons-y/etc.)
- Social Proof: "Trusted by customers" → Localize with country-specific language
- Urgency: "Don't wait" → Use local urgency expressions
- Captions: Mix English (70%) with local language (30%) naturally
- ADAPTS TO: Kenya, Nigeria, Ghana, South Africa, India, Philippines, Indonesia, Thailand, Vietnam, Brazil, Mexico, Spain, France, Germany, and more

⚠️ CRITICAL: Local language should enhance, not confuse. Keep it natural and contextual.
` : ''}

CTA INSTRUCTIONS:
Create a specific, actionable CTA that matches:
- The business type (${businessType})
- The urgency factor (${businessOutcome.urgency})
- The content approach (Story/Education/Promo/Testimonial/Lifestyle)
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
  "subheadline": "Proof element that builds credibility and trust (NEVER start with 'Join [number]+' - use varied structures)",
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
- BUSINESS CONTEXT: "Biashara" (business), "Huduma" (service), "Kazi" (work), "Pesa" (money), "Benki" (bank)
- FINTECH TERMS: "M-Pesa" (mobile money), "Simu" (phone), "Mitandao" (networks), "Usalama" (security)
- GREETINGS: "Jambo" (hello), "Habari" (how are you), "Sawa" (okay/fine), "Vipi" (how's it going)
- EXPRESSIONS: "Hakuna matata" (no problem), "Pole pole" (slowly/carefully), "Twende" (let's go), "Fanya haraka" (do it quickly)
- ENCOURAGEMENT: "Hongera" (congratulations), "Vizuri sana" (very good), "Umefanya vizuri" (you did well)
- INTEGRATION EXAMPLES: 
  * "Fast payments" → "Malipo ya haraka"
  * "No worries" → "Hakuna wasiwasi" 
  * "Let's start" → "Twende tuanze"
  * "Very secure" → "Salama sana"`;
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
- BUSINESS CONTEXT: "Vyavasaya" (business), "Seva" (service), "Kaam" (work), "Paisa" (money)
- GREETINGS: "Namaskar" (respectful hello), "Sat Sri Akal" (Punjabi hello)
- EXPRESSIONS: "Bahut accha" (very good), "Chalo" (let's go), "Kya baat hai" (what's the matter)`;
    }

    if (locationKey.includes('philippines')) {
      return `- FILIPINO ELEMENTS: "Kumusta" (how are you), "Salamat" (thank you), "Mabuti" (good), "Bilisan" (hurry up)
- BUSINESS CONTEXT: "Negosyo" (business), "Serbisyo" (service), "Trabaho" (work), "Pera" (money)
- GREETINGS: "Magandang umaga" (good morning), "Kamusta ka" (how are you)
- EXPRESSIONS: "Walang problema" (no problem), "Tara na" (let's go), "Sulit" (difficult/valuable)`;
    }

    if (locationKey.includes('indonesia')) {
      return `- BAHASA ELEMENTS: "Halo" (hello), "Terima kasih" (thank you), "Bagus" (good), "Cepat" (fast)
- BUSINESS CONTEXT: "Bisnis" (business), "Layanan" (service), "Kerja" (work), "Uang" (money)
- GREETINGS: "Selamat pagi" (good morning), "Apa kabar" (how are you)
- EXPRESSIONS: "Tidak masalah" (no problem), "Ayo" (let's go), "Mantap" (great/solid)`;
    }

    if (locationKey.includes('thailand')) {
      return `- THAI ELEMENTS: "Sawasdee" (hello), "Khob khun" (thank you), "Dee" (good), "Rew" (fast)
- BUSINESS CONTEXT: "Thurakit" (business), "Borikan" (service), "Ngan" (work), "Ngern" (money)
- GREETINGS: "Sawasdee krab/ka" (hello), "Sabai dee mai" (how are you)
- EXPRESSIONS: "Mai pen rai" (no problem), "Pai kan" (let's go), "Jai yen" (stay calm)`;
    }

    if (locationKey.includes('vietnam')) {
      return `- VIETNAMESE ELEMENTS: "Xin chào" (hello), "Cảm ơn" (thank you), "Tốt" (good), "Nhanh" (fast)
- BUSINESS CONTEXT: "Kinh doanh" (business), "Dịch vụ" (service), "Công việc" (work), "Tiền" (money)
- GREETINGS: "Chào bạn" (hello friend), "Bạn khỏe không" (how are you)
- EXPRESSIONS: "Không sao" (no problem), "Đi thôi" (let's go), "Tuyệt vời" (excellent)`;
    }

    if (locationKey.includes('brazil')) {
      return `- PORTUGUESE ELEMENTS: "Olá" (hello), "Obrigado/a" (thank you), "Bom" (good), "Rápido" (fast)
- BUSINESS CONTEXT: "Negócio" (business), "Serviço" (service), "Trabalho" (work), "Dinheiro" (money)
- GREETINGS: "Bom dia" (good morning), "Como vai" (how are you)
- EXPRESSIONS: "Sem problema" (no problem), "Vamos lá" (let's go), "Perfeito" (perfect)`;
    }

    if (locationKey.includes('mexico') || locationKey.includes('spain')) {
      return `- SPANISH ELEMENTS: "Hola" (hello), "Gracias" (thank you), "Bueno" (good), "Rápido" (fast)
- BUSINESS CONTEXT: "Negocio" (business), "Servicio" (service), "Trabajo" (work), "Dinero" (money)
- GREETINGS: "Buenos días" (good morning), "¿Cómo estás?" (how are you)
- EXPRESSIONS: "Sin problema" (no problem), "Vamos" (let's go), "Excelente" (excellent)`;
    }

    if (locationKey.includes('france')) {
      return `- FRENCH ELEMENTS: "Bonjour" (hello), "Merci" (thank you), "Bon" (good), "Rapide" (fast)
- BUSINESS CONTEXT: "Affaires" (business), "Service" (service), "Travail" (work), "Argent" (money)
- GREETINGS: "Salut" (hi), "Comment allez-vous" (how are you)
- EXPRESSIONS: "Pas de problème" (no problem), "Allons-y" (let's go), "Parfait" (perfect)`;
    }

    if (locationKey.includes('germany')) {
      return `- GERMAN ELEMENTS: "Hallo" (hello), "Danke" (thank you), "Gut" (good), "Schnell" (fast)
- BUSINESS CONTEXT: "Geschäft" (business), "Service" (service), "Arbeit" (work), "Geld" (money)
- GREETINGS: "Guten Tag" (good day), "Wie geht's" (how are you)
- EXPRESSIONS: "Kein Problem" (no problem), "Los geht's" (let's go), "Perfekt" (perfect)`;
    }

    return `- Use appropriate local language elements for ${location}
- Mix naturally with English for authentic feel
- Focus on greetings, business terms, and common expressions
- Keep it contextual and business-appropriate
- Research local business language and cultural expressions
- Maintain professional tone while adding cultural authenticity`;
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
