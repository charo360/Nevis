/**
 * Samaki Cookies - Comprehensive Business Profile
 * 
 * This is an example of a complete business profile that the AI system
 * should understand to generate perfectly tailored ads.
 */

import { BusinessProfile } from '../business-profiler';

export const samakiCookiesProfile: BusinessProfile = {
  // Core Identity
  businessId: 'samaki-cookies-kenya',
  businessName: 'Samaki Cookies',
  industry: 'Food & Nutrition',
  businessType: 'food',

  // Brand Colors (Ocean-inspired theme reflecting fish-based product)
  primaryColor: '#1E40AF',      // Deep ocean blue - represents fish/ocean heritage
  accentColor: '#F59E0B',       // Warm amber - represents warmth, nutrition, and Kenyan sunshine
  backgroundColor: '#F8FAFC',   // Clean off-white - represents purity and health

  // Contact Information - NOTE: This will be overridden by actual brand profile data
  // These are fallback values only used if no contact info is provided in the brand profile
  contactInfo: {
    phone: '+254 712 345 678',
    email: 'info@samakicookies.co.ke',
    website: 'www.samakicookies.co.ke',
    address: 'Kilifi County, Kenya'
  },
  
  // Mission & Purpose
  mission: 'Combat malnutrition in Kenya through affordable, nutritious fish-based cookies',
  socialImpact: 'Fighting malnutrition in underserved communities across Kenya',
  founderStory: 'Founded by Francis Thoya in Kilifi County to address local malnutrition challenges',
  coreValues: [
    'Nutrition accessibility',
    'Community empowerment', 
    'Local sourcing',
    'Affordability',
    'Health equity'
  ],
  
  // Unique Value Proposition
  uniqueSellingPoints: [
    'First fish-based cookies in Kenya',
    'Combines convenience with nutrition',
    'Locally sourced ingredients from Kilifi',
    'Affordable protein source',
    'Mission-driven social impact'
  ],
  competitiveAdvantages: [
    'Unique fish protein formulation',
    'Deep community roots in Kilifi',
    'Social impact mission',
    'Local ingredient sourcing',
    'Founder expertise in nutrition'
  ],
  keyDifferentiators: [
    'Fish-based protein (not typical grain cookies)',
    'Malnutrition-fighting mission',
    'Community-centered approach',
    'Kenyan-made for Kenyan needs',
    'Affordable nutrition solution'
  ],
  
  // Products/Services Deep Dive
  offerings: [
    {
      name: 'Samaki Cookies',
      type: 'product',
      category: 'Nutritious Snacks',
      description: 'Fish-based cookies designed to combat malnutrition',
      
      keyIngredients: [
        'High-quality fish protein',
        'Local Kilifi ingredients',
        'Essential nutrients',
        'Natural flavoring'
      ],
      nutritionalBenefits: [
        'High protein content from fish',
        'Essential amino acids',
        'Omega-3 fatty acids',
        'Vitamins and minerals',
        'Balanced nutrition profile'
      ],
      healthBenefits: [
        'Fights malnutrition',
        'Supports child development',
        'Improves protein intake',
        'Boosts immune system',
        'Enhances cognitive function'
      ],
      functionalBenefits: [
        'Convenient snack format',
        'Long shelf life',
        'Portable nutrition',
        'Easy to consume',
        'No preparation needed'
      ],
      emotionalBenefits: [
        'Peace of mind for parents',
        'Supporting local community',
        'Contributing to social good',
        'Providing quality nutrition',
        'Caring for family health'
      ],
      
      pricePoint: 'budget',
      targetUseCase: [
        'Daily nutrition supplement',
        'School snacks',
        'Family treats',
        'Emergency nutrition',
        'Community feeding programs'
      ],
      consumptionContext: [
        'Home with family',
        'School lunch',
        'Community centers',
        'On-the-go snacking',
        'Shared with friends'
      ],
      
      primaryAngle: 'Affordable nutrition that fights malnutrition',
      secondaryAngles: [
        'Local Kilifi ingredients',
        'Supporting community development',
        'Convenient healthy snacking',
        'Fish protein innovation'
      ],
      proofPoints: [
        'Founded by nutrition expert Francis Thoya',
        'Made with local Kilifi ingredients',
        'Designed specifically for malnutrition',
        'Community-tested and approved',
        'Affordable pricing for all families'
      ]
    }
  ],
  
  // Target Audience Intelligence
  primaryAudience: {
    name: 'Kenyan Families with Children',
    demographics: {
      ageRange: 'Parents 25-45, Children 3-15',
      income: 'Low to middle income',
      location: 'Kenya (focus on Kilifi County)',
      lifestyle: ['Family-oriented', 'Health-conscious', 'Community-minded']
    },
    psychographics: {
      values: ['Family health', 'Community support', 'Value for money', 'Local pride'],
      motivations: ['Child nutrition', 'Family wellbeing', 'Supporting local business'],
      painPoints: ['Malnutrition concerns', 'Limited healthy snack options', 'Budget constraints'],
      aspirations: ['Healthy children', 'Strong community', 'Better nutrition access']
    },
    behaviors: {
      shoppingHabits: ['Local markets', 'Community stores', 'Bulk buying'],
      mediaConsumption: ['Local radio', 'Community networks', 'Mobile phones'],
      decisionFactors: ['Price', 'Nutrition value', 'Local sourcing', 'Community impact']
    },
    messaging: {
      tone: 'Caring, authentic, community-focused',
      keyMessages: [
        'Nutrition your family can afford',
        'Made in Kilifi, for Kilifi families',
        'Fighting malnutrition together',
        'Quality nutrition, local ingredients'
      ],
      emotionalTriggers: ['Family care', 'Community pride', 'Health security'],
      avoidMessages: ['Luxury positioning', 'Generic health claims', 'Foreign comparisons']
    }
  },
  
  secondaryAudiences: [
    {
      name: 'Health-Conscious Urban Kenyans',
      demographics: {
        ageRange: '25-40',
        income: 'Middle income',
        location: 'Urban Kenya (Nairobi, Mombasa)',
        lifestyle: ['Health-focused', 'Socially conscious', 'Busy professionals']
      },
      psychographics: {
        values: ['Health optimization', 'Social impact', 'Innovation'],
        motivations: ['Personal health', 'Supporting social causes', 'Trying new products'],
        painPoints: ['Limited healthy snack options', 'Wanting to support social impact'],
        aspirations: ['Optimal health', 'Contributing to social good']
      },
      behaviors: {
        shoppingHabits: ['Supermarkets', 'Online shopping', 'Health stores'],
        mediaConsumption: ['Social media', 'Health blogs', 'Urban radio'],
        decisionFactors: ['Health benefits', 'Social impact', 'Innovation', 'Convenience']
      },
      messaging: {
        tone: 'Innovative, impact-focused, health-oriented',
        keyMessages: [
          'Innovation in nutrition',
          'Support malnutrition fight',
          'Unique fish-based protein',
          'Local impact, personal health'
        ],
        emotionalTriggers: ['Social impact', 'Health innovation', 'Community support'],
        avoidMessages: ['Budget positioning', 'Basic nutrition claims']
      }
    }
  ],
  
  // Market Context
  localContext: {
    country: 'Kenya',
    region: 'Kilifi County (coastal region)',
    culturalFactors: [
      'Strong community bonds',
      'Respect for local traditions',
      'Family-centered society',
      'Coastal fishing culture',
      'Ubuntu philosophy (community care)'
    ],
    economicContext: 'Developing economy with income disparities',
    localChallenges: [
      'Malnutrition in children',
      'Limited access to quality protein',
      'Economic constraints',
      'Food security issues'
    ],
    communityValues: [
      'Collective responsibility',
      'Supporting local business',
      'Child welfare priority',
      'Community development'
    ],
    languageNuances: [
      'Swahili cultural references',
      'Local coastal dialects',
      'Community-focused language',
      'Respectful family terms'
    ]
  },
  
  marketPosition: {
    category: 'Nutritious Snacks / Social Impact Food',
    positioning: 'The affordable nutrition solution fighting malnutrition',
    competitors: ['Generic biscuits', 'Imported snacks', 'Local bakeries'],
    marketGap: 'No other fish-based nutritious cookies addressing malnutrition',
    opportunitySize: 'Large - malnutrition affects millions in Kenya'
  },
  
  // Marketing Intelligence
  brandPersonality: {
    archetype: 'Caregiver', // Nurturing, protective, caring
    traits: ['Caring', 'Authentic', 'Community-minded', 'Innovative', 'Accessible'],
    voice: 'Warm, caring, authentic, community-focused',
    visualStyle: 'Warm colors, family imagery, local settings, authentic photography',
    emotionalTone: 'Caring, hopeful, empowering, community-proud'
  },
  
  messagingFramework: {
    coreMessage: 'Affordable nutrition that fights malnutrition, made with love in Kilifi',
    supportingMessages: [
      'Fish-based protein in convenient cookie form',
      'Supporting local Kilifi community',
      'Founded by nutrition expert Francis Thoya',
      'Every cookie fights malnutrition'
    ],
    proofPoints: [
      'High-quality fish protein',
      'Local Kilifi ingredients',
      'Designed for malnutrition',
      'Community-tested',
      'Affordable for all families'
    ],
    callToActions: [
      'Nourish your family today',
      'Join the fight against malnutrition',
      'Try Samaki Cookies now',
      'Support local nutrition'
    ],
    valuePropositions: [
      'Affordable nutrition for every family',
      'Local ingredients, global impact',
      'Convenient protein in cookie form',
      'Supporting community health'
    ]
  },
  
  contentStrategy: {
    primaryContentTypes: ['Family moments', 'Community impact', 'Product benefits', 'Founder story'],
    visualApproach: 'Authentic family photography, local Kilifi settings, product close-ups',
    storytellingAngles: [
      'Family nutrition journey',
      'Community impact stories',
      'Founder mission narrative',
      'Local ingredient sourcing',
      'Child health transformation'
    ],
    seasonalConsiderations: [
      'School term nutrition focus',
      'Holiday family gatherings',
      'Harvest season local ingredients'
    ],
    channelSpecificAdaptations: {
      'social_media': 'Family moments, community stories',
      'radio': 'Community testimonials, local language',
      'print': 'Detailed nutrition information, founder story',
      'community': 'Local impact, testimonials'
    }
  },
  
  // Forbidden Elements (what NOT to include)
  avoidanceList: [
    'Generic motivational language (Fuel Your Dreams, etc.)',
    'Luxury positioning',
    'Foreign comparisons',
    'Complex nutrition jargon',
    'Urban-only imagery',
    'Expensive lifestyle imagery',
    'Generic health claims',
    'Non-local cultural references'
  ],
  
  // Generated Insights
  generatedAt: new Date('2024-11-10'),
  confidence: 95
};
