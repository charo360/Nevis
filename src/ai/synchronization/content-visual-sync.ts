/**
 * Content-Visual Synchronization System
 * 
 * Ensures perfect alignment between content elements and visual design
 * throughout the entire generation pipeline.
 */

import type { AssistantContentResponse, DesignSpecifications } from '../assistants/assistant-manager';

export interface SynchronizationRequest {
  content: AssistantContentResponse['content'];
  designSpecs: DesignSpecifications;
  brandProfile: any;
  businessType: string;
  platform: string;
  concept: any;
}

export interface SynchronizationResult {
  isSync: boolean;
  syncScore: number; // 0-100
  synchronizedContent: {
    headline: string;
    subheadline: string;
    caption: string;
    cta: string;
    hashtags: string[];
  };
  synchronizedDesign: {
    hero_element: string;
    scene_description: string;
    text_placement: string;
    color_scheme: string;
    mood_direction: string;
  };
  syncReport: {
    alignmentIssues: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export interface VisualContentMapping {
  headlineToHero: number; // 0-100 alignment score
  captionToScene: number;
  ctaToAction: number;
  moodConsistency: number;
  overallSync: number;
}

/**
 * Content-Visual Synchronization Engine
 * Ensures perfect harmony between text and visual elements
 */
export class ContentVisualSynchronizer {

  /**
   * Main synchronization method
   */
  async synchronizeContentAndVisuals(request: SynchronizationRequest): Promise<SynchronizationResult> {
    console.log(`🔄 [Content-Visual Sync] Starting synchronization for ${request.brandProfile.businessName}`);

    // Step 1: Analyze current alignment
    const alignmentAnalysis = this.analyzeCurrentAlignment(request);
    console.log(`📊 [Sync Analysis] Current alignment score: ${alignmentAnalysis.overallSync}/100`);

    // Step 2: Identify synchronization issues
    const syncIssues = this.identifySyncIssues(request, alignmentAnalysis);
    
    // Step 3: Apply synchronization improvements
    const synchronizedResult = await this.applySynchronizationImprovements(request, syncIssues);

    // Step 4: Validate final synchronization
    const finalValidation = this.validateFinalSync(synchronizedResult);

    console.log(`✅ [Content-Visual Sync] Final sync score: ${finalValidation.syncScore}/100`);

    return {
      isSync: finalValidation.syncScore >= 60, // Lowered threshold for food businesses
      syncScore: finalValidation.syncScore,
      synchronizedContent: synchronizedResult.content,
      synchronizedDesign: synchronizedResult.design,
      syncReport: {
        alignmentIssues: syncIssues.issues,
        improvements: syncIssues.improvements,
        recommendations: finalValidation.recommendations
      }
    };
  }

  /**
   * Analyze current content-visual alignment
   */
  private analyzeCurrentAlignment(request: SynchronizationRequest): VisualContentMapping {
    const { content, designSpecs } = request;

    // Analyze headline to hero element alignment
    const headlineToHero = this.calculateHeadlineHeroAlignment(
      content.headline, 
      designSpecs.hero_element
    );

    // Analyze caption to scene alignment
    const captionToScene = this.calculateCaptionSceneAlignment(
      content.caption, 
      designSpecs.scene_description
    );

    // Analyze CTA to action alignment
    const ctaToAction = this.calculateCTAActionAlignment(
      content.cta, 
      designSpecs.scene_description
    );

    // Analyze mood consistency
    const moodConsistency = this.calculateMoodConsistency(
      content.caption, 
      designSpecs.mood_direction
    );

    // Calculate overall synchronization score
    const overallSync = Math.round(
      (headlineToHero * 0.3 + captionToScene * 0.3 + ctaToAction * 0.2 + moodConsistency * 0.2)
    );

    return {
      headlineToHero,
      captionToScene,
      ctaToAction,
      moodConsistency,
      overallSync
    };
  }

  /**
   * Identify specific synchronization issues
   */
  private identifySyncIssues(request: SynchronizationRequest, alignment: VisualContentMapping): {
    issues: string[];
    improvements: string[];
  } {
    const issues: string[] = [];
    const improvements: string[] = [];

    // Check headline-hero alignment
    if (alignment.headlineToHero < 70) {
      issues.push(`Headline "${request.content.headline}" doesn't match hero element "${request.designSpecs.hero_element}"`);
      improvements.push('Align headline promise with main visual element');
    }

    // Check caption-scene alignment
    if (alignment.captionToScene < 70) {
      issues.push(`Caption story doesn't match visual scene description`);
      improvements.push('Ensure visual scene demonstrates the story told in caption');
    }

    // Check CTA-action alignment
    if (alignment.ctaToAction < 70) {
      issues.push(`CTA "${request.content.cta}" doesn't match visual action context`);
      improvements.push('Make CTA the logical next step shown in the visual');
    }

    // Check mood consistency
    if (alignment.moodConsistency < 70) {
      issues.push(`Content mood doesn't match visual mood direction`);
      improvements.push('Align emotional tone between text and visual elements');
    }

    return { issues, improvements };
  }

  /**
   * Apply synchronization improvements
   */
  private async applySynchronizationImprovements(
    request: SynchronizationRequest, 
    syncIssues: { issues: string[]; improvements: string[] }
  ): Promise<{ content: any; design: any }> {
    
    console.log(`🔧 [Sync Improvements] Applying ${syncIssues.improvements.length} improvements`);

    // Create synchronized versions
    const synchronizedContent = await this.synchronizeContent(request, syncIssues);
    const synchronizedDesign = await this.synchronizeDesign(request, syncIssues);

    return {
      content: synchronizedContent,
      design: synchronizedDesign
    };
  }

  /**
   * Synchronize content elements
   */
  private async synchronizeContent(
    request: SynchronizationRequest, 
    syncIssues: { issues: string[]; improvements: string[] }
  ): Promise<SynchronizationResult['synchronizedContent']> {
    
    const { content, designSpecs, brandProfile, businessType } = request;

    // Start with original content
    let syncedContent = {
      headline: content.headline,
      subheadline: content.subheadline || '',
      caption: content.caption,
      cta: content.cta,
      hashtags: content.hashtags
    };

    // Apply headline synchronization
    if (syncIssues.issues.some(issue => issue.includes('Headline'))) {
      syncedContent.headline = this.synchronizeHeadlineWithHero(
        content.headline, 
        designSpecs.hero_element, 
        brandProfile, 
        businessType
      );
      console.log(`🎯 [Sync] Synchronized headline: "${syncedContent.headline}"`);
    }

    // Apply caption synchronization
    if (syncIssues.issues.some(issue => issue.includes('Caption'))) {
      syncedContent.caption = this.synchronizeCaptionWithScene(
        content.caption, 
        designSpecs.scene_description, 
        brandProfile
      );
      console.log(`📝 [Sync] Synchronized caption length: ${syncedContent.caption.length} chars`);
    }

    // Apply CTA synchronization
    if (syncIssues.issues.some(issue => issue.includes('CTA'))) {
      syncedContent.cta = this.synchronizeCTAWithAction(
        content.cta, 
        designSpecs.scene_description, 
        businessType
      );
      console.log(`🎬 [Sync] Synchronized CTA: "${syncedContent.cta}"`);
    }

    return syncedContent;
  }

  /**
   * Synchronize design elements
   */
  private async synchronizeDesign(
    request: SynchronizationRequest, 
    syncIssues: { issues: string[]; improvements: string[] }
  ): Promise<SynchronizationResult['synchronizedDesign']> {
    
    const { content, designSpecs, brandProfile, businessType } = request;

    // Start with original design specs
    let syncedDesign = {
      hero_element: designSpecs.hero_element,
      scene_description: designSpecs.scene_description,
      text_placement: designSpecs.text_placement,
      color_scheme: designSpecs.color_scheme,
      mood_direction: designSpecs.mood_direction
    };

    // Apply hero element synchronization
    if (syncIssues.issues.some(issue => issue.includes('hero element'))) {
      syncedDesign.hero_element = this.synchronizeHeroWithHeadline(
        designSpecs.hero_element, 
        content.headline, 
        businessType
      );
      console.log(`🎨 [Sync] Synchronized hero: "${syncedDesign.hero_element}"`);
    }

    // Apply scene synchronization
    if (syncIssues.issues.some(issue => issue.includes('scene'))) {
      syncedDesign.scene_description = this.synchronizeSceneWithCaption(
        designSpecs.scene_description, 
        content.caption, 
        brandProfile
      );
      console.log(`🎬 [Sync] Synchronized scene description updated`);
    }

    // Apply mood synchronization
    if (syncIssues.issues.some(issue => issue.includes('mood'))) {
      syncedDesign.mood_direction = this.synchronizeMoodWithContent(
        designSpecs.mood_direction, 
        content.caption, 
        businessType
      );
      console.log(`🎭 [Sync] Synchronized mood: "${syncedDesign.mood_direction}"`);
    }

    return syncedDesign;
  }

  /**
   * Validate final synchronization
   */
  private validateFinalSync(result: { content: any; design: any }): {
    syncScore: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    // Re-analyze alignment with synchronized content
    const finalAlignment = this.analyzeAlignment(result.content, result.design);
    
    if (finalAlignment < 90) {
      recommendations.push('Consider additional refinement for perfect alignment');
    }
    
    if (finalAlignment >= 95) {
      recommendations.push('Excellent synchronization achieved - content and visuals are perfectly aligned');
    }

    return {
      syncScore: finalAlignment,
      recommendations
    };
  }

  // Helper methods for alignment calculations
  private calculateHeadlineHeroAlignment(headline: string, heroElement: string): number {
    const headlineWords = this.extractKeywords(headline);
    const heroWords = this.extractKeywords(heroElement);
    
    const overlap = headlineWords.filter(word => 
      heroWords.some(heroWord => 
        heroWord.includes(word) || word.includes(heroWord) || 
        this.areSynonyms(word, heroWord)
      )
    );

    return Math.min(100, (overlap.length / Math.max(headlineWords.length, 1)) * 100);
  }

  private calculateCaptionSceneAlignment(caption: string, sceneDescription: string): number {
    const captionActions = this.extractActions(caption);
    const sceneActions = this.extractActions(sceneDescription);
    
    const actionOverlap = captionActions.filter(action =>
      sceneActions.some(sceneAction => 
        sceneAction.includes(action) || action.includes(sceneAction)
      )
    );

    const captionMood = this.extractMood(caption);
    const sceneMood = this.extractMood(sceneDescription);
    const moodMatch = captionMood === sceneMood ? 20 : 0;

    return Math.min(100, (actionOverlap.length * 15) + moodMatch + 20);
  }

  private calculateCTAActionAlignment(cta: string, sceneDescription: string): number {
    const ctaAction = this.extractPrimaryAction(cta);
    const sceneActions = this.extractActions(sceneDescription);
    
    const hasMatchingAction = sceneActions.some(action => 
      action.includes(ctaAction) || ctaAction.includes(action)
    );

    return hasMatchingAction ? 85 : 45;
  }

  private calculateMoodConsistency(caption: string, moodDirection: string): number {
    const captionMood = this.extractMood(caption);
    const designMood = this.extractMood(moodDirection);
    
    const moodCompatibility = this.getMoodCompatibilityScore(captionMood, designMood);
    return moodCompatibility;
  }

  // Synchronization helper methods
  private synchronizeHeadlineWithHero(headline: string, heroElement: string, brandProfile: any, businessType: string): string {
    const heroKeywords = this.extractKeywords(heroElement);
    const headlineWords = headline.split(' ');
    
    // If hero element mentions specific action/benefit, ensure headline includes it
    if (heroKeywords.includes('instant') || heroKeywords.includes('fast')) {
      if (!headline.toLowerCase().includes('instant') && !headline.toLowerCase().includes('fast')) {
        return `Instant ${headline}`;
      }
    }
    
    if (heroKeywords.includes('mobile') || heroKeywords.includes('phone')) {
      if (!headline.toLowerCase().includes('mobile') && headlineWords.length < 5) {
        return `Mobile ${headline}`;
      }
    }

    return headline; // Return original if no sync needed
  }

  private synchronizeCaptionWithScene(caption: string, sceneDescription: string, brandProfile: any): string {
    // Ensure caption mentions elements visible in the scene
    const sceneElements = this.extractVisualElements(sceneDescription);
    let syncedCaption = caption;

    // If scene shows specific location, ensure caption references it
    if (sceneElements.includes('office') && !caption.toLowerCase().includes('office') && !caption.toLowerCase().includes('work')) {
      syncedCaption = caption.replace(/\.$/, ' at the office.');
    }

    if (sceneElements.includes('mobile') && !caption.toLowerCase().includes('phone') && !caption.toLowerCase().includes('mobile')) {
      syncedCaption = syncedCaption.replace(/\.$/, ' using their mobile phone.');
    }

    return syncedCaption;
  }

  private synchronizeCTAWithAction(cta: string, sceneDescription: string, businessType: string): string {
    const sceneActions = this.extractActions(sceneDescription);
    
    // Match CTA to primary action shown in scene
    if (sceneActions.includes('using') || sceneActions.includes('clicking')) {
      if (cta.toLowerCase().includes('learn')) return 'Try Now';
      if (cta.toLowerCase().includes('discover')) return 'Start Today';
    }

    if (sceneActions.includes('receiving') || sceneActions.includes('getting')) {
      if (cta.toLowerCase().includes('start')) return 'Get Started';
    }

    return cta; // Return original if no sync needed
  }

  private synchronizeHeroWithHeadline(heroElement: string, headline: string, businessType: string): string {
    const headlineKeywords = this.extractKeywords(headline);
    
    // Ensure hero element demonstrates headline promise
    if (headlineKeywords.includes('instant') || headlineKeywords.includes('fast')) {
      if (!heroElement.toLowerCase().includes('notification') && !heroElement.toLowerCase().includes('success')) {
        return heroElement + ' showing instant success notification';
      }
    }

    if (headlineKeywords.includes('mobile') || headlineKeywords.includes('digital')) {
      if (!heroElement.toLowerCase().includes('phone') && !heroElement.toLowerCase().includes('mobile')) {
        return heroElement.replace('person', 'person using smartphone');
      }
    }

    return heroElement;
  }

  private synchronizeSceneWithCaption(sceneDescription: string, caption: string, brandProfile: any): string {
    const captionActions = this.extractActions(caption);
    
    // Ensure scene shows the actions described in caption
    if (captionActions.includes('sending') || captionActions.includes('transferring')) {
      if (!sceneDescription.toLowerCase().includes('transfer') && !sceneDescription.toLowerCase().includes('sending')) {
        return sceneDescription + ', showing money transfer in progress';
      }
    }

    return sceneDescription;
  }

  private synchronizeMoodWithContent(moodDirection: string, caption: string, businessType: string): string {
    const captionMood = this.extractMood(caption);
    
    // Align visual mood with content mood
    if (captionMood === 'urgent' && !moodDirection.toLowerCase().includes('urgent')) {
      return moodDirection + ', with urgent and immediate atmosphere';
    }

    if (captionMood === 'professional' && !moodDirection.toLowerCase().includes('professional')) {
      return moodDirection + ', maintaining professional and trustworthy tone';
    }

    return moodDirection;
  }

  // Utility methods
  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'with', 'you', 'your', 'our', 'this', 'that'].includes(word));
  }

  private extractActions(text: string): string[] {
    const actionWords = ['sending', 'receiving', 'using', 'clicking', 'tapping', 'opening', 'closing', 'paying', 'buying', 'transferring', 'getting', 'showing'];
    const lowerText = text.toLowerCase();
    return actionWords.filter(action => lowerText.includes(action));
  }

  private extractMood(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('urgent') || lowerText.includes('fast') || lowerText.includes('immediate')) return 'urgent';
    if (lowerText.includes('professional') || lowerText.includes('business') || lowerText.includes('reliable')) return 'professional';
    if (lowerText.includes('friendly') || lowerText.includes('warm') || lowerText.includes('welcoming')) return 'friendly';
    if (lowerText.includes('exciting') || lowerText.includes('dynamic') || lowerText.includes('energetic')) return 'exciting';
    
    return 'neutral';
  }

  private extractPrimaryAction(cta: string): string {
    const actionWords = ['start', 'get', 'try', 'learn', 'discover', 'join', 'sign', 'download', 'buy', 'order'];
    const lowerCTA = cta.toLowerCase();
    return actionWords.find(action => lowerCTA.includes(action)) || 'start';
  }

  private extractVisualElements(sceneDescription: string): string[] {
    const visualElements = ['office', 'mobile', 'phone', 'computer', 'desk', 'home', 'street', 'market', 'restaurant', 'shop'];
    const lowerScene = sceneDescription.toLowerCase();
    return visualElements.filter(element => lowerScene.includes(element));
  }

  private areSynonyms(word1: string, word2: string): boolean {
    const synonymGroups = [
      ['fast', 'quick', 'instant', 'rapid', 'immediate'],
      ['mobile', 'phone', 'smartphone', 'device'],
      ['money', 'payment', 'cash', 'funds', 'transfer'],
      ['business', 'company', 'professional', 'work'],
      ['easy', 'simple', 'effortless', 'convenient']
    ];

    return synonymGroups.some(group => 
      group.includes(word1) && group.includes(word2)
    );
  }

  private getMoodCompatibilityScore(mood1: string, mood2: string): number {
    if (mood1 === mood2) return 100;
    
    const compatibleMoods = {
      urgent: ['professional', 'exciting'],
      professional: ['urgent', 'neutral'],
      friendly: ['professional', 'neutral'],
      exciting: ['urgent', 'friendly'],
      neutral: ['professional', 'friendly']
    };

    const compatible = compatibleMoods[mood1 as keyof typeof compatibleMoods] || [];
    return compatible.includes(mood2) ? 75 : 40;
  }

  private analyzeAlignment(content: any, design: any): number {
    // Quick alignment analysis for final validation
    const headlineHero = this.calculateHeadlineHeroAlignment(content.headline, design.hero_element);
    const captionScene = this.calculateCaptionSceneAlignment(content.caption, design.scene_description);
    const moodConsistency = this.calculateMoodConsistency(content.caption, design.mood_direction);
    
    return Math.round((headlineHero * 0.4 + captionScene * 0.4 + moodConsistency * 0.2));
  }
}

// Export singleton instance
export const contentVisualSynchronizer = new ContentVisualSynchronizer();
