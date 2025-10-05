interface PsychologicalTrigger {
  type: 'urgency' | 'scarcity' | 'social_proof' | 'authority' | 'reciprocity' | 'commitment' | 'fear_of_loss';
  message: string;
  intensity: number;
  culturalRelevance: number;
}

interface EmotionalProfile {
  primaryEmotion: 'trust' | 'excitement' | 'urgency' | 'hope' | 'security' | 'pride';
  triggers: PsychologicalTrigger[];
  painPoints: string[];
  desires: string[];
  culturalContext: string;
}

export class EmotionalPsychologyEngine {
  private static identifyPainPoints(companyData: any, region: string): string[] {
    const industry = companyData.industry?.toLowerCase() || '';
    const painPoints: string[] = [];
    
    // Industry-specific pain points
    if (industry.includes('financial') || industry.includes('fintech')) {
      painPoints.push('Slow loan approvals', 'Complex banking processes', 'Limited financial access');
    } else if (industry.includes('food') || industry.includes('nutrition')) {
      painPoints.push('Poor nutrition options', 'Expensive healthy food', 'Limited access to quality products');
    } else if (industry.includes('technology') || industry.includes('software')) {
      painPoints.push('Outdated systems', 'Complex technology', 'Poor user experience');
    } else {
      painPoints.push('Inefficient processes', 'High costs', 'Poor service quality');
    }
    
    // Regional pain points
    if (region.toLowerCase().includes('kenya') || region.toLowerCase().includes('africa')) {
      painPoints.push('Limited local options', 'Trust concerns with new services');
    }
    
    return painPoints.slice(0, 3);
  }

  private static identifyDesires(companyData: any, region: string): string[] {
    const industry = companyData.industry?.toLowerCase() || '';
    const desires: string[] = [];
    
    // Industry-specific desires
    if (industry.includes('financial') || industry.includes('fintech')) {
      desires.push('Quick approvals', 'Financial freedom', 'Secure transactions');
    } else if (industry.includes('food') || industry.includes('nutrition')) {
      desires.push('Healthy families', 'Affordable nutrition', 'Quality products');
    } else if (industry.includes('technology') || industry.includes('software')) {
      desires.push('Simple solutions', 'Improved efficiency', 'Modern tools');
    } else {
      desires.push('Better results', 'Peace of mind', 'Professional service');
    }
    
    // Regional desires
    if (region.toLowerCase().includes('kenya') || region.toLowerCase().includes('africa')) {
      desires.push('Local expertise', 'Community impact', 'Trusted partnership');
    }
    
    return desires.slice(0, 3);
  }

  private static generatePsychologicalTriggers(companyData: any, painPoints: string[], desires: string[]): PsychologicalTrigger[] {
    const triggers: PsychologicalTrigger[] = [];
    
    // Social proof trigger
    triggers.push({
      type: 'social_proof',
      message: 'Join thousands of satisfied customers',
      intensity: 8,
      culturalRelevance: 9
    });
    
    // Urgency trigger
    triggers.push({
      type: 'urgency',
      message: 'Limited time offer - Act now',
      intensity: 7,
      culturalRelevance: 6
    });
    
    // Authority trigger
    triggers.push({
      type: 'authority',
      message: 'Trusted by industry leaders',
      intensity: 8,
      culturalRelevance: 8
    });
    
    // Fear of loss trigger based on pain points
    if (painPoints.length > 0) {
      triggers.push({
        type: 'fear_of_loss',
        message: `Don't let ${painPoints[0].toLowerCase()} hold you back`,
        intensity: 9,
        culturalRelevance: 8
      });
    }
    
    return triggers;
  }

  private static determinePrimaryEmotion(companyData: any, painPoints: string[]): EmotionalProfile['primaryEmotion'] {
    const industry = companyData.industry?.toLowerCase() || '';
    
    if (industry.includes('financial') || industry.includes('security')) {
      return 'security';
    } else if (industry.includes('health') || industry.includes('nutrition')) {
      return 'hope';
    } else if (industry.includes('technology') || industry.includes('innovation')) {
      return 'excitement';
    } else if (painPoints.some(pain => pain.includes('slow') || pain.includes('delay'))) {
      return 'urgency';
    } else {
      return 'trust';
    }
  }

  static analyzeEmotionalProfile(companyData: any, region: string = 'Kenya'): EmotionalProfile {
    const painPoints = this.identifyPainPoints(companyData, region);
    const desires = this.identifyDesires(companyData, region);
    const triggers = this.generatePsychologicalTriggers(companyData, painPoints, desires);
    const primaryEmotion = this.determinePrimaryEmotion(companyData, painPoints);
    
    return {
      primaryEmotion,
      triggers,
      painPoints,
      desires,
      culturalContext: region
    };
  }

  static generateEmotionalContent(profile: EmotionalProfile, contentType: 'headline' | 'subheadline' | 'cta'): string {
    const topTrigger = profile.triggers.sort((a, b) => b.intensity - a.intensity)[0];
    
    switch (contentType) {
      case 'headline':
        if (profile.primaryEmotion === 'urgency') {
          return `Stop ${profile.painPoints[0]} - Get Results Now`;
        } else if (profile.primaryEmotion === 'hope') {
          return `Transform Your Life with ${profile.desires[0]}`;
        } else if (profile.primaryEmotion === 'security') {
          return `Secure, Trusted Solutions You Can Count On`;
        } else {
          return `Experience ${profile.desires[0]} Like Never Before`;
        }
        
      case 'subheadline':
        return topTrigger.message;
        
      case 'cta':
        if (profile.primaryEmotion === 'urgency') {
          return 'Get Started Now';
        } else if (profile.primaryEmotion === 'security') {
          return 'Secure Your Spot';
        } else {
          return 'Join Today';
        }
        
      default:
        return topTrigger.message;
    }
  }

  static optimizeForConversion(profile: EmotionalProfile): {
    headline: string;
    subheadline: string;
    cta: string;
    psychologyScore: number;
  } {
    const headline = this.generateEmotionalContent(profile, 'headline');
    const subheadline = this.generateEmotionalContent(profile, 'subheadline');
    const cta = this.generateEmotionalContent(profile, 'cta');
    
    // Calculate psychology score based on trigger intensity and cultural relevance
    const avgIntensity = profile.triggers.reduce((sum, t) => sum + t.intensity, 0) / profile.triggers.length;
    const avgCulturalRelevance = profile.triggers.reduce((sum, t) => sum + t.culturalRelevance, 0) / profile.triggers.length;
    const psychologyScore = Math.round((avgIntensity + avgCulturalRelevance) / 2);
    
    return {
      headline,
      subheadline,
      cta,
      psychologyScore
    };
  }
}