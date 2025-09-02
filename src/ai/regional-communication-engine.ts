/**
 * Regional Communication Engine
 * Deep understanding of how people actually communicate, advertise, and connect in different regions
 */

export interface RegionalProfile {
  region: string;
  country: string;
  communicationStyle: CommunicationStyle;
  advertisingPatterns: AdvertisingPattern[];
  localSlang: LocalSlang;
  culturalNuances: CulturalNuance[];
  businessCommunication: BusinessCommunication;
  socialMediaBehavior: SocialMediaBehavior;
}

export interface CommunicationStyle {
  directness: 'very_direct' | 'direct' | 'indirect' | 'very_indirect';
  formality: 'very_formal' | 'formal' | 'casual' | 'very_casual';
  emotionalExpression: 'high' | 'medium' | 'low';
  humorStyle: string[];
  persuasionTactics: string[];
  attentionGrabbers: string[];
}

export interface AdvertisingPattern {
  type: string;
  approach: string;
  examples: string[];
  effectiveness: 'high' | 'medium' | 'low';
  platforms: string[];
}

export interface LocalSlang {
  greetings: string[];
  excitement: string[];
  approval: string[];
  emphasis: string[];
  callToAction: string[];
  endingPhrases: string[];
}

export interface CulturalNuance {
  aspect: string;
  importance: 'critical' | 'important' | 'moderate';
  description: string;
  doAndDonts: {
    do: string[];
    dont: string[];
  };
}

export interface BusinessCommunication {
  trustBuilders: string[];
  valuePropositions: string[];
  communityConnection: string[];
  localReferences: string[];
}

export interface SocialMediaBehavior {
  preferredPlatforms: string[];
  contentPreferences: string[];
  engagementStyle: string;
  hashtagUsage: string;
  visualPreferences: string[];
}

export class RegionalCommunicationEngine {
  private regionalProfiles: Map<string, RegionalProfile> = new Map();

  constructor() {
    this.initializeRegionalProfiles();
  }

  private initializeRegionalProfiles() {
    // KENYA - Nairobi and surrounding areas
    this.regionalProfiles.set('kenya', {
      region: 'Kenya',
      country: 'Kenya',
      communicationStyle: {
        directness: 'direct',
        formality: 'casual',
        emotionalExpression: 'high',
        humorStyle: ['witty', 'playful', 'community-based', 'storytelling'],
        persuasionTactics: ['community benefit', 'family value', 'quality emphasis', 'local pride'],
        attentionGrabbers: ['Eh!', 'Sawa sawa!', 'Mambo!', 'Poa!', 'Uko ready?']
      },
      advertisingPatterns: [
        {
          type: 'Community-Centered',
          approach: 'Emphasize how the business serves the local community',
          examples: [
            'Serving our Nairobi family with love',
            'Your neighborhood spot for authentic taste',
            'Where Kenyans come together'
          ],
          effectiveness: 'high',
          platforms: ['facebook', 'whatsapp', 'instagram']
        },
        {
          type: 'Quality & Freshness',
          approach: 'Highlight freshness, quality, and authentic preparation',
          examples: [
            'Fresh from the kitchen to your table',
            'Made with love, served with pride',
            'Authentic taste that reminds you of home'
          ],
          effectiveness: 'high',
          platforms: ['instagram', 'facebook']
        },
        {
          type: 'Swahili Integration',
          approach: 'Natural mix of English and Swahili that feels authentic',
          examples: [
            'Chakula kizuri, bei nzuri!',
            'Karibu for the best experience',
            'Tupo hapa for you always'
          ],
          effectiveness: 'high',
          platforms: ['all']
        }
      ],
      localSlang: {
        greetings: ['Mambo!', 'Sasa!', 'Niaje!', 'Poa!', 'Karibu!'],
        excitement: ['Poa kabisa!', 'Sawa sawa!', 'Fiti!', 'Bomba!', 'Noma!'],
        approval: ['Safi!', 'Poa!', 'Nzuri!', 'Fiti kabisa!', 'Bomba sana!'],
        emphasis: ['kabisa', 'sana', 'mzuri', 'noma', 'fiti'],
        callToAction: ['Njoo uone!', 'Karibu!', 'Tupatane!', 'Uko ready?', 'Twende!'],
        endingPhrases: ['Tutaonana!', 'Karibu tena!', 'Asante sana!', 'Mungu akubariki!']
      },
      culturalNuances: [
        {
          aspect: 'Community Connection',
          importance: 'critical',
          description: 'Kenyans value businesses that feel like part of the community',
          doAndDonts: {
            do: ['Reference local landmarks', 'Use "our community" language', 'Show family values'],
            dont: ['Sound too corporate', 'Ignore local customs', 'Be overly formal']
          }
        },
        {
          aspect: 'Language Mixing',
          importance: 'important',
          description: 'Natural mixing of English and Swahili is expected and appreciated',
          doAndDonts: {
            do: ['Mix languages naturally', 'Use common Swahili phrases', 'Keep it conversational'],
            dont: ['Force Swahili if unsure', 'Use formal Swahili only', 'Ignore English speakers']
          }
        }
      ],
      businessCommunication: {
        trustBuilders: [
          'Family-owned and operated',
          'Serving the community for [X] years',
          'Made with love by local hands',
          'Your neighbors you can trust'
        ],
        valuePropositions: [
          'Fresh ingredients sourced locally',
          'Authentic recipes passed down generations',
          'Fair prices for quality food',
          'A place where everyone is family'
        ],
        communityConnection: [
          'Part of the Nairobi family',
          'Supporting local farmers and suppliers',
          'Where neighbors become friends',
          'Celebrating our Kenyan heritage'
        ],
        localReferences: [
          'Just off [local road/landmark]',
          'Near [well-known local spot]',
          'In the heart of [neighborhood]',
          'Where locals have been coming for years'
        ]
      },
      socialMediaBehavior: {
        preferredPlatforms: ['WhatsApp', 'Facebook', 'Instagram', 'TikTok'],
        contentPreferences: ['food photos', 'behind-the-scenes', 'customer testimonials', 'community events'],
        engagementStyle: 'High interaction, lots of comments and shares, community-focused',
        hashtagUsage: 'Mix of English and Swahili hashtags, location-based tags',
        visualPreferences: ['bright colors', 'authentic moments', 'people enjoying food', 'local settings']
      }
    });

    // NIGERIA - Lagos and surrounding areas
    this.regionalProfiles.set('nigeria', {
      region: 'Nigeria',
      country: 'Nigeria',
      communicationStyle: {
        directness: 'direct',
        formality: 'casual',
        emotionalExpression: 'high',
        humorStyle: ['energetic', 'bold', 'confident', 'community-pride'],
        persuasionTactics: ['quality emphasis', 'value for money', 'social status', 'community respect'],
        attentionGrabbers: ['Oya!', 'See this one!', 'No be small thing!', 'This one sweet die!']
      },
      advertisingPatterns: [
        {
          type: 'Bold & Confident',
          approach: 'Strong, confident statements about quality and value',
          examples: [
            'The best in Lagos, no cap!',
            'Quality wey go shock you!',
            'This one na correct business!'
          ],
          effectiveness: 'high',
          platforms: ['instagram', 'twitter', 'facebook']
        },
        {
          type: 'Value Emphasis',
          approach: 'Highlight exceptional value and quality for the price',
          examples: [
            'Quality food, affordable price',
            'Where your money get value',
            'Premium taste, pocket-friendly price'
          ],
          effectiveness: 'high',
          platforms: ['all']
        }
      ],
      localSlang: {
        greetings: ['How far?', 'Wetin dey happen?', 'Oya!', 'My guy!'],
        excitement: ['E sweet die!', 'This one correct!', 'Na fire!', 'Too much!'],
        approval: ['Correct!', 'Na so!', 'Perfect!', 'E good die!'],
        emphasis: ['die', 'well well', 'proper', 'correct'],
        callToAction: ['Come try am!', 'Oya come!', 'Make you taste am!', 'No waste time!'],
        endingPhrases: ['See you soon!', 'We dey wait for you!', 'Come back again!']
      },
      culturalNuances: [
        {
          aspect: 'Confidence & Quality',
          importance: 'critical',
          description: 'Nigerians appreciate confident, bold statements about quality',
          doAndDonts: {
            do: ['Be confident about your quality', 'Use bold language', 'Emphasize value'],
            dont: ['Be too modest', 'Undersell your quality', 'Sound uncertain']
          }
        }
      ],
      businessCommunication: {
        trustBuilders: [
          'Tested and trusted',
          'Lagos people choice',
          'Quality wey you fit trust',
          'We no dey disappoint'
        ],
        valuePropositions: [
          'Best quality for your money',
          'Fresh ingredients, authentic taste',
          'Where quality meets affordability',
          'Premium service, reasonable price'
        ],
        communityConnection: [
          'Proudly Nigerian',
          'Serving Lagos with pride',
          'Your neighborhood favorite',
          'Where Lagos people gather'
        ],
        localReferences: [
          'For Lagos Island',
          'Victoria Island area',
          'Mainland favorite',
          'Ikeja corridor'
        ]
      },
      socialMediaBehavior: {
        preferredPlatforms: ['Instagram', 'Twitter', 'WhatsApp', 'Facebook'],
        contentPreferences: ['food videos', 'customer reactions', 'quality showcases', 'value demonstrations'],
        engagementStyle: 'High energy, lots of reactions, sharing culture',
        hashtagUsage: 'Mix of English and Pidgin, location tags, trending topics',
        visualPreferences: ['vibrant colors', 'appetizing close-ups', 'happy customers', 'quality focus']
      }
    });

    // SOUTH AFRICA - Johannesburg/Cape Town
    this.regionalProfiles.set('south_africa', {
      region: 'South Africa',
      country: 'South Africa',
      communicationStyle: {
        directness: 'direct',
        formality: 'casual',
        emotionalExpression: 'medium',
        humorStyle: ['laid-back', 'friendly', 'inclusive', 'warm'],
        persuasionTactics: ['quality focus', 'local pride', 'community value', 'authentic experience'],
        attentionGrabbers: ['Howzit!', 'Check this out!', 'Lekker!', 'Sharp!']
      },
      advertisingPatterns: [
        {
          type: 'Lekker & Local',
          approach: 'Emphasize local flavor and authentic South African experience',
          examples: [
            'Proper lekker food, hey!',
            'Authentic South African taste',
            'Made with love in Mzansi'
          ],
          effectiveness: 'high',
          platforms: ['instagram', 'facebook']
        }
      ],
      localSlang: {
        greetings: ['Howzit!', 'Sharp!', 'Sawubona!', 'Hey!'],
        excitement: ['Lekker!', 'Sharp sharp!', 'Eish!', 'Awesome!'],
        approval: ['Lekker!', 'Sharp!', 'Cool!', 'Nice one!'],
        emphasis: ['proper', 'lekker', 'sharp', 'hey'],
        callToAction: ['Come check us out!', 'Pop in!', 'Give us a try!'],
        endingPhrases: ['Cheers!', 'See you now!', 'Sharp!']
      },
      culturalNuances: [
        {
          aspect: 'Rainbow Nation Unity',
          importance: 'important',
          description: 'Inclusive language that welcomes all South Africans',
          doAndDonts: {
            do: ['Be inclusive', 'Celebrate diversity', 'Use local terms naturally'],
            dont: ['Exclude any group', 'Be overly formal', 'Ignore local culture']
          }
        }
      ],
      businessCommunication: {
        trustBuilders: [
          'Proudly South African',
          'Local family business',
          'Trusted by locals',
          'Authentic Mzansi experience'
        ],
        valuePropositions: [
          'Lekker food, fair prices',
          'Authentic local flavors',
          'Quality you can trust',
          'Where everyone is welcome'
        ],
        communityConnection: [
          'Part of the local community',
          'Supporting local suppliers',
          'Where neighbors meet',
          'Celebrating our heritage'
        ],
        localReferences: [
          'In the heart of [area]',
          'Your local [business type]',
          'Joburg favorite',
          'Cape Town gem'
        ]
      },
      socialMediaBehavior: {
        preferredPlatforms: ['Facebook', 'Instagram', 'WhatsApp', 'Twitter'],
        contentPreferences: ['local culture', 'food heritage', 'community events', 'authentic moments'],
        engagementStyle: 'Friendly, inclusive, community-focused',
        hashtagUsage: 'Local slang mixed with English, location-based',
        visualPreferences: ['natural lighting', 'authentic settings', 'diverse people', 'local culture']
      }
    });

    // Add more regions as needed...
  }

  /**
   * Get regional communication profile
   */
  public getRegionalProfile(location: string): RegionalProfile | null {
    const locationLower = location.toLowerCase();

    // Kenya detection
    if (locationLower.includes('kenya') || locationLower.includes('nairobi') ||
      locationLower.includes('mombasa') || locationLower.includes('kisumu')) {
      return this.regionalProfiles.get('kenya');
    }

    // Nigeria detection
    if (locationLower.includes('nigeria') || locationLower.includes('lagos') ||
      locationLower.includes('abuja') || locationLower.includes('kano')) {
      return this.regionalProfiles.get('nigeria');
    }

    // South Africa detection
    if (locationLower.includes('south africa') || locationLower.includes('johannesburg') ||
      locationLower.includes('cape town') || locationLower.includes('durban')) {
      return this.regionalProfiles.get('south_africa');
    }

    return null;
  }

  /**
   * Generate regionally authentic content
   */
  public generateRegionalContent(
    businessType: string,
    businessName: string,
    location: string,
    contentType: 'headline' | 'subheadline' | 'caption' | 'cta' = 'headline'
  ): string {
    const profile = this.getRegionalProfile(location);

    if (!profile) {
      return this.generateGenericContent(businessType, businessName, contentType);
    }

    switch (contentType) {
      case 'headline':
        return this.generateRegionalHeadline(businessType, businessName, profile);
      case 'subheadline':
        return this.generateRegionalSubheadline(businessType, businessName, profile);
      case 'caption':
        return this.generateRegionalCaption(businessType, businessName, profile);
      case 'cta':
        return this.generateRegionalCTA(businessType, businessName, profile);
      default:
        return this.generateRegionalHeadline(businessType, businessName, profile);
    }
  }

  private generateRegionalHeadline(businessType: string, businessName: string, profile: RegionalProfile): string {
    const { localSlang, advertisingPatterns, businessCommunication } = profile;

    // Get relevant advertising pattern
    const relevantPattern = advertisingPatterns.find(p => p.effectiveness === 'high') || advertisingPatterns[0];

    // Create meaningful headlines that tell a story
    const meaningfulTemplates = [
      `What makes ${businessName} different in ${profile.region}?`,
      `The ${profile.region.toLowerCase()} secret everyone's talking about`,
      `Why ${businessName} is ${profile.region}'s best kept secret`,
      `${this.getRandomElement(businessCommunication.valuePropositions)} - ${businessName}`,
      `Discover what makes ${businessName} special`,
      `${businessName}: ${this.getRandomElement(businessCommunication.trustBuilders)}`,
    ];

    // Add local flavor to meaningful content
    const selectedTemplate = this.getRandomElement(meaningfulTemplates);

    // Enhance with local expressions where appropriate
    if (Math.random() > 0.6) {
      const localTouch = this.getRandomElement(localSlang.excitement);
      return `${selectedTemplate} ${localTouch}`;
    }

    return selectedTemplate;
  }

  private generateRegionalSubheadline(businessType: string, businessName: string, profile: RegionalProfile): string {
    const { localSlang, businessCommunication } = profile;

    // Create meaningful subheadlines that provide context
    const meaningfulTemplates = [
      `${this.getRandomElement(businessCommunication.valuePropositions)} you can trust`,
      `Authentic ${businessType.toLowerCase()} with a local touch`,
      `Where tradition meets innovation`,
      `${this.getRandomElement(businessCommunication.trustBuilders)} since day one`,
      `Bringing ${profile.region}'s finest to your table`,
      `More than just ${businessType.toLowerCase()} - it's an experience`,
      `Crafted with care, served with pride`,
      `Your neighborhood's favorite gathering place`,
      `Quality ingredients, time-tested recipes`,
      `Where every customer becomes family`
    ];

    // Occasionally add local flair
    const baseSubheadline = this.getRandomElement(meaningfulTemplates);

    if (Math.random() > 0.8) {
      const localEmphasis = this.getRandomElement(localSlang.emphasis);
      return `${localEmphasis} ${baseSubheadline.toLowerCase()}`;
    }

    return baseSubheadline;
  }

  private generateRegionalCaption(businessType: string, businessName: string, profile: RegionalProfile): string {
    const { localSlang, businessCommunication, culturalNuances } = profile;

    // Create meaningful story-driven captions
    const storyTemplates = [
      {
        opening: `Ever wondered what makes ${businessName} stand out?`,
        story: `We've been ${this.getRandomElement(businessCommunication.trustBuilders)} for years, bringing you ${this.getRandomElement(businessCommunication.valuePropositions)}. Our secret? We understand what ${profile.region} truly values.`,
        proof: `From our carefully selected ingredients to our time-tested recipes, every detail matters. That's why we're ${this.getRandomElement(businessCommunication.communityConnection)}.`,
        action: `Ready to taste the difference? ${this.getRandomElement(localSlang.callToAction)}`
      },
      {
        opening: `Here's what makes ${businessName} special in ${profile.region}:`,
        story: `✨ ${this.getRandomElement(businessCommunication.valuePropositions)}\n✨ ${this.getRandomElement(businessCommunication.trustBuilders)}\n✨ ${this.getRandomElement(businessCommunication.communityConnection)}`,
        proof: `We don't just serve ${businessType.toLowerCase()} - we create experiences that bring people together. That's the ${profile.region} way!`,
        action: `Come see for yourself why locals choose us. ${this.getRandomElement(localSlang.callToAction)}`
      },
      {
        opening: `The story behind ${businessName}:`,
        story: `We started with a simple mission: to be ${this.getRandomElement(businessCommunication.trustBuilders)} while delivering ${this.getRandomElement(businessCommunication.valuePropositions)}.`,
        proof: `Today, we're proud to be ${this.getRandomElement(businessCommunication.communityConnection)}, serving authentic ${businessType.toLowerCase()} that reflects our heritage and values.`,
        action: `Join our growing family! ${this.getRandomElement(localSlang.callToAction)}`
      }
    ];

    const selectedStory = this.getRandomElement(storyTemplates);

    // Add local greeting and closing
    const greeting = Math.random() > 0.7 ? `${this.getRandomElement(localSlang.greetings)} ` : '';
    const excitement = Math.random() > 0.5 ? ` ${this.getRandomElement(localSlang.excitement)}` : '';
    const ending = this.getRandomElement(localSlang.endingPhrases);

    return `${greeting}${selectedStory.opening}

${selectedStory.story}

${selectedStory.proof}${excitement}

${selectedStory.action}

${ending}`;
  }

  private generateRegionalCTA(businessType: string, businessName: string, profile: RegionalProfile): string {
    const { localSlang, businessCommunication } = profile;

    // Create meaningful CTAs that provide clear value
    const meaningfulCTAs = [
      `Taste the difference at ${businessName}`,
      `Experience authentic ${businessType.toLowerCase()} today`,
      `Join our community of satisfied customers`,
      `Discover why locals choose ${businessName}`,
      `Book your table and taste the tradition`,
      `Visit us and see what makes us special`,
      `Come for the food, stay for the experience`,
      `Your next favorite meal awaits`,
      `Ready to become part of our family?`,
      `Let us show you what quality means`
    ];

    // Add local CTAs with context
    const localCTAs = localSlang.callToAction.map(cta => {
      if (Math.random() > 0.5) {
        return `${cta} - ${this.getRandomElement(businessCommunication.valuePropositions)}`;
      }
      return cta;
    });

    const allCTAs = [...meaningfulCTAs, ...localCTAs];
    return this.getRandomElement(allCTAs);
  }

  private generateGenericContent(businessType: string, businessName: string, contentType: string): string {
    // Fallback for unsupported regions
    const templates = {
      headline: `Experience the best at ${businessName}`,
      subheadline: `Quality ${businessType.toLowerCase()} you can trust`,
      caption: `Welcome to ${businessName}! We're committed to providing you with exceptional ${businessType} services. Visit us today!`,
      cta: `Visit ${businessName} today!`
    };

    return templates[contentType as keyof typeof templates] || templates.headline;
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)] || array[0];
  }

  /**
   * Get regional hashtags
   */
  public getRegionalHashtags(location: string, businessType: string): string[] {
    const profile = this.getRegionalProfile(location);

    if (!profile) {
      return [`#${businessType}`, `#local`, `#quality`];
    }

    const hashtags: string[] = [];

    // Add location-based hashtags
    if (location.toLowerCase().includes('nairobi')) {
      hashtags.push('#NairobiEats', '#KenyanFood', '#NairobiLife', '#254Food');
    } else if (location.toLowerCase().includes('lagos')) {
      hashtags.push('#LagosEats', '#NaijaFood', '#LagosLife', '#9jaFood');
    } else if (location.toLowerCase().includes('johannesburg')) {
      hashtags.push('#JoziEats', '#SouthAfricanFood', '#MzansiFood', '#JHBLife');
    }

    // Add business type hashtags with local flavor
    hashtags.push(`#${businessType}`, '#LocalBusiness', '#CommunityFavorite');

    return hashtags;
  }
}

// Export singleton instance
export const regionalEngine = new RegionalCommunicationEngine();
