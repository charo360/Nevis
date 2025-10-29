// Core Type Definitions for AI-Intelligence Marketing System

export interface BusinessProfile {
  // Basic info
  name: string
  type: string
  category: string
  
  // Services
  services: string[]
  primaryService: string
  
  // Target market
  targetAudience: string
  location: string
  serviceArea: string
  
  // Positioning
  uniqueFeatures: string[]
  competitiveAdvantages: string[]
  pricePoint: 'budget' | 'mid-range' | 'premium' | 'luxury'
  
  // Brand
  brandVoice?: string
  values?: string[]
  
  // Goals
  primaryGoal: 'awareness' | 'consideration' | 'conversion' | 'retention'
}

export interface AudiencePainPoint {
  pain: string
  intensity: number // 1-10
  frequency: number // 1-10
  emotionalImpact: string
}

export interface TargetPersona {
  demographics: {
    ageRange?: string
    income?: string
    lifestyle?: string
  }
  psychographics: {
    values?: string[]
    interests?: string[]
    attitudes?: string[]
  }
  painPoints: AudiencePainPoint[]
  desires: string[]
  fears: string[]
  objections: string[]
  buyingStage: 'awareness' | 'consideration' | 'decision'
  purchaseMotivation: 'emotional' | 'logical' | 'social'
}

export interface MarketingFramework {
  framework: string
  reasoning: string
}

export interface EmotionalTrigger {
  trigger: string
  application: string
}

export interface BusinessIntelligence {
  // Core understanding
  industryCategory: string
  businessModel: string
  valueProposition: string
  
  // Audience insights
  targetPersona: TargetPersona
  
  // Market positioning
  marketPosition: string
  competitiveDifferentiators: string[]
  uniqueSellingProposition: string
  
  // Marketing strategy
  recommendedFrameworks: string[]
  emotionalTriggers: string[]
  messagingAngles: string[]
  
  // Content guidance
  toneSuggestions: string[]
  keyMessagePoints: string[]
  ctaRecommendations: string[]
}

export interface MarketingExample {
  id: string
  
  // Business context
  businessType: string
  industryCategory: string
  targetAudience: string
  pricePoint: string
  
  // Campaign details
  goal: 'awareness' | 'consideration' | 'conversion' | 'retention'
  platform: string
  framework: string
  
  // The content
  content: string
  headline: string
  hook: string
  cta: string
  
  // Analysis
  whyItWorks: string
  emotionalTriggers: string[]
  keyTechniques: string[]
  
  // Performance
  performance: {
    engagementRate: number
    clickThroughRate: number
    conversionRate: number
    qualityScore: number
  }
  
  // Meta
  dateAdded: Date
  performanceVerified: boolean
}

export interface MarketingKnowledge {
  frameworkTemplate: string
  frameworkReasoning: string
  frameworkSteps: Array<{
    name: string
    description: string
    requirements: string[]
  }>
  headlineFormulas: Array<{
    formula: string
    example: string
  }>
  hookPatterns: Array<{
    pattern: string
    example: string
  }>
  bannedPhrases: string[]
  emotionalTriggerGuidance: Record<string, string>
}

export interface ContentGenerationRequest {
  businessIntelligence: BusinessIntelligence
  businessProfile: BusinessProfile
  platform: string
  realTimeContext?: any
  variantSeed?: number
}

export interface GeneratedContent {
  headline: string
  subheadline: string
  bodyContent: string
  callToAction: string
  hashtags: string[]
  
  // Metadata
  frameworkUsed: string
  emotionalTriggersUsed: string[]
  messagingAngle: string
  estimatedReadability: number
  targetWordCount: number
  
  // Reasoning (for transparency)
  reasoning?: {
    whyThisHook?: string
    keyEmotionalTrigger?: string
    mainMessageAngle?: string
  }
}

export interface QualityScore {
  marketingEffectiveness: number // 0-100
  authenticityScore: number // 0-100 (higher = more human-like)
  brandAlignment: number // 0-100
  conversionPotential: number // 0-100
  engagementPrediction: number // 0-100
  overallScore: number // 0-100
  issues: string[]
  suggestions: string[]
}

export interface LLMGenerationOptions {
  prompt: string
  temperature: number
  maxTokens: number
  model?: 'claude' | 'gpt4' | 'gemini'
}

export interface ExampleSearchCriteria {
  industryCategory?: string
  goal?: string
  framework?: string
  minPerformanceScore?: number
  limit?: number
}
