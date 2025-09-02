/**
 * Dynamic CTA Generator - Creates compelling, conversion-focused call-to-actions
 * Uses AI and business intelligence to generate CTAs that drive action
 */

export interface CTAStrategy {
  primary: string;           // Main CTA for the post
  alternatives: string[];    // Alternative CTAs for A/B testing
  style: string;            // CTA style used (e.g., URGENCY, BENEFIT_FOCUSED)
  reasoning: string;        // Why this CTA was chosen
  platform: string;         // Platform-optimized version
}

export class DynamicCTAGenerator {

  /**
   * Generate dynamic, conversion-focused CTA
   */
  async generateDynamicCTA(
    businessName: string,
    businessType: string,
    location: string,
    platform: string,
    contentGoal: string = 'engagement',
    services?: string,
    targetAudience?: string
  ): Promise<CTAStrategy> {


    // Select optimal CTA style based on business context
    const ctaStyle = this.selectOptimalCTAStyle(businessType, platform, contentGoal);

    // Generate primary CTA
    const primary = this.generateCTAByStyle(ctaStyle, businessName, businessType, location, platform, services);
    
    // Generate alternatives for A/B testing
    const alternatives = this.generateAlternativeCTAs(businessName, businessType, location, platform, services);
    
    // Get reasoning for CTA choice
    const reasoning = this.getCTAReasoning(ctaStyle, businessType, platform);


    return {
      primary,
      alternatives,
      style: ctaStyle,
      reasoning,
      platform
    };
  }

  /**
   * Select optimal CTA style based on business context
   */
  private selectOptimalCTAStyle(businessType: string, platform: string, contentGoal: string): string {
    const businessCTAMap: Record<string, string[]> = {
      restaurant: ['URGENCY', 'INVITATION', 'SENSORY', 'LOCAL_REFERENCE'],
      bakery: ['SENSORY', 'URGENCY', 'INVITATION', 'COMMUNITY'],
      fitness: ['CHALLENGE', 'BENEFIT_FOCUSED', 'MOTIVATION', 'PERSONAL'],
      beauty: ['TRANSFORMATION', 'CONFIDENCE', 'EXCLUSIVE', 'PERSONAL'],
      retail: ['URGENCY', 'EXCLUSIVE', 'BENEFIT_FOCUSED', 'DISCOVERY'],
      tech: ['INNOVATION', 'BENEFIT_FOCUSED', 'CURIOSITY', 'PROFESSIONAL'],
      service: ['DIRECT_ACTION', 'BENEFIT_FOCUSED', 'TRUST', 'LOCAL_REFERENCE']
    };

    const platformCTAMap: Record<string, string[]> = {
      instagram: ['VISUAL', 'DISCOVERY', 'COMMUNITY', 'INVITATION'],
      facebook: ['COMMUNITY', 'LOCAL_REFERENCE', 'INVITATION', 'SHARE'],
      twitter: ['URGENCY', 'CURIOSITY', 'DIRECT_ACTION', 'TRENDING'],
      linkedin: ['PROFESSIONAL', 'BENEFIT_FOCUSED', 'NETWORKING', 'EXPERTISE'],
      tiktok: ['CHALLENGE', 'TRENDING', 'VIRAL', 'FUN']
    };

    const goalCTAMap: Record<string, string[]> = {
      engagement: ['CURIOSITY', 'COMMUNITY', 'INVITATION', 'QUESTION'],
      conversion: ['URGENCY', 'BENEFIT_FOCUSED', 'EXCLUSIVE', 'DIRECT_ACTION'],
      awareness: ['DISCOVERY', 'CURIOSITY', 'SHARE', 'VIRAL'],
      retention: ['COMMUNITY', 'LOYALTY', 'PERSONAL', 'APPRECIATION']
    };

    // Get possible styles from each category
    const businessStyles = businessCTAMap[businessType.toLowerCase()] || ['DIRECT_ACTION', 'BENEFIT_FOCUSED'];
    const platformStyles = platformCTAMap[platform.toLowerCase()] || ['DIRECT_ACTION'];
    const goalStyles = goalCTAMap[contentGoal.toLowerCase()] || ['ENGAGEMENT'];

    // Find intersection or pick best match
    const allStyles = [...businessStyles, ...platformStyles, ...goalStyles];
    const styleCounts = allStyles.reduce((acc, style) => {
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Return style with highest count (most relevant)
    const bestStyle = Object.entries(styleCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    return bestStyle;
  }

  /**
   * Generate CTA based on selected style
   */
  private generateCTAByStyle(
    style: string, 
    businessName: string, 
    businessType: string, 
    location: string, 
    platform: string,
    services?: string
  ): string {
    
    const timestamp = Date.now();
    const variation = timestamp % 4; // 4 variations per style

    const ctaTemplates: Record<string, string[]> = {
      URGENCY: [
        `Book now - limited spots!`,
        `Don't wait - call today!`,
        `Limited time offer - act fast!`,
        `Only a few left - grab yours!`
      ],
      INVITATION: [
        `Come experience the difference!`,
        `Visit us this weekend!`,
        `Join our community today!`,
        `See what everyone's talking about!`
      ],
      CHALLENGE: [
        `Try to find better - we dare you!`,
        `Challenge yourself today!`,
        `Beat this quality anywhere!`,
        `Prove us wrong - we're confident!`
      ],
      BENEFIT_FOCUSED: [
        `Get more for your money!`,
        `Save time and hassle!`,
        `Double your results!`,
        `Feel the difference immediately!`
      ],
      COMMUNITY: [
        `Join the ${location} family!`,
        `Be part of something special!`,
        `Connect with your neighbors!`,
        `Share the love with friends!`
      ],
      CURIOSITY: [
        `Discover what makes us different!`,
        `Find out why locals choose us!`,
        `See what the buzz is about!`,
        `Uncover ${location}'s best kept secret!`
      ],
      LOCAL_REFERENCE: [
        `${location}'s favorite spot awaits!`,
        `Proudly serving ${location} families!`,
        `Your neighborhood ${businessType}!`,
        `Where ${location} locals go!`
      ],
      SENSORY: [
        `Taste the difference today!`,
        `Experience pure quality!`,
        `Feel the freshness!`,
        `Savor every moment!`
      ],
      EXCLUSIVE: [
        `VIP treatment awaits you!`,
        `Exclusive access - members only!`,
        `Premium experience guaranteed!`,
        `Elite service, just for you!`
      ],
      DIRECT_ACTION: [
        `Call us now!`,
        `Book your appointment!`,
        `Order online today!`,
        `Get started immediately!`
      ]
    };

    const templates = ctaTemplates[style] || ctaTemplates.DIRECT_ACTION;
    let cta = templates[variation];

    // Personalize with business name or location when appropriate
    if (Math.random() > 0.5 && !cta.includes(businessName) && !cta.includes(location)) {
      const personalizations = [
        `at ${businessName}`,
        `with ${businessName}`,
        `- ${businessName}`,
        `@ ${businessName}`
      ];
      const personalization = personalizations[variation % personalizations.length];
      cta = `${cta.replace('!', '')} ${personalization}!`;
    }

    return cta;
  }

  /**
   * Generate alternative CTAs for A/B testing
   */
  private generateAlternativeCTAs(
    businessName: string,
    businessType: string,
    location: string,
    platform: string,
    services?: string
  ): string[] {
    
    const alternativeStyles = ['URGENCY', 'INVITATION', 'BENEFIT_FOCUSED', 'COMMUNITY', 'CURIOSITY'];
    const alternatives: string[] = [];

    alternativeStyles.forEach(style => {
      const cta = this.generateCTAByStyle(style, businessName, businessType, location, platform, services);
      alternatives.push(cta);
    });

    // Remove duplicates and return top 3
    return [...new Set(alternatives)].slice(0, 3);
  }

  /**
   * Get reasoning for CTA choice
   */
  private getCTAReasoning(style: string, businessType: string, platform: string): string {
    const reasoningMap: Record<string, string> = {
      URGENCY: `Creates immediate action through scarcity and time pressure, effective for ${businessType} conversions`,
      INVITATION: `Builds welcoming community feeling, perfect for local ${businessType} businesses`,
      CHALLENGE: `Engages competitive spirit and confidence, great for ${businessType} differentiation`,
      BENEFIT_FOCUSED: `Highlights clear value proposition, drives ${businessType} decision-making`,
      COMMUNITY: `Leverages local connection and belonging, ideal for neighborhood ${businessType}`,
      CURIOSITY: `Sparks interest and discovery, effective for ${platform} engagement`,
      LOCAL_REFERENCE: `Emphasizes local pride and familiarity, builds ${businessType} trust`,
      SENSORY: `Appeals to emotional and physical experience, perfect for ${businessType}`,
      EXCLUSIVE: `Creates premium positioning and special treatment feeling`,
      DIRECT_ACTION: `Clear, straightforward instruction that drives immediate response`
    };

    return reasoningMap[style] || `Optimized for ${businessType} on ${platform} to drive engagement and conversions`;
  }

  /**
   * Generate platform-optimized CTA
   */
  generatePlatformOptimizedCTA(baseCTA: string, platform: string): string {
    const platformOptimizations: Record<string, (cta: string) => string> = {
      instagram: (cta) => `${cta} 📸✨`,
      facebook: (cta) => `${cta} Share with friends! 👥`,
      twitter: (cta) => `${cta} #${new Date().getFullYear()}`,
      linkedin: (cta) => `${cta} Connect with us professionally.`,
      tiktok: (cta) => `${cta} 🔥💯`
    };

    const optimizer = platformOptimizations[platform.toLowerCase()];
    return optimizer ? optimizer(baseCTA) : baseCTA;
  }

  /**
   * Generate time-sensitive CTA
   */
  generateTimeSensitiveCTA(businessType: string, location: string): string {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;

    if (hour < 11) {
      return `Start your day right - visit us now!`;
    } else if (hour < 14) {
      return `Perfect lunch break spot - come by!`;
    } else if (hour < 17) {
      return `Afternoon pick-me-up awaits!`;
    } else if (hour < 20) {
      return `End your day on a high note!`;
    } else {
      return `Evening treat - you deserve it!`;
    }
  }

  /**
   * Generate seasonal CTA
   */
  generateSeasonalCTA(businessType: string, location: string): string {
    const now = new Date();
    const month = now.getMonth();

    const seasonalCTAs: Record<number, string[]> = {
      0: [`New Year, new experiences - try us!`, `Start 2024 right with us!`], // January
      1: [`Warm up with us this February!`, `Love is in the air - visit us!`], // February
      2: [`Spring into action - book now!`, `Fresh start, fresh experience!`], // March
      3: [`April showers bring May flowers - and great service!`, `Spring special awaits!`], // April
      4: [`May we serve you today?`, `Mother's Day special - treat her!`], // May
      5: [`Summer starts here - join us!`, `Father's Day celebration awaits!`], // June
      6: [`Beat the heat with us!`, `Summer vibes, great service!`], // July
      7: [`August special - don't miss out!`, `Late summer treat awaits!`], // August
      8: [`Back to school, back to us!`, `Fall into great service!`], // September
      9: [`October surprise awaits you!`, `Halloween special - spooktacular!`], // October
      10: [`Thanksgiving gratitude - visit us!`, `Give thanks for great service!`], // November
      11: [`Holiday magic awaits you!`, `Christmas special - ho ho ho!`] // December
    };

    const monthCTAs = seasonalCTAs[month] || [`Visit us today!`, `Experience the difference!`];
    return monthCTAs[Math.floor(Math.random() * monthCTAs.length)];
  }
}

// Export singleton instance
export const dynamicCTAGenerator = new DynamicCTAGenerator();
