export interface BusinessProfile {
  // Basic Business Information
  businessName: string;
  businessType: string; // restaurant, retail, service, healthcare, fitness, etc.
  industry: string; // food & beverage, fashion, technology, health, etc.
  location: string;
  city: string;
  country: string;
  
  // Business Details
  description: string;
  mission: string;
  vision: string;
  founded: string; // year or date
  employeeCount: number;
  
  // Target Audience
  targetAudience: string[];
  ageGroups: string[]; // young adults, families, seniors, etc.
  interests: string[];
  lifestyle: string[]; // health-conscious, budget-friendly, luxury, etc.
  
  // Services & Products
  services: string[];
  products: string[];
  specialties: string[];
  uniqueValue: string;
  competitiveAdvantages: string[];
  
  // Brand Identity
  brandColors: string[];
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  visualStyle: string; // modern, rustic, professional, creative, minimalist, bold
  brandVoice: string; // friendly, professional, casual, authoritative, inspiring
  brandPersonality: string[]; // trustworthy, innovative, caring, fun, etc.
  
  // Content Preferences
  contentThemes: string[];
  contentTone: string; // educational, entertaining, inspirational, promotional
  preferredPostTypes: string[]; // product showcases, behind-the-scenes, tips, etc.
  contentFrequency: string; // daily, 2-3 times per week, weekly
  
  // Social Media Strategy
  platforms: string[]; // instagram, facebook, linkedin, twitter, tiktok
  primaryPlatform: string;
  socialMediaGoals: string[]; // brand awareness, lead generation, community building, sales
  targetMetrics: string[]; // engagement, followers, website traffic, conversions
  
  // Local Context
  localCulture: string[];
  communityInvolvement: string[];
  localEvents: string[];
  seasonalFactors: string[];
  localCompetitors: string[];
  
  // Business Challenges & Opportunities
  challenges: string[];
  opportunities: string[];
  currentTrends: string[];
  seasonalPromotions: string[];
  
  // Customer Insights
  customerPainPoints: string[];
  customerSuccessStories: string[];
  testimonials: string[];
  frequentlyAskedQuestions: string[];
  
  // Content Assets
  logoUrl?: string;
  brandImages: string[];
  productPhotos: string[];
  teamPhotos: string[];
  locationPhotos: string[];
  
  // Business Hours & Contact
  businessHours: string;
  contactInfo: {
    phone: string;
    email: string;
    website: string;
    address: string;
  };
  
  // Additional Context
  businessSeasonality: string; // year-round, seasonal, event-based
  peakBusinessTimes: string[];
  slowPeriods: string[];
  specialEvents: string[];
  
  // AI System Preferences
  contentVariety: string; // high, medium, low
  creativeStyle: string; // conservative, balanced, experimental
  localRelevance: string; // high, medium, low
  industryExpertise: string; // showcase, educate, inspire
}

export interface BusinessAnalysis {
  businessType: string;
  industryInsights: string[];
  targetAudienceProfile: string;
  contentOpportunities: string[];
  visualStyleRecommendations: string[];
  platformStrategy: string[];
  contentThemes: string[];
  competitivePositioning: string;
  localMarketContext: string;
  seasonalContentStrategy: string;
  engagementTactics: string[];
}

export interface ContentStrategy {
  businessType: string;
  primaryContentThemes: string[];
  visualStyle: string;
  postingFrequency: string;
  platformMix: string[];
  contentMix: {
    educational: number;
    promotional: number;
    behindTheScenes: number;
    customerSpotlight: number;
    industryInsights: number;
    communityEngagement: number;
  };
  hashtagStrategy: string[];
  engagementTactics: string[];
  seasonalContent: string[];
  localRelevance: string[];
}
