/**
 * Enhanced Creative Concept Generator
 * 
 * Generates sophisticated creative concepts with detailed visual direction
 * based on business intelligence, brand profile, and platform requirements.
 */

export interface EnhancedConceptRequest {
  brandProfile: any;
  businessType: string;
  platform: string;
  businessIntelligence?: any;
  marketingAngle?: any;
  useLocalLanguage?: boolean;
}

export interface VisualDirection {
  primaryStyle: string;
  colorPalette: string;
  composition: string;
  lighting: string;
  mood: string;
  visualElements: string[];
  sceneType: string;
  cameraAngle: string;
}

export interface ConceptNarrative {
  storyArc: string;
  emotionalJourney: string;
  keyMoments: string[];
  characterTypes: string[];
  settingDetails: string;
}

export interface EnhancedCreativeConceptResult {
  concept: string;
  visualTheme: string;
  emotionalTone: string;
  visualDirection: VisualDirection;
  narrative: ConceptNarrative;
  brandAlignment: {
    brandValues: string[];
    targetAudience: string;
    keyMessages: string[];
  };
  platformOptimization: {
    aspectRatio: string;
    contentFormat: string;
    engagementStrategy: string;
  };
  competitivePositioning: {
    differentiators: string[];
    marketAdvantage: string;
    uniqueAngle: string;
  };
}

/**
 * Enhanced Creative Concept Generator Class
 * Creates sophisticated concepts with comprehensive visual and narrative direction
 */
export class EnhancedCreativeConceptGenerator {

  /**
   * Generate enhanced creative concept with full visual direction
   */
  async generateEnhancedConcept(request: EnhancedConceptRequest): Promise<EnhancedCreativeConceptResult> {
    console.log(`🎨 [Enhanced Concept] Generating sophisticated concept for ${request.brandProfile.businessName}`);
    console.log(`📊 [Enhanced Concept] Business type: ${request.businessType}, Platform: ${request.platform}`);

    const startTime = Date.now();

    // Step 1: Analyze business context for concept direction
    const businessContext = this.analyzeBusinessContext(request);
    
    // Step 2: Generate core creative concept
    const coreConceptData = await this.generateCoreConceptWithAI(request, businessContext);
    
    // Step 3: Develop detailed visual direction
    const visualDirection = this.developVisualDirection(request, coreConceptData, businessContext);
    
    // Step 4: Create narrative structure
    const narrative = this.createNarrativeStructure(request, coreConceptData, businessContext);
    
    // Step 5: Align with brand values and positioning
    const brandAlignment = this.alignWithBrandValues(request, businessContext);
    
    // Step 6: Optimize for platform requirements
    const platformOptimization = this.optimizeForPlatform(request, coreConceptData);
    
    // Step 7: Position against competition
    const competitivePositioning = this.positionAgainstCompetition(request, businessContext);

    const processingTime = Date.now() - startTime;
    console.log(`✅ [Enhanced Concept] Generated in ${processingTime}ms`);

    return {
      concept: coreConceptData.concept,
      visualTheme: coreConceptData.visualTheme,
      emotionalTone: coreConceptData.emotionalTone,
      visualDirection,
      narrative,
      brandAlignment,
      platformOptimization,
      competitivePositioning
    };
  }

  /**
   * Analyze business context for concept direction
   */
  private analyzeBusinessContext(request: EnhancedConceptRequest) {
    const context = {
      industryType: request.businessType,
      brandPersonality: request.brandProfile.brandPersonality || 'professional',
      targetAudience: request.brandProfile.targetAudience || 'general audience',
      location: request.brandProfile.location || 'global',
      businessIntelligence: request.businessIntelligence,
      marketingFocus: request.marketingAngle?.focusArea || 'general'
    };

    // Extract key insights from business intelligence
    if (request.businessIntelligence) {
      const bi = request.businessIntelligence;
      context.competitiveAdvantages = bi.competitive?.competitiveAdvantages || [];
      context.customerPainPoints = bi.customer?.painPoints || [];
      context.marketPosition = bi.competitive?.marketPosition || 'challenger';
      context.keyMessages = bi.content?.keyMessages || [];
    }

    return context;
  }

  /**
   * Generate core creative concept using AI
   */
  private async generateCoreConceptWithAI(request: EnhancedConceptRequest, businessContext: any): Promise<{
    concept: string;
    visualTheme: string;
    emotionalTone: string;
  }> {
    console.log(`🤖 [Enhanced Concept] Generating AI-powered concept`);

    try {
      const { generateContentDirect } = await import('../revo-2.0-service');
      
      const conceptPrompt = `Generate a sophisticated creative concept for a ${request.businessType} business named "${request.brandProfile.businessName}" on ${request.platform}.

Business Context:
- Brand Personality: ${businessContext.brandPersonality}
- Target Audience: ${businessContext.targetAudience}
- Location: ${businessContext.location}
- Marketing Focus: ${businessContext.marketingFocus}
${businessContext.competitiveAdvantages ? `- Key Advantages: ${businessContext.competitiveAdvantages.slice(0, 3).join(', ')}` : ''}
${businessContext.customerPainPoints ? `- Customer Pain Points: ${businessContext.customerPainPoints.slice(0, 3).join(', ')}` : ''}
${businessContext.keyMessages ? `- Key Messages: ${businessContext.keyMessages.slice(0, 3).join(', ')}` : ''}

Generate a creative concept in the following format:
{
  "concept": "Detailed creative concept description (50-100 words)",
  "visualTheme": "Specific visual theme name and description",
  "emotionalTone": "Primary emotional tone for the concept"
}

Requirements:
- Create a unique, memorable concept that differentiates from competitors
- Address specific customer pain points through visual storytelling
- Align with brand personality and target audience
- Be platform-appropriate for ${request.platform}
- Include specific visual and emotional direction
- Focus on authentic, relatable scenarios`;

      const result = await generateContentDirect(conceptPrompt, 'claude-3-5-sonnet-20241022', false);
      const response = await result.response;
      const conceptText = response.text();

      try {
        const conceptData = JSON.parse(this.extractJSON(conceptText));
        console.log(`✅ [Enhanced Concept] AI concept generated: "${conceptData.concept.substring(0, 50)}..."`);
        return conceptData;
      } catch (parseError) {
        console.warn(`⚠️ [Enhanced Concept] Failed to parse AI concept, using fallback`);
        return this.getFallbackConcept(request, businessContext);
      }

    } catch (error) {
      console.warn(`⚠️ [Enhanced Concept] AI concept generation failed, using fallback:`, error);
      return this.getFallbackConcept(request, businessContext);
    }
  }

  /**
   * Develop detailed visual direction
   */
  private developVisualDirection(request: EnhancedConceptRequest, coreConceptData: any, businessContext: any): VisualDirection {
    console.log(`🎨 [Enhanced Concept] Developing visual direction`);

    // Determine primary visual style based on business type and brand
    const primaryStyle = this.determinePrimaryStyle(request.businessType, businessContext.brandPersonality);
    
    // Create color palette based on brand colors and emotional tone
    const colorPalette = this.createColorPalette(request.brandProfile, coreConceptData.emotionalTone);
    
    // Determine composition style
    const composition = this.determineComposition(request.platform, request.businessType);
    
    // Set lighting based on emotional tone and business type
    const lighting = this.determineLighting(coreConceptData.emotionalTone, request.businessType);
    
    // Extract mood from concept and business context
    const mood = this.extractMood(coreConceptData.emotionalTone, businessContext.marketingFocus);
    
    // Define key visual elements
    const visualElements = this.defineVisualElements(request.businessType, businessContext);
    
    // Determine scene type
    const sceneType = this.determineSceneType(request.businessType, businessContext.location);
    
    // Set camera angle for optimal impact
    const cameraAngle = this.determineCameraAngle(request.platform, coreConceptData.emotionalTone);

    return {
      primaryStyle,
      colorPalette,
      composition,
      lighting,
      mood,
      visualElements,
      sceneType,
      cameraAngle
    };
  }

  /**
   * Create narrative structure for storytelling
   */
  private createNarrativeStructure(request: EnhancedConceptRequest, coreConceptData: any, businessContext: any): ConceptNarrative {
    console.log(`📖 [Enhanced Concept] Creating narrative structure`);

    // Define story arc based on marketing angle and customer journey
    const storyArc = this.defineStoryArc(request.marketingAngle, businessContext.customerPainPoints);
    
    // Map emotional journey
    const emotionalJourney = this.mapEmotionalJourney(coreConceptData.emotionalTone, businessContext.marketingFocus);
    
    // Identify key story moments
    const keyMoments = this.identifyKeyMoments(request.businessType, businessContext.competitiveAdvantages);
    
    // Define character types
    const characterTypes = this.defineCharacterTypes(businessContext.targetAudience, businessContext.location);
    
    // Create setting details
    const settingDetails = this.createSettingDetails(businessContext.location, request.businessType);

    return {
      storyArc,
      emotionalJourney,
      keyMoments,
      characterTypes,
      settingDetails
    };
  }

  /**
   * Align concept with brand values
   */
  private alignWithBrandValues(request: EnhancedConceptRequest, businessContext: any) {
    const brandValues = [
      ...(request.brandProfile.brandValues || []),
      ...(businessContext.competitiveAdvantages || []).slice(0, 2),
      'Customer-focused', 'Reliable', 'Innovative'
    ].slice(0, 5);

    const targetAudience = businessContext.targetAudience;
    
    const keyMessages = [
      ...(businessContext.keyMessages || []),
      ...(request.brandProfile.valuePropositions || []),
      `${request.brandProfile.businessName} delivers exceptional ${request.businessType} solutions`
    ].slice(0, 4);

    return {
      brandValues,
      targetAudience,
      keyMessages
    };
  }

  /**
   * Optimize concept for specific platform
   */
  private optimizeForPlatform(request: EnhancedConceptRequest, coreConceptData: any) {
    const platformSpecs = {
      instagram: {
        aspectRatio: '1:1',
        contentFormat: 'Visual-first with minimal text overlay',
        engagementStrategy: 'Hashtag optimization and story-driven visuals'
      },
      facebook: {
        aspectRatio: '16:9',
        contentFormat: 'Balanced text-visual with clear CTA',
        engagementStrategy: 'Community engagement and shareability focus'
      },
      linkedin: {
        aspectRatio: '1.91:1',
        contentFormat: 'Professional with business value emphasis',
        engagementStrategy: 'Thought leadership and industry expertise'
      },
      twitter: {
        aspectRatio: '16:9',
        contentFormat: 'Concise with strong visual impact',
        engagementStrategy: 'Trending topics and conversation starters'
      }
    };

    return platformSpecs[request.platform.toLowerCase() as keyof typeof platformSpecs] || platformSpecs.instagram;
  }

  /**
   * Position concept against competition
   */
  private positionAgainstCompetition(request: EnhancedConceptRequest, businessContext: any) {
    const differentiators = [
      ...(businessContext.competitiveAdvantages || []),
      'Personalized approach',
      'Local expertise',
      'Innovative solutions'
    ].slice(0, 4);

    const marketAdvantage = businessContext.marketPosition === 'leader' 
      ? 'Market leadership and proven track record'
      : businessContext.marketPosition === 'challenger'
      ? 'Innovative disruption and better value'
      : 'Specialized expertise and personalized service';

    const uniqueAngle = `${request.brandProfile.businessName} as the ${businessContext.marketPosition} that ${differentiators[0]?.toLowerCase() || 'delivers superior value'}`;

    return {
      differentiators,
      marketAdvantage,
      uniqueAngle
    };
  }

  // Helper methods for visual direction
  private determinePrimaryStyle(businessType: string, brandPersonality: string): string {
    const styleMatrix = {
      finance: {
        professional: 'Clean minimalist with trust-building elements',
        friendly: 'Approachable modern with warm undertones',
        innovative: 'Tech-forward with dynamic compositions'
      },
      retail: {
        professional: 'Product-focused with premium aesthetics',
        friendly: 'Lifestyle photography with authentic moments',
        innovative: 'Creative product displays with unique angles'
      },
      service: {
        professional: 'Documentary-style with real people and scenarios',
        friendly: 'Candid interactions with warm, inviting atmosphere',
        innovative: 'Behind-the-scenes with process visualization'
      }
    };

    const businessStyles = styleMatrix[businessType as keyof typeof styleMatrix];
    if (businessStyles) {
      return businessStyles[brandPersonality as keyof typeof businessStyles] || businessStyles.professional;
    }

    return 'Professional modern with authentic human elements';
  }

  private createColorPalette(brandProfile: any, emotionalTone: string): string {
    const brandColors = brandProfile.brandColors;
    const baseColors = brandColors ? 
      `Primary: ${brandColors.primary}, Secondary: ${brandColors.secondary}` :
      'Professional blue and white';

    const toneColors = {
      urgent: 'with energetic red accents',
      professional: 'with trustworthy blue tones',
      friendly: 'with warm orange highlights',
      exciting: 'with vibrant gradient overlays',
      calm: 'with soft neutral backgrounds'
    };

    return `${baseColors} ${toneColors[emotionalTone as keyof typeof toneColors] || 'with balanced neutral accents'}`;
  }

  private determineComposition(platform: string, businessType: string): string {
    const compositions = {
      instagram: 'Centered focal point with rule of thirds',
      facebook: 'Left-aligned with clear visual hierarchy',
      linkedin: 'Professional grid layout with business focus',
      twitter: 'Dynamic diagonal composition for impact'
    };

    const businessAdjustments = {
      finance: 'with trust-building symmetry',
      retail: 'with product prominence',
      service: 'with people-centered focus'
    };

    const baseComposition = compositions[platform.toLowerCase() as keyof typeof compositions] || compositions.instagram;
    const adjustment = businessAdjustments[businessType as keyof typeof businessAdjustments] || '';
    
    return `${baseComposition} ${adjustment}`;
  }

  private determineLighting(emotionalTone: string, businessType: string): string {
    const lightingStyles = {
      urgent: 'High contrast with dramatic shadows',
      professional: 'Even, soft lighting with minimal shadows',
      friendly: 'Warm, natural lighting with soft highlights',
      exciting: 'Dynamic lighting with color temperature variation',
      calm: 'Soft, diffused lighting with gentle gradients'
    };

    return lightingStyles[emotionalTone as keyof typeof lightingStyles] || lightingStyles.professional;
  }

  private extractMood(emotionalTone: string, marketingFocus: string): string {
    return `${emotionalTone} atmosphere with ${marketingFocus}-focused energy`;
  }

  private defineVisualElements(businessType: string, businessContext: any): string[] {
    const baseElements = {
      finance: ['Mobile devices', 'Success notifications', 'Professional people', 'Modern interfaces'],
      retail: ['Products in use', 'Happy customers', 'Shopping scenarios', 'Lifestyle contexts'],
      service: ['Service delivery', 'Customer interactions', 'Professional tools', 'Results demonstration'],
      saas: ['Software interfaces', 'Productivity gains', 'Team collaboration', 'Data visualization']
    };

    const elements = baseElements[businessType as keyof typeof baseElements] || baseElements.service;
    
    // Add location-specific elements
    if (businessContext.location && businessContext.location !== 'global') {
      elements.push(`${businessContext.location} cultural elements`);
    }

    return elements;
  }

  private determineSceneType(businessType: string, location: string): string {
    const sceneTypes = {
      finance: 'Modern office or mobile-first environment',
      retail: 'Shopping or lifestyle environment',
      service: 'Service delivery or customer interaction environment',
      saas: 'Collaborative workspace or productivity environment'
    };

    const baseScene = sceneTypes[businessType as keyof typeof sceneTypes] || 'Professional business environment';
    
    if (location && location !== 'global') {
      return `${baseScene} with authentic ${location} characteristics`;
    }

    return baseScene;
  }

  private determineCameraAngle(platform: string, emotionalTone: string): string {
    const angleMatrix = {
      urgent: 'Dynamic low angle for impact',
      professional: 'Eye-level for trust and connection',
      friendly: 'Slightly elevated for approachability',
      exciting: 'Varied angles for visual interest',
      calm: 'Stable, centered framing'
    };

    const platformAdjustments = {
      instagram: 'optimized for square format',
      facebook: 'optimized for landscape viewing',
      linkedin: 'professional headroom consideration',
      twitter: 'compact framing for mobile'
    };

    const baseAngle = angleMatrix[emotionalTone as keyof typeof angleMatrix] || angleMatrix.professional;
    const adjustment = platformAdjustments[platform.toLowerCase() as keyof typeof platformAdjustments] || '';
    
    return `${baseAngle} ${adjustment}`;
  }

  // Narrative helper methods
  private defineStoryArc(marketingAngle: any, customerPainPoints: string[]): string {
    if (marketingAngle?.focusArea === 'problem') {
      return 'Problem identification → Solution demonstration → Positive outcome';
    }
    
    if (customerPainPoints && customerPainPoints.length > 0) {
      return `Current challenge (${customerPainPoints[0]}) → Solution introduction → Transformation result`;
    }

    return 'Current state → Improvement opportunity → Better future state';
  }

  private mapEmotionalJourney(emotionalTone: string, marketingFocus: string): string {
    const journeyMap = {
      urgent: 'Tension → Action → Relief',
      professional: 'Challenge → Confidence → Success',
      friendly: 'Connection → Trust → Satisfaction',
      exciting: 'Curiosity → Discovery → Enthusiasm',
      calm: 'Concern → Reassurance → Peace of mind'
    };

    return journeyMap[emotionalTone as keyof typeof journeyMap] || journeyMap.professional;
  }

  private identifyKeyMoments(businessType: string, competitiveAdvantages: string[]): string[] {
    const baseMoments = {
      finance: ['Payment initiation', 'Processing speed', 'Confirmation receipt'],
      retail: ['Product discovery', 'Purchase decision', 'Satisfaction confirmation'],
      service: ['Service request', 'Delivery process', 'Result achievement'],
      saas: ['Problem identification', 'Solution implementation', 'Productivity gain']
    };

    const moments = baseMoments[businessType as keyof typeof baseMoments] || baseMoments.service;
    
    // Add competitive advantage moments
    if (competitiveAdvantages && competitiveAdvantages.length > 0) {
      moments.push(`${competitiveAdvantages[0]} demonstration`);
    }

    return moments;
  }

  private defineCharacterTypes(targetAudience: string, location: string): string[] {
    const baseCharacters = [
      'Primary user persona',
      'Supporting characters',
      'Success beneficiaries'
    ];

    if (location && location !== 'global') {
      baseCharacters.push(`Authentic ${location} representatives`);
    }

    return baseCharacters;
  }

  private createSettingDetails(location: string, businessType: string): string {
    const settingBase = {
      finance: 'Modern, trustworthy environment with technology integration',
      retail: 'Vibrant, customer-friendly space with product focus',
      service: 'Professional, approachable setting with service emphasis',
      saas: 'Collaborative, innovative workspace with productivity focus'
    };

    const baseSetting = settingBase[businessType as keyof typeof settingBase] || settingBase.service;
    
    if (location && location !== 'global') {
      return `${baseSetting} with authentic ${location} cultural elements and local context`;
    }

    return baseSetting;
  }

  // Fallback methods
  private getFallbackConcept(request: EnhancedConceptRequest, businessContext: any): {
    concept: string;
    visualTheme: string;
    emotionalTone: string;
  } {
    return {
      concept: `Professional ${request.businessType} business showcasing quality services and customer satisfaction in ${businessContext.location}. Focus on authentic interactions and positive outcomes.`,
      visualTheme: 'Modern Professional with Authentic Human Elements',
      emotionalTone: 'professional'
    };
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }
}

// Export singleton instance
export const enhancedCreativeConceptGenerator = new EnhancedCreativeConceptGenerator();
