interface CulturalContext {
  region: string;
  language: string;
  values: string[];
  communicationStyle: 'direct' | 'indirect' | 'relationship-focused' | 'achievement-focused';
  trustBuilders: string[];
  localExpressions: string[];
  socialIssues: string[];
  economicContext: string;
}

interface LocalizedContent {
  culturalRelevance: number;
  localizedMessage: string;
  trustSignals: string[];
  culturalValues: string[];
  regionalContext: string;
}

export class EnhancedCulturalIntelligence {
  private static readonly CULTURAL_CONTEXTS: Record<string, CulturalContext> = {
    'kenya': {
      region: 'Kenya',
      language: 'English/Swahili',
      values: ['Ubuntu (community)', 'Family first', 'Respect for elders', 'Hard work', 'Education'],
      communicationStyle: 'relationship-focused',
      trustBuilders: ['Local presence', 'Community testimonials', 'Family benefits', 'Proven local success'],
      localExpressions: ['Harambee (pulling together)', 'Pamoja (together)', 'Maendeleo (progress)'],
      socialIssues: ['Financial inclusion', 'Youth unemployment', 'Healthcare access', 'Education costs'],
      economicContext: 'Growing middle class, mobile money adoption, entrepreneurial spirit'
    },
    'nigeria': {
      region: 'Nigeria',
      language: 'English/Local languages',
      values: ['Community support', 'Entrepreneurship', 'Education', 'Family success', 'Religious faith'],
      communicationStyle: 'relationship-focused',
      trustBuilders: ['Local success stories', 'Community endorsement', 'Religious backing', 'Family testimonials'],
      localExpressions: ['Naija spirit', 'We move', 'God dey'],
      socialIssues: ['Financial inclusion', 'Infrastructure', 'Youth empowerment', 'Small business support'],
      economicContext: 'Largest African economy, tech innovation hub, young population'
    },
    'south_africa': {
      region: 'South Africa',
      language: 'English/Afrikaans/Local languages',
      values: ['Ubuntu', 'Transformation', 'Equality', 'Community upliftment', 'Economic empowerment'],
      communicationStyle: 'direct',
      trustBuilders: ['BEE compliance', 'Community impact', 'Local ownership', 'Transformation credentials'],
      localExpressions: ['Ubuntu', 'Sawubona', 'Vuka (rise up)'],
      socialIssues: ['Economic inequality', 'Youth unemployment', 'Skills development', 'Financial inclusion'],
      economicContext: 'Most developed African economy, focus on transformation and empowerment'
    }
  };

  private static detectRegion(companyData: any): string {
    const text = JSON.stringify(companyData).toLowerCase();
    
    if (text.includes('kenya') || text.includes('nairobi') || text.includes('kilifi')) {
      return 'kenya';
    } else if (text.includes('nigeria') || text.includes('lagos') || text.includes('abuja')) {
      return 'nigeria';
    } else if (text.includes('south africa') || text.includes('johannesburg') || text.includes('cape town')) {
      return 'south_africa';
    }
    
    return 'kenya'; // Default to Kenya
  }

  private static getCulturalContext(region: string): CulturalContext {
    return this.CULTURAL_CONTEXTS[region] || this.CULTURAL_CONTEXTS['kenya'];
  }

  private static generateCulturallyRelevantMessage(
    baseMessage: string, 
    context: CulturalContext, 
    companyData: any
  ): string {
    const industry = companyData.industry?.toLowerCase() || '';
    
    // Add cultural values integration
    if (context.values.includes('Ubuntu (community)') || context.values.includes('Ubuntu')) {
      if (industry.includes('financial')) {
        return `${baseMessage} - Building stronger communities through financial empowerment`;
      } else if (industry.includes('food') || industry.includes('nutrition')) {
        return `${baseMessage} - Nourishing our community, one family at a time`;
      }
    }
    
    // Add local expressions where appropriate
    if (context.region === 'Kenya' && context.localExpressions.includes('Pamoja (together)')) {
      return `${baseMessage} - Pamoja, we achieve more`;
    }
    
    // Add economic context
    if (context.economicContext.includes('mobile money') && industry.includes('financial')) {
      return `${baseMessage} - Leveraging Kenya's mobile money leadership`;
    }
    
    return `${baseMessage} - Proudly serving ${context.region}`;
  }

  private static generateTrustSignals(context: CulturalContext, companyData: any): string[] {
    const signals: string[] = [];
    const industry = companyData.industry?.toLowerCase() || '';
    
    // Add context-specific trust builders
    context.trustBuilders.forEach(builder => {
      if (builder === 'Local presence') {
        signals.push(`Proudly based in ${context.region}`);
      } else if (builder === 'Community testimonials') {
        signals.push('Trusted by local families and businesses');
      } else if (builder === 'Family benefits') {
        signals.push('Supporting families across our community');
      } else if (builder === 'Proven local success') {
        signals.push(`Proven track record in ${context.region}`);
      }
    });
    
    // Industry-specific cultural trust signals
    if (industry.includes('financial')) {
      if (context.region === 'Kenya') {
        signals.push('Safaricom partnership ready', 'M-Pesa integration available');
      } else if (context.region === 'South Africa') {
        signals.push('BEE Level 1 contributor', 'Transformation partner');
      }
    }
    
    return signals.slice(0, 3);
  }

  private static calculateCulturalRelevance(
    message: string, 
    context: CulturalContext, 
    companyData: any
  ): number {
    let relevance = 5; // Base score
    
    const messageText = message.toLowerCase();
    
    // Check for cultural values integration
    context.values.forEach(value => {
      if (messageText.includes(value.toLowerCase().split(' ')[0])) {
        relevance += 2;
      }
    });
    
    // Check for local expressions
    context.localExpressions.forEach(expression => {
      if (messageText.includes(expression.toLowerCase().split(' ')[0])) {
        relevance += 2;
      }
    });
    
    // Check for regional context
    if (messageText.includes(context.region.toLowerCase())) {
      relevance += 1;
    }
    
    // Check for social issues awareness
    context.socialIssues.forEach(issue => {
      if (messageText.includes(issue.toLowerCase().split(' ')[0])) {
        relevance += 1;
      }
    });
    
    return Math.min(relevance, 10);
  }

  static generateLocalizedContent(
    baseMessage: string, 
    companyData: any, 
    contentType: 'headline' | 'subheadline' | 'cta' = 'headline'
  ): LocalizedContent {
    const region = this.detectRegion(companyData);
    const context = this.getCulturalContext(region);
    
    let localizedMessage = baseMessage;
    
    // Apply cultural localization based on content type
    if (contentType === 'headline') {
      localizedMessage = this.generateCulturallyRelevantMessage(baseMessage, context, companyData);
    } else if (contentType === 'subheadline') {
      // Add social issue awareness for subheadlines
      const relevantIssue = context.socialIssues.find(issue => 
        companyData.industry?.toLowerCase().includes(issue.split(' ')[0].toLowerCase())
      );
      if (relevantIssue) {
        localizedMessage = `${baseMessage} - Addressing ${relevantIssue.toLowerCase()}`;
      }
    } else if (contentType === 'cta') {
      // Culturally appropriate CTAs
      if (context.communicationStyle === 'relationship-focused') {
        localizedMessage = 'Join Our Community';
      } else if (context.values.includes('Ubuntu (community)')) {
        localizedMessage = 'Build Together';
      }
    }
    
    const trustSignals = this.generateTrustSignals(context, companyData);
    const culturalRelevance = this.calculateCulturalRelevance(localizedMessage, context, companyData);
    
    return {
      culturalRelevance,
      localizedMessage,
      trustSignals,
      culturalValues: context.values,
      regionalContext: context.economicContext
    };
  }

  static optimizeForCulturalResonance(companyData: any): {
    headline: string;
    subheadline: string;
    cta: string;
    culturalScore: number;
    trustSignals: string[];
  } {
    const region = this.detectRegion(companyData);
    const context = this.getCulturalContext(region);
    
    // Generate base messages
    const baseHeadline = `${companyData.companyName} - Transforming Lives`;
    const baseSubheadline = 'Trusted by thousands of customers';
    const baseCta = 'Get Started';
    
    // Localize each component
    const headlineContent = this.generateLocalizedContent(baseHeadline, companyData, 'headline');
    const subheadlineContent = this.generateLocalizedContent(baseSubheadline, companyData, 'subheadline');
    const ctaContent = this.generateLocalizedContent(baseCta, companyData, 'cta');
    
    // Calculate overall cultural score
    const culturalScore = Math.round(
      (headlineContent.culturalRelevance + subheadlineContent.culturalRelevance + ctaContent.culturalRelevance) / 3
    );
    
    return {
      headline: headlineContent.localizedMessage,
      subheadline: subheadlineContent.localizedMessage,
      cta: ctaContent.localizedMessage,
      culturalScore,
      trustSignals: headlineContent.trustSignals
    };
  }

  static getCulturalInsights(companyData: any): {
    region: string;
    keyValues: string[];
    communicationStyle: string;
    trustBuilders: string[];
    socialContext: string[];
  } {
    const region = this.detectRegion(companyData);
    const context = this.getCulturalContext(region);
    
    return {
      region: context.region,
      keyValues: context.values,
      communicationStyle: context.communicationStyle,
      trustBuilders: context.trustBuilders,
      socialContext: context.socialIssues
    };
  }
}