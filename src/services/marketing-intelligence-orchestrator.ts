import { StoryIntelligenceEngine } from './story-intelligence-engine';
import { EmotionalPsychologyEngine } from './emotional-psychology-engine';
import { BusinessIntelligenceAnalyzer } from './business-intelligence-analyzer';
import { EnhancedCulturalIntelligence } from './enhanced-cultural-intelligence';
import { DeepStoryExtractor } from './deep-story-extractor';
import { CompellingCTAGenerator } from './compelling-cta-generator';

interface IntelligenceAnalysis {
  storyAnalysis: any;
  emotionalProfile: any;
  valueProposition: any;
  culturalContext: any;
  overallScore: number;
}

interface OptimizedContent {
  headline: string;
  subheadline: string;
  cta: string;
  intelligenceScore: number;
  conversionPrediction: number;
  culturalResonance: number;
  emotionalImpact: number;
  businessRelevance: number;
  recommendations: string[];
}

export class MarketingIntelligenceOrchestrator {
  static async analyzeCompany(companyData: any): Promise<IntelligenceAnalysis> {
    // Run all intelligence engines
    const storyAnalysis = StoryIntelligenceEngine.analyzeBusinessStory(companyData);
    const emotionalProfile = EmotionalPsychologyEngine.analyzeEmotionalProfile(companyData);
    const valueProposition = BusinessIntelligenceAnalyzer.analyzeValueProposition(companyData);
    const culturalContext = EnhancedCulturalIntelligence.getCulturalInsights(companyData);
    
    // Calculate overall intelligence score
    const businessScore = BusinessIntelligenceAnalyzer.calculateBusinessIntelligenceScore(valueProposition);
    const emotionalScore = EmotionalPsychologyEngine.optimizeForConversion(emotionalProfile).psychologyScore;
    const culturalScore = EnhancedCulturalIntelligence.optimizeForCulturalResonance(companyData).culturalScore;
    
    const overallScore = Math.round((businessScore + emotionalScore + culturalScore) / 3);
    
    return {
      storyAnalysis,
      emotionalProfile,
      valueProposition,
      culturalContext,
      overallScore
    };
  }

  static generateOptimizedContent(
    companyData: any, 
    contentType: 'conversion' | 'awareness' | 'engagement' = 'conversion'
  ): OptimizedContent {
    // Get deep story extraction
    const compellingStory = DeepStoryExtractor.extractCompellingStory(companyData);
    const emotionalProfile = EmotionalPsychologyEngine.analyzeEmotionalProfile(companyData);
    const valueProposition = BusinessIntelligenceAnalyzer.analyzeValueProposition(companyData);
    
    // Generate content based on compelling stories
    let headline: string;
    let subheadline: string;
    let cta: string;
    
    if (contentType === 'conversion') {
      // Use compelling emotional hooks and customer stories
      headline = DeepStoryExtractor.generateCompellingContent(compellingStory, 'headline');
      subheadline = DeepStoryExtractor.generateCompellingContent(compellingStory, 'subheadline');
      cta = CompellingCTAGenerator.getOptimalCTA(companyData, 'urgency');
    } else if (contentType === 'awareness') {
      // Use founder journey and innovation story
      headline = compellingStory.founderJourney;
      subheadline = compellingStory.innovationStory;
      cta = CompellingCTAGenerator.getOptimalCTA(companyData, 'social');
    } else {
      // Use impact story and location story
      headline = compellingStory.impactStory;
      subheadline = compellingStory.locationStory;
      cta = CompellingCTAGenerator.getOptimalCTA(companyData, 'benefit');
    }
    
    // Apply cultural localization
    const culturalHeadline = EnhancedCulturalIntelligence.generateLocalizedContent(headline, companyData, 'headline');
    const culturalSubheadline = EnhancedCulturalIntelligence.generateLocalizedContent(subheadline, companyData, 'subheadline');
    const culturalCta = EnhancedCulturalIntelligence.generateLocalizedContent(cta, companyData, 'cta');
    
    // Calculate performance scores
    const businessScore = BusinessIntelligenceAnalyzer.calculateBusinessIntelligenceScore(valueProposition);
    const emotionalScore = EmotionalPsychologyEngine.optimizeForConversion(emotionalProfile).psychologyScore;
    const culturalScore = EnhancedCulturalIntelligence.optimizeForCulturalResonance(companyData).culturalScore;
    
    const intelligenceScore = Math.round((businessScore + emotionalScore + culturalScore) / 3);
    
    // Predict conversion potential
    const conversionPrediction = this.calculateConversionPrediction(
      emotionalScore, 
      businessScore, 
      culturalScore, 
      contentType
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      businessScore, 
      emotionalScore, 
      culturalScore, 
      storyAnalysis, 
      emotionalProfile
    );
    
    return {
      headline: culturalHeadline.localizedMessage,
      subheadline: culturalSubheadline.localizedMessage,
      cta: culturalCta.localizedMessage,
      intelligenceScore,
      conversionPrediction,
      culturalResonance: culturalScore,
      emotionalImpact: emotionalScore,
      businessRelevance: businessScore,
      recommendations
    };
  }

  private static calculateConversionPrediction(
    emotionalScore: number, 
    businessScore: number, 
    culturalScore: number, 
    contentType: string
  ): number {
    let prediction = 0;
    
    if (contentType === 'conversion') {
      // Emotional triggers are most important for conversion
      prediction = (emotionalScore * 0.5) + (businessScore * 0.3) + (culturalScore * 0.2);
    } else if (contentType === 'awareness') {
      // Cultural resonance and story are most important for awareness
      prediction = (culturalScore * 0.4) + (businessScore * 0.3) + (emotionalScore * 0.3);
    } else {
      // Balanced approach for engagement
      prediction = (emotionalScore * 0.35) + (businessScore * 0.35) + (culturalScore * 0.3);
    }
    
    return Math.round(prediction);
  }

  private static generateRecommendations(
    businessScore: number, 
    emotionalScore: number, 
    culturalScore: number, 
    storyAnalysis: any, 
    emotionalProfile: any
  ): string[] {
    const recommendations: string[] = [];
    
    // Business intelligence recommendations
    if (businessScore < 7) {
      recommendations.push('Strengthen unique value proposition with specific competitive advantages');
      recommendations.push('Add more credible social proof and customer testimonials');
    }
    
    // Emotional intelligence recommendations
    if (emotionalScore < 7) {
      recommendations.push('Incorporate stronger psychological triggers for urgency and social proof');
      recommendations.push('Address specific customer pain points more directly');
    }
    
    // Cultural intelligence recommendations
    if (culturalScore < 7) {
      recommendations.push('Integrate more local cultural values and expressions');
      recommendations.push('Add region-specific trust signals and community connections');
    }
    
    // Story-based recommendations
    if (!storyAnalysis.founderStory && !storyAnalysis.socialMission) {
      recommendations.push('Develop compelling founder or mission story for emotional connection');
    }
    
    // Emotional profile recommendations
    if (emotionalProfile.painPoints.length < 2) {
      recommendations.push('Identify and address more specific customer pain points');
    }
    
    // Default recommendations if all scores are good
    if (recommendations.length === 0) {
      recommendations.push('Content is well-optimized across all intelligence dimensions');
      recommendations.push('Consider A/B testing different emotional triggers for optimization');
    }
    
    return recommendations.slice(0, 4); // Top 4 recommendations
  }

  static async generateIntelligentCampaign(companyData: any): Promise<{
    conversionAd: OptimizedContent;
    awarenessAd: OptimizedContent;
    engagementAd: OptimizedContent;
    campaignStrategy: string[];
    overallIntelligenceScore: number;
  }> {
    const conversionAd = this.generateOptimizedContent(companyData, 'conversion');
    const awarenessAd = this.generateOptimizedContent(companyData, 'awareness');
    const engagementAd = this.generateOptimizedContent(companyData, 'engagement');
    
    const overallIntelligenceScore = Math.round(
      (conversionAd.intelligenceScore + awarenessAd.intelligenceScore + engagementAd.intelligenceScore) / 3
    );
    
    const campaignStrategy = [
      'Start with awareness ads to build brand recognition',
      'Follow with engagement ads to build community',
      'Convert with high-impact conversion ads',
      'Use cultural insights to optimize timing and placement'
    ];
    
    return {
      conversionAd,
      awarenessAd,
      engagementAd,
      campaignStrategy,
      overallIntelligenceScore
    };
  }
}