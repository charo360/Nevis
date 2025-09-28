/**
 * Cultural Intelligence Service
 * Provides cultural adaptation for global marketing content
 */

export interface CulturalProfile {
  country: string;
  languageMix: {
    primary: string;
    secondary?: string;
    mixRatio: number; // 0-100, percentage of local language when enabled
  };
  culturalValues: string[];
  trustSignals: string[];
  communicationStyle: 'direct' | 'indirect' | 'relationship-focused' | 'efficiency-focused';
  visualPreferences: {
    peopleRepresentation: string;
    colorPsychology: string[];
    settings: string[];
  };
  platformPreferences: Record<string, number>; // Platform priority scores
}

export interface BusinessIntelligence {
  industryType: string;
  businessModel: string;
  targetMarket: string;
  maturityStage: string;
  painPoints: string[];
  valueProps: string[];
  trustSignals: string[];
  competitivePosition: string;
}

export class CulturalIntelligenceService {
  
  private static culturalProfiles: Record<string, CulturalProfile> = {
    'kenya': {
      country: 'Kenya',
      languageMix: { primary: 'English', secondary: 'Swahili', mixRatio: 30 },
      culturalValues: ['Community', 'Respect', 'Ubuntu', 'Professional growth'],
      trustSignals: ['Local office', 'Kenyan team', 'Community endorsement', 'Professional service'],
      communicationStyle: 'relationship-focused',
      visualPreferences: {
        peopleRepresentation: 'Diverse African professionals, Kenyan ethnicities',
        colorPsychology: ['Blue (trust)', 'Green (growth)', 'Gold (prosperity)'],
        settings: ['Nairobi CBD', 'Modern offices', 'Community centers', 'Urban Kenya']
      },
      platformPreferences: { 'WhatsApp': 95, 'Facebook': 90, 'Instagram': 75, 'LinkedIn': 70, 'Twitter': 65 }
    },
    'nigeria': {
      country: 'Nigeria',
      languageMix: { primary: 'English', secondary: 'Pidgin', mixRatio: 25 },
      culturalValues: ['Success', 'Community', 'Innovation', 'Entrepreneurship'],
      trustSignals: ['Nigerian-owned', 'Lagos office', 'Local support', 'Professional service'],
      communicationStyle: 'relationship-focused',
      visualPreferences: {
        peopleRepresentation: 'Nigerian professionals, diverse Nigerian ethnicities',
        colorPsychology: ['Green (prosperity)', 'Gold (success)', 'Blue (trust)'],
        settings: ['Lagos skyline', 'Abuja business district', 'Modern African offices']
      },
      platformPreferences: { 'Instagram': 95, 'Twitter': 90, 'Facebook': 85, 'LinkedIn': 75, 'TikTok': 80 }
    },
    'south africa': {
      country: 'South Africa',
      languageMix: { primary: 'English', secondary: 'Local languages', mixRatio: 20 },
      culturalValues: ['Ubuntu', 'Transformation', 'Professional excellence', 'Diversity'],
      trustSignals: ['Local presence', 'Professional credentials', 'Community partner', 'Quality service'],
      communicationStyle: 'direct',
      visualPreferences: {
        peopleRepresentation: 'Rainbow nation diversity, professional South Africans',
        colorPsychology: ['Blue (trust)', 'Gold (sophistication)', 'Green (hope)'],
        settings: ['Cape Town/Joburg', 'Financial districts', 'Modern offices']
      },
      platformPreferences: { 'Facebook': 90, 'Instagram': 85, 'LinkedIn': 80, 'Twitter': 70, 'WhatsApp': 85 }
    },
    'usa': {
      country: 'USA',
      languageMix: { primary: 'English', mixRatio: 0 },
      culturalValues: ['Innovation', 'Efficiency', 'Individual success', 'Convenience'],
      trustSignals: ['Industry certifications', 'Customer reviews', 'Professional service', 'Quality guarantee'],
      communicationStyle: 'direct',
      visualPreferences: {
        peopleRepresentation: 'Diverse American professionals, multicultural teams',
        colorPsychology: ['Blue (trust)', 'Red (urgency)', 'Green (growth)'],
        settings: ['Modern offices', 'Tech environments', 'Urban settings']
      },
      platformPreferences: { 'LinkedIn': 95, 'Facebook': 85, 'Instagram': 80, 'Twitter': 75, 'TikTok': 70 }
    },
    'india': {
      country: 'India',
      languageMix: { primary: 'English', secondary: 'Hindi', mixRatio: 35 },
      culturalValues: ['Family', 'Respect', 'Education', 'Growth', 'Value for money'],
      trustSignals: ['Local company', 'Local support', 'Family values', 'Professional service'],
      communicationStyle: 'relationship-focused',
      visualPreferences: {
        peopleRepresentation: 'Indian professionals, diverse Indian ethnicities',
        colorPsychology: ['Saffron (prosperity)', 'Blue (trust)', 'Green (growth)'],
        settings: ['Modern Indian offices', 'Tech parks', 'Urban India']
      },
      platformPreferences: { 'WhatsApp': 95, 'Instagram': 90, 'Facebook': 85, 'LinkedIn': 80, 'Twitter': 70 }
    },
    'canada': {
      country: 'Canada',
      languageMix: { primary: 'English', secondary: 'French', mixRatio: 15 },
      culturalValues: ['Inclusivity', 'Politeness', 'Multiculturalism', 'Quality'],
      trustSignals: ['Canadian owned', 'Quality certifications', 'Professional service', 'Local presence'],
      communicationStyle: 'direct',
      visualPreferences: {
        peopleRepresentation: 'Multicultural Canadians, diverse professionals',
        colorPsychology: ['Blue (trust)', 'Red (Canadian pride)', 'Green (nature)'],
        settings: ['Canadian cities', 'Modern offices', 'Natural settings']
      },
      platformPreferences: { 'LinkedIn': 90, 'Facebook': 85, 'Instagram': 80, 'Twitter': 75, 'TikTok': 65 }
    },
    'uk': {
      country: 'UK',
      languageMix: { primary: 'English', mixRatio: 0 },
      culturalValues: ['Tradition', 'Quality', 'Professionalism', 'Innovation'],
      trustSignals: ['British standards', 'Quality service', 'Professional heritage', 'Local expertise'],
      communicationStyle: 'direct',
      visualPreferences: {
        peopleRepresentation: 'British professionals, multicultural UK teams',
        colorPsychology: ['Navy (tradition)', 'Red (heritage)', 'Green (growth)'],
        settings: ['London financial district', 'Modern UK offices', 'Traditional settings']
      },
      platformPreferences: { 'LinkedIn': 95, 'Facebook': 80, 'Instagram': 75, 'Twitter': 85, 'TikTok': 60 }
    }
  };

  private static industryIntelligence: Record<string, BusinessIntelligence> = {
    'fintech': {
      industryType: 'Financial Technology',
      businessModel: 'SaaS/Platform',
      targetMarket: 'SME/Consumer',
      maturityStage: 'Growth',
      painPoints: ['Slow banking', 'High fees', 'Poor access', 'Security concerns', 'Complex processes'],
      valueProps: ['Speed', 'Security', 'Convenience', 'Cost-effectiveness', 'Accessibility'],
      trustSignals: ['Professional service', 'Customer testimonials', 'Security measures', 'Quality assurance'],
      competitivePosition: 'Challenger'
    },
    'sacco': {
      industryType: 'Financial Cooperative',
      businessModel: 'Membership/Service',
      targetMarket: 'Community/SME',
      maturityStage: 'Established',
      painPoints: ['Manual processes', 'Slow loan approvals', 'Member complaints', 'Paperwork'],
      valueProps: ['Digital efficiency', 'Fast processing', 'Member satisfaction', 'Professional service'],
      trustSignals: ['Member testimonials', 'Local presence', 'Professional service', 'Quality assurance'],
      competitivePosition: 'Traditional'
    },
    'ecommerce': {
      industryType: 'E-commerce',
      businessModel: 'Marketplace/Retail',
      targetMarket: 'Consumer',
      maturityStage: 'Growth',
      painPoints: ['Fake products', 'Slow delivery', 'Poor service', 'Limited variety', 'Trust issues'],
      valueProps: ['Authentic products', 'Fast delivery', 'Great service', 'Wide selection', 'Secure shopping'],
      trustSignals: ['Verified sellers', 'Return policies', 'Customer reviews', 'Secure payments'],
      competitivePosition: 'Challenger'
    },
    'healthcare': {
      industryType: 'Healthcare',
      businessModel: 'Service',
      targetMarket: 'Consumer/B2B',
      maturityStage: 'Established',
      painPoints: ['Long waits', 'Expensive care', 'Poor access', 'Language barriers', 'Quality concerns'],
      valueProps: ['Quality care', 'Affordability', 'Accessibility', 'Professional service', 'Modern facilities'],
      trustSignals: ['Licensed professionals', 'Certifications', 'Patient testimonials', 'Medical standards'],
      competitivePosition: 'Established'
    },
    'technology': {
      industryType: 'Technology',
      businessModel: 'SaaS/Product',
      targetMarket: 'B2B/Enterprise',
      maturityStage: 'Growth',
      painPoints: ['Inefficiency', 'Manual processes', 'Poor integration', 'High costs', 'Complexity'],
      valueProps: ['Automation', 'Integration', 'Efficiency', 'Cost savings', 'Scalability'],
      trustSignals: ['Security certifications', 'Client testimonials', 'Uptime guarantees', 'Support quality'],
      competitivePosition: 'Challenger'
    }
  };

  static getCulturalProfile(location: string): CulturalProfile {
    const normalizedLocation = location.toLowerCase();
    
    // Direct country match
    if (this.culturalProfiles[normalizedLocation]) {
      return this.culturalProfiles[normalizedLocation];
    }
    
    // City/region matching
    const cityMappings: Record<string, string> = {
      'nairobi': 'kenya',
      'mombasa': 'kenya',
      'lagos': 'nigeria',
      'abuja': 'nigeria',
      'cape town': 'south africa',
      'johannesburg': 'south africa',
      'new york': 'usa',
      'california': 'usa',
      'mumbai': 'india',
      'delhi': 'india',
      'toronto': 'canada',
      'vancouver': 'canada',
      'london': 'uk',
      'manchester': 'uk'
    };
    
    for (const [city, country] of Object.entries(cityMappings)) {
      if (normalizedLocation.includes(city)) {
        return this.culturalProfiles[country];
      }
    }
    
    // Default to USA profile for unknown locations
    return this.culturalProfiles['usa'];
  }

  static getBusinessIntelligence(businessType: string): BusinessIntelligence {
    const normalizedType = businessType.toLowerCase();
    
    // Direct match
    if (this.industryIntelligence[normalizedType]) {
      return this.industryIntelligence[normalizedType];
    }
    
    // Fuzzy matching
    const typeMapping: Record<string, string> = {
      'financial': 'fintech',
      'banking': 'fintech',
      'payment': 'fintech',
      'cooperative': 'sacco',
      'credit union': 'sacco',
      'retail': 'ecommerce',
      'marketplace': 'ecommerce',
      'shopping': 'ecommerce',
      'medical': 'healthcare',
      'clinic': 'healthcare',
      'hospital': 'healthcare',
      'software': 'technology',
      'saas': 'technology',
      'tech': 'technology'
    };
    
    for (const [keyword, industry] of Object.entries(typeMapping)) {
      if (normalizedType.includes(keyword)) {
        return this.industryIntelligence[industry];
      }
    }
    
    // Default to technology
    return this.industryIntelligence['technology'];
  }

  static generateCulturalContent(
    businessName: string,
    businessType: string,
    location: string,
    useLocalLanguage: boolean = false
  ): {
    headlines: string[];
    subheadlines: string[];
    ctas: string[];
    culturalContext: string;
  } {
    const cultural = this.getCulturalProfile(location);
    const business = this.getBusinessIntelligence(businessType);
    
    const headlines = this.generateHeadlines(businessName, business, cultural, useLocalLanguage);
    const subheadlines = this.generateSubheadlines(businessName, business, cultural, useLocalLanguage);
    const ctas = this.generateCTAs(business, cultural, useLocalLanguage);
    
    return {
      headlines,
      subheadlines,
      ctas,
      culturalContext: `${cultural.country} - ${cultural.communicationStyle} culture with ${business.industryType} focus`
    };
  }

  private static generateHeadlines(
    businessName: string,
    business: BusinessIntelligence,
    cultural: CulturalProfile,
    useLocalLanguage: boolean
  ): string[] {
    const headlines: string[] = [];
    
    // Problem-focused headlines
    headlines.push(`Stop ${business.painPoints[0]} Today`);
    headlines.push(`Tired of ${business.painPoints[1]}?`);
    
    // Social proof headlines
    if (cultural.communicationStyle === 'relationship-focused') {
      headlines.push(`Join ${cultural.country} Businesses Using ${businessName}`);
      headlines.push(`Why ${cultural.country} Leaders Choose ${businessName}`);
    } else {
      headlines.push(`${businessName}: Industry Leader in ${business.valueProps[0]}`);
      headlines.push(`Proven Results: ${businessName} Delivers`);
    }
    
    // Local language integration (only when toggle is on)
    if (useLocalLanguage && cultural.languageMix.secondary) {
      const localHeadlines = this.generateLocalLanguageHeadlines(businessName, cultural);
      headlines.push(...localHeadlines);
    }
    
    return headlines.slice(0, 5);
  }

  private static generateSubheadlines(
    businessName: string,
    business: BusinessIntelligence,
    cultural: CulturalProfile,
    useLocalLanguage: boolean
  ): string[] {
    const subheadlines: string[] = [];
    
    // Trust-focused subheadlines
    subheadlines.push(`${cultural.trustSignals[0]} • ${business.valueProps[0]} • Trusted locally`);
    subheadlines.push(`${business.valueProps[1]} for ${cultural.country} businesses since 2020`);
    
    // Benefit-focused
    subheadlines.push(`Cut ${business.painPoints[0]} by 90% with ${businessName}`);
    subheadlines.push(`${business.valueProps[0]} + ${business.valueProps[1]} = Success`);
    
    // Cultural adaptation
    if (cultural.communicationStyle === 'relationship-focused') {
      subheadlines.push(`Building stronger ${cultural.country} businesses together`);
    } else {
      subheadlines.push(`Maximize efficiency, minimize ${business.painPoints[0]}`);
    }
    
    return subheadlines.slice(0, 5);
  }

  private static generateCTAs(
    business: BusinessIntelligence,
    cultural: CulturalProfile,
    useLocalLanguage: boolean
  ): string[] {
    const ctas: string[] = [];
    
    // Industry-specific CTAs
    if (business.industryType.includes('Financial')) {
      ctas.push('Get Free Demo', 'Start Free Trial', 'Apply Now', 'Book Consultation');
    } else if (business.industryType.includes('E-commerce')) {
      ctas.push('Shop Now', 'Order Today', 'Browse Products', 'Get Deals');
    } else if (business.industryType.includes('Healthcare')) {
      ctas.push('Book Appointment', 'Get Consultation', 'Schedule Visit', 'Learn More');
    } else {
      ctas.push('Try Free', 'Get Started', 'Book Demo', 'Contact Us');
    }
    
    // Cultural adaptation
    if (cultural.communicationStyle === 'relationship-focused') {
      ctas.push('Join Community', 'Connect Today');
    } else {
      ctas.push('Start Now', 'Get Results');
    }
    
    return ctas.slice(0, 4);
  }

  private static generateLocalLanguageHeadlines(
    businessName: string,
    cultural: CulturalProfile
  ): string[] {
    const headlines: string[] = [];
    
    switch (cultural.country.toLowerCase()) {
      case 'kenya':
        headlines.push(`${businessName} ni Solution Yako ya Business`);
        headlines.push(`Watu wa Kenya Wanapenda ${businessName}`);
        break;
      case 'nigeria':
        headlines.push(`${businessName} Na the Real Deal for Your Business`);
        headlines.push(`Naija Businesses Dey Use ${businessName}`);
        break;
      case 'india':
        headlines.push(`${businessName} Se Apna Business Badhayiye`);
        headlines.push(`Bharatiya Businesses Choose ${businessName}`);
        break;
      case 'canada':
        headlines.push(`${businessName} - Votre Solution d'Affaires`);
        headlines.push(`Les Entreprises Canadiennes Choisissent ${businessName}`);
        break;
    }
    
    return headlines;
  }

  static getVisualInstructions(location: string, businessType: string): string {
    const cultural = this.getCulturalProfile(location);
    const business = this.getBusinessIntelligence(businessType);
    
    return `
CULTURAL VISUAL ADAPTATION FOR ${cultural.country.toUpperCase()}:
- People: ${cultural.visualPreferences.peopleRepresentation}
- Settings: ${cultural.visualPreferences.settings.join(', ')}
- Colors: ${cultural.visualPreferences.colorPsychology.join(', ')}
- Business Context: ${business.industryType} professionals in ${cultural.country}
- Trust Elements: Include ${cultural.trustSignals.slice(0, 2).join(', ')}
- Cultural Values: Reflect ${cultural.culturalValues.slice(0, 3).join(', ')}
`;
  }
}