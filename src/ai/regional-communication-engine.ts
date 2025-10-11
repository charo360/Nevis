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

    // GHANA - Accra and surrounding areas
    this.regionalProfiles.set('ghana', {
      region: 'Ghana',
      country: 'Ghana',
      communicationStyle: {
        directness: 'direct',
        formality: 'casual',
        emotionalExpression: 'high',
        humorStyle: ['friendly', 'warm', 'storytelling', 'community-based'],
        persuasionTactics: ['community benefit', 'family value', 'quality emphasis', 'hospitality'],
        attentionGrabbers: ['Akwaaba!', 'Chale!', 'Omo!', 'Eii!']
      },
      advertisingPatterns: [
        {
          type: 'Hospitality-Centered',
          approach: 'Emphasize warm welcome and family-like service',
          examples: [
            'Akwaaba to authentic Ghanaian hospitality',
            'Where every customer is family',
            'Bringing you the best of Ghana'
          ],
          effectiveness: 'high',
          platforms: ['facebook', 'whatsapp', 'instagram']
        }
      ],
      localSlang: {
        greetings: ['Akwaaba!', 'Eti sen?', 'Chale!', 'Omo!'],
        excitement: ['Eii!', 'Chale!', 'Omo yie!', 'Asem ooo!'],
        approval: ['Perfect!', 'Yie!', 'Nice!', 'Good job!'],
        emphasis: ['ooo', 'chale', 'omo', 'serious'],
        callToAction: ['Come try!', 'Akwaaba!', 'Join us!', 'Let\'s go!'],
        endingPhrases: ['Medaase!', 'See you!', 'Akwaaba!']
      },
      culturalNuances: [
        {
          aspect: 'Hospitality Culture',
          importance: 'critical',
          description: 'Ghanaians value warm, welcoming business interactions',
          doAndDonts: {
            do: ['Emphasize welcome', 'Show warmth', 'Reference community'],
            dont: ['Be cold', 'Rush interactions', 'Ignore cultural values']
          }
        }
      ],
      businessCommunication: {
        trustBuilders: ['family business', 'local community', 'authentic service'],
        valuePropositions: ['quality you can trust', 'service with a smile', 'authentic experience'],
        communityConnection: ['serving our community', 'your neighborhood choice', 'Ghana proud'],
        localReferences: ['Accra', 'Ghana', 'West Africa', 'Golden Coast']
      },
      socialMediaBehavior: {
        preferredPlatforms: ['facebook', 'whatsapp', 'instagram'],
        contentPreferences: ['family stories', 'community events', 'local pride', 'success stories'],
        engagementStyle: 'warm and conversational',
        hashtagUsage: 'Mix of English and local terms',
        visualPreferences: ['bright colors', 'family scenes', 'local settings', 'traditional elements']
      }
    });

    // USA - Various regions
    this.regionalProfiles.set('usa', {
      region: 'United States',
      country: 'USA',
      communicationStyle: {
        directness: 'direct',
        formality: 'casual',
        emotionalExpression: 'medium',
        humorStyle: ['confident', 'bold', 'achievement-focused', 'competitive'],
        persuasionTactics: ['value emphasis', 'competitive advantage', 'results focus', 'innovation'],
        attentionGrabbers: ['Game changer!', 'Level up!', 'This is huge!', 'Don\'t miss out!']
      },
      advertisingPatterns: [
        {
          type: 'Results-Driven',
          approach: 'Emphasize outcomes, results, and competitive advantages',
          examples: [
            'Get results that matter',
            'The competitive edge you need',
            'Game-changing solutions for American businesses'
          ],
          effectiveness: 'high',
          platforms: ['linkedin', 'facebook', 'instagram']
        }
      ],
      localSlang: {
        greetings: ['Hey there!', 'What\'s up!', 'Ready to rock?'],
        excitement: ['Awesome!', 'Amazing!', 'Let\'s go!', 'This is it!'],
        approval: ['Perfect!', 'Exactly!', 'You got it!', 'Spot on!'],
        emphasis: ['totally', 'absolutely', 'definitely', 'for sure'],
        callToAction: ['Let\'s do this!', 'Get started now!', 'Ready to level up?'],
        endingPhrases: ['Let\'s make it happen!', 'Ready when you are!', 'Game on!']
      },
      culturalNuances: [
        {
          aspect: 'Achievement Culture',
          importance: 'important',
          description: 'Americans value success, efficiency, and competitive advantage',
          doAndDonts: {
            do: ['Emphasize results', 'Show competitive edge', 'Highlight efficiency'],
            dont: ['Undersell capabilities', 'Be too modest', 'Avoid direct benefits']
          }
        }
      ],
      businessCommunication: {
        trustBuilders: ['proven results', 'industry expertise', 'customer success'],
        valuePropositions: ['competitive advantage', 'superior quality', 'measurable results'],
        communityConnection: ['serving America', 'local business', 'community investment'],
        localReferences: ['USA', 'America', 'local community', 'home grown']
      },
      socialMediaBehavior: {
        preferredPlatforms: ['linkedin', 'facebook', 'instagram', 'twitter'],
        contentPreferences: ['success stories', 'behind scenes', 'results focus', 'innovation'],
        engagementStyle: 'confident and results-oriented',
        hashtagUsage: 'Professional and achievement-focused',
        visualPreferences: ['professional', 'results-oriented', 'modern', 'success imagery']
      }
    });

    // CANADA - Various provinces
    this.regionalProfiles.set('canada', {
      region: 'Canada',
      country: 'Canada',
      communicationStyle: {
        directness: 'indirect',
        formality: 'casual',
        emotionalExpression: 'medium',
        humorStyle: ['self-deprecating', 'friendly', 'inclusive', 'polite'],
        persuasionTactics: ['community benefit', 'inclusive value', 'quality emphasis', 'politeness'],
        attentionGrabbers: ['Hey there, eh!', 'Beauty opportunity!', 'Right on!', 'Perfect, eh?']
      },
      advertisingPatterns: [
        {
          type: 'Inclusive-Friendly',
          approach: 'Emphasize inclusivity, community, and friendly service',
          examples: [
            'Serving all Canadians with pride',
            'Your friendly neighborhood business',
            'Quality service, Canadian hospitality'
          ],
          effectiveness: 'high',
          platforms: ['facebook', 'instagram', 'linkedin']
        }
      ],
      localSlang: {
        greetings: ['Hey there!', 'How\'s it going, eh?', 'Beauty day!'],
        excitement: ['Beauty!', 'Right on!', 'Fantastic!', 'Eh, that\'s great!'],
        approval: ['Perfect!', 'Beauty!', 'Right on!', 'Good stuff!'],
        emphasis: ['eh', 'beauty', 'right on', 'for sure'],
        callToAction: ['Give us a shout!', 'Come on by!', 'Let\'s chat, eh?'],
        endingPhrases: ['Take care!', 'See you soon!', 'Thanks, eh!']
      },
      culturalNuances: [
        {
          aspect: 'Politeness Culture',
          importance: 'critical',
          description: 'Canadians value politeness, inclusivity, and community spirit',
          doAndDonts: {
            do: ['Be polite', 'Include everyone', 'Show community spirit'],
            dont: ['Be pushy', 'Exclude anyone', 'Be overly aggressive']
          }
        }
      ],
      businessCommunication: {
        trustBuilders: ['community service', 'inclusive approach', 'quality with care'],
        valuePropositions: ['friendly service', 'community-focused', 'quality you can trust'],
        communityConnection: ['serving Canadians', 'local community', 'coast to coast'],
        localReferences: ['Canada', 'local community', 'home grown', 'eh']
      },
      socialMediaBehavior: {
        preferredPlatforms: ['facebook', 'instagram', 'linkedin'],
        contentPreferences: ['community stories', 'inclusive content', 'friendly interactions'],
        engagementStyle: 'polite and inclusive',
        hashtagUsage: 'Community-focused and friendly',
        visualPreferences: ['natural', 'inclusive', 'community-focused', 'friendly']
      }
    });

    // INDIA - Various regions with multilingual approach
    this.regionalProfiles.set('india', {
      region: 'India',
      country: 'India',
      communicationStyle: {
        directness: 'indirect',
        formality: 'formal',
        emotionalExpression: 'high',
        humorStyle: ['family-centered', 'respectful', 'clever', 'cultural'],
        persuasionTactics: ['family benefit', 'value emphasis', 'tradition respect', 'community trust'],
        attentionGrabbers: ['Namaste!', 'Areh yaar!', 'Suniye!', 'Dekho!']
      },
      advertisingPatterns: [
        {
          type: 'Family-Value-Centered',
          approach: 'Emphasize family benefits, value, and traditional trust',
          examples: [
            'For your family\'s happiness and prosperity',
            'Trusted by Indian families nationwide',
            'Value that makes your family proud'
          ],
          effectiveness: 'high',
          platforms: ['facebook', 'whatsapp', 'instagram']
        }
      ],
      localSlang: {
        greetings: ['Namaste!', 'Kaise ho?', 'Areh yaar!', 'Kya haal hai?'],
        excitement: ['Zabardast!', 'Bahut accha!', 'Mast!', 'Kamaal!'],
        approval: ['Accha!', 'Sahi hai!', 'Perfect!', 'Bilkul!'],
        emphasis: ['bilkul', 'sach mein', 'yaar', 'accha'],
        callToAction: ['Aaiye!', 'Call karo!', 'Join karo!', 'Dekho!'],
        endingPhrases: ['Dhanyawad!', 'Milte hain!', 'Jai Hind!']
      },
      culturalNuances: [
        {
          aspect: 'Family First Culture',
          importance: 'critical',
          description: 'Indians prioritize family benefits and collective value',
          doAndDonts: {
            do: ['Emphasize family benefits', 'Show respect', 'Build trust'],
            dont: ['Ignore family values', 'Be too direct', 'Rush decisions']
          }
        }
      ],
      businessCommunication: {
        trustBuilders: ['family tradition', 'community trust', 'proven quality'],
        valuePropositions: ['value for money', 'family benefit', 'trusted quality'],
        communityConnection: ['serving Indian families', 'community first', 'local trust'],
        localReferences: ['India', 'Bharat', 'local community', 'traditional values']
      },
      socialMediaBehavior: {
        preferredPlatforms: ['whatsapp', 'facebook', 'instagram'],
        contentPreferences: ['family stories', 'value emphasis', 'cultural respect', 'community'],
        engagementStyle: 'respectful and family-oriented',
        hashtagUsage: 'Mix of English and Hindi terms',
        visualPreferences: ['family scenes', 'traditional elements', 'bright colors', 'cultural symbols']
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

    // Ghana detection
    if (locationLower.includes('ghana') || locationLower.includes('accra') ||
      locationLower.includes('kumasi') || locationLower.includes('tamale')) {
      return this.regionalProfiles.get('ghana');
    }

    // USA detection
    if (locationLower.includes('usa') || locationLower.includes('united states') ||
      locationLower.includes('america') || locationLower.includes('new york') ||
      locationLower.includes('california') || locationLower.includes('texas')) {
      return this.regionalProfiles.get('usa');
    }

    // Canada detection
    if (locationLower.includes('canada') || locationLower.includes('toronto') ||
      locationLower.includes('vancouver') || locationLower.includes('montreal')) {
      return this.regionalProfiles.get('canada');
    }

    // India detection
    if (locationLower.includes('india') || locationLower.includes('mumbai') ||
      locationLower.includes('delhi') || locationLower.includes('bangalore') ||
      locationLower.includes('chennai') || locationLower.includes('kolkata')) {
      return this.regionalProfiles.get('india');
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
   * Get regional hashtags with AI-powered contextual generation
   */
  public async getRegionalHashtags(location: string, businessType: string, businessName?: string): Promise<string[]> {
    try {
      // Use AI to generate contextual regional hashtags
      const aiHashtags = await this.generateAIRegionalHashtags(location, businessType, businessName);
      if (aiHashtags.length > 0) {
        return aiHashtags;
      }
    } catch (error) {
      console.warn('AI regional hashtag generation failed, using contextual fallback:', error);
    }

    // Fallback to contextual generation
    return this.generateContextualRegionalHashtags(location, businessType, businessName);
  }

  /**
   * Generate regional hashtags using AI for maximum local relevance
   */
  private async generateAIRegionalHashtags(location: string, businessType: string, businessName?: string): Promise<string[]> {
    // Import Vertex AI client instead of Google Generative AI
    const { vertexAIClient } = await import('@/lib/services/vertex-ai-client');

    const prompt = `Generate 8 highly relevant, locally-focused hashtags for a ${businessType} business in ${location}.

Business Details:
- Type: ${businessType}
- Location: ${location}
${businessName ? `- Name: ${businessName}` : ''}

Requirements:
1. Create hashtags that are specific to this location and business type
2. Include local cultural references and location-specific terms
3. Avoid generic hashtags like #local, #business, #quality, #community
4. Make hashtags discoverable by locals and tourists
5. Consider local language, culture, and popular local terms
6. Include location-specific food/business culture references

Return ONLY a JSON array of hashtags (including the # symbol):
["#hashtag1", "#hashtag2", "#hashtag3", ...]`;

    try {
      // Use Vertex AI with gemini-2.5-flash model
      const result = await vertexAIClient.generateText(prompt, 'gemini-2.5-flash', {
        temperature: 0.7,
        maxOutputTokens: 1000
      });

      let response = result.text;

      // Remove markdown code blocks if present
      response = response.replace(/```json\s*|\s*```/g, '').trim();

      // Try to parse as complete JSON first
      try {
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 8);
        }
      } catch {
        // Fallback: extract JSON array from response
        const hashtagsMatch = response.match(/\[.*?\]/);
        if (hashtagsMatch) {
          const hashtags = JSON.parse(hashtagsMatch[0]);
          if (Array.isArray(hashtags) && hashtags.length > 0) {
            return hashtags.slice(0, 8);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse AI regional hashtag response:', error);
    }

    return [];
  }

  /**
   * Generate contextual regional hashtags without hardcoded placeholders
   */
  private generateContextualRegionalHashtags(location: string, businessType: string, businessName?: string): string[] {
    const hashtags: string[] = [];

    // Add business-specific hashtags
    if (businessName) {
      hashtags.push(`#${businessName.replace(/\s+/g, '')}`);
    }
    hashtags.push(`#${businessType.replace(/\s+/g, '')}Business`);

    // Add location-based hashtags (more specific than generic)
    const locationParts = location.split(',').map(part => part.trim());
    locationParts.forEach(part => {
      if (part.length > 2) {
        hashtags.push(`#${part.replace(/\s+/g, '')}`);
        // Add business type + location combination
        hashtags.push(`#${part.replace(/\s+/g, '')}${businessType.replace(/\s+/g, '')}`);
      }
    });

    // Strategic location hashtags - only 40% of the time
    const shouldIncludeLocationHashtags = Math.random() < 0.40; // 40% chance

    if (shouldIncludeLocationHashtags) {
      // Add contextual hashtags based on location (more specific than hardcoded)
      if (location.toLowerCase().includes('nairobi')) {
        hashtags.push('#NairobiEats', '#KenyanCuisine', '#254Business');
      } else if (location.toLowerCase().includes('lagos')) {
        hashtags.push('#LagosEats', '#NaijaFlavors', '#LagosBusiness');
      } else if (location.toLowerCase().includes('johannesburg')) {
        hashtags.push('#JoziEats', '#SouthAfricanTaste', '#JHBBusiness');
      } else {
        // For other locations, create dynamic hashtags
        const cityName = locationParts[0]?.replace(/\s+/g, '') || 'Local';
        hashtags.push(`#${cityName}Eats`, `#${cityName}Business`);
      }
    } else {
      // Focus on business-value hashtags instead of location
      hashtags.push('#QualityFood', '#FreshDaily', '#LocalBusiness', '#TrustedService');
    }

    return [...new Set(hashtags)].slice(0, 8); // Remove duplicates and limit to 8
  }
}

// Export singleton instance
export const regionalEngine = new RegionalCommunicationEngine();
