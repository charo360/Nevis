/**
 * Human-Like Content Generation System
 * 
 * This module provides techniques to make AI-generated content
 * feel authentic, human, and engaging while avoiding AI detection.
 */

export interface HumanizationTechniques {
  personality_markers: string[];
  authenticity_elements: string[];
  conversational_patterns: string[];
  storytelling_devices: string[];
  emotional_connectors: string[];
  imperfection_markers: string[];
}

export interface TrafficDrivingElements {
  viral_hooks: string[];
  engagement_magnets: string[];
  conversion_triggers: string[];
  shareability_factors: string[];
  curiosity_gaps: string[];
  social_proof_elements: string[];
}

/**
 * Generates human-like content techniques based on business type and brand voice
 */
export function generateHumanizationTechniques(
  businessType: string,
  brandVoice: string,
  location: string
): HumanizationTechniques {
  
  const basePersonality = getPersonalityMarkers(brandVoice);
  const industryAuthenticity = getIndustryAuthenticity(businessType);
  const locationConversation = getLocationConversation(location);
  
  return {
    personality_markers: [
      ...basePersonality,
      'Use first-person perspective occasionally',
      'Include personal opinions and preferences',
      'Show vulnerability and learning moments',
      'Express genuine excitement about successes'
    ],
    authenticity_elements: [
      ...industryAuthenticity,
      'Share behind-the-scenes moments',
      'Admit mistakes and lessons learned',
      'Use specific details instead of generalities',
      'Reference real experiences and observations',
      'Include time-specific references (today, this morning, etc.)'
    ],
    conversational_patterns: [
      ...locationConversation,
      'Start sentences with "You know what?"',
      'Use rhetorical questions naturally',
      'Include conversational fillers like "honestly" or "actually"',
      'Break up long thoughts with shorter sentences',
      'Use contractions (we\'re, don\'t, can\'t) naturally'
    ],
    storytelling_devices: [
      'Start with "I remember when..." or "Last week..."',
      'Use the "But here\'s the thing..." transition',
      'Include dialogue: "My customer said..."',
      'Paint vivid scenes with sensory details',
      'End with unexpected insights or realizations'
    ],
    emotional_connectors: [
      'Share moments of doubt and breakthrough',
      'Express genuine gratitude to customers',
      'Show empathy for customer struggles',
      'Celebrate small wins with enthusiasm',
      'Use emotional language that resonates'
    ],
    imperfection_markers: [
      'Occasional typos that feel natural (but not distracting)',
      'Slightly informal grammar in casual contexts',
      'Stream-of-consciousness moments',
      'Self-corrections: "Actually, let me rephrase that..."',
      'Honest admissions: "I\'m still figuring this out..."'
    ]
  };
}

/**
 * Generates traffic-driving content elements
 */
export function generateTrafficDrivingElements(
  businessType: string,
  platform: string,
  targetAudience?: string
): TrafficDrivingElements {
  
  return {
    viral_hooks: [
      'Controversial but respectful opinions',
      'Surprising industry statistics',
      'Before/after transformations',
      'Myth-busting content',
      'Exclusive behind-the-scenes reveals',
      'Timely reactions to trending topics',
      'Unexpected collaborations or partnerships'
    ],
    engagement_magnets: [
      'Fill-in-the-blank questions',
      'This or that choices',
      'Caption this photo challenges',
      'Share your experience prompts',
      'Prediction requests',
      'Opinion polls and surveys',
      'Challenge participation invites'
    ],
    conversion_triggers: [
      'Limited-time offers with urgency',
      'Exclusive access for followers',
      'Free valuable resources',
      'Personal consultation offers',
      'Early bird opportunities',
      'Member-only benefits',
      'Referral incentives'
    ],
    shareability_factors: [
      'Relatable everyday struggles',
      'Inspirational success stories',
      'Useful tips people want to save',
      'Funny observations about the industry',
      'Heartwarming customer stories',
      'Educational content that teaches',
      'Content that makes people look smart for sharing'
    ],
    curiosity_gaps: [
      'The one thing nobody tells you about...',
      'What happened next will surprise you...',
      'The secret that changed everything...',
      'Why everyone is wrong about...',
      'The mistake I made that taught me...',
      'What I wish I knew before...',
      'The truth about... that nobody talks about'
    ],
    social_proof_elements: [
      'Customer testimonials and reviews',
      'User-generated content features',
      'Industry recognition and awards',
      'Media mentions and press coverage',
      'Collaboration with respected figures',
      'Community size and engagement stats',
      'Success metrics and achievements'
    ]
  };
}

/**
 * Gets personality markers based on brand voice
 */
function getPersonalityMarkers(brandVoice: string): string[] {
  const voiceMap: Record<string, string[]> = {
    'friendly': [
      'Use warm, welcoming language',
      'Include friendly greetings and sign-offs',
      'Show genuine interest in followers',
      'Use inclusive language that brings people together'
    ],
    'professional': [
      'Maintain expertise while being approachable',
      'Use industry knowledge to build authority',
      'Balance formal tone with personal touches',
      'Show competence through specific examples'
    ],
    'casual': [
      'Use everyday language and slang appropriately',
      'Be relaxed and conversational',
      'Include humor and light-hearted moments',
      'Feel like talking to a friend'
    ],
    'innovative': [
      'Show forward-thinking perspectives',
      'Challenge conventional wisdom respectfully',
      'Share cutting-edge insights',
      'Express excitement about new possibilities'
    ]
  };

  // Extract key words from brand voice description
  const lowerVoice = brandVoice.toLowerCase();
  for (const [key, markers] of Object.entries(voiceMap)) {
    if (lowerVoice.includes(key)) {
      return markers;
    }
  }

  return voiceMap['friendly']; // Default fallback
}

/**
 * Gets industry-specific authenticity elements
 */
function getIndustryAuthenticity(businessType: string): string[] {
  const industryMap: Record<string, string[]> = {
    'restaurant': [
      'Share cooking failures and successes',
      'Talk about ingredient sourcing stories',
      'Mention customer reactions and feedback',
      'Describe the sensory experience of food'
    ],
    'fitness': [
      'Share personal workout struggles',
      'Admit to having off days',
      'Celebrate client progress genuinely',
      'Talk about the mental health benefits'
    ],
    'technology': [
      'Explain complex concepts simply',
      'Share debugging stories and solutions',
      'Admit when technology isn\'t perfect',
      'Focus on human impact of technology'
    ],
    'financial technology software': [
      'Share stories about financial inclusion impact',
      'Explain complex financial concepts simply',
      'Highlight real customer success stories',
      'Address common financial fears and concerns',
      'Show the human side of financial technology'
    ],
    'beauty': [
      'Share makeup fails and learning moments',
      'Talk about skin struggles and solutions',
      'Celebrate diverse beauty standards',
      'Share product testing experiences'
    ]
  };

  return industryMap[businessType.toLowerCase()] || [
    'Share real customer interactions',
    'Talk about daily business challenges',
    'Celebrate small business wins',
    'Show the human side of your industry'
  ];
}

/**
 * Gets location-specific conversational patterns
 */
function getLocationConversation(location: string): string[] {
  const locationMap: Record<string, string[]> = {
    'nairobi': [
      'Use occasional Swahili phrases naturally',
      'Reference local landmarks and experiences',
      'Include community-focused language',
      'Show respect for local customs and values'
    ],
    'new york': [
      'Use direct, fast-paced communication',
      'Reference city experiences and culture',
      'Include diverse perspectives',
      'Show hustle and ambition'
    ],
    'london': [
      'Use British expressions naturally',
      'Include dry humor appropriately',
      'Reference local culture and experiences',
      'Maintain polite but direct communication'
    ]
  };

  const locationKey = location.toLowerCase().split(',')[0].trim();
  return locationMap[locationKey] || [
    'Use local expressions and references',
    'Include regional cultural touchpoints',
    'Show understanding of local context',
    'Connect with community values'
  ];
}

/**
 * Generates content optimization strategies for maximum engagement
 */
export function generateContentOptimization(
  platform: string,
  businessType: string,
  timeOfDay: string = 'morning'
): {
  posting_strategy: string[];
  engagement_timing: string[];
  content_mix: string[];
  performance_indicators: string[];
} {
  
  const platformStrategies: Record<string, any> = {
    'instagram': {
      posting_strategy: [
        'Use high-quality visuals as primary hook',
        'Write captions that encourage saves and shares',
        'Include clear call-to-actions in stories',
        'Use relevant hashtags strategically'
      ],
      engagement_timing: [
        'Post when your audience is most active',
        'Respond to comments within first hour',
        'Use stories for real-time engagement',
        'Go live during peak audience times'
      ]
    },
    'linkedin': {
      posting_strategy: [
        'Lead with valuable insights or questions',
        'Use professional but personal tone',
        'Include industry-relevant hashtags',
        'Share thought leadership content'
      ],
      engagement_timing: [
        'Post during business hours for B2B',
        'Engage with comments professionally',
        'Share in relevant LinkedIn groups',
        'Connect with commenters personally'
      ]
    },
    'twitter': {
      posting_strategy: [
        'Use trending hashtags when relevant',
        'Create tweetable quotes and insights',
        'Engage in real-time conversations',
        'Share quick tips and observations'
      ],
      engagement_timing: [
        'Tweet during peak conversation times',
        'Respond quickly to mentions',
        'Join trending conversations',
        'Retweet with thoughtful comments'
      ]
    },
    'facebook': {
      posting_strategy: [
        'Create community-focused content',
        'Use longer-form storytelling',
        'Encourage group discussions',
        'Share local community content'
      ],
      engagement_timing: [
        'Post when your community is online',
        'Respond to all comments personally',
        'Share in relevant Facebook groups',
        'Use Facebook events for promotion'
      ]
    }
  };

  const strategy = platformStrategies[platform.toLowerCase()] || platformStrategies['instagram'];
  
  return {
    ...strategy,
    content_mix: [
      '60% educational/valuable content',
      '20% behind-the-scenes/personal',
      '15% promotional/business',
      '5% trending/entertainment'
    ],
    performance_indicators: [
      'Comments and meaningful engagement',
      'Saves and shares over likes',
      'Profile visits and follows',
      'Website clicks and conversions',
      'Direct messages and inquiries'
    ]
  };
}
