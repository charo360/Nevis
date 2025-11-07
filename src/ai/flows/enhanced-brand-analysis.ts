'use server';

/**
 * @fileOverview Enhanced Brand Analysis Flow that integrates comprehensive brand intelligence
 * 
 * This flow provides both basic and comprehensive brand analysis options:
 * - Basic: Uses existing OpenRouter analysis (fast, lightweight)
 * - Comprehensive: Uses new Brand Intelligence system (detailed, multi-source)
 */

import { BrandIntelligenceOrchestrator, type CompleteBrandIntelligence } from '../brand-intelligence/orchestration-pipeline';
import { analyzeBrand as basicAnalyzeBrand, type BrandAnalysisResult, type AnalyzeBrandInput } from './analyze-brand';

export interface EnhancedBrandAnalysisInput {
  websiteUrl: string;
  analysisType: 'basic' | 'comprehensive';
  designImageUris?: string[];
  websiteContent?: string;
  options?: {
    includeSocialMedia?: boolean;
    includeVisualAnalysis?: boolean;
    maxPages?: number;
    maxImages?: number;
  };
}

export interface EnhancedBrandAnalysisResult {
  // Basic analysis results (always included)
  basic: BrandAnalysisResult;
  
  // Comprehensive analysis results (only when analysisType = 'comprehensive')
  comprehensive?: {
    brandIntelligence: CompleteBrandIntelligence;
    quickReport: string;
    insights: {
      brandStrength: number; // 0-100 score
      digitalPresence: number; // 0-100 score
      contentQuality: number; // 0-100 score
      visualConsistency: number; // 0-100 score
      recommendations: Array<{
        category: string;
        priority: 'high' | 'medium' | 'low';
        recommendation: string;
        impact: string;
      }>;
    };
  };
  
  // Metadata
  metadata: {
    analysisId: string;
    timestamp: number;
    duration: number;
    analysisType: 'basic' | 'comprehensive';
    status: 'success' | 'partial' | 'failed';
    errors: string[];
  };
}

export class EnhancedBrandAnalyzer {
  private orchestrator: BrandIntelligenceOrchestrator;

  constructor() {
    this.orchestrator = new BrandIntelligenceOrchestrator();
  }

  async analyzeEnhanced(input: EnhancedBrandAnalysisInput): Promise<EnhancedBrandAnalysisResult> {
    const startTime = Date.now();
    const analysisId = `enhanced_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const errors: string[] = [];
    let status: 'success' | 'partial' | 'failed' = 'success';

    console.log(`🚀 Starting ${input.analysisType} brand analysis for: ${input.websiteUrl}`);

    try {
      // Step 1: Always perform basic analysis first
      console.log('📊 Step 1: Performing basic brand analysis...');
      const basicInput: AnalyzeBrandInput = {
        websiteUrl: input.websiteUrl,
        designImageUris: input.designImageUris || [],
        websiteContent: input.websiteContent
      };

      const basicResult = await basicAnalyzeBrand(basicInput);
      console.log('✅ Basic analysis completed');

      let comprehensiveResult: EnhancedBrandAnalysisResult['comprehensive'];

      // Step 2: Perform comprehensive analysis if requested
      if (input.analysisType === 'comprehensive') {
        try {
          console.log('🔬 Step 2: Performing comprehensive brand intelligence analysis...');
          
          const brandIntelligence = await this.orchestrator.analyzeBrand(input.websiteUrl, {
            maxPages: input.options?.maxPages || 25,
            maxImages: input.options?.maxImages || 30,
            includeSocialMedia: input.options?.includeSocialMedia ?? true,
            includeVisualAnalysis: input.options?.includeVisualAnalysis ?? true,
            generateEmbeddings: false,
            saveResults: false
          });

          const quickReport = this.orchestrator.generateQuickReport(brandIntelligence);
          const insights = this.generateInsights(brandIntelligence, basicResult);

          comprehensiveResult = {
            brandIntelligence,
            quickReport,
            insights
          };

          console.log('✅ Comprehensive analysis completed');

        } catch (error) {
          console.error('❌ Comprehensive analysis failed:', error.message);
          errors.push(`Comprehensive analysis: ${error.message}`);
          status = 'partial';
        }
      }

      const duration = Date.now() - startTime;

      return {
        basic: basicResult,
        comprehensive: comprehensiveResult,
        metadata: {
          analysisId,
          timestamp: startTime,
          duration,
          analysisType: input.analysisType,
          status,
          errors
        }
      };

    } catch (error) {
      console.error('❌ Enhanced brand analysis failed:', error.message);
      
      const duration = Date.now() - startTime;
      
      // Return error result with metadata
      throw new Error(`Enhanced brand analysis failed: ${error.message}`);
    }
  }

  private generateInsights(
    brandIntelligence: CompleteBrandIntelligence,
    basicResult: BrandAnalysisResult
  ): {
    brandStrength: number;
    digitalPresence: number;
    contentQuality: number;
    visualConsistency: number;
    recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      recommendation: string;
      impact: string;
    }>;
  } {
    // Calculate brand strength score (0-100)
    const brandStrength = this.calculateBrandStrength(brandIntelligence);
    
    // Calculate digital presence score (0-100)
    const digitalPresence = this.calculateDigitalPresence(brandIntelligence);
    
    // Calculate content quality score (0-100)
    const contentQuality = this.calculateContentQuality(brandIntelligence);
    
    // Calculate visual consistency score (0-100)
    const visualConsistency = this.calculateVisualConsistency(brandIntelligence);
    
    // Generate prioritized recommendations
    const recommendations = this.generatePrioritizedRecommendations(brandIntelligence, basicResult);

    return {
      brandStrength,
      digitalPresence,
      contentQuality,
      visualConsistency,
      recommendations
    };
  }

  private calculateBrandStrength(intelligence: CompleteBrandIntelligence): number {
    let score = 0;
    let maxScore = 0;

    // Brand DNA strength (40 points)
    maxScore += 40;
    if (intelligence.brandDNA.brandPersonality.traits.length > 0) {
      score += Math.min(intelligence.brandDNA.brandPersonality.traits.length * 8, 32);
    }
    if (intelligence.brandDNA.brandLexicon.brandValues.length > 0) {
      score += Math.min(intelligence.brandDNA.brandLexicon.brandValues.length * 2, 8);
    }

    // Competitive advantages (30 points)
    maxScore += 30;
    score += Math.min(intelligence.brandSummary.competitiveAdvantages.length * 6, 30);

    // Brand consistency (30 points)
    maxScore += 30;
    if (intelligence.brandDNA.contentPatterns.communicationStyle.formality !== 'mixed') {
      score += 15;
    }
    if (intelligence.brandDNA.sentiment.overall === 'positive') {
      score += 15;
    }

    return Math.round((score / maxScore) * 100);
  }

  private calculateDigitalPresence(intelligence: CompleteBrandIntelligence): number {
    let score = 0;
    let maxScore = 0;

    // Website presence (40 points)
    maxScore += 40;
    score += Math.min(intelligence.websiteData.website.pages.length * 2, 30);
    if (intelligence.websiteData.website.technicalInfo.performance.averageLoadTime < 3000) {
      score += 10;
    }

    // Social media presence (40 points)
    maxScore += 40;
    const socialHandles = Object.keys(intelligence.websiteData.socialMedia.handles).length;
    score += Math.min(socialHandles * 10, 30);
    if (intelligence.socialMediaData?.instagram) {
      score += 10;
    }

    // Content volume (20 points)
    maxScore += 20;
    const totalContent = intelligence.brandDNA.keywords.primary.length + intelligence.brandDNA.topics.main.length;
    score += Math.min(totalContent, 20);

    return Math.round((score / maxScore) * 100);
  }

  private calculateContentQuality(intelligence: CompleteBrandIntelligence): number {
    let score = 0;
    let maxScore = 0;

    // Content depth (40 points)
    maxScore += 40;
    score += Math.min(intelligence.brandDNA.keywords.primary.length * 2, 30);
    score += Math.min(intelligence.brandDNA.topics.main.length * 5, 10);

    // Sentiment quality (30 points)
    maxScore += 30;
    if (intelligence.brandDNA.sentiment.overall === 'positive') {
      score += 20;
    }
    score += Math.min(intelligence.brandDNA.sentiment.score * 10, 10);

    // Message clarity (30 points)
    maxScore += 30;
    score += Math.min(intelligence.brandDNA.brandLexicon.keyMessages.length * 5, 25);
    if (intelligence.brandDNA.contentPatterns.ctaPatterns.length > 0) {
      score += 5;
    }

    return Math.round((score / maxScore) * 100);
  }

  private calculateVisualConsistency(intelligence: CompleteBrandIntelligence): number {
    if (!intelligence.visualIdentity) {
      return 50; // Default score when no visual analysis available
    }

    let score = 0;
    let maxScore = 0;

    // Color consistency (40 points)
    maxScore += 40;
    score += intelligence.visualIdentity.colorScheme.consistency * 40;

    // Style consistency (30 points)
    maxScore += 30;
    if (intelligence.visualIdentity.visualStyle.overallStyle !== 'mixed') {
      score += 20;
    }
    score += Math.min(intelligence.visualIdentity.visualStyle.commonElements.length * 2, 10);

    // Technical quality (30 points)
    maxScore += 30;
    score += intelligence.visualIdentity.technicalQuality.professionalScore * 30;

    return Math.round((score / maxScore) * 100);
  }

  private generatePrioritizedRecommendations(
    intelligence: CompleteBrandIntelligence,
    basicResult: BrandAnalysisResult
  ): Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    impact: string;
  }> {
    const recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      recommendation: string;
      impact: string;
    }> = [];

    // High priority recommendations
    if (intelligence.brandDNA.sentiment.score < 0.3) {
      recommendations.push({
        category: 'Content Strategy',
        priority: 'high',
        recommendation: 'Improve content sentiment by adding more positive messaging and customer success stories',
        impact: 'Significantly improve brand perception and customer trust'
      });
    }

    if (!intelligence.socialMediaData?.instagram && intelligence.brandSummary.businessType !== 'finance') {
      recommendations.push({
        category: 'Digital Presence',
        priority: 'high',
        recommendation: 'Establish Instagram presence for visual brand building and customer engagement',
        impact: 'Expand reach to younger demographics and improve brand visibility'
      });
    }

    // Medium priority recommendations
    if (intelligence.brandDNA.contentPatterns.communicationStyle.formality === 'mixed') {
      recommendations.push({
        category: 'Brand Voice',
        priority: 'medium',
        recommendation: 'Standardize tone of voice across all communications for better brand consistency',
        impact: 'Improve brand recognition and professional credibility'
      });
    }

    if (intelligence.visualIdentity && intelligence.visualIdentity.colorScheme.consistency < 0.7) {
      recommendations.push({
        category: 'Visual Identity',
        priority: 'medium',
        recommendation: 'Improve color consistency across all visual materials and website',
        impact: 'Strengthen visual brand recognition and professional appearance'
      });
    }

    // Low priority recommendations
    if (intelligence.brandDNA.keywords.primary.length < 10) {
      recommendations.push({
        category: 'SEO & Content',
        priority: 'low',
        recommendation: 'Expand content strategy to target more relevant keywords and topics',
        impact: 'Improve search engine visibility and content depth'
      });
    }

    return recommendations.slice(0, 8); // Limit to top 8 recommendations
  }
}

// Export the main function for easy use
export async function analyzeEnhancedBrand(input: EnhancedBrandAnalysisInput): Promise<EnhancedBrandAnalysisResult> {
  const analyzer = new EnhancedBrandAnalyzer();
  return analyzer.analyzeEnhanced(input);
}
