interface CompetitiveAdvantage {
  type: 'innovation' | 'experience' | 'local_presence' | 'cost' | 'quality' | 'speed' | 'trust';
  description: string;
  strength: number;
  differentiator: string;
}

interface ValueProposition {
  primary: string;
  secondary: string[];
  uniqueSellingPoint: string;
  competitiveAdvantages: CompetitiveAdvantage[];
  socialProof: string[];
  credibilityFactors: string[];
}

export class BusinessIntelligenceAnalyzer {
  private static extractCompetitiveAdvantages(companyData: any): CompetitiveAdvantage[] {
    const advantages: CompetitiveAdvantage[] = [];
    const text = JSON.stringify(companyData).toLowerCase();
    
    // Innovation advantage
    if (text.includes('first') || text.includes('innovative') || text.includes('revolutionary')) {
      advantages.push({
        type: 'innovation',
        description: 'Industry-leading innovation',
        strength: 9,
        differentiator: 'First-to-market solutions that set industry standards'
      });
    }
    
    // Experience advantage
    if (text.includes('years') || text.includes('experience') || text.includes('established')) {
      advantages.push({
        type: 'experience',
        description: 'Proven track record',
        strength: 8,
        differentiator: 'Years of expertise delivering consistent results'
      });
    }
    
    // Local presence advantage
    if (text.includes('local') || text.includes('community') || text.includes('kenya')) {
      advantages.push({
        type: 'local_presence',
        description: 'Deep local understanding',
        strength: 9,
        differentiator: 'Local expertise with global standards'
      });
    }
    
    // Speed advantage
    if (text.includes('fast') || text.includes('quick') || text.includes('instant')) {
      advantages.push({
        type: 'speed',
        description: 'Rapid delivery',
        strength: 8,
        differentiator: 'Get results faster than traditional alternatives'
      });
    }
    
    // Quality advantage
    if (text.includes('quality') || text.includes('premium') || text.includes('excellence')) {
      advantages.push({
        type: 'quality',
        description: 'Superior quality',
        strength: 8,
        differentiator: 'Uncompromising quality that exceeds expectations'
      });
    }
    
    // Default trust advantage
    if (advantages.length === 0) {
      advantages.push({
        type: 'trust',
        description: 'Trusted by customers',
        strength: 7,
        differentiator: 'Reliable service you can count on'
      });
    }
    
    return advantages.slice(0, 3); // Top 3 advantages
  }

  private static extractSocialProof(companyData: any): string[] {
    const socialProof: string[] = [];
    const text = JSON.stringify(companyData);
    
    // Look for customer numbers
    const customerPattern = /(\d+[,\d]*)\s*(customers?|clients?|users?|members?)/gi;
    const customerMatches = text.match(customerPattern);
    if (customerMatches) {
      socialProof.push(`${customerMatches[0]} trust us`);
    }
    
    // Look for transaction/volume numbers
    const volumePattern = /(\d+[,\d]*)\s*(transactions?|sales?|projects?)/gi;
    const volumeMatches = text.match(volumePattern);
    if (volumeMatches) {
      socialProof.push(`${volumeMatches[0]} completed successfully`);
    }
    
    // Look for awards or certifications
    if (text.toLowerCase().includes('award') || text.toLowerCase().includes('certified')) {
      socialProof.push('Award-winning service');
    }
    
    // Industry-specific social proof
    const industry = companyData.industry?.toLowerCase() || '';
    if (industry.includes('financial')) {
      socialProof.push('Trusted by leading financial institutions');
    } else if (industry.includes('food')) {
      socialProof.push('Recommended by nutrition experts');
    } else if (industry.includes('technology')) {
      socialProof.push('Chosen by innovative companies');
    }
    
    // Default social proof
    if (socialProof.length === 0) {
      socialProof.push('Growing customer base', 'Positive customer reviews');
    }
    
    return socialProof.slice(0, 3);
  }

  private static extractCredibilityFactors(companyData: any): string[] {
    const credibility: string[] = [];
    const text = JSON.stringify(companyData).toLowerCase();
    
    // Certifications and compliance
    if (text.includes('certified') || text.includes('licensed') || text.includes('registered')) {
      credibility.push('Fully licensed and certified');
    }
    
    // Security and trust
    if (text.includes('secure') || text.includes('encrypted') || text.includes('protected')) {
      credibility.push('Bank-level security');
    }
    
    // Local presence
    if (text.includes('kenya') || text.includes('nairobi') || text.includes('local')) {
      credibility.push('Local presence, global standards');
    }
    
    // Professional team
    if (text.includes('team') || text.includes('expert') || text.includes('professional')) {
      credibility.push('Expert professional team');
    }
    
    // Default credibility
    if (credibility.length === 0) {
      credibility.push('Professional service', 'Proven reliability');
    }
    
    return credibility.slice(0, 3);
  }

  private static generateUniqueSellingPoint(advantages: CompetitiveAdvantage[], companyData: any): string {
    const topAdvantage = advantages.sort((a, b) => b.strength - a.strength)[0];
    
    if (!topAdvantage) {
      return `${companyData.companyName} - Your trusted partner for success`;
    }
    
    switch (topAdvantage.type) {
      case 'innovation':
        return `The only solution that combines innovation with proven results`;
      case 'local_presence':
        return `Local expertise that understands your unique needs`;
      case 'speed':
        return `Get results in days, not weeks`;
      case 'quality':
        return `Premium quality at competitive prices`;
      case 'experience':
        return `Decades of experience, cutting-edge solutions`;
      default:
        return `${companyData.companyName} - Where reliability meets innovation`;
    }
  }

  static analyzeValueProposition(companyData: any): ValueProposition {
    const advantages = this.extractCompetitiveAdvantages(companyData);
    const socialProof = this.extractSocialProof(companyData);
    const credibilityFactors = this.extractCredibilityFactors(companyData);
    const uniqueSellingPoint = this.generateUniqueSellingPoint(advantages, companyData);
    
    // Generate primary value proposition
    const topAdvantage = advantages[0];
    const primary = topAdvantage ? 
      `${companyData.companyName} delivers ${topAdvantage.description.toLowerCase()} that transforms your business` :
      `${companyData.companyName} delivers exceptional results for your business`;
    
    // Generate secondary value propositions
    const secondary = advantages.slice(1).map(adv => adv.differentiator);
    if (secondary.length === 0) {
      secondary.push('Trusted by customers who demand excellence', 'Proven track record of success');
    }
    
    return {
      primary,
      secondary,
      uniqueSellingPoint,
      competitiveAdvantages: advantages,
      socialProof,
      credibilityFactors
    };
  }

  static generateBusinessFocusedContent(valueProposition: ValueProposition, contentType: 'headline' | 'subheadline' | 'cta'): string {
    switch (contentType) {
      case 'headline':
        return valueProposition.uniqueSellingPoint;
        
      case 'subheadline':
        if (valueProposition.socialProof.length > 0) {
          return valueProposition.socialProof[0];
        }
        return valueProposition.secondary[0] || 'Professional service you can trust';
        
      case 'cta':
        const topAdvantage = valueProposition.competitiveAdvantages[0];
        if (topAdvantage?.type === 'speed') {
          return 'Get Started Today';
        } else if (topAdvantage?.type === 'innovation') {
          return 'Experience Innovation';
        } else {
          return 'Learn More';
        }
        
      default:
        return valueProposition.primary;
    }
  }

  static calculateBusinessIntelligenceScore(valueProposition: ValueProposition): number {
    let score = 0;
    
    // Competitive advantages score (40%)
    const avgAdvantageStrength = valueProposition.competitiveAdvantages.reduce((sum, adv) => sum + adv.strength, 0) / 
                                 Math.max(valueProposition.competitiveAdvantages.length, 1);
    score += (avgAdvantageStrength / 10) * 40;
    
    // Social proof score (30%)
    const socialProofScore = Math.min(valueProposition.socialProof.length * 3, 10);
    score += (socialProofScore / 10) * 30;
    
    // Credibility score (30%)
    const credibilityScore = Math.min(valueProposition.credibilityFactors.length * 3, 10);
    score += (credibilityScore / 10) * 30;
    
    return Math.round(score);
  }
}