/**
 * Smart Business Analyzer
 * 
 * Intelligently analyzes business profile data to extract meaningful insights
 * WITHOUT relying on external AI - uses smart pattern matching and business logic
 */

export interface SmartBusinessAnalysis {
  whatTheyDo: string;
  whoItsFor: string;
  howTheyDoIt: string;
  whyItMatters: string;
  localContext: string;
  customerPainPoints: string[];
  customerMotivations: string[];
  competitiveAdvantages: string[];
}

export class SmartBusinessAnalyzer {
  
  /**
   * Analyze business profile intelligently using available data
   */
  analyzeBusinessProfile(brandProfile: any, businessType: string, location: string): SmartBusinessAnalysis {
    const businessName = brandProfile.businessName || 'This business';
    const description = brandProfile.description || '';
    const services = brandProfile.services || [];
    const targetAudience = brandProfile.targetAudience || '';
    
    // Extract what they do
    const whatTheyDo = this.extractWhatTheyDo(businessName, businessType, description, services, location);
    
    // Extract who it's for
    const whoItsFor = this.extractWhoItsFor(targetAudience, businessType, location);
    
    // Extract how they do it
    const howTheyDoIt = this.extractHowTheyDoIt(description, services, businessType);
    
    // Extract why it matters
    const whyItMatters = this.extractWhyItMatters(businessType, location, services);
    
    // Extract local context
    const localContext = this.extractLocalContext(businessName, location, description);
    
    // Extract customer pain points
    const customerPainPoints = this.extractPainPoints(businessType, location);
    
    // Extract customer motivations
    const customerMotivations = this.extractMotivations(businessType, location);
    
    // Extract competitive advantages
    const competitiveAdvantages = this.extractCompetitiveAdvantages(description, services, businessType);
    
    return {
      whatTheyDo,
      whoItsFor,
      howTheyDoIt,
      whyItMatters,
      localContext,
      customerPainPoints,
      customerMotivations,
      competitiveAdvantages
    };
  }
  
  private extractWhatTheyDo(businessName: string, businessType: string, description: string, services: string[], location: string): string {
    // If description mentions what they do, use it (with location only as context, not limitation)
    if (description && description.length > 20) {
      // Only mention location if it's part of their identity, not their market limitation
      return `${businessName} - ${description}`;
    }

    // If services are specific, use them
    if (services.length > 0) {
      const serviceList = services.slice(0, 3).join(', ');
      return `${businessName} specializes in ${serviceList}`;
    }

    // Generic fallback
    return `${businessName} is a ${businessType} business`;
  }
  
  private extractWhoItsFor(targetAudience: string, businessType: string, location: string): string {
    // If target audience is specified, use it EXACTLY as provided
    if (targetAudience && targetAudience.length > 5) {
      return targetAudience;
    }

    // Smart defaults based on business type (WITHOUT location assumptions)
    const audienceMap: Record<string, string> = {
      food: 'Families, office workers, and students looking for quality food options',
      retail: 'Shoppers seeking quality products',
      service: 'Individuals and businesses needing professional services',
      finance: 'People and businesses seeking financial solutions',
      healthcare: 'Patients and families looking for quality healthcare',
      education: 'Students and learners seeking educational opportunities',
      realestate: 'Home buyers, sellers, and renters',
      saas: 'Businesses and professionals looking for digital solutions',
      b2b: 'Businesses seeking professional partnerships',
      nonprofit: 'People who care about social impact'
    };

    return audienceMap[businessType] || 'Customers seeking quality solutions';
  }
  
  private extractHowTheyDoIt(description: string, services: string[], businessType: string): string {
    // Look for quality indicators in description
    const qualityKeywords = ['fresh', 'quality', 'professional', 'expert', 'experienced', 'certified', 'local', 'handmade', 'custom', 'personalized'];
    const foundKeywords = qualityKeywords.filter(keyword => 
      description.toLowerCase().includes(keyword) || 
      services.some(s => s.toLowerCase().includes(keyword))
    );
    
    if (foundKeywords.length > 0) {
      return `By focusing on ${foundKeywords.slice(0, 2).join(' and ')} ${businessType} solutions`;
    }
    
    // Business type specific approaches
    const approachMap: Record<string, string> = {
      food: 'By preparing fresh, quality food with care and attention to detail',
      retail: 'By offering carefully selected products and excellent customer service',
      service: 'By providing professional, reliable service tailored to customer needs',
      finance: 'By offering transparent, customer-focused financial solutions',
      healthcare: 'By providing compassionate, professional healthcare services',
      education: 'By delivering engaging, effective educational programs',
      realestate: 'By offering expert guidance and personalized service',
      saas: 'By providing user-friendly, reliable software solutions',
      b2b: 'By building strong partnerships and delivering consistent results',
      nonprofit: 'By mobilizing community support and creating meaningful impact'
    };
    
    return approachMap[businessType] || 'By delivering quality service to customers';
  }
  
  private extractWhyItMatters(businessType: string, location: string, services: string[]): string {
    // Business type specific value propositions (NO location assumptions)
    const valueMap: Record<string, string> = {
      food: 'Provides fresh, quality food options for people to enjoy in their daily lives',
      retail: 'Gives customers access to quality products they need',
      service: 'Helps people and businesses solve important problems',
      finance: 'Empowers people to achieve their financial goals',
      healthcare: 'Improves the health and wellbeing of customers',
      education: 'Helps people learn, grow, and achieve their potential',
      realestate: 'Helps people find their ideal home or property',
      saas: 'Makes business operations easier and more efficient',
      b2b: 'Helps businesses grow and succeed',
      nonprofit: 'Creates positive change and supports communities'
    };

    return valueMap[businessType] || 'Provides valuable solutions to customers';
  }
  
  private extractLocalContext(businessName: string, location: string, description: string): string {
    // Look for location-specific keywords in description
    const locationKeywords = ['market', 'downtown', 'center', 'mall', 'street', 'avenue', 'road', 'plaza', 'square'];
    const foundLocation = locationKeywords.find(keyword => description.toLowerCase().includes(keyword));

    if (foundLocation) {
      return `Based in ${location}, serving customers with convenient access`;
    }

    // Only mention location as where they're based, not who they serve
    return `Based in ${location}`;
  }
  
  private extractPainPoints(businessType: string, location: string): string[] {
    // Business type specific pain points (NO location assumptions)
    const painPointsMap: Record<string, string[]> = {
      food: [
        'Need for fresh, quality food options',
        'Looking for convenient, affordable meal solutions',
        'Want to try new and interesting food products'
      ],
      retail: [
        'Difficulty finding quality products',
        'Concerned about value for money',
        'Need for reliable suppliers'
      ],
      service: [
        'Hard to find trustworthy service providers',
        'Expensive or unreliable service options',
        'Need for professional expertise'
      ],
      finance: [
        'Limited access to affordable financial services',
        'Complex, confusing financial products',
        'Need for trustworthy financial guidance'
      ],
      healthcare: [
        'Limited access to quality healthcare',
        'Long wait times and inconvenient hours',
        'Need for compassionate, professional care'
      ]
    };

    return painPointsMap[businessType] || [
      `Limited options for quality ${businessType} services`,
      'Need for reliable, quality solutions',
      'Looking for trustworthy providers'
    ];
  }
  
  private extractMotivations(businessType: string, location: string): string[] {
    // Business type specific motivations (NO location assumptions)
    const motivationsMap: Record<string, string[]> = {
      food: [
        'Get fresh, quality food for daily needs',
        'Enjoy convenient access to good food',
        'Try new and interesting food options'
      ],
      retail: [
        'Find quality products',
        'Get good value for money',
        'Discover unique items'
      ],
      service: [
        'Work with trusted professionals',
        'Get reliable, quality service',
        'Solve problems efficiently'
      ],
      finance: [
        'Achieve financial security and peace of mind',
        'Work with trustworthy advisors',
        'Access affordable financial solutions'
      ],
      healthcare: [
        'Maintain good health and wellbeing',
        'Access quality care',
        'Receive compassionate, professional treatment'
      ]
    };

    return motivationsMap[businessType] || [
      `Get quality ${businessType} services`,
      'Work with trusted providers',
      'Achieve desired outcomes'
    ];
  }
  
  private extractCompetitiveAdvantages(description: string, services: string[], businessType: string): string[] {
    const advantages: string[] = [];
    
    // Check for quality indicators
    if (description.toLowerCase().includes('fresh') || services.some(s => s.toLowerCase().includes('fresh'))) {
      advantages.push('Fresh, quality products');
    }
    if (description.toLowerCase().includes('local') || services.some(s => s.toLowerCase().includes('local'))) {
      advantages.push('Locally-sourced and community-focused');
    }
    if (description.toLowerCase().includes('professional') || description.toLowerCase().includes('expert')) {
      advantages.push('Professional expertise and experience');
    }
    if (description.toLowerCase().includes('affordable') || description.toLowerCase().includes('competitive')) {
      advantages.push('Competitive pricing and good value');
    }
    
    // Add business type specific advantages if we don't have enough
    if (advantages.length < 2) {
      const typeAdvantages: Record<string, string[]> = {
        food: ['Fresh, quality ingredients', 'Made with care and attention'],
        retail: ['Carefully selected products', 'Excellent customer service'],
        service: ['Professional, reliable service', 'Personalized attention'],
        finance: ['Transparent pricing', 'Customer-focused approach'],
        healthcare: ['Compassionate care', 'Professional expertise']
      };
      
      const defaultAdvantages = typeAdvantages[businessType] || ['Quality service', 'Local expertise'];
      advantages.push(...defaultAdvantages.slice(0, 3 - advantages.length));
    }
    
    return advantages.slice(0, 3);
  }
}

// Export singleton instance
export const smartBusinessAnalyzer = new SmartBusinessAnalyzer();

