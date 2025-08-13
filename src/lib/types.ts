export type Platform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter';

export type BrandConsistencyPreferences = {
  strictConsistency: boolean; // Whether to strictly follow design examples for consistency
  followBrandColors: boolean; // Whether to follow brand colors in the design
};

export type BrandProfile = {
  businessName: string;
  businessType: string;
  location: string;
  logoDataUrl: string;
  visualStyle: string;
  writingTone: string;
  contentThemes: string;

  // New detailed fields
  websiteUrl?: string;
  description?: string;
  services?: string; // Storing as a newline-separated string for simplicity in UI
  targetAudience?: string;
  keyFeatures?: string; // Storing as a newline-separated string
  competitiveAdvantages?: string; // Storing as a newline-separated string
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };

  // Theme colors remain
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;

  // Design Examples (for AI reference)
  designExamples?: string[]; // Array of data URIs from uploaded design samples
};

export type ContentVariant = {
  content: string;
  approach: string;
  rationale: string;
};

export type HashtagAnalysis = {
  trending: string[];
  niche: string[];
  location: string[];
  community: string[];
};

export type TrendingTopic = {
  topic: string;
  relevanceScore: number;
  category: string;
  engagement_potential: string;
};

export type CompetitorInsight = {
  competitor_name: string;
  content_gap: string;
  differentiation_opportunity: string;
};

export type CulturalContext = {
  location: string;
  cultural_nuances: string[];
  local_customs: string[];
};

export type MarketIntelligence = {
  trending_topics: TrendingTopic[];
  competitor_insights: CompetitorInsight[];
  cultural_context: CulturalContext;
  viral_patterns: string[];
  engagement_triggers: string[];
};

export type WeatherContext = {
  temperature: number;
  condition: string;
  business_impact: string;
  content_opportunities: string[];
};

export type LocalEvent = {
  name: string;
  category: string;
  relevance_score: number;
  start_date: string;
};

export type LocalContext = {
  weather?: WeatherContext;
  events?: LocalEvent[];
};

export type GeneratedPost = {
  id: string;
  date: string;
  content: string;
  hashtags: string;
  status: 'generated' | 'edited' | 'posted';
  variants: {
    platform: Platform;
    imageUrl: string;
  }[];
  imageText: string;
  videoUrl?: string;
  // Enhanced AI features
  contentVariants?: ContentVariant[];
  hashtagAnalysis?: HashtagAnalysis;
  // Advanced AI features
  marketIntelligence?: MarketIntelligence;
  // Local context features
  localContext?: LocalContext;
};


export type BrandAnalysisResult = {
  visualStyle: string;
  writingTone: string;
  contentThemes: string;
  // New analysis fields
  description: string;
  services: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
};

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  maskDataUrl?: string | null;
}

export type CreativeAsset = {
  imageUrl: string | null;
  videoUrl: string | null;
  aiExplanation: string;
};
