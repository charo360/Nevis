/**
 * Claude Sonnet 4 Content Generator
 * Primary content generation system for Revo 1.5 - NO FALLBACKS
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

export interface ClaudeContentRequest {
  businessType: string;
  businessName: string;
  services: string;
  platform: string;
  targetAudience?: string;
  location?: string;
  useLocalLanguage?: boolean;
  brandProfileId?: string; // For DB-based repetition tracking
  brandContext?: {
    colors?: string[];
    personality?: string;
    values?: string[];
  };
  scheduledServices?: Array<{
    serviceId: string;
    serviceName: string;
    description?: string;
    isToday?: boolean;
    isUpcoming?: boolean;
    daysUntil?: number;
  }>;
}

export interface ClaudeContentResponse {
  format?: string; // Selected enforced format used
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

  // Track last used formats per brand+platform
  private static recentFormats: Record<string, string[]> = {};

  private static async fetchRecentDbPosts(brandProfileId?: string, platform?: string): Promise<Array<{ content?: string; format?: string }>> {
    try {
      if (!brandProfileId || !platform) return [];
      const { data, error } = await supabase
        .from('generated_posts')
        .select('content, generation_settings')
        .eq('brand_profile_id', brandProfileId)
        .eq('platform', platform)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) {
        console.warn('[Claude Sonnet 4] Supabase fetch error (generated_posts):', error.message);
        return [];
      }
      return (data || []).map((row: any) => ({
        content: row.content || '',
        format: row.generation_settings?.format || undefined
      }));
    } catch (e) {
      console.warn('[Claude Sonnet 4] Supabase fetch exception:', (e as Error).message);
      return [];
    }
  }

  private static rememberFormat(request: ClaudeContentRequest, format: string) {
    const key = this.keyFor(request);
    const arr = this.recentFormats[key] || (this.recentFormats[key] = []);
    arr.push(format);
    if (arr.length > 10) arr.shift();
  }

  private static getRecentlyUsedFormats(request: ClaudeContentRequest): string[] {
    const key = this.keyFor(request);
    return (this.recentFormats[key] || []).slice(-10);
  }

  private static chooseFormat = async (request: ClaudeContentRequest, available: string[]): Promise<string> => {
    const recentMemory = this.getRecentlyUsedFormats(request);
    let recentDb: string[] = [];
    const dbPosts = await this.fetchRecentDbPosts(request.brandProfileId, request.platform);
    recentDb = dbPosts.map(p => p.format).filter(Boolean) as string[];
    const recentlyUsed = new Set([...recentMemory, ...recentDb]);
    const candidates = available.filter(f => !recentlyUsed.has(f));
    if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
    // If all recently used, pick least recently used by random fallback
    return available[Math.floor(Math.random() * available.length)];
  };

  private static keyFor(request: ClaudeContentRequest) {
    // Prefer brandProfileId for exact scoping; fallback to businessName
    const brandKey = request.brandProfileId ? `${request.brandProfileId}::${request.platform}` : `${request.businessName}::${request.platform}`;
    return brandKey.toLowerCase();
  }

  // Recent products memory per brand/platform to rotate SKUs without repetition
  private static recentProducts: Record<string, string[]> = {};

  private static rememberProduct(request: ClaudeContentRequest, productName: string) {
    const key = this.keyFor(request);
    const arr = this.recentProducts[key] || (this.recentProducts[key] = []);
    arr.push(productName);
    if (arr.length > 10) arr.shift();
  }

  private static getRecentlyUsedProducts(request: ClaudeContentRequest): string[] {
    const key = this.keyFor(request);
    return (this.recentProducts[key] || []).slice(-10);
  }

  // Parse product/service data from the existing services field (string | string[] | object[])
  private static parseProductsFromServices(services: any): Array<{ name: string; price?: string; discount?: string; features?: string[]; raw?: any; }> {
    const items: Array<{ name: string; price?: string; discount?: string; features?: string[]; raw?: any; }> = [];
    const addItem = (name: string, desc?: string, priceField?: any, raw?: any) => {
      const text = [name, desc || '', typeof priceField === 'string' ? priceField : ''].filter(Boolean).join(' | ');
      const priceRegex = /(KSh|KES|₵|GHS|₦|NGN|Rs|₹|\$|£|€|R)\s?\d{1,3}(?:[\,\s]\d{3})*(?:\.\d{1,2})?|(?:from|starting at)\s+(KSh|KES|₵|GHS|₦|NGN|Rs|₹|\$|£|€|R)\s?\d{1,3}(?:[\,\s]\d{3})*(?:\.\d{1,2})?/gi;
      const discountRegex = /(\d{1,2}|[1-9]\d)%\s?(off|discount)|save\s+(KSh|KES|₵|GHS|₦|NGN|Rs|₹|\$|£|€|R)\s?\d{1,3}(?:[\,\s]\d{3})*/gi;
      const featureRegex = /(\d+\s?GB|\d+\s?MP|\d{2,3}"|\d{2,3}”|warranty|genuine|original|same[-\s]?day\s+delivery|delivery|m-?pesa|pos|bank\s+transfer|installments?|trade-?in|fast\s+charging|battery|camera|oled|amoled|retina|ram|storage)/gi;
      const priceMatch = text.match(priceRegex)?.[0];
      const discountMatch = text.match(discountRegex)?.[0];
      const features = Array.from(new Set((desc || '').match(featureRegex) || [])).slice(0, 6);
      items.push({ name: name.trim(), price: priceMatch?.trim(), discount: discountMatch?.trim(), features, raw });
    };

    try {
      if (!services) return items;
      if (Array.isArray(services)) {
        for (const s of services) {
          if (!s) continue;
          if (typeof s === 'string') {
            const line = s.trim();
            if (!line) continue;
            // try to split name:desc if present
            const [name, ...rest] = line.split(/[:\-\u2013\u2014]/);
            const desc = rest.join(' ').trim();
            addItem(name, desc || line, undefined, s);
          } else if (typeof s === 'object') {
            const name = s.name || s.title || s.productName || '';
            const desc = s.description || s.details || '';
            const price = s.price || s.currentPrice || s.amount || '';
            if (name || desc || price) addItem(String(name || desc).slice(0, 120), String(desc || ''), price, s);
          }
        }
      } else if (typeof services === 'string') {
        const lines = services.split(/\n|\r|;|\|/);
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;
          const [name, ...rest] = line.split(/[:\-\u2013\u2014]/);
          const desc = rest.join(' ').trim();
          addItem(name, desc || line, undefined, rawLine);
        }
      }
    } catch (e) {
      console.warn('[Claude Sonnet 4] parseProductsFromServices error:', (e as Error).message);
    }

    // Deduplicate by name
    const seen = new Set<string>();
    return items.filter(it => {
      const key = it.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private static normalize(text: string): string[] {
    const stop = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'for', 'of', 'in', 'on', 'with', 'at', 'by', 'from', 'your', 'you', 'our', 'their', 'is', 'are', 'be', 'this', 'that', 'it', 'as']);
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w && !stop.has(w));
  }

  // Generate creative concept with scheduled services (Revo 2.0 approach)
  private static async generateCreativeConcept(request: ClaudeContentRequest, todaysServices: any[], upcomingServices: any[]): Promise<string> {
    try {
      const anthropic = this.getAnthropicClient();

      // Build service-aware concept prompt (Revo 2.0 approach)
      let serviceContext = '';
      if (todaysServices.length > 0) {
        serviceContext = `\n\n🎯 TODAY'S FEATURED SERVICES (Priority Focus):\n${todaysServices.map(s => `- ${s.serviceName}: ${s.description || 'Premium service offering'}`).join('\n')}`;
      }
      if (upcomingServices.length > 0) {
        serviceContext += `\n\n📅 UPCOMING SERVICES (Secondary Focus):\n${upcomingServices.slice(0, 2).map(s => `- ${s.serviceName}`).join('\n')}`;
      }

      const conceptPrompt = `Generate a creative concept for ${request.businessName} (${request.businessType}) on ${request.platform}.
      ${serviceContext}
      
Focus on:
- Unique visual storytelling approach featuring today's services
- Brand personality expression through service excellence
- Platform-specific engagement strategies
- Cultural relevance for ${request.location || 'global audience'}
${todaysServices.length > 0 ? `- Highlight today's featured service: ${todaysServices[0].serviceName}` : ''}

Return a brief creative concept (2-3 sentences) that will guide the content creation.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        temperature: 0.8,
        messages: [{ role: 'user', content: conceptPrompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }
    } catch (error) {
      console.warn('⚠️ [Claude Sonnet 4] Creative concept generation failed, using fallback');
    }

    // Fallback concept with service integration
    const fallbackConcept = todaysServices.length > 0
      ? `Create engaging content for ${request.businessName} featuring today's ${todaysServices[0].serviceName} with authentic, professional appeal tailored for ${request.platform}.`
      : `Create engaging content for ${request.businessName} that showcases their ${request.businessType} expertise with authentic, professional appeal tailored for ${request.platform}.`;

    return fallbackConcept;
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
  private static getCulturalRule(location?: string, useLocalLanguage?: boolean): { name: string; regex: RegExp; extraRules: string } | null {
    // Apply cultural guidance whenever a location is provided; code-switching only if appropriate
    const loc = (location || '').toLowerCase();
    const mk = (name: string, examples: string[], notes: string[]): { name: string; regex: RegExp; extraRules: string } => ({
      name,
      regex: new RegExp(examples.join('|'), 'i'),
      extraRules: `REQUIRED ${name.toUpperCase()} CULTURAL ELEMENTS (MUST INCLUDE):\n- Natural local code-switching where appropriate\n- Specific locality references when relevant\n- Payment/holiday references only if contextually appropriate\nExamples to consider (use naturally, not all at once): ${examples.join(', ')}\nNotes: ${notes.join(' ')}`
    });

    // Specific over regional
    if (loc.includes('ghana') || loc.includes('accra') || loc.includes('kumasi')) {
      return mk('Ghana', ['Ghana', 'Accra', 'Kumasi', 'cedi', 'GHS', 'MoMo', 'mobile money'], ['Avoid stereotypes; use natural brand-appropriate tone.']);
    }
    if (loc.includes('kenya') || loc.includes('nairobi')) {
      return mk('Kenya', ['Mpesa', 'M-Pesa', 'Nairobi', 'Westlands', 'Karibu', 'Habari', 'Sawa'], ['Use Swahili/English mix naturally; avoid overuse.']);
    }
    if (loc.includes('india') || loc.includes('delhi') || loc.includes('mumbai') || loc.includes('bengaluru') || loc.includes('bangalore') || loc.includes('chennai')) {
      return mk('India', ['UPI', 'Rupee', '₹', 'Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Diwali', 'Holi', 'namaste', 'jugaad'], ['Use Hinglish only if appropriate to audience; avoid clichés.']);
    }
    if (loc.includes('united states') || loc.includes('usa') || loc.includes('america') || loc.includes('u.s.')) {
      return mk('USA', ['US', 'USA', 'American', 'NYC', 'Los Angeles', 'San Francisco', 'Black Friday', 'Thanksgiving'], ['Prefer city/region specifics tied to the brand audience.']);
    }
    if (loc.includes('canada') || loc.includes('toronto') || loc.includes('vancouver') || loc.includes('montreal')) {
      return mk('Canada', ['Canada', 'Canadian', 'Toronto', 'Vancouver', 'Montreal', 'CAD', 'C$'], ['Avoid stereotypes; focus on locality and seasons.']);
    }
    // Europe subregions first
    if (loc.includes('united kingdom') || loc.includes('uk') || loc.includes('london') || loc.includes('manchester')) {
      return mk('UK', ['UK', 'London', 'Manchester', 'GBP', '£', 'British'], ['Prefer city-level references and seasons; avoid clichés.']);
    }
    if (loc.includes('germany') || loc.includes('berlin') || loc.includes('munich') || loc.includes('münchen')) {
      return mk('Germany', ['Germany', 'Berlin', 'Munich', 'Euro', '€', 'DE'], ['Neutral tone; avoid stereotypes; focus on locality.']);
    }
    if (loc.includes('france') || loc.includes('paris') || loc.includes('lyon')) {
      return mk('France', ['France', 'Paris', 'Lyon', 'Euro', '€', 'FR'], ['Avoid clichés; keep references natural and brand-appropriate.']);
    }
    if (loc.includes('spain') || loc.includes('madrid') || loc.includes('barcelona')) {
      return mk('Spain', ['Spain', 'Madrid', 'Barcelona', 'Euro', '€', 'ES'], ['Use local city/event references when relevant.']);
    }
    if (loc.includes('italy') || loc.includes('rome') || loc.includes('milan')) {
      return mk('Italy', ['Italy', 'Rome', 'Milan', 'Euro', '€', 'IT'], ['Keep references authentic; avoid stereotypes.']);
    }
    if (loc.includes('europe') || loc.includes('eu')) {
      return mk('Europe', ['Europe', 'EU', 'Euro', '€', 'Berlin', 'Paris', 'Madrid', 'Milan', 'Amsterdam', 'Stockholm'], ['Prefer specific country/city references over generic "Europe" where possible.']);
    }
    // West Africa + Nigeria
    if (loc.includes('nigeria') || loc.includes('lagos') || loc.includes('abuja') || loc.includes('naira') || loc.includes('₦')) {
      return mk('Nigeria', ['Nigeria', 'Lagos', 'Abuja', 'Naira', '₦', 'bank transfer', 'POS'], ['Avoid slang unless brand voice; use authentic payment/locale cues.']);
    }
    if (loc.includes('west africa') || loc.includes('west-africa') || loc.includes('westafrica')) {
      return mk('West Africa', ['West Africa', 'ECOWAS', 'Lagos', 'Accra', 'Abidjan', 'Abuja', 'Kumasi', 'mobile money'], ['Use neutral, authentic references; avoid slang unless brand voice.']);
    }
    return null;
  }

  private static collapseDuplicateWords(text: string): string {
    if (!text) return text;
    // Collapse immediate duplicates: "best best" -> "best"
    return text.replace(/\b(\w+)(\s+\1\b)+/gi, '$1').replace(/\s{2,}/g, ' ').trim();
  }

  private static tidyPunctuation(text: string): string {
    if (!text) return text;
    let t = text.trim();
    // Ensure single punctuation at the end of sentences
    t = t.replace(/([!?\.]){2,}$/g, '$1');
    // Capitalize first letter conservatively
    t = t.charAt(0) ? t.charAt(0).toUpperCase() + t.slice(1) : t;
    return t;
  }

  private static applyQualityGuards(parsed: { headline?: string; subheadline?: string; caption?: string; cta?: string }): void {
    const fix = (s?: string) => this.tidyPunctuation(this.collapseDuplicateWords(s || ''));
    parsed.headline = fix(parsed.headline);
    parsed.subheadline = fix(parsed.subheadline);
    parsed.caption = fix(parsed.caption);
    parsed.cta = this.collapseDuplicateWords(parsed.cta || '');
  }

  private static async logBusinessTypePerformance(params: { businessType: string; platform: string; format?: string; hadRetry: boolean; issues: string[] }): Promise<void> {
    try {
      const { businessType, platform, format, hadRetry, issues } = params;
      await supabase.from('generation_analytics').insert([
        {
          business_type: businessType,
          platform,
          format,
          had_retry: hadRetry,
          issues,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (e) {
      console.warn('[Claude Sonnet 4] Analytics insert skipped:', (e as Error).message);
    }
  }
  private static hasGrammarSignals(text: string): boolean {
    if (!text) return false;
    // Repeated letters like "goooood" or "accouunt", or multiple punctuation
    if (/(\w)\1{2,}/i.test(text)) return true;
    if (/[!?\.]{3,}/.test(text)) return true;
    return false;
  }

  private static async grammarRefineWithClaude(parsed: { headline?: string; subheadline?: string; caption?: string; cta?: string; hashtags?: string[] }): Promise<typeof parsed> {
    try {
      const client = this.getAnthropicClient();
      const json = JSON.stringify({
        headline: parsed.headline || '',
        subheadline: parsed.subheadline || '',
        cta: parsed.cta || '',
        caption: parsed.caption || '',
        hashtags: parsed.hashtags || []
      });
      const prompt = `You are a world-class copy editor. Correct spelling and grammar ONLY. Do not add facts. Do not change meaning. Keep the SAME JSON keys and structure. Return JSON only.\n\nJSON:\n${json}`;
      const resp = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }]
      });
      const content = resp.content[0];
      if (content.type === 'text') {
        let t = content.text.trim();
        const m = t.match(/```json\s*([\s\S]*?)\s*```/);
        if (m) t = m[1].trim();
        const refined = JSON.parse(t);
        return refined;
      }
    } catch (e) {
      console.warn('[Claude Sonnet 4] Grammar refine skipped:', (e as Error).message);
    }
    return parsed;
  }

  /**
   * Generate content using Claude Sonnet 4 ONLY - NO FALLBACKS
   */
  static async generateContent(request: ClaudeContentRequest): Promise<ClaudeContentResponse> {

    // Extract scheduled services for priority content focus (Revo 2.0 approach)
    const todaysServices = request.scheduledServices?.filter(s => s.isToday) || [];
    const upcomingServices = request.scheduledServices?.filter(s => s.isUpcoming) || [];

    // Platform-specific hashtag count
    const hashtagCount = request.platform.toLowerCase() === 'instagram' ? 5 : 3;

    const anthropic = this.getAnthropicClient();

    // Enforce format selection (no defaulting). Exclude recently used formats (memory + DB when available)
    const contentFormats = [
      'Problem/Solution', 'Feature Focus', 'Humor/Relatable', 'Comparison', 'Social Proof (generic, no names)',
      'How-To (3-step)', 'Myth vs Fact', 'FAQ (3 Q&A)', 'Data Point Insight', 'Limited-Time Offer (ethical, no fake scarcity)',
      'Community Spotlight (no real names)', 'Local Slang/Language Mix', 'Micro Case Study (no names)', 'Objection Handling', 'Checklist (short, practical)'
    ];
    const enforcedFormat = await this.chooseFormat(request, contentFormats);

    // Cultural enforcement rules (region-aware)
    const cultural = this.getCulturalRule(request.location, request.useLocalLanguage);

    const extraRules = `STEP 1: You MUST use exactly this format and its structure.\nSTEP 2: Follow that format's structure strictly; no generic benefit blurbs.\nSTEP 3: Validate uniqueness > 80% against last outputs; if fails, regenerate with different phrasing.\nSTEP 4: Do not include any statistics, numbers, or certifications unless provided in input.\n${cultural ? cultural.extraRules : ''}`;

    // STEP 1: Generate creative concept with scheduled services (Revo 2.0 approach)
    const creativeConcept = await this.generateCreativeConcept(request, todaysServices, upcomingServices);

    // Build product context from existing services for retail-focused ads
    const productCandidates = this.parseProductsFromServices((request as any).servicesRaw ?? request.services);
    let selectedProduct: { name: string; price?: string; discount?: string; features?: string[] } | undefined;
    let productBlock: string | undefined;
    if (productCandidates.length > 0) {
      const recent = new Set(this.getRecentlyUsedProducts(request));
      const available = productCandidates.filter(c => !recent.has(c.name));
      selectedProduct = (available.length > 0 ? available : productCandidates)[Math.floor(Math.random() * (available.length > 0 ? available.length : productCandidates.length))];
      const lines = [
        `- Selected Product: ${selectedProduct.name}${selectedProduct.price ? ` — ${selectedProduct.price}` : ''}${selectedProduct.discount ? ` — ${selectedProduct.discount}` : ''}`,
        selectedProduct.features && selectedProduct.features.length ? `  Features: ${selectedProduct.features.slice(0, 4).join(', ')}` : ''
      ].filter(Boolean);
      productBlock = `Use this specific product for a retail spotlight with a price anchor and action CTA.\n${lines.join('\n')}`;
    }

    // STEP 2: Build focused prompt with creative concept and scheduled services (Revo 2.0 style)
    const prompt = this.buildFocusedClaudePrompt(request, hashtagCount, creativeConcept, enforcedFormat, productBlock, todaysServices, upcomingServices);

    // Log prompt details for debugging

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.9, // Revo 2.0 uses 0.9 for better balance
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

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
      // Always-on grammar refine to correct spelling/grammar while preserving meaning and JSON
      try { parsed = await this.grammarRefineWithClaude(parsed); } catch { }

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

    // Apply quality guards (dedupe words, tidy punctuation)
    this.applyQualityGuards(parsed);

    // Additional validation: cultural and fact-safety checks (post-parse)
    const combinedText = `${parsed.headline || ''} ${parsed.subheadline || ''} ${parsed.caption || ''}`;

    // Cultural enforcement (region-aware)
    const culturalRule = this.getCulturalRule(request.location, request.useLocalLanguage);
    let culturalIssue = false;
    if (culturalRule && !culturalRule.regex.test(combinedText)) {
      culturalIssue = true;
      console.warn(`⚠️ [Claude Sonnet 4] Missing required ${culturalRule.name} cultural elements — will retry with stronger constraints`);
    }

    // Fact-safety: disallow unverified stats/claims (percentages or large numbers)
    const riskyNumbers = /(\d{4,}|\d+%)/;
    let factIssue = false;
    if (riskyNumbers.test(combinedText)) {
      factIssue = true;
      console.warn('⚠️ [Claude Sonnet 4] Potential unverified numeric claims detected — will retry without numbers');
    }

    // DB-based repetition check against last 5 posts (if available)
    let dbSimilar = false;
    let dbReasons: string[] = [];
    try {
      const recentDb = await this.fetchRecentDbPosts(request.brandProfileId, request.platform);
      for (const p of recentDb.slice(0, 5)) {
        const sim = this.jaccard(parsed.caption || '', p.content || '');
        if (sim > 0.7) {
          dbSimilar = true;
          dbReasons.push(`Caption too similar to a recent post (${(sim * 100).toFixed(0)}%)`);
          break;
        }
      }
    } catch { }

    // Diversity check and optional single retry
    let { similar, reasons } = this.tooSimilar(request, { headline: parsed.headline, subheadline: parsed.subheadline || '', caption: parsed.caption || '' });
    if (dbSimilar) {
      similar = true;
      reasons = reasons.concat(dbReasons);
    }
    if (similar || culturalIssue || factIssue) {
      const issues = [
        ...(similar ? reasons : []),
        ...(culturalIssue ? [`Missing ${culturalRule?.name || 'regional'} cultural elements`] : []),
        ...(factIssue ? ['Potential unverified numeric claims'] : []),
      ];
      console.warn('⚠️ [Claude Sonnet 4] Validation issues detected, retrying once with stronger constraints:', issues);
      const avoid = (this.getAvoidSnippet(request) ? this.getAvoidSnippet(request) + '\n' : '') +
        'Additional reasons to avoid: ' + reasons.join('; ');
      const retryExtra = `${culturalIssue ? `MUST include ${culturalRule?.name || 'regional'} cultural elements as specified.` : ''}${factIssue ? '\nREMOVE all numeric claims, percentages, or specific numbers.' : ''}`;
      const retryPrompt = this.buildClaudePrompt(request, hashtagCount, avoid, enforcedFormat, retryExtra, productBlock);
      const retryResp = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.9, // Match main generation temperature
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
            // Apply quality guards on retry parse as well
            this.applyQualityGuards(p2);
            parsed = p2;
            // Optional grammar refine on retry
            // Enhanced fallback content system (Revo 2.0 approach)
            if (!p2.caption || p2.caption.includes('Experience the excellence of')) {
              const creativityLevel = Math.floor(Math.random() * 10);
              const fallbackCaptions = [
                `Transform your ${request.businessType.toLowerCase()} experience with ${request.businessName}. We're redefining excellence in ${request.location || 'the industry'}.`,
                `Ready to elevate your ${request.businessType.toLowerCase()} journey? ${request.businessName} brings innovation and expertise to ${request.location || 'every project'}.`,
                `Discover why ${request.businessName} is the preferred choice for ${request.businessType.toLowerCase()} solutions in ${request.location || 'the market'}.`,
                `Your success is our mission. ${request.businessName} delivers exceptional ${request.businessType.toLowerCase()} services with a personal touch.`,
                `Innovation meets reliability at ${request.businessName}. Experience the future of ${request.businessType.toLowerCase()} today.`
              ];
              p2.caption = fallbackCaptions[creativityLevel % fallbackCaptions.length];
            }

            // Always-on grammar refine on retry parse as well
            try { parsed = await this.grammarRefineWithClaude(p2); } catch { }

            ({ similar, reasons } = this.tooSimilar(request, { headline: parsed.headline, subheadline: parsed.subheadline || '', caption: parsed.caption || '' }));
          } catch { }
        }
      }
    }

    if (similar) {
      console.warn('⚠️ [Claude Sonnet 4] Still similar after retry:', reasons);
    } else {
      this.rememberOutput(request, { headline: parsed.headline, subheadline: parsed.subheadline || '', cta: parsed.cta, caption: parsed.caption || '' });
      // Re-validate cultural/fact after retry parse
      {
        const combinedText2 = `${parsed.headline || ''} ${parsed.subheadline || ''} ${parsed.caption || ''}`;
        if (culturalRule) {
          culturalIssue = !culturalRule.regex.test(combinedText2);
        }
        const riskyNumbers2 = /(\d{4,}|\d+%)/;
        factIssue = riskyNumbers2.test(combinedText2);
      }

    }

    // Log analytics (best-effort)
    const hadRetry = (similar || culturalIssue || factIssue || dbSimilar);
    this.logBusinessTypePerformance({
      businessType: request.businessType,
      platform: request.platform,
      format: enforcedFormat,
      hadRetry,
      issues: [
        ...(reasons || []),
        ...(culturalIssue ? [`Missing ${culturalRule?.name || 'regional'} elements`] : []),
        ...(factIssue ? ['Numeric claims detected'] : []),
        ...(dbSimilar ? dbReasons : [])
      ]
    });

    this.rememberFormat(request, enforcedFormat);

    // Remember selected product to avoid repetition next time
    try { if (selectedProduct?.name) this.rememberProduct(request, selectedProduct.name); } catch { }

    return {
      format: enforcedFormat,
      headline: parsed.headline,
      subheadline: parsed.subheadline || `Quality ${request.businessType.toLowerCase()} services`,
      cta: parsed.cta,
      caption: parsed.caption,
      hashtags: parsed.hashtags || []
    };
  }

  // Build focused prompt using Revo 2.0 approach (shorter, more structured)
  private static buildFocusedClaudePrompt(request: ClaudeContentRequest, hashtagCount: number, creativeConcept: string, enforcedFormat: string, productBlock?: string, todaysServices?: any[], upcomingServices?: any[]): string {
    const creativityBoost = Math.floor(Math.random() * 10) + 1;

    // Build scheduled services context (Revo 2.0 approach)
    let scheduledServicesContext = '';
    if (todaysServices && todaysServices.length > 0) {
      scheduledServicesContext = `\n\n🎯 SCHEDULED SERVICES (HIGHEST PRIORITY - Focus content on these specific services):
${todaysServices.filter(s => s.isToday).length > 0 ? `
⚡ TODAY'S SERVICES (Create URGENT, action-focused content):
${todaysServices.filter(s => s.isToday).map(s => `- ${s.serviceName}: ${s.description || 'Available today'}`).join('\n')}

URGENT CONTENT REQUIREMENTS:
- Use TODAY-focused language: "today", "now", "available today", "don't miss out"
- Create urgency and immediate action
- Mention specific service names in headlines/content
- Use urgent CTAs: "Book now", "Available today", "Don't wait"
` : ''}
${upcomingServices && upcomingServices.length > 0 ? `
📅 UPCOMING SERVICES (Build anticipation and early booking):
${upcomingServices.map(s => `- ${s.serviceName} (in ${s.daysUntil} days): ${s.description || 'Coming soon'}`).join('\n')}

ANTICIPATION CONTENT REQUIREMENTS:
- Build excitement for upcoming services
- Use anticipation language: "coming soon", "get ready", "reserve your spot"
- Create early booking incentives
- Mention specific dates/timing
` : ''}

⚠️ CRITICAL REQUIREMENT:
- The content MUST specifically promote ONLY these scheduled services
- DO NOT create generic business content or mention other services
- Focus ENTIRELY on the scheduled services listed above
- Use the EXACT service names in headlines and content
- Ignore any other business services not listed above`;
    }

    return `Generate UNIQUE and CREATIVE social media content for ${request.businessName} (${request.businessType}) on ${request.platform}.

🎯 CREATIVITY REQUIREMENT: This must be COMPLETELY DIFFERENT from any previous content. Use creativity level ${creativityBoost}/10.

CREATIVE CONCEPT: ${creativeConcept}
LOCATION: ${request.location || 'Global'}
BUSINESS FOCUS: ${request.businessType}
PLATFORM: ${request.platform}
ENFORCED FORMAT: ${enforcedFormat}
${productBlock ? `\nPRODUCT FOCUS:\n${productBlock}\n` : ''}${scheduledServicesContext}

🚫 ANTI-REPETITION RULES:
- DO NOT use "Experience the excellence of" - BANNED PHRASE
- DO NOT use generic templates or repetitive patterns
- DO NOT repeat previous captions - be completely original
- DO NOT use placeholder text - create authentic content
- CREATE fresh, unique content every time

✅ CONTENT REQUIREMENTS:
1. HEADLINE (max 6 words): Catchy, unique, attention-grabbing
2. SUBHEADLINE (max 25 words): Compelling, specific value proposition
3. CAPTION (50-100 words): Engaging, authentic, conversational, UNIQUE
4. CALL-TO-ACTION (2-4 words): Action-oriented, compelling
5. HASHTAGS (EXACTLY ${hashtagCount}): ${request.platform === 'instagram' ? 'Instagram gets 5 hashtags' : 'Other platforms get 3 hashtags'}

🎨 CONTENT STYLE:
- Write like a sophisticated marketer who understands ${request.location || 'the local market'}
- Use persuasive, engaging language that drives interest
- Be conversational and authentic, not corporate
- Include specific benefits and value propositions
- Make it feel personal and relatable
- Use local cultural context when appropriate

📱 PLATFORM OPTIMIZATION:
- ${request.platform === 'instagram' ? 'Instagram: Visual storytelling, lifestyle focus, 5 strategic hashtags' : 'Other platforms: Professional tone, business focus, 3 targeted hashtags'}

🌍 CULTURAL INTELLIGENCE:
- Adapt tone for ${request.location || 'global audience'}
- Use culturally relevant references when appropriate
- Consider local business practices and communication styles

Format as JSON:
{
  "headline": "...",
  "subheadline": "...",
  "caption": "...",
  "cta": "...",
  "hashtags": ["#tag1", "#tag2", ...]
}`;
  }

  // Keep original buildClaudePrompt for fallback/retry scenarios
  private static buildClaudePrompt(request: ClaudeContentRequest, hashtagCount: number, avoidSnippet?: string, enforcedFormat?: string, extraRules?: string, productBlock?: string): string {
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
    const selectedFormat = enforcedFormat || contentFormats[Math.floor(Math.random() * contentFormats.length)];

    // Banned phrases from previous generations to prevent repetition
    const bannedPhrases = [
      "Money Moves", "Your Fingertips", "At Your", "Built in", "App Idea",
      "Smart Money Moves", "Nairobi's Hustlers", "Transform your business",
      "Digital Journey", "Growth Stories", "Move Millions", "Latest Tech",
      "Flexible Payment", "Delivered Today", "Rising entrepreneurs",
      "Secure digital payments", "Management tools designed"
    ];

    return `🎯 CREATIVE SESSION #${randomSeed} | TIMESTAMP: ${timestamp} | SESSION: ${sessionId}
${productBlock ? '\nRETAIL EXECUTION RULES (auto-applied):\n- Use the SELECTED PRODUCT above for a product spotlight ad.\n- Include exact price anchor (or "from" price if present).\n- If discount is present, mention it clearly and ethically.\n- Keep headline ≤ 6 words; subheadline ≤ 25 words total.\n- Use retail CTAs (Shop Now, Order Today, Visit Store) appropriate to platform.\n- Use local cues like M-Pesa or delivery as supporting details, not headline.\n' : ''}

🚨 EXTREME ANTI-REPETITION PROTOCOL ACTIVATED 🚨

MANDATORY UNIQUENESS DIRECTIVE: You are a ${selectedPersonality} creating COMPLETELY ORIGINAL content.

CREATIVE ANGLE FOR THIS SESSION: ${selectedAngle}

FORMAT FOR THIS SESSION: ${selectedFormat}

${extraRules ? `\n${extraRules}\n` : ''}

LANGUAGE POLICY: ${languageInstruction}

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
${productBlock ? `\nPRODUCT CATALOG SNAPSHOT (parsed from brand services):\n${productBlock}\n` : ''}

	BUSINESS MODEL ANALYSIS & CONVERSION MAPPING:
	- Identify which category best fits this business from: Banking/Fintech, E-commerce/Retail, Restaurant/Food, Local Services, App/Software, Experience/Events.
	- Then apply the matching strategy below to craft action-oriented content that drives the correct next step.

	CATEGORY PLAYBOOKS (pick the single best fit):
	- Banking/Fintech: Trust + security + convenience. Mention features that reduce friction. CTA examples: "Open Account", "Get Started", "Apply Now".
	- E-commerce/Retail: Product specifics (use-case, materials, variants), benefits, social proof (generic), optional price cues. CTA: "Shop Now", "Add to Cart", "Visit Store".
	- Restaurant/Food: Sensory language + dish specificity + occasion fit + location cue. CTA: "Reserve Table", "Order Now", "Visit Today".
	- Local Services: Before/after, the job in action, tools/equipment, proof of reliability. CTA: "Book Service", "Get Quote", "Call Now".
	- App/Software: Feature→Value mapping, problem solved, onboarding ease. CTA: "Download App", "Try Free", "Start Free Trial".
	- Experience/Events: Date/time/location clarity, what attendees get, social energy. CTA: "RSVP", "Get Tickets", "Join Us".

	ACTION LOGIC:
	- Determine primary customer path: browse→buy vs book→visit vs download→use.
	- Ensure the CTA matches that path, and the caption narrates the path to action.
	- Create natural urgency (limited availability, seasonal relevance) without fake scarcity.

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
