// Brand Intelligence Orchestration Pipeline
// Coordinates all brand analysis components and generates comprehensive reports

import { EnhancedWebScraper, type ComprehensiveBrandData } from './enhanced-web-scraper';
import { SocialMediaScraper, type SocialMediaData } from './social-media-scraper';
import { BrandDNAExtractor, type BrandDNA, type TextCorpus } from './brand-dna-extractor';
import { VisualAnalyzer, type BrandVisualIdentity } from './visual-analyzer';

interface BrandAnalysisConfig {
  maxPages: number;
  maxImages: number;
  includeSocialMedia: boolean;
  includeVisualAnalysis: boolean;
  generateEmbeddings: boolean;
  saveResults: boolean;
}

interface CompleteBrandIntelligence {
  metadata: {
    analysisId: string;
    timestamp: number;
    url: string;
    duration: number;
    config: BrandAnalysisConfig;
    status: 'success' | 'partial' | 'failed';
    errors: string[];
  };
  websiteData: ComprehensiveBrandData;
  socialMediaData?: SocialMediaData;
  brandDNA: BrandDNA;
  visualIdentity?: BrandVisualIdentity;
  brandSummary: {
    businessType: string;
    industry: string;
    brandArchetype: string;
    keyStrengths: string[];
    marketPosition: string;
    targetAudience: string[];
    brandPersonality: string[];
    competitiveAdvantages: string[];
    recommendedStrategy: string[];
  };
  contentStrategy: {
    toneOfVoice: string[];
    contentThemes: string[];
    messagingFramework: {
      primaryMessage: string;
      supportingMessages: string[];
      callToActions: string[];
    };
    visualGuidelines: {
      colorPalette: string[];
      imageStyle: string[];
      designPrinciples: string[];
    };
  };
  marketingInsights: {
    socialMediaStrategy: {
      platforms: string[];
      contentTypes: string[];
      postingFrequency: string;
      engagementTactics: string[];
    };
    brandPositioning: {
      currentPosition: string;
      opportunities: string[];
      threats: string[];
      recommendations: string[];
    };
  };
}

export class BrandIntelligenceOrchestrator {
  private webScraper: EnhancedWebScraper;
  private socialScraper: SocialMediaScraper;
  private dnaExtractor: BrandDNAExtractor;
  private visualAnalyzer: VisualAnalyzer;

  constructor() {
    this.webScraper = new EnhancedWebScraper();
    this.socialScraper = new SocialMediaScraper();
    this.dnaExtractor = new BrandDNAExtractor();
    this.visualAnalyzer = new VisualAnalyzer();
  }

  async analyzeBrand(
    url: string, 
    config: Partial<BrandAnalysisConfig> = {}
  ): Promise<CompleteBrandIntelligence> {
    const analysisId = this.generateAnalysisId();
    const startTime = Date.now();
    
    console.log(`🚀 Starting comprehensive brand analysis for: ${url}`);
    console.log(`📊 Analysis ID: ${analysisId}`);

    const fullConfig: BrandAnalysisConfig = {
      maxPages: 25,
      maxImages: 30,
      includeSocialMedia: true,
      includeVisualAnalysis: true,
      generateEmbeddings: false, // Disabled for now
      saveResults: true,
      ...config
    };

    const errors: string[] = [];
    let status: 'success' | 'partial' | 'failed' = 'success';

    try {
      // Step 1: Comprehensive Website Scraping
      console.log('🔍 Step 1: Scraping website content...');
      const websiteData = await this.webScraper.scrapeComprehensively(url);
      console.log(`✅ Scraped ${websiteData.website.pages.length} pages`);

      // Step 2: Social Media Discovery and Scraping
      let socialMediaData: SocialMediaData | undefined;
      if (fullConfig.includeSocialMedia) {
        try {
          console.log('📱 Step 2: Analyzing social media presence...');
          socialMediaData = await this.socialScraper.scrapeMultiplePlatforms(
            websiteData.socialMedia.handles
          );
          
          if (socialMediaData.instagram) {
            console.log(`✅ Found Instagram: @${socialMediaData.instagram.profile.username} with ${socialMediaData.instagram.posts.length} posts`);
          }
        } catch (error) {
          console.warn('⚠️ Social media analysis failed:', error.message);
          errors.push(`Social media analysis: ${error.message}`);
          status = 'partial';
        }
      }

      // Step 3: Brand DNA Extraction
      console.log('🧬 Step 3: Extracting brand DNA...');
      const textCorpus = this.createTextCorpus(websiteData, socialMediaData);
      const brandDNA = await this.dnaExtractor.extractBrandDNA(textCorpus);
      console.log(`✅ Extracted ${brandDNA.keywords.primary.length} primary keywords and ${brandDNA.topics.main.length} main topics`);

      // Step 4: Visual Analysis
      let visualIdentity: BrandVisualIdentity | undefined;
      if (fullConfig.includeVisualAnalysis) {
        try {
          console.log('🎨 Step 4: Analyzing visual identity...');
          const allImages = [
            ...websiteData.brandAssets.logos,
            ...websiteData.brandAssets.images.map(img => img.url)
          ].slice(0, fullConfig.maxImages);

          if (allImages.length > 0) {
            visualIdentity = await this.visualAnalyzer.analyzeImages(allImages);
            console.log(`✅ Analyzed ${allImages.length} images for visual identity`);
          } else {
            console.log('⚠️ No images found for visual analysis');
          }
        } catch (error) {
          console.warn('⚠️ Visual analysis failed:', error.message);
          errors.push(`Visual analysis: ${error.message}`);
          status = 'partial';
        }
      }

      // Step 5: Generate Brand Summary and Insights
      console.log('📋 Step 5: Generating brand insights...');
      const brandSummary = this.generateBrandSummary(websiteData, brandDNA, visualIdentity, socialMediaData);
      const contentStrategy = this.generateContentStrategy(brandDNA, visualIdentity, socialMediaData);
      const marketingInsights = this.generateMarketingInsights(websiteData, brandDNA, socialMediaData);

      const duration = Date.now() - startTime;
      console.log(`🎉 Brand analysis completed in ${Math.round(duration / 1000)}s`);

      const result: CompleteBrandIntelligence = {
        metadata: {
          analysisId,
          timestamp: startTime,
          url,
          duration,
          config: fullConfig,
          status,
          errors
        },
        websiteData,
        socialMediaData,
        brandDNA,
        visualIdentity,
        brandSummary,
        contentStrategy,
        marketingInsights
      };

      // Step 6: Save Results (if configured)
      if (fullConfig.saveResults) {
        await this.saveAnalysisResults(result);
      }

      return result;

    } catch (error) {
      console.error('❌ Brand analysis failed:', error.message);
      
      // Return partial results if available
      throw new Error(`Brand analysis failed: ${error.message}`);
    }
  }

  private generateAnalysisId(): string {
    return `brand_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private createTextCorpus(
    websiteData: ComprehensiveBrandData, 
    socialMediaData?: SocialMediaData
  ): TextCorpus {
    const websiteContent = websiteData.website.pages.map(page => page.content);
    
    const socialMediaContent: string[] = [];
    if (socialMediaData?.instagram) {
      socialMediaContent.push(
        socialMediaData.instagram.profile.biography,
        ...socialMediaData.instagram.posts.map(post => post.caption)
      );
    }

    return this.dnaExtractor.createTextCorpus(websiteContent, socialMediaContent);
  }

  private generateBrandSummary(
    websiteData: ComprehensiveBrandData,
    brandDNA: BrandDNA,
    visualIdentity?: BrandVisualIdentity,
    socialMediaData?: SocialMediaData
  ): CompleteBrandIntelligence['brandSummary'] {
    return {
      businessType: websiteData.businessIntelligence.businessType,
      industry: websiteData.businessIntelligence.industry,
      brandArchetype: brandDNA.brandPersonality.archetype,
      keyStrengths: brandDNA.brandLexicon.brandValues.slice(0, 5),
      marketPosition: this.determineMarketPosition(brandDNA, visualIdentity),
      targetAudience: websiteData.businessIntelligence.targetAudience,
      brandPersonality: brandDNA.brandPersonality.traits.slice(0, 4).map(t => t.trait),
      competitiveAdvantages: websiteData.businessIntelligence.competitiveAdvantages.slice(0, 5),
      recommendedStrategy: this.generateStrategicRecommendations(websiteData, brandDNA, socialMediaData)
    };
  }

  private determineMarketPosition(brandDNA: BrandDNA, visualIdentity?: BrandVisualIdentity): string {
    const personality = brandDNA.brandPersonality.traits[0]?.trait || 'Professional';
    const sentiment = brandDNA.sentiment.overall;
    const quality = visualIdentity?.technicalQuality.professionalScore || 0.7;

    if (quality > 0.8 && personality.includes('Sophisticated')) {
      return 'Premium/Luxury';
    } else if (quality > 0.7 && sentiment === 'positive') {
      return 'Professional/Quality';
    } else if (personality.includes('Friendly') || personality.includes('Caring')) {
      return 'Accessible/Community-focused';
    } else {
      return 'Mid-market/Competitive';
    }
  }

  private generateStrategicRecommendations(
    websiteData: ComprehensiveBrandData,
    brandDNA: BrandDNA,
    socialMediaData?: SocialMediaData
  ): string[] {
    const recommendations: string[] = [];

    // Content recommendations
    if (brandDNA.sentiment.score < 0.5) {
      recommendations.push('Increase positive messaging and customer success stories');
    }

    // Social media recommendations
    if (!socialMediaData?.instagram && websiteData.businessIntelligence.businessType !== 'finance') {
      recommendations.push('Establish Instagram presence for visual brand building');
    }

    // SEO/Content recommendations
    if (brandDNA.keywords.primary.length < 10) {
      recommendations.push('Expand content strategy to target more relevant keywords');
    }

    // Brand consistency recommendations
    if (brandDNA.contentPatterns.communicationStyle.formality === 'mixed') {
      recommendations.push('Standardize tone of voice across all communications');
    }

    // Visual recommendations
    recommendations.push('Maintain consistent visual identity across all touchpoints');

    return recommendations.slice(0, 6);
  }

  private generateContentStrategy(
    brandDNA: BrandDNA,
    visualIdentity?: BrandVisualIdentity,
    socialMediaData?: SocialMediaData
  ): CompleteBrandIntelligence['contentStrategy'] {
    return {
      toneOfVoice: brandDNA.contentPatterns.communicationStyle.tone,
      contentThemes: brandDNA.topics.main.map(t => t.topic),
      messagingFramework: {
        primaryMessage: brandDNA.brandLexicon.keyMessages[0] || 'Quality solutions for your needs',
        supportingMessages: brandDNA.brandLexicon.keyMessages.slice(1, 4),
        callToActions: brandDNA.contentPatterns.ctaPatterns.slice(0, 3).map(cta => cta.pattern)
      },
      visualGuidelines: {
        colorPalette: visualIdentity?.colorScheme.brandColors.slice(0, 5).map(c => c.hex) || [],
        imageStyle: visualIdentity?.visualStyle.commonElements || [],
        designPrinciples: visualIdentity?.visualStyle.designPrinciples || []
      }
    };
  }

  private generateMarketingInsights(
    websiteData: ComprehensiveBrandData,
    brandDNA: BrandDNA,
    socialMediaData?: SocialMediaData
  ): CompleteBrandIntelligence['marketingInsights'] {
    const platforms = Object.keys(websiteData.socialMedia.handles);
    
    return {
      socialMediaStrategy: {
        platforms: platforms.length > 0 ? platforms : ['instagram', 'linkedin'],
        contentTypes: this.recommendContentTypes(brandDNA, socialMediaData),
        postingFrequency: socialMediaData?.instagram?.contentAnalysis.postingFrequency.postsPerWeek 
          ? `${socialMediaData.instagram.contentAnalysis.postingFrequency.postsPerWeek} posts/week`
          : '3-5 posts/week',
        engagementTactics: this.recommendEngagementTactics(brandDNA, socialMediaData)
      },
      brandPositioning: {
        currentPosition: this.analyzeCurrentPosition(websiteData, brandDNA),
        opportunities: this.identifyOpportunities(websiteData, brandDNA, socialMediaData),
        threats: this.identifyThreats(websiteData, brandDNA),
        recommendations: this.generatePositioningRecommendations(websiteData, brandDNA)
      }
    };
  }

  private recommendContentTypes(brandDNA: BrandDNA, socialMediaData?: SocialMediaData): string[] {
    const contentTypes = ['educational', 'behind-the-scenes'];
    
    if (brandDNA.brandPersonality.archetype.includes('Creator')) {
      contentTypes.push('process-showcase', 'tutorials');
    }
    
    if (socialMediaData?.instagram?.contentAnalysis.contentThemes.includes('product')) {
      contentTypes.push('product-highlights');
    }
    
    if (brandDNA.brandLexicon.brandValues.includes('Community')) {
      contentTypes.push('user-generated-content', 'testimonials');
    }

    return contentTypes.slice(0, 5);
  }

  private recommendEngagementTactics(brandDNA: BrandDNA, socialMediaData?: SocialMediaData): string[] {
    const tactics = ['respond-to-comments', 'ask-questions'];
    
    if (socialMediaData?.instagram?.contentAnalysis.topHashtags.length > 0) {
      tactics.push('strategic-hashtag-use');
    }
    
    if (brandDNA.contentPatterns.communicationStyle.personality.includes('Friendly')) {
      tactics.push('personal-storytelling', 'community-building');
    }

    return tactics.slice(0, 4);
  }

  private analyzeCurrentPosition(websiteData: ComprehensiveBrandData, brandDNA: BrandDNA): string {
    const businessType = websiteData.businessIntelligence.businessType;
    const archetype = brandDNA.brandPersonality.archetype;
    
    return `${businessType} brand positioned as ${archetype.toLowerCase()} with focus on ${brandDNA.brandLexicon.brandValues[0] || 'quality'}`;
  }

  private identifyOpportunities(
    websiteData: ComprehensiveBrandData,
    brandDNA: BrandDNA,
    socialMediaData?: SocialMediaData
  ): string[] {
    const opportunities: string[] = [];

    if (!socialMediaData?.instagram) {
      opportunities.push('Untapped social media potential');
    }

    if (brandDNA.sentiment.score > 0.6) {
      opportunities.push('Strong positive sentiment to leverage');
    }

    if (websiteData.businessIntelligence.competitiveAdvantages.length > 3) {
      opportunities.push('Multiple differentiators to highlight');
    }

    return opportunities.slice(0, 4);
  }

  private identifyThreats(websiteData: ComprehensiveBrandData, brandDNA: BrandDNA): string[] {
    const threats: string[] = [];

    if (brandDNA.contentPatterns.communicationStyle.formality === 'mixed') {
      threats.push('Inconsistent brand voice');
    }

    if (brandDNA.keywords.primary.length < 8) {
      threats.push('Limited content depth');
    }

    return threats.slice(0, 3);
  }

  private generatePositioningRecommendations(
    websiteData: ComprehensiveBrandData,
    brandDNA: BrandDNA
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Emphasize ${brandDNA.brandLexicon.brandValues[0] || 'quality'} as core differentiator`);
    recommendations.push(`Leverage ${brandDNA.brandPersonality.archetype} archetype in messaging`);
    
    if (websiteData.businessIntelligence.competitiveAdvantages.length > 0) {
      recommendations.push(`Highlight competitive advantage: ${websiteData.businessIntelligence.competitiveAdvantages[0]}`);
    }

    return recommendations.slice(0, 4);
  }

  private async saveAnalysisResults(result: CompleteBrandIntelligence): Promise<void> {
    try {
      // In a real implementation, this would save to a database or file system
      console.log(`💾 Saving analysis results for ${result.metadata.analysisId}`);
      
      // For now, just log the summary
      console.log('📊 Analysis Summary:');
      console.log(`- Business Type: ${result.brandSummary.businessType}`);
      console.log(`- Brand Archetype: ${result.brandSummary.brandArchetype}`);
      console.log(`- Market Position: ${result.brandSummary.marketPosition}`);
      console.log(`- Key Strengths: ${result.brandSummary.keyStrengths.join(', ')}`);
      
    } catch (error) {
      console.warn('⚠️ Failed to save analysis results:', error.message);
    }
  }

  // Utility method to generate a quick brand report
  generateQuickReport(analysis: CompleteBrandIntelligence): string {
    const { brandSummary, contentStrategy, marketingInsights } = analysis;
    
    return `
# Brand Intelligence Report

## Brand Overview
- **Business Type**: ${brandSummary.businessType}
- **Industry**: ${brandSummary.industry}
- **Brand Archetype**: ${brandSummary.brandArchetype}
- **Market Position**: ${brandSummary.marketPosition}

## Key Strengths
${brandSummary.keyStrengths.map(strength => `- ${strength}`).join('\n')}

## Brand Personality
${brandSummary.brandPersonality.map(trait => `- ${trait}`).join('\n')}

## Content Strategy
- **Tone of Voice**: ${contentStrategy.toneOfVoice.join(', ')}
- **Primary Message**: ${contentStrategy.messagingFramework.primaryMessage}
- **Content Themes**: ${contentStrategy.contentThemes.join(', ')}

## Marketing Recommendations
${brandSummary.recommendedStrategy.map(rec => `- ${rec}`).join('\n')}

## Social Media Strategy
- **Platforms**: ${marketingInsights.socialMediaStrategy.platforms.join(', ')}
- **Content Types**: ${marketingInsights.socialMediaStrategy.contentTypes.join(', ')}
- **Posting Frequency**: ${marketingInsights.socialMediaStrategy.postingFrequency}

---
*Analysis completed on ${new Date(analysis.metadata.timestamp).toLocaleDateString()}*
    `.trim();
  }
}
