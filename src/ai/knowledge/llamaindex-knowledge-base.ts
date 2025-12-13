/**
 * LlamaIndex Knowledge Base - Persistent memory for Revo 2.0
 * Maintains knowledge of:
 * - Past successful posts (avoid repetition)
 * - Brand guidelines per business
 * - Cultural context for different markets
 * - Competitor content analysis
 */

import { Document, VectorStoreIndex, OpenAI, Settings } from 'llamaindex';
import { createClient } from '@supabase/supabase-js';

// Configure LlamaIndex to use OpenAI
Settings.llm = new OpenAI({
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Knowledge Base Categories
 */
export enum KnowledgeCategory {
  PAST_POSTS = 'past_posts',
  BRAND_GUIDELINES = 'brand_guidelines',
  CULTURAL_CONTEXT = 'cultural_context',
  COMPETITOR_ANALYSIS = 'competitor_analysis'
}

/**
 * Past Post Record
 */
export interface PastPost {
  id: string;
  businessId: string;
  platform: string;
  headline: string;
  caption: string;
  sellingAngle: string;
  emotionalTone: string;
  targetAudience: string;
  performanceScore?: number; // Engagement metrics
  createdAt: Date;
}

/**
 * Brand Guidelines Record
 */
export interface BrandGuidelines {
  businessId: string;
  brandVoice: string;
  prohibitedWords: string[];
  preferredPhrases: string[];
  colorPalette: string[];
  logoUsageRules: string;
  targetAudience: string;
  competitiveAdvantages: string[];
  updatedAt: Date;
}

/**
 * Cultural Context Record
 */
export interface CulturalContext {
  country: string;
  language: string;
  localPhrases: { phrase: string; meaning: string; usage: string }[];
  culturalNorms: string[];
  avoidTopics: string[];
  preferredImagery: string[];
  businessEtiquette: string[];
  updatedAt: Date;
}

/**
 * Competitor Analysis Record
 */
export interface CompetitorAnalysis {
  businessId: string;
  competitorName: string;
  strengths: string[];
  weaknesses: string[];
  contentApproaches: string[];
  differentiationOpportunities: string[];
  analyzedAt: Date;
}

/**
 * LlamaIndex Knowledge Base Manager
 */
export class KnowledgeBaseManager {
  private supabase: any;
  private indexes: Map<string, VectorStoreIndex> = new Map();
  
  constructor() {
    // Initialize Supabase for persistent storage
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Store past post in knowledge base
   */
  async storePastPost(post: PastPost): Promise<void> {
    console.log(`📚 [Knowledge Base] Storing past post for business ${post.businessId}`);

    // Create document for LlamaIndex
    const document = new Document({
      text: `
        Business: ${post.businessId}
        Platform: ${post.platform}
        Headline: ${post.headline}
        Caption: ${post.caption}
        Selling Angle: ${post.sellingAngle}
        Emotional Tone: ${post.emotionalTone}
        Target Audience: ${post.targetAudience}
        Performance Score: ${post.performanceScore || 'N/A'}
        Created: ${post.createdAt.toISOString()}
      `,
      metadata: {
        category: KnowledgeCategory.PAST_POSTS,
        businessId: post.businessId,
        platform: post.platform,
        sellingAngle: post.sellingAngle,
        emotionalTone: post.emotionalTone,
        createdAt: post.createdAt.toISOString()
      }
    });

    // Store in vector index
    await this.addToIndex(KnowledgeCategory.PAST_POSTS, document);

    // Also store in Supabase for persistence
    await this.supabase.from('knowledge_base_posts').insert({
      id: post.id,
      business_id: post.businessId,
      platform: post.platform,
      headline: post.headline,
      caption: post.caption,
      selling_angle: post.sellingAngle,
      emotional_tone: post.emotionalTone,
      target_audience: post.targetAudience,
      performance_score: post.performanceScore,
      created_at: post.createdAt.toISOString()
    });

    console.log(`✅ [Knowledge Base] Past post stored successfully`);
  }

  /**
   * Store brand guidelines in knowledge base
   */
  async storeBrandGuidelines(guidelines: BrandGuidelines): Promise<void> {
    console.log(`📚 [Knowledge Base] Storing brand guidelines for ${guidelines.businessId}`);

    const document = new Document({
      text: `
        Business: ${guidelines.businessId}
        Brand Voice: ${guidelines.brandVoice}
        Prohibited Words: ${guidelines.prohibitedWords.join(', ')}
        Preferred Phrases: ${guidelines.preferredPhrases.join(', ')}
        Color Palette: ${guidelines.colorPalette.join(', ')}
        Logo Usage: ${guidelines.logoUsageRules}
        Target Audience: ${guidelines.targetAudience}
        Competitive Advantages: ${guidelines.competitiveAdvantages.join(', ')}
      `,
      metadata: {
        category: KnowledgeCategory.BRAND_GUIDELINES,
        businessId: guidelines.businessId,
        updatedAt: guidelines.updatedAt.toISOString()
      }
    });

    await this.addToIndex(KnowledgeCategory.BRAND_GUIDELINES, document);

    // Store in Supabase
    await this.supabase.from('knowledge_base_guidelines').upsert({
      business_id: guidelines.businessId,
      brand_voice: guidelines.brandVoice,
      prohibited_words: guidelines.prohibitedWords,
      preferred_phrases: guidelines.preferredPhrases,
      color_palette: guidelines.colorPalette,
      logo_usage_rules: guidelines.logoUsageRules,
      target_audience: guidelines.targetAudience,
      competitive_advantages: guidelines.competitiveAdvantages,
      updated_at: guidelines.updatedAt.toISOString()
    });

    console.log(`✅ [Knowledge Base] Brand guidelines stored successfully`);
  }

  /**
   * Store cultural context in knowledge base
   */
  async storeCulturalContext(context: CulturalContext): Promise<void> {
    console.log(`📚 [Knowledge Base] Storing cultural context for ${context.country}`);

    const document = new Document({
      text: `
        Country: ${context.country}
        Language: ${context.language}
        Local Phrases: ${context.localPhrases.map(p => `${p.phrase} (${p.meaning})`).join(', ')}
        Cultural Norms: ${context.culturalNorms.join(', ')}
        Avoid Topics: ${context.avoidTopics.join(', ')}
        Preferred Imagery: ${context.preferredImagery.join(', ')}
        Business Etiquette: ${context.businessEtiquette.join(', ')}
      `,
      metadata: {
        category: KnowledgeCategory.CULTURAL_CONTEXT,
        country: context.country,
        language: context.language,
        updatedAt: context.updatedAt.toISOString()
      }
    });

    await this.addToIndex(KnowledgeCategory.CULTURAL_CONTEXT, document);

    // Store in Supabase
    await this.supabase.from('knowledge_base_cultural').upsert({
      country: context.country,
      language: context.language,
      local_phrases: context.localPhrases,
      cultural_norms: context.culturalNorms,
      avoid_topics: context.avoidTopics,
      preferred_imagery: context.preferredImagery,
      business_etiquette: context.businessEtiquette,
      updated_at: context.updatedAt.toISOString()
    });

    console.log(`✅ [Knowledge Base] Cultural context stored successfully`);
  }

  /**
   * Store competitor analysis in knowledge base
   */
  async storeCompetitorAnalysis(analysis: CompetitorAnalysis): Promise<void> {
    console.log(`📚 [Knowledge Base] Storing competitor analysis for ${analysis.businessId}`);

    const document = new Document({
      text: `
        Business: ${analysis.businessId}
        Competitor: ${analysis.competitorName}
        Strengths: ${analysis.strengths.join(', ')}
        Weaknesses: ${analysis.weaknesses.join(', ')}
        Content Approaches: ${analysis.contentApproaches.join(', ')}
        Differentiation Opportunities: ${analysis.differentiationOpportunities.join(', ')}
      `,
      metadata: {
        category: KnowledgeCategory.COMPETITOR_ANALYSIS,
        businessId: analysis.businessId,
        competitorName: analysis.competitorName,
        analyzedAt: analysis.analyzedAt.toISOString()
      }
    });

    await this.addToIndex(KnowledgeCategory.COMPETITOR_ANALYSIS, document);

    // Store in Supabase
    await this.supabase.from('knowledge_base_competitors').insert({
      business_id: analysis.businessId,
      competitor_name: analysis.competitorName,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      content_approaches: analysis.contentApproaches,
      differentiation_opportunities: analysis.differentiationOpportunities,
      analyzed_at: analysis.analyzedAt.toISOString()
    });

    console.log(`✅ [Knowledge Base] Competitor analysis stored successfully`);
  }

  /**
   * Query past posts to avoid repetition
   */
  async queryPastPosts(
    businessId: string,
    query: string,
    limit: number = 10
  ): Promise<PastPost[]> {
    console.log(`🔍 [Knowledge Base] Querying past posts for ${businessId}`);

    const index = await this.getOrCreateIndex(KnowledgeCategory.PAST_POSTS);
    const queryEngine = index.asQueryEngine();

    const response = await queryEngine.query({
      query: `${query} for business ${businessId}`
    });

    console.log(`📊 [Knowledge Base] Found relevant past posts`);

    // Also query Supabase for structured data
    const { data, error } = await this.supabase
      .from('knowledge_base_posts')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [Knowledge Base] Error querying Supabase:', error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      businessId: row.business_id,
      platform: row.platform,
      headline: row.headline,
      caption: row.caption,
      sellingAngle: row.selling_angle,
      emotionalTone: row.emotional_tone,
      targetAudience: row.target_audience,
      performanceScore: row.performance_score,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Get brand guidelines for a business
   */
  async getBrandGuidelines(businessId: string): Promise<BrandGuidelines | null> {
    console.log(`🔍 [Knowledge Base] Retrieving brand guidelines for ${businessId}`);

    const { data, error } = await this.supabase
      .from('knowledge_base_guidelines')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (error || !data) {
      console.log(`⚠️ [Knowledge Base] No brand guidelines found for ${businessId}`);
      return null;
    }

    return {
      businessId: data.business_id,
      brandVoice: data.brand_voice,
      prohibitedWords: data.prohibited_words,
      preferredPhrases: data.preferred_phrases,
      colorPalette: data.color_palette,
      logoUsageRules: data.logo_usage_rules,
      targetAudience: data.target_audience,
      competitiveAdvantages: data.competitive_advantages,
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Get cultural context for a country
   */
  async getCulturalContext(country: string): Promise<CulturalContext | null> {
    console.log(`🔍 [Knowledge Base] Retrieving cultural context for ${country}`);

    const { data, error } = await this.supabase
      .from('knowledge_base_cultural')
      .select('*')
      .eq('country', country)
      .single();

    if (error || !data) {
      console.log(`⚠️ [Knowledge Base] No cultural context found for ${country}`);
      return null;
    }

    return {
      country: data.country,
      language: data.language,
      localPhrases: data.local_phrases,
      culturalNorms: data.cultural_norms,
      avoidTopics: data.avoid_topics,
      preferredImagery: data.preferred_imagery,
      businessEtiquette: data.business_etiquette,
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Get competitor analysis for a business
   */
  async getCompetitorAnalysis(businessId: string): Promise<CompetitorAnalysis[]> {
    console.log(`🔍 [Knowledge Base] Retrieving competitor analysis for ${businessId}`);

    const { data, error } = await this.supabase
      .from('knowledge_base_competitors')
      .select('*')
      .eq('business_id', businessId)
      .order('analyzed_at', { ascending: false });

    if (error || !data) {
      console.log(`⚠️ [Knowledge Base] No competitor analysis found for ${businessId}`);
      return [];
    }

    return data.map((row: any) => ({
      businessId: row.business_id,
      competitorName: row.competitor_name,
      strengths: row.strengths,
      weaknesses: row.weaknesses,
      contentApproaches: row.content_approaches,
      differentiationOpportunities: row.differentiation_opportunities,
      analyzedAt: new Date(row.analyzed_at)
    }));
  }

  /**
   * Helper: Add document to vector index
   */
  private async addToIndex(category: KnowledgeCategory, document: Document): Promise<void> {
    const index = await this.getOrCreateIndex(category);
    await index.insert(document);
  }

  /**
   * Helper: Get or create vector index for category
   */
  private async getOrCreateIndex(category: KnowledgeCategory): Promise<VectorStoreIndex> {
    if (this.indexes.has(category)) {
      return this.indexes.get(category)!;
    }

    // Create new index
    const index = await VectorStoreIndex.fromDocuments([]);
    this.indexes.set(category, index);
    
    return index;
  }

  /**
   * Initialize knowledge base from existing data
   */
  async initialize(businessId: string): Promise<void> {
    console.log(`🚀 [Knowledge Base] Initializing for business ${businessId}`);

    // Load past posts
    const pastPosts = await this.queryPastPosts(businessId, 'all posts', 50);
    console.log(`📚 [Knowledge Base] Loaded ${pastPosts.length} past posts`);

    // Load brand guidelines
    const guidelines = await this.getBrandGuidelines(businessId);
    if (guidelines) {
      console.log(`📚 [Knowledge Base] Loaded brand guidelines`);
    }

    // Load competitor analysis
    const competitors = await this.getCompetitorAnalysis(businessId);
    console.log(`📚 [Knowledge Base] Loaded ${competitors.length} competitor analyses`);

    console.log(`✅ [Knowledge Base] Initialization complete`);
  }
}

// Singleton instance
let knowledgeBaseInstance: KnowledgeBaseManager | null = null;

export function getKnowledgeBase(): KnowledgeBaseManager {
  if (!knowledgeBaseInstance) {
    knowledgeBaseInstance = new KnowledgeBaseManager();
  }
  return knowledgeBaseInstance;
}
