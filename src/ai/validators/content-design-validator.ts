/**
 * Content-Design Alignment Validator
 * 
 * Validates that content and design specifications work together
 * to create unified, coherent social media posts.
 */

import type { AssistantContentResponse, DesignSpecifications } from '../assistants/assistant-manager';

export interface ContentDesignValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  validation_details: {
    narrative_flow: boolean;
    cta_alignment: boolean;
    hero_match: boolean;
    scene_story: boolean;
    mood_consistency: boolean;
    color_usage: boolean;
    style_alignment: boolean;
  };
}

export interface ValidationContext {
  brandProfile: any;
  businessType: string;
  platform: string;
  concept: any;
}

/**
 * Content-Design Validator Class
 * Ensures perfect alignment between content and visual specifications
 */
export class ContentDesignValidator {
  
  /**
   * Main validation method - checks all alignment aspects
   */
  validateAlignment(
    response: AssistantContentResponse, 
    context: ValidationContext
  ): ContentDesignValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const details = {
      narrative_flow: false,
      cta_alignment: false,
      hero_match: false,
      scene_story: false,
      mood_consistency: false,
      color_usage: false,
      style_alignment: false,
    };

    // 1. Check narrative flow (headline -> subheadline -> caption -> CTA)
    details.narrative_flow = this.checkNarrativeFlow(response.content, issues, recommendations);

    // 2. Check CTA alignment with caption
    details.cta_alignment = this.checkCTAAlignment(response.content, issues, recommendations);

    // 3. Check hero element matches headline
    details.hero_match = this.checkHeroAlignment(
      response.content.headline, 
      response.design_specifications.hero_element, 
      issues, 
      recommendations
    );

    // 4. Check scene story alignment
    details.scene_story = this.checkSceneStory(
      response.content.caption, 
      response.design_specifications.scene_description, 
      issues, 
      recommendations
    );

    // 5. Check mood consistency
    details.mood_consistency = this.checkMoodAlignment(
      response.content, 
      response.design_specifications.mood_direction, 
      context.concept, 
      issues, 
      recommendations
    );

    // 6. Check brand color usage
    details.color_usage = this.validateBrandColors(
      response.design_specifications.color_scheme, 
      context.brandProfile, 
      issues, 
      recommendations
    );

    // 7. Check style alignment
    details.style_alignment = this.checkStyleConsistency(
      response.design_specifications, 
      context.brandProfile, 
      issues, 
      recommendations
    );

    // Calculate overall score
    const validChecks = Object.values(details).filter(Boolean).length;
    const totalChecks = Object.keys(details).length;
    const score = Math.round((validChecks / totalChecks) * 100);

    const isValid = score >= 60; // Require 60% alignment score (lowered for food businesses)

    console.log(`🎯 [Content-Design Validator] Score: ${score}/100, Valid: ${isValid}`);
    console.log(`📊 [Validation Details]:`, details);
    
    if (issues.length > 0) {
      console.log(`⚠️ [Validation Issues]:`, issues);
    }

    return {
      isValid,
      score,
      issues,
      recommendations,
      validation_details: details,
    };
  }

  /**
   * Check narrative flow from headline to CTA
   */
  private checkNarrativeFlow(
    content: AssistantContentResponse['content'], 
    issues: string[], 
    recommendations: string[]
  ): boolean {
    const { headline, subheadline, caption, cta } = content;

    // Extract key themes/words from each element
    const headlineWords = this.extractKeyWords(headline);
    const subheadlineWords = this.extractKeyWords(subheadline || '');
    const captionWords = this.extractKeyWords(caption);
    const ctaWords = this.extractKeyWords(cta);

    // Check for thematic consistency
    const commonThemes = this.findCommonThemes([headlineWords, subheadlineWords, captionWords]);
    
    if (commonThemes.length === 0) {
      issues.push('No common themes found between headline, subheadline, and caption');
      recommendations.push('Ensure all content elements focus on the same core benefit or story');
      return false;
    }

    // Check logical progression
    if (subheadline && !this.isLogicalProgression(headline, subheadline)) {
      issues.push('Subheadline does not logically expand on headline');
      recommendations.push('Make subheadline provide more detail about the headline promise');
    }

    if (!this.isLogicalProgression(headline, caption)) {
      issues.push('Caption does not tell the story introduced by headline');
      recommendations.push('Ensure caption demonstrates or explains the headline benefit');
      return false;
    }

    return true;
  }

  /**
   * Check CTA alignment with caption content
   */
  private checkCTAAlignment(
    content: AssistantContentResponse['content'], 
    issues: string[], 
    recommendations: string[]
  ): boolean {
    const { caption, cta } = content;

    // Check if CTA is a logical next step from caption
    const captionSentiment = this.analyzeSentiment(caption);
    const ctaAction = this.extractAction(cta);

    // CTA should match the urgency/tone of the caption
    if (captionSentiment === 'urgent' && !this.isUrgentCTA(cta)) {
      issues.push('CTA does not match urgent tone of caption');
      recommendations.push('Use action words like "Start Now", "Get Started", "Act Today"');
      return false;
    }

    if (captionSentiment === 'informative' && this.isUrgentCTA(cta)) {
      issues.push('CTA too urgent for informative caption tone');
      recommendations.push('Use softer CTAs like "Learn More", "Discover", "Explore"');
      return false;
    }

    return true;
  }

  /**
   * Check hero element matches headline promise
   */
  private checkHeroAlignment(
    headline: string, 
    heroElement: string, 
    issues: string[], 
    recommendations: string[]
  ): boolean {
    const headlineKeywords = this.extractKeyWords(headline);
    const heroKeywords = this.extractKeyWords(heroElement);

    const overlap = headlineKeywords.filter(word => 
      heroKeywords.some(heroWord => 
        heroWord.includes(word) || word.includes(heroWord)
      )
    );

    if (overlap.length === 0) {
      issues.push('Hero element does not visually represent headline promise');
      recommendations.push('Ensure main visual element demonstrates what headline promises');
      return false;
    }

    return true;
  }

  /**
   * Check scene description supports caption story
   */
  private checkSceneStory(
    caption: string, 
    sceneDescription: string, 
    issues: string[], 
    recommendations: string[]
  ): boolean {
    // Check if scene shows what caption describes
    const captionActions = this.extractActions(caption);
    const sceneActions = this.extractActions(sceneDescription);

    const actionOverlap = captionActions.filter(action =>
      sceneActions.some(sceneAction => 
        sceneAction.includes(action) || action.includes(sceneAction)
      )
    );

    if (actionOverlap.length === 0) {
      issues.push('Visual scene does not demonstrate the story told in caption');
      recommendations.push('Ensure visual scene shows the actions or outcomes described in caption');
      return false;
    }

    return true;
  }

  /**
   * Check mood consistency across content and design
   */
  private checkMoodAlignment(
    content: AssistantContentResponse['content'], 
    moodDirection: string, 
    concept: any, 
    issues: string[], 
    recommendations: string[]
  ): boolean {
    const contentMood = this.analyzeMood(content.caption);
    const designMood = this.extractMoodFromDirection(moodDirection);
    const conceptMood = concept.emotionalTone?.toLowerCase() || '';

    // All moods should be compatible
    if (!this.areMoodsCompatible(contentMood, designMood, conceptMood)) {
      issues.push(`Mood mismatch: content (${contentMood}), design (${designMood}), concept (${conceptMood})`);
      recommendations.push('Ensure content tone matches visual mood and concept emotional tone');
      return false;
    }

    return true;
  }

  /**
   * Validate brand color usage in design specifications
   */
  private validateBrandColors(
    colorScheme: string, 
    brandProfile: any, 
    issues: string[], 
    recommendations: string[]
  ): boolean {
    if (!brandProfile.brandColors) {
      return true; // No brand colors to validate
    }

    const { primary, secondary } = brandProfile.brandColors;
    
    if (primary && !colorScheme.includes(primary)) {
      issues.push(`Primary brand color ${primary} not mentioned in color scheme`);
      recommendations.push('Include primary brand color prominently in design');
      return false;
    }

    if (secondary && !colorScheme.includes(secondary)) {
      issues.push(`Secondary brand color ${secondary} not mentioned in color scheme`);
      recommendations.push('Include secondary brand color as accent in design');
    }

    return true;
  }

  /**
   * Check style consistency with brand profile
   */
  private checkStyleConsistency(
    designSpecs: DesignSpecifications, 
    brandProfile: any, 
    issues: string[], 
    recommendations: string[]
  ): boolean {
    const brandStyle = brandProfile.designStyle?.toLowerCase() || '';
    const moodDirection = designSpecs.mood_direction.toLowerCase();

    if (brandStyle && !this.isStyleCompatible(brandStyle, moodDirection)) {
      issues.push(`Design mood "${moodDirection}" incompatible with brand style "${brandStyle}"`);
      recommendations.push(`Adjust visual mood to match ${brandStyle} brand style`);
      return false;
    }

    return true;
  }

  // Helper methods
  private extractKeyWords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'with', 'you', 'your', 'our'].includes(word));
  }

  private findCommonThemes(wordArrays: string[][]): string[] {
    if (wordArrays.length === 0) return [];
    
    return wordArrays[0].filter(word =>
      wordArrays.every(array => array.includes(word))
    );
  }

  private isLogicalProgression(first: string, second: string): boolean {
    const firstWords = this.extractKeyWords(first);
    const secondWords = this.extractKeyWords(second);
    
    // Check if second expands on first (has some common words plus new ones)
    const commonWords = firstWords.filter(word => secondWords.includes(word));
    return commonWords.length > 0;
  }

  private analyzeSentiment(text: string): 'urgent' | 'informative' | 'aspirational' | 'neutral' {
    const urgentWords = ['now', 'today', 'immediately', 'fast', 'quick', 'instant', 'urgent'];
    const informativeWords = ['learn', 'discover', 'understand', 'know', 'find'];
    const aspirationalWords = ['achieve', 'success', 'grow', 'transform', 'unlock'];

    const lowerText = text.toLowerCase();
    
    if (urgentWords.some(word => lowerText.includes(word))) return 'urgent';
    if (informativeWords.some(word => lowerText.includes(word))) return 'informative';
    if (aspirationalWords.some(word => lowerText.includes(word))) return 'aspirational';
    
    return 'neutral';
  }

  private extractAction(text: string): string {
    const actionWords = ['start', 'get', 'try', 'learn', 'discover', 'join', 'sign', 'download'];
    const lowerText = text.toLowerCase();
    
    return actionWords.find(action => lowerText.includes(action)) || '';
  }

  private isUrgentCTA(cta: string): boolean {
    const urgentCTAs = ['start now', 'get started', 'act today', 'join now', 'try now'];
    return urgentCTAs.some(urgent => cta.toLowerCase().includes(urgent));
  }

  private extractActions(text: string): string[] {
    const actionWords = ['send', 'receive', 'pay', 'buy', 'use', 'click', 'tap', 'open', 'close', 'save'];
    const lowerText = text.toLowerCase();
    
    return actionWords.filter(action => lowerText.includes(action));
  }

  private analyzeMood(text: string): string {
    const urgentMood = ['fast', 'quick', 'now', 'immediate'];
    const professionalMood = ['professional', 'business', 'reliable', 'trust'];
    const friendlyMood = ['easy', 'simple', 'help', 'support'];

    const lowerText = text.toLowerCase();

    if (urgentMood.some(word => lowerText.includes(word))) return 'urgent';
    if (professionalMood.some(word => lowerText.includes(word))) return 'professional';
    if (friendlyMood.some(word => lowerText.includes(word))) return 'friendly';

    return 'neutral';
  }

  private extractMoodFromDirection(moodDirection: string): string {
    const lowerMood = moodDirection.toLowerCase();
    
    if (lowerMood.includes('urgent') || lowerMood.includes('fast')) return 'urgent';
    if (lowerMood.includes('professional') || lowerMood.includes('business')) return 'professional';
    if (lowerMood.includes('friendly') || lowerMood.includes('approachable')) return 'friendly';
    
    return 'neutral';
  }

  private areMoodsCompatible(contentMood: string, designMood: string, conceptMood: string): boolean {
    // Define compatible mood combinations
    const compatibleMoods = {
      urgent: ['urgent', 'professional', 'neutral'],
      professional: ['professional', 'urgent', 'neutral'],
      friendly: ['friendly', 'professional', 'neutral'],
      neutral: ['urgent', 'professional', 'friendly', 'neutral']
    };

    const contentCompatible = compatibleMoods[contentMood as keyof typeof compatibleMoods] || [];
    
    return contentCompatible.includes(designMood) && 
           (conceptMood === '' || contentCompatible.includes(conceptMood));
  }

  private isStyleCompatible(brandStyle: string, moodDirection: string): boolean {
    const styleCompatibility = {
      modern: ['professional', 'clean', 'minimalist', 'tech'],
      professional: ['business', 'corporate', 'reliable', 'trustworthy'],
      friendly: ['approachable', 'warm', 'casual', 'welcoming'],
      luxury: ['premium', 'elegant', 'sophisticated', 'exclusive']
    };

    const compatibleMoods = styleCompatibility[brandStyle as keyof typeof styleCompatibility] || [];
    
    return compatibleMoods.some(mood => moodDirection.includes(mood));
  }
}

// Export singleton instance
export const contentDesignValidator = new ContentDesignValidator();
