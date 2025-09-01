import { BusinessProfile, ContentStrategy } from '@/lib/types/business-profile';

/**
 * Content Generation Engine for Small Business Social Media
 * 
 * This engine creates engaging, authentic social media content that:
 * - Sounds like the business owner wrote it
 * - Maintains brand consistency
 * - Provides variety and creativity
 * - Optimizes for each platform
 * - Incorporates local relevance
 */

export interface GeneratedPost {
  id: string;
  type: 'caption' | 'story' | 'reel' | 'carousel';
  platform: string;
  content: string;
  hashtags: string[];
  visualDescription: string;
  engagementPrompt: string;
  callToAction: string;
  postCategory: string;
  localRelevance: string[];
  seasonalContext: string;
  businessValue: string;
  targetAudience: string[];
}

export interface ContentVariation {
  style: string;
  tone: string;
  approach: string;
  emotionalTrigger: string;
  storytellingFramework: string;
}

export class ContentGenerationEngine {
  private businessProfile: BusinessProfile;
  private contentStrategy: ContentStrategy;
  private postVariations: ContentVariation[];

  constructor(businessProfile: BusinessProfile, contentStrategy: ContentStrategy) {
    this.businessProfile = businessProfile;
    this.contentStrategy = contentStrategy;
    this.initializePostVariations();
  }

  /**
   * Initialize different post variation styles
   */
  private initializePostVariations(): void {
    this.postVariations = [
      {
        style: 'Storytelling',
        tone: 'Personal',
        approach: 'Behind-the-scenes narrative',
        emotionalTrigger: 'Connection and authenticity',
        storytellingFramework: 'Situation → Challenge → Solution → Result'
      },
      {
        style: 'Educational',
        tone: 'Helpful',
        approach: 'Value-driven tips and insights',
        emotionalTrigger: 'Learning and growth',
        storytellingFramework: 'Problem → Insight → Solution → Benefit'
      },
      {
        style: 'Inspirational',
        tone: 'Motivational',
        approach: 'Uplifting and encouraging content',
        emotionalTrigger: 'Hope and motivation',
        storytellingFramework: 'Vision → Challenge → Inspiration → Action'
      },
      {
        style: 'Community',
        tone: 'Welcoming',
        approach: 'Local pride and community focus',
        emotionalTrigger: 'Belonging and pride',
        storytellingFramework: 'Community → Connection → Celebration → Invitation'
      },
      {
        style: 'Behind-the-Scenes',
        tone: 'Authentic',
        approach: 'Real business life and operations',
        emotionalTrigger: 'Transparency and trust',
        storytellingFramework: 'Reality → Process → People → Results'
      },
      {
        style: 'Customer Spotlight',
        tone: 'Appreciative',
        approach: 'Celebrating customer success',
        emotionalTrigger: 'Recognition and gratitude',
        storytellingFramework: 'Customer → Challenge → Solution → Success'
      },
      {
        style: 'Industry Expert',
        tone: 'Authoritative',
        approach: 'Professional insights and trends',
        emotionalTrigger: 'Trust and expertise',
        storytellingFramework: 'Trend → Analysis → Insight → Action'
      },
      {
        style: 'Promotional',
        tone: 'Exciting',
        approach: 'Product/service highlights',
        emotionalTrigger: 'Desire and urgency',
        storytellingFramework: 'Offer → Benefit → Value → Action'
      }
    ];
  }

  /**
   * Generate a complete social media post
   */
  public generatePost(
    platform: string,
    postType: string,
    category: string
  ): GeneratedPost {
    const variation = this.selectVariation(category);
    const content = this.generateContent(variation, platform, category);
    const hashtags = this.generateHashtags(category, platform);
    const visualDescription = this.generateVisualDescription(category, variation);
    const engagementPrompt = this.generateEngagementPrompt(variation, category);
    const callToAction = this.generateCallToAction(variation, category);

    return {
      id: this.generatePostId(),
      type: this.determinePostType(postType),
      platform,
      content,
      hashtags,
      visualDescription,
      engagementPrompt,
      callToAction,
      postCategory: category,
      localRelevance: this.getLocalRelevanceElements(),
      seasonalContext: this.getSeasonalContext(),
      businessValue: this.getBusinessValue(category),
      targetAudience: this.businessProfile.targetAudience
    };
  }

  /**
   * Select appropriate content variation based on category
   */
  private selectVariation(category: string): ContentVariation {
    const categoryVariations: Record<string, string[]> = {
      'behind-the-scenes': ['Storytelling', 'Behind-the-Scenes', 'Authentic'],
      'educational': ['Educational', 'Industry Expert', 'Helpful'],
      'inspirational': ['Inspirational', 'Motivational', 'Uplifting'],
      'community': ['Community', 'Local Pride', 'Welcoming'],
      'customer-spotlight': ['Customer Spotlight', 'Appreciative', 'Grateful'],
      'promotional': ['Promotional', 'Exciting', 'Urgent'],
      'industry-insights': ['Industry Expert', 'Authoritative', 'Professional'],
      'seasonal': ['Community', 'Local Pride', 'Celebratory']
    };

    const preferredStyles = categoryVariations[category] || ['Storytelling', 'Authentic'];
    const availableVariations = this.postVariations.filter(v => 
      preferredStyles.includes(v.style)
    );

    return availableVariations[Math.floor(Math.random() * availableVariations.length)];
  }

  /**
   * Generate the main content based on variation and category
   */
  private generateContent(
    variation: ContentVariation,
    platform: string,
    category: string
  ): string {
    const contentTemplates = this.getContentTemplates(variation, category);
    const template = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
    
    return this.fillContentTemplate(template, variation, platform, category);
  }

  /**
   * Get content templates based on variation and category
   */
  private getContentTemplates(variation: ContentVariation, category: string): string[] {
    const templates: Record<string, Record<string, string[]>> = {
      'Storytelling': {
        'behind-the-scenes': [
          "Today at {businessName}, we {action}. It's moments like these that remind us why we love what we do. {detail}",
          "Ever wonder what goes into {service}? Here's a peek behind the curtain at {businessName}. {detail}",
          "This morning, {detail}. It's the little things that make {businessName} special. {reflection}"
        ],
        'customer-spotlight': [
          "Meet {customerName}, who came to {businessName} looking for {need}. Today, {result}. {celebration}",
          "Stories like {customerName}'s remind us why we do what we do at {businessName}. {journey}",
          "When {customerName} first walked into {businessName}, {situation}. Now, {transformation}. {gratitude}"
        ]
      },
      'Educational': {
        'industry-insights': [
          "Did you know that {fact}? At {businessName}, we've learned that {insight}. Here's why it matters: {explanation}",
          "Many people ask us about {topic}. Here's what we've discovered at {businessName}: {insight}",
          "In the {industry} world, {trend} is changing everything. Here's how {businessName} is adapting: {strategy}"
        ],
        'tips': [
          "Want to {goal}? Here are {number} tips we've learned at {businessName}: {tips}",
          "After {years} in {industry}, here's what we know about {topic}: {advice}",
          "The secret to {success}? At {businessName}, we've found that {key} makes all the difference."
        ]
      },
      'Community': {
        'local-pride': [
          "There's something special about {city} that makes {businessName} what it is. {localDetail}",
          "In {city}, we believe in {value}. That's why at {businessName}, we {action}",
          "From {localLandmark} to {localEvent}, {city} is full of {quality}. At {businessName}, we're proud to be part of it."
        ],
        'seasonal': [
          "As {season} approaches in {city}, {businessName} is getting ready for {seasonalActivity}",
          "There's nothing like {season} in {city}. At {businessName}, we're celebrating by {celebration}",
          "The {season} vibes are strong in {city}! At {businessName}, we're embracing it with {seasonalOffer}"
        ]
      },
      'Behind-the-Scenes': {
        'operations': [
          "While most people are {commonActivity}, our team at {businessName} is {businessActivity}. {detail}",
          "Today's mission at {businessName}: {goal}. Here's what that looks like: {process}",
          "Behind every {service} at {businessName} is a team that {dedication}. Today, {example}"
        ],
        'team': [
          "Meet the amazing people behind {businessName}. Today, {teamMember} is {activity}. {appreciation}",
          "Our team at {businessName} works hard to {goal}. Here's {teamMember} in action: {action}",
          "The heart of {businessName} is our incredible team. Today, {teamMember} is {activity}. {gratitude}"
        ]
      }
    };

    return templates[variation.style]?.[category] || [
      "At {businessName}, we're passionate about {service}. Today, {detail}. {reflection}"
    ];
  }

  /**
   * Fill content template with business-specific information
   */
  private fillContentTemplate(
    template: string,
    variation: ContentVariation,
    platform: string,
    category: string
  ): string {
    const businessName = this.businessProfile.businessName;
    const city = this.businessProfile.city;
    const businessType = this.businessProfile.businessType;
    const services = this.businessProfile.services;
    const uniqueValue = this.businessProfile.uniqueValue;

    // Generate dynamic content based on category
    const dynamicContent = this.generateDynamicContent(category, variation);

    return template
      .replace('{businessName}', businessName)
      .replace('{city}', city)
      .replace('{businessType}', businessType)
      .replace('{service}', services[Math.floor(Math.random() * services.length)] || 'our services')
      .replace('{services}', services.join(', '))
      .replace('{uniqueValue}', uniqueValue)
      .replace('{action}', dynamicContent.action)
      .replace('{detail}', dynamicContent.detail)
      .replace('{reflection}', dynamicContent.reflection)
      .replace('{goal}', dynamicContent.goal)
      .replace('{insight}', dynamicContent.insight)
      .replace('{tips}', dynamicContent.tips)
      .replace('{localDetail}', dynamicContent.localDetail)
      .replace('{value}', dynamicContent.value)
      .replace('{season}', dynamicContent.season)
      .replace('{seasonalActivity}', dynamicContent.seasonalActivity)
      .replace('{celebration}', dynamicContent.celebration)
      .replace('{seasonalOffer}', dynamicContent.seasonalOffer)
      .replace('{commonActivity}', dynamicContent.commonActivity)
      .replace('{businessActivity}', dynamicContent.businessActivity)
      .replace('{process}', dynamicContent.process)
      .replace('{dedication}', dynamicContent.dedication)
      .replace('{example}', dynamicContent.example)
      .replace('{teamMember}', dynamicContent.teamMember)
      .replace('{activity}', dynamicContent.activity)
      .replace('{appreciation}', dynamicContent.appreciation)
      .replace('{gratitude}', dynamicContent.gratitude)
      .replace('{customerName}', dynamicContent.customerName)
      .replace('{need}', dynamicContent.need)
      .replace('{result}', dynamicContent.result)
      .replace('{situation}', dynamicContent.situation)
      .replace('{transformation}', dynamicContent.transformation)
      .replace('{journey}', dynamicContent.journey)
      .replace('{fact}', dynamicContent.fact)
      .replace('{explanation}', dynamicContent.explanation)
      .replace('{topic}', dynamicContent.topic)
      .replace('{trend}', dynamicContent.trend)
      .replace('{strategy}', dynamicContent.strategy)
      .replace('{number}', dynamicContent.number)
      .replace('{advice}', dynamicContent.advice)
      .replace('{success}', dynamicContent.success)
      .replace('{key}', dynamicContent.key)
      .replace('{localLandmark}', dynamicContent.localLandmark)
      .replace('{localEvent}', dynamicContent.localEvent)
      .replace('{quality}', dynamicContent.quality)
      .replace('{years}', dynamicContent.years)
      .replace('{industry}', this.businessProfile.industry);
  }

  /**
   * Generate dynamic content based on category and variation
   */
  private generateDynamicContent(category: string, variation: ContentVariation): any {
    const contentGenerators: Record<string, () => any> = {
      'behind-the-scenes': () => ({
        action: this.getRandomAction(),
        detail: this.getRandomDetail(),
        reflection: this.getRandomReflection()
      }),
      'educational': () => ({
        fact: this.getRandomFact(),
        insight: this.getRandomInsight(),
        explanation: this.getRandomExplanation(),
        tips: this.getRandomTips(),
        advice: this.getRandomAdvice()
      }),
      'community': () => ({
        localDetail: this.getRandomLocalDetail(),
        value: this.getRandomValue(),
        season: this.getCurrentSeason(),
        seasonalActivity: this.getSeasonalActivity(),
        celebration: this.getRandomCelebration(),
        seasonalOffer: this.getSeasonalOffer(),
        localLandmark: this.getRandomLocalLandmark(),
        localEvent: this.getRandomLocalEvent(),
        quality: this.getRandomQuality()
      }),
      'customer-spotlight': () => ({
        customerName: this.getRandomCustomerName(),
        need: this.getRandomNeed(),
        result: this.getRandomResult(),
        situation: this.getRandomSituation(),
        transformation: this.getRandomTransformation(),
        journey: this.getRandomJourney(),
        gratitude: this.getRandomGratitude()
      })
    };

    return contentGenerators[category]?.() || {
      action: 'work hard to serve our community',
      detail: 'every detail matters to us',
      reflection: 'it\'s what makes us special'
    };
  }

  /**
   * Generate hashtags for the post
   */
  private generateHashtags(category: string, platform: string): string[] {
    const baseHashtags = this.contentStrategy.hashtagStrategy;
    const categoryHashtags = this.getCategoryHashtags(category);
    const platformHashtags = this.getPlatformHashtags(platform);
    
    return [...baseHashtags, ...categoryHashtags, ...platformHashtags]
      .slice(0, 15);
  }

  /**
   * Get category-specific hashtags
   */
  private getCategoryHashtags(category: string): string[] {
    const categoryHashtags: Record<string, string[]> = {
      'behind-the-scenes': ['#BehindTheScenes', '#BTS', '#BusinessLife', '#TeamWork'],
      'educational': ['#Tips', '#Learn', '#Knowledge', '#Expertise', '#Insights'],
      'community': ['#LocalBusiness', '#Community', '#LocalPride', '#SupportLocal'],
      'customer-spotlight': ['#CustomerSuccess', '#Testimonial', '#SuccessStory', '#HappyCustomer'],
      'promotional': ['#SpecialOffer', '#LimitedTime', '#Deal', '#Promotion'],
      'seasonal': ['#Seasonal', '#Holiday', '#Celebration', '#Festive']
    };

    return categoryHashtags[category] || ['#Business', '#Professional'];
  }

  /**
   * Get platform-specific hashtags
   */
  private getPlatformHashtags(platform: string): string[] {
    const platformHashtags: Record<string, string[]> = {
      'instagram': ['#Instagram', '#InstaGood', '#PhotoOfTheDay'],
      'facebook': ['#Facebook', '#SocialMedia', '#Community'],
      'linkedin': ['#LinkedIn', '#Professional', '#Business'],
      'twitter': ['#Twitter', '#Tweet', '#SocialMedia']
    };

    return platformHashtags[platform.toLowerCase()] || [];
  }

  /**
   * Generate visual description for the post
   */
  private generateVisualDescription(category: string, variation: ContentVariation): string {
    const visualTemplates = [
      "High-quality image showing {visualElement} with {businessName} branding",
      "Professional photo of {visualElement} in {setting}",
      "Engaging visual featuring {visualElement} with {style} aesthetic",
      "Authentic image capturing {visualElement} in natural {environment}"
    ];

    const template = visualTemplates[Math.floor(Math.random() * visualTemplates.length)];
    const visualElement = this.getVisualElement(category);
    const setting = this.getVisualSetting(category);
    const style = this.businessProfile.visualStyle;
    const environment = this.getVisualEnvironment(category);

    return template
      .replace('{visualElement}', visualElement)
      .replace('{setting}', setting)
      .replace('{style}', style)
      .replace('{environment}', environment);
  }

  /**
   * Generate engagement prompt
   */
  private generateEngagementPrompt(variation: ContentVariation, category: string): string {
    const prompts = [
      "What's your experience with {topic}? Share below! 👇",
      "Have you ever {action}? Tell us about it! 💬",
      "What do you think about {topic}? Comment your thoughts! 🤔",
      "Tag someone who needs to see this! 👥",
      "What's your favorite {item}? Let us know! ❤️",
      "Share this if you agree! 🔄",
      "What questions do you have about {topic}? Ask away! ❓"
    ];

    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    const topic = this.getEngagementTopic(category);
    const action = this.getEngagementAction(category);
    const item = this.getEngagementItem(category);

    return prompt
      .replace('{topic}', topic)
      .replace('{action}', action)
      .replace('{item}', item);
  }

  /**
   * Generate call to action
   */
  private generateCallToAction(variation: ContentVariation, category: string): string {
    const actions = [
      "Visit us today!",
      "Book your appointment now!",
      "Call us to learn more!",
      "Follow us for daily updates!",
      "Share this with friends!",
      "Save this post for later!",
      "DM us for details!",
      "Check out our website!"
    ];

    return actions[Math.floor(Math.random() * actions.length)];
  }

  // Helper methods for dynamic content generation
  private getRandomAction(): string { return 'crafted something special'; }
  private getRandomDetail(): string { return 'every detail is carefully considered'; }
  private getRandomReflection(): string { return 'it\'s moments like these that make it all worthwhile'; }
  private getRandomFact(): string { return 'quality matters more than quantity'; }
  private getRandomInsight(): string { return 'success comes from understanding our customers'; }
  private getRandomExplanation(): string { return 'because it directly impacts the customer experience'; }
  private getRandomTips(): string { return 'focus on quality, listen to feedback, and stay true to your values'; }
  private getRandomAdvice(): string { return 'success comes from passion and persistence'; }
  private getRandomSuccess(): string { return 'delivering exceptional service'; }
  private getRandomKey(): string { return 'attention to detail'; }
  private getRandomLocalDetail(): string { return 'the community spirit is incredible'; }
  private getRandomValue(): string { return 'supporting local businesses'; }
  private getCurrentSeason(): string { return 'this beautiful season'; }
  private getSeasonalActivity(): string { return 'special seasonal offerings'; }
  private getRandomCelebration(): string { return 'embracing the seasonal spirit'; }
  private getSeasonalOffer(): string { return 'exclusive seasonal products'; }
  private getRandomLocalLandmark(): string { return 'our beautiful downtown'; }
  private getRandomLocalEvent(): string { return 'community festivals'; }
  private getRandomQuality(): string { return 'authenticity and warmth'; }
  private getRandomCustomerName(): string { return 'Sarah'; }
  private getRandomNeed(): string { return 'quality service'; }
  private getRandomResult(): string { return 'they found exactly what they were looking for'; }
  private getRandomSituation(): string { return 'they were unsure about their options'; }
  private getRandomTransformation(): string { return 'they\'re now our biggest advocate'; }
  private getRandomJourney(): string { return 'it\'s been amazing to see their progress'; }
  private getRandomGratitude(): string { return 'we\'re so grateful for customers like this'; }
  private getRandomYears(): string { return 'over 5 years'; }
  private getVisualElement(category: string): string { return 'our team in action'; }
  private getVisualSetting(category: string): string { return 'our workspace'; }
  private getVisualEnvironment(category: string): string { return 'business environment'; }
  private getEngagementTopic(category: string): string { return 'our services'; }
  private getEngagementAction(category: string): string { return 'tried something new'; }
  private getEngagementItem(category: string): string { return 'part of our business'; }
  private getBusinessValue(category: string): string { return 'Building authentic connections with our community'; }
  private getLocalRelevanceElements(): string[] { return ['Local culture', 'Community involvement']; }
  private getSeasonalContext(): string { return 'Seasonal business opportunities'; }
  private generatePostId(): string { return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
  private determinePostType(postType: string): 'caption' | 'story' | 'reel' | 'carousel' { 
    return postType as 'caption' | 'story' | 'reel' | 'carousel' || 'caption'; 
  }
}
