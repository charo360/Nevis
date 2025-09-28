interface StoryElement {
  type: 'founder' | 'mission' | 'innovation' | 'impact' | 'challenge' | 'transformation';
  narrative: string;
  emotionalWeight: number;
  credibilityScore: number;
}

interface BusinessStory {
  coreNarrative: string;
  founderStory?: string;
  socialMission?: string;
  uniqueInnovation?: string;
  impactMetrics?: string[];
  customerStories?: string[];
  competitiveAdvantage?: string;
  emotionalHooks: string[];
}

export class StoryIntelligenceEngine {
  private static extractFounderStory(companyData: any): string | undefined {
    const founderKeywords = ['founded', 'started', 'created', 'began', 'launched', 'established'];
    const personalKeywords = ['passion', 'dream', 'vision', 'mission', 'journey', 'story'];
    
    const text = JSON.stringify(companyData).toLowerCase();
    
    if (founderKeywords.some(keyword => text.includes(keyword)) && 
        personalKeywords.some(keyword => text.includes(keyword))) {
      return `${companyData.companyName} was founded with a personal mission to transform lives through innovative solutions.`;
    }
    
    return undefined;
  }

  private static extractSocialMission(companyData: any): string | undefined {
    const socialKeywords = ['community', 'impact', 'change', 'help', 'serve', 'empower', 'transform'];
    const problemKeywords = ['problem', 'challenge', 'issue', 'struggle', 'difficulty', 'barrier'];
    
    const text = JSON.stringify(companyData).toLowerCase();
    
    if (socialKeywords.some(keyword => text.includes(keyword)) || 
        problemKeywords.some(keyword => text.includes(keyword))) {
      return `Addressing critical community needs through innovative solutions that create lasting positive impact.`;
    }
    
    return undefined;
  }

  private static extractUniqueInnovation(companyData: any): string | undefined {
    const innovationKeywords = ['first', 'unique', 'revolutionary', 'breakthrough', 'innovative', 'pioneering'];
    const techKeywords = ['technology', 'AI', 'digital', 'platform', 'system', 'solution'];
    
    const text = JSON.stringify(companyData).toLowerCase();
    
    if (innovationKeywords.some(keyword => text.includes(keyword)) || 
        techKeywords.some(keyword => text.includes(keyword))) {
      return `Pioneering innovative approaches that set new industry standards and deliver unprecedented results.`;
    }
    
    return undefined;
  }

  private static extractImpactMetrics(companyData: any): string[] {
    const metrics: string[] = [];
    const text = JSON.stringify(companyData);
    
    // Look for numbers followed by impact words
    const numberPattern = /(\d+[,\d]*)\s*(customers?|users?|members?|communities?|lives?|businesses?)/gi;
    const matches = text.match(numberPattern);
    
    if (matches) {
      metrics.push(...matches.slice(0, 3)); // Top 3 metrics
    }
    
    // Fallback metrics based on industry
    if (metrics.length === 0) {
      const industry = companyData.industry?.toLowerCase() || '';
      if (industry.includes('financial') || industry.includes('fintech')) {
        metrics.push('Thousands of customers served', 'Millions in transactions processed');
      } else if (industry.includes('food') || industry.includes('nutrition')) {
        metrics.push('Communities impacted', 'Lives improved through nutrition');
      } else {
        metrics.push('Growing customer base', 'Proven track record');
      }
    }
    
    return metrics;
  }

  private static generateEmotionalHooks(story: BusinessStory): string[] {
    const hooks: string[] = [];
    
    if (story.founderStory) {
      hooks.push('Personal mission driving real change');
    }
    
    if (story.socialMission) {
      hooks.push('Making a difference in your community');
    }
    
    if (story.uniqueInnovation) {
      hooks.push('Revolutionary solution you can trust');
    }
    
    if (story.impactMetrics && story.impactMetrics.length > 0) {
      hooks.push('Proven results speak for themselves');
    }
    
    // Default emotional hooks
    if (hooks.length === 0) {
      hooks.push('Your success is our mission', 'Real solutions for real people');
    }
    
    return hooks;
  }

  static analyzeBusinessStory(companyData: any): BusinessStory {
    const founderStory = this.extractFounderStory(companyData);
    const socialMission = this.extractSocialMission(companyData);
    const uniqueInnovation = this.extractUniqueInnovation(companyData);
    const impactMetrics = this.extractImpactMetrics(companyData);
    
    // Generate core narrative
    let coreNarrative = `${companyData.companyName} delivers exceptional results`;
    
    if (socialMission) {
      coreNarrative = `${companyData.companyName} transforms communities through innovative solutions`;
    } else if (uniqueInnovation) {
      coreNarrative = `${companyData.companyName} pioneers breakthrough solutions that deliver real results`;
    } else if (founderStory) {
      coreNarrative = `${companyData.companyName} was built on a mission to create meaningful change`;
    }
    
    const story: BusinessStory = {
      coreNarrative,
      founderStory,
      socialMission,
      uniqueInnovation,
      impactMetrics,
      competitiveAdvantage: uniqueInnovation || 'Proven expertise and commitment to excellence',
      emotionalHooks: []
    };
    
    story.emotionalHooks = this.generateEmotionalHooks(story);
    
    return story;
  }

  static generateStoryBasedContent(story: BusinessStory, contentType: 'headline' | 'subheadline' | 'cta'): string {
    switch (contentType) {
      case 'headline':
        if (story.socialMission) {
          return story.coreNarrative;
        }
        return story.emotionalHooks[0] || story.coreNarrative;
        
      case 'subheadline':
        if (story.impactMetrics && story.impactMetrics.length > 0) {
          return story.impactMetrics[0];
        }
        return story.competitiveAdvantage || 'Trusted by customers who demand excellence';
        
      case 'cta':
        if (story.socialMission) {
          return 'Join the Movement';
        }
        return 'Get Started Today';
        
      default:
        return story.coreNarrative;
    }
  }
}