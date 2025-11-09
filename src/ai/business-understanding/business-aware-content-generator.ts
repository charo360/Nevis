/**
 * Business-Aware Content Generator
 * 
 * Uses deep business understanding to generate content that:
 * - Speaks to the REAL target audience
 * - Highlights the ACTUAL differentiators
 * - Reflects the TRUE business model
 * - Aligns with the AUTHENTIC mission
 * 
 * NO generic templates - every piece of content is informed by deep business insight.
 */

import { DeepBusinessInsight, deepBusinessAnalyzer } from './deep-business-analyzer';

export interface BusinessAwareContentRequest {
  businessInsight: DeepBusinessInsight;
  contentType: 'social_post' | 'ad_campaign' | 'product_launch' | 'brand_story';
  platform: string;
  objective: string;
  specificFocus?: string; // e.g., "highlight innovation", "target parents", "emphasize social impact"
}

export interface BusinessAwareContentGuidelines {
  // Audience Targeting
  targetAudience: {
    who: string;
    painPoint: string;
    motivation: string;
    language: string; // How to speak to them
  };

  // Messaging
  messaging: {
    coreMessage: string;
    keyPoints: string[];
    emotionalTrigger: string;
    proofPoints: string[];
    avoidances: string[]; // What NOT to say
  };

  // Visual Direction
  visual: {
    sceneType: string;
    characters: string[];
    setting: string;
    mood: string;
    mustShow: string[]; // Critical visual elements
    mustAvoid: string[]; // Visual elements to avoid
  };

  // Content Structure
  structure: {
    headline: {
      approach: string;
      mustInclude: string[];
    };
    caption: {
      approach: string;
      structure: string[];
      tone: string;
    };
    cta: {
      type: string;
      specific: string;
    };
  };

  // Brand Alignment
  brandAlignment: {
    personality: string[];
    tone: string;
    values: string[];
    storyAngle: string;
  };
}

export class BusinessAwareContentGenerator {
  /**
   * Generate content guidelines based on deep business understanding
   */
  async generateContentGuidelines(
    request: BusinessAwareContentRequest
  ): Promise<BusinessAwareContentGuidelines> {
    console.log('🎯 [Business-Aware Generator] Creating content guidelines from business insight');

    const { businessInsight, contentType, platform, objective, specificFocus } = request;

    // Build comprehensive guidelines
    const guidelines: BusinessAwareContentGuidelines = {
      targetAudience: this.defineTargetAudience(businessInsight, specificFocus),
      messaging: this.defineMessaging(businessInsight, objective, specificFocus),
      visual: this.defineVisualDirection(businessInsight, contentType),
      structure: this.defineContentStructure(businessInsight, platform, contentType),
      brandAlignment: this.defineBrandAlignment(businessInsight)
    };

    console.log('✅ [Business-Aware Generator] Guidelines created');
    return guidelines;
  }

  /**
   * Define target audience based on business insight
   */
  private defineTargetAudience(
    insight: DeepBusinessInsight,
    specificFocus?: string
  ): BusinessAwareContentGuidelines['targetAudience'] {
    const primary = insight.targetAudience.primary;

    return {
      who: primary.segment,
      painPoint: primary.painPoints[0] || insight.mission.problemSolved,
      motivation: primary.motivations[0] || insight.valueProposition.emotionalBenefits[0],
      language: this.determineLanguageStyle(primary.psychographics, insight.brandEssence.tone)
    };
  }

  /**
   * Define messaging based on business insight
   */
  private defineMessaging(
    insight: DeepBusinessInsight,
    objective: string,
    specificFocus?: string
  ): BusinessAwareContentGuidelines['messaging'] {
    // Determine what to emphasize based on objective and focus
    let coreMessage = insight.valueProposition.coreValue;
    let keyPoints: string[] = [];

    // If focusing on innovation
    if (specificFocus?.includes('innovation')) {
      coreMessage = insight.innovation.uniqueApproach;
      keyPoints = [
        insight.innovation.keyDifferentiator,
        insight.innovation.competitiveAdvantage,
        ...insight.valueProposition.functionalBenefits.slice(0, 2)
      ];
    }
    // If focusing on social impact
    else if (specificFocus?.includes('impact') || insight.mission.socialImpact) {
      coreMessage = insight.mission.impactGoal;
      keyPoints = [
        insight.mission.problemSolved,
        ...insight.valueProposition.socialBenefits,
        insight.innovation.uniqueApproach
      ];
    }
    // Default: value proposition
    else {
      keyPoints = [
        ...insight.valueProposition.uniqueSellingPoints.slice(0, 3),
        ...insight.valueProposition.functionalBenefits.slice(0, 2)
      ];
    }

    return {
      coreMessage,
      keyPoints: keyPoints.filter(Boolean),
      emotionalTrigger: insight.valueProposition.emotionalBenefits[0] || insight.brandEssence.emotionalConnection,
      proofPoints: insight.marketingImplications.proofPoints,
      avoidances: insight.marketingImplications.avoidances
    };
  }

  /**
   * Define visual direction based on business insight
   */
  private defineVisualDirection(
    insight: DeepBusinessInsight,
    contentType: string
  ): BusinessAwareContentGuidelines['visual'] {
    // Determine who should be shown
    const showEndUser = insight.targetAudience.endUser !== insight.targetAudience.decisionMaker;
    const characters = showEndUser 
      ? [insight.targetAudience.endUser, insight.targetAudience.decisionMaker]
      : [insight.targetAudience.primary.segment];

    // Determine setting based on delivery model and use case
    const setting = this.determineVisualSetting(insight);

    // Determine mood based on brand essence and mission
    const mood = this.determineVisualMood(insight);

    // Determine what MUST be shown (product, innovation, impact, etc.)
    const mustShow = this.determineMustShowElements(insight);

    // Determine what to AVOID showing
    const mustAvoid = this.determineMustAvoidElements(insight);

    return {
      sceneType: insight.marketingImplications.visualDirection,
      characters,
      setting,
      mood,
      mustShow,
      mustAvoid
    };
  }

  /**
   * Define content structure based on business insight
   */
  private defineContentStructure(
    insight: DeepBusinessInsight,
    platform: string,
    contentType: string
  ): BusinessAwareContentGuidelines['structure'] {
    return {
      headline: {
        approach: this.determineHeadlineApproach(insight),
        mustInclude: [
          insight.innovation.keyDifferentiator,
          insight.valueProposition.coreValue
        ].filter(Boolean)
      },
      caption: {
        approach: this.determineCaptionApproach(insight),
        structure: this.determineCaptionStructure(insight),
        tone: insight.brandEssence.tone
      },
      cta: {
        type: this.determineCTAType(insight.businessModel.type),
        specific: insight.marketingImplications.callToActions[0] || 'Learn more'
      }
    };
  }

  /**
   * Define brand alignment
   */
  private defineBrandAlignment(
    insight: DeepBusinessInsight
  ): BusinessAwareContentGuidelines['brandAlignment'] {
    return {
      personality: insight.brandEssence.personality,
      tone: insight.brandEssence.tone,
      values: insight.brandEssence.values,
      storyAngle: insight.brandEssence.brandStory
    };
  }

  // Helper methods
  private determineLanguageStyle(psychographics: string, tone: string): string {
    // Combine psychographics and tone to determine how to speak
    return `${tone} language that resonates with ${psychographics}`;
  }

  private determineVisualSetting(insight: DeepBusinessInsight): string {
    // Based on delivery model and target audience context
    if (insight.mission.socialImpact) {
      return 'Community or impact setting showing real-world benefit';
    }
    if (insight.businessModel.type === 'B2B') {
      return 'Professional business environment';
    }
    return insight.delivery.keyTouchpoints[0] || 'Relevant use context';
  }

  private determineVisualMood(insight: DeepBusinessInsight): string {
    if (insight.mission.socialImpact) {
      return 'Hopeful, empowering, authentic';
    }
    if (insight.innovation.innovationLevel === 'revolutionary') {
      return 'Exciting, forward-thinking, dynamic';
    }
    return insight.brandEssence.emotionalConnection;
  }

  private determineMustShowElements(insight: DeepBusinessInsight): string[] {
    const elements: string[] = [];

    // Show the innovation if it's visual
    if (insight.innovation.technologyOrMethod) {
      elements.push(insight.innovation.technologyOrMethod);
    }

    // Show the impact if social enterprise
    if (insight.mission.socialImpact) {
      elements.push('Real people benefiting from the solution');
    }

    // Show the product/service in use
    elements.push('Product/service being used in authentic context');

    // Show the end user if different from buyer
    if (insight.targetAudience.endUser !== insight.targetAudience.decisionMaker) {
      elements.push(`${insight.targetAudience.endUser} using the product`);
    }

    return elements;
  }

  private determineMustAvoidElements(insight: DeepBusinessInsight): string[] {
    const avoid: string[] = [...insight.marketingImplications.avoidances];

    // Avoid B2C imagery for B2B businesses
    if (insight.businessModel.type === 'B2B') {
      avoid.push('Individual consumer shopping scenarios');
      avoid.push('Personal lifestyle imagery');
    }

    // Avoid corporate imagery for social impact businesses
    if (insight.mission.socialImpact) {
      avoid.push('Corporate/sterile environments');
      avoid.push('Stock photo aesthetics');
    }

    return avoid;
  }

  private determineHeadlineApproach(insight: DeepBusinessInsight): string {
    if (insight.innovation.innovationLevel === 'revolutionary') {
      return 'Lead with the innovation - what makes this different';
    }
    if (insight.mission.socialImpact) {
      return 'Lead with the impact - the change being made';
    }
    if (insight.businessModel.type === 'B2B') {
      return 'Lead with the business value - ROI or efficiency';
    }
    return 'Lead with the customer benefit - what they gain';
  }

  private determineCaptionApproach(insight: DeepBusinessInsight): string {
    if (insight.mission.socialImpact) {
      return 'Tell the story of impact and change';
    }
    if (insight.innovation.innovationLevel === 'disruptive' || insight.innovation.innovationLevel === 'revolutionary') {
      return 'Explain the innovation and why it matters';
    }
    return 'Connect the solution to the customer pain point';
  }

  private determineCaptionStructure(insight: DeepBusinessInsight): string[] {
    const structure: string[] = [];

    // Start with the problem or opportunity
    structure.push(`Open with ${insight.targetAudience.primary.painPoints[0] || 'the customer need'}`);

    // Introduce the solution
    structure.push(`Introduce ${insight.innovation.uniqueApproach || 'the solution'}`);

    // Explain the value
    structure.push(`Explain ${insight.valueProposition.coreValue}`);

    // Add proof if available
    if (insight.marketingImplications.proofPoints.length > 0) {
      structure.push(`Include proof: ${insight.marketingImplications.proofPoints[0]}`);
    }

    // Close with CTA
    structure.push('Close with clear call-to-action');

    return structure;
  }

  private determineCTAType(businessModel: string): string {
    switch (businessModel) {
      case 'B2B':
        return 'Contact/Demo request';
      case 'subscription':
        return 'Free trial/Sign up';
      case 'wholesale':
        return 'Partner inquiry/Bulk order';
      default:
        return 'Purchase/Learn more';
    }
  }

  /**
   * Convert guidelines to a prompt for content generation
   */
  convertGuidelinesToPrompt(guidelines: BusinessAwareContentGuidelines): string {
    let prompt = `# BUSINESS-AWARE CONTENT GENERATION GUIDELINES\n\n`;

    prompt += `## TARGET AUDIENCE\n`;
    prompt += `You are speaking to: ${guidelines.targetAudience.who}\n`;
    prompt += `Their pain point: ${guidelines.targetAudience.painPoint}\n`;
    prompt += `Their motivation: ${guidelines.targetAudience.motivation}\n`;
    prompt += `Language style: ${guidelines.targetAudience.language}\n\n`;

    prompt += `## MESSAGING\n`;
    prompt += `Core message: ${guidelines.messaging.coreMessage}\n`;
    prompt += `Key points to include:\n`;
    guidelines.messaging.keyPoints.forEach(point => {
      prompt += `- ${point}\n`;
    });
    prompt += `Emotional trigger: ${guidelines.messaging.emotionalTrigger}\n`;
    prompt += `\n⚠️ DO NOT SAY:\n`;
    guidelines.messaging.avoidances.forEach(avoid => {
      prompt += `- ${avoid}\n`;
    });
    prompt += `\n`;

    prompt += `## VISUAL DIRECTION\n`;
    prompt += `Scene type: ${guidelines.visual.sceneType}\n`;
    prompt += `Characters: ${guidelines.visual.characters.join(', ')}\n`;
    prompt += `Setting: ${guidelines.visual.setting}\n`;
    prompt += `Mood: ${guidelines.visual.mood}\n`;
    prompt += `\nMUST SHOW:\n`;
    guidelines.visual.mustShow.forEach(show => {
      prompt += `- ${show}\n`;
    });
    prompt += `\nMUST AVOID:\n`;
    guidelines.visual.mustAvoid.forEach(avoid => {
      prompt += `- ${avoid}\n`;
    });
    prompt += `\n`;

    prompt += `## CONTENT STRUCTURE\n`;
    prompt += `Headline approach: ${guidelines.structure.headline.approach}\n`;
    prompt += `Caption approach: ${guidelines.structure.caption.approach}\n`;
    prompt += `Caption structure:\n`;
    guidelines.structure.caption.structure.forEach((step, i) => {
      prompt += `${i + 1}. ${step}\n`;
    });
    prompt += `Tone: ${guidelines.structure.caption.tone}\n`;
    prompt += `CTA: ${guidelines.structure.cta.specific}\n\n`;

    prompt += `## BRAND ALIGNMENT\n`;
    prompt += `Personality: ${guidelines.brandAlignment.personality.join(', ')}\n`;
    prompt += `Values: ${guidelines.brandAlignment.values.join(', ')}\n`;
    prompt += `Story angle: ${guidelines.brandAlignment.storyAngle}\n\n`;

    return prompt;
  }
}

// Export singleton instance
export const businessAwareContentGenerator = new BusinessAwareContentGenerator();
