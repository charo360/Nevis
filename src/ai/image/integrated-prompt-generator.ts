/**
 * Integrated Image Prompt Generator
 * 
 * Generates image prompts that perfectly align with assistant-generated content
 * and design specifications for unified content-visual creation.
 */

import type { AssistantContentResponse, DesignSpecifications } from '../assistants/assistant-manager';

export interface IntegratedPromptRequest {
  assistantResponse: AssistantContentResponse;
  brandProfile: any;
  platform: string;
  aspectRatio: string;
  businessType: string;
}

export interface IntegratedPromptResult {
  imagePrompt: string;
  contentStructure: {
    headline: string;
    subheadline: string;
    caption: string;
    cta: string;
  };
  designInstructions: {
    layout: string;
    colors: string;
    typography: string;
    contact: string;
  };
  alignmentNotes: string[];
}

/**
 * Integrated Image Prompt Generator Class
 * Creates prompts that ensure perfect content-visual alignment
 */
export class IntegratedPromptGenerator {

  /**
   * Generate integrated image prompt with content and design specifications
   */
  generateIntegratedPrompt(request: IntegratedPromptRequest): IntegratedPromptResult {
    const { assistantResponse, brandProfile, platform, aspectRatio, businessType } = request;
    const { content, design_specifications } = assistantResponse;

    console.log(`🎨 [Integrated Prompt Generator] Creating unified prompt for ${brandProfile.businessName}`);
    console.log(`📱 [Platform]: ${platform}, Aspect: ${aspectRatio}`);
    console.log(`🎯 [Hero Element]: ${design_specifications.hero_element}`);

    // Build the integrated image prompt
    const imagePrompt = this.buildUnifiedImagePrompt(
      content,
      design_specifications,
      brandProfile,
      platform,
      aspectRatio,
      businessType
    );

    // Extract content structure for text overlay
    const contentStructure = {
      headline: content.headline,
      subheadline: content.subheadline || '',
      caption: this.truncateForImage(content.caption, 100), // Shorter for image
      cta: content.cta,
    };

    // Build design instructions
    const designInstructions = this.buildDesignInstructions(
      design_specifications,
      brandProfile,
      platform,
      businessType
    );

    // Generate alignment notes
    const alignmentNotes = this.generateAlignmentNotes(
      content,
      design_specifications,
      brandProfile
    );

    console.log(`✅ [Integrated Prompt Generator] Generated unified prompt (${imagePrompt.length} chars)`);

    return {
      imagePrompt,
      contentStructure,
      designInstructions,
      alignmentNotes,
    };
  }

  /**
   * Build unified image prompt that includes content and design specifications
   */
  private buildUnifiedImagePrompt(
    content: AssistantContentResponse['content'],
    designSpecs: DesignSpecifications,
    brandProfile: any,
    platform: string,
    aspectRatio: string,
    businessType: string
  ): string {
    let prompt = `Create a professional ${platform} social media design for ${brandProfile.businessName}:\n\n`;

    // CONTENT TO INCLUDE (most important section)
    prompt += `**CONTENT TO INCLUDE ON IMAGE:**\n`;
    prompt += `- Headline: "${content.headline}" (LARGEST TEXT, most prominent)\n`;
    if (content.subheadline) {
      prompt += `- Subheadline: "${content.subheadline}" (medium size, supports headline)\n`;
    }
    prompt += `- CTA: "${content.cta}" (prominent button or call-out)\n\n`;

    // Caption is for context only, NOT to be displayed on image
    prompt += `**CAPTION CONTEXT (DO NOT DISPLAY ON IMAGE):**\n`;
    prompt += `- Caption Story: "${this.truncateForImage(content.caption, 100)}" (for visual inspiration only, NOT text on image)\n\n`;

    // VISUAL SCENE (from design specifications)
    prompt += `**VISUAL SCENE:**\n`;
    prompt += `- Hero Element: ${designSpecs.hero_element}\n`;
    prompt += `- Scene Description: ${designSpecs.scene_description}\n`;
    prompt += `- Mood & Atmosphere: ${designSpecs.mood_direction}\n\n`;

    // DESIGN SPECIFICATIONS
    prompt += `**DESIGN SPECIFICATIONS:**\n`;
    prompt += `- Text Placement: ${designSpecs.text_placement}\n`;
    prompt += `- Color Scheme: ${designSpecs.color_scheme}\n`;
    prompt += `- Layout Style: ${this.getLayoutStyle(platform, businessType)}\n`;
    prompt += `- Aspect Ratio: ${aspectRatio}\n\n`;

    // BRAND INTEGRATION
    prompt += `**BRAND INTEGRATION:**\n`;

    // Check both brandColors.primary and primaryColor for compatibility
    const primaryColor = brandProfile.brandColors?.primary || brandProfile.primaryColor;
    const secondaryColor = brandProfile.brandColors?.secondary || brandProfile.accentColor;
    const backgroundColor = brandProfile.brandColors?.background || brandProfile.backgroundColor;

    if (primaryColor) {
      prompt += `- Primary Color: ${primaryColor} (60% usage - main brand color)\n`;
    }
    if (secondaryColor) {
      prompt += `- Secondary Color: ${secondaryColor} (30% usage - accent color)\n`;
    }
    if (backgroundColor) {
      prompt += `- Background Color: ${backgroundColor} (10% usage - background/neutral)\n`;
    }
    if (brandProfile.designStyle) {
      prompt += `- Brand Style: ${brandProfile.designStyle}\n`;
    }
    prompt += `- Logo: Include ${brandProfile.businessName} logo prominently\n\n`;

    // CRITICAL ALIGNMENT RULES
    prompt += `**CRITICAL ALIGNMENT RULES:**\n`;
    prompt += `1. Visual elements must DEMONSTRATE what the text describes\n`;
    prompt += `2. Hero element must match the headline promise\n`;
    prompt += `3. Scene must show the story the caption tells\n`;
    prompt += `4. CTA action must be visually represented\n`;
    prompt += `5. Overall mood must match content tone\n`;
    prompt += `6. All text must be clearly readable and well-contrasted\n\n`;

    // TECHNICAL REQUIREMENTS
    prompt += `**TECHNICAL REQUIREMENTS:**\n`;
    prompt += `- Platform: ${platform} optimized\n`;
    prompt += `- Text Hierarchy: Clear size differences (Headline > Subheadline > Caption > CTA)\n`;
    prompt += `- Readability: High contrast, legible fonts, minimum 14px equivalent\n`;
    prompt += `- Professional Quality: Clean, modern, trustworthy appearance\n`;
    prompt += `- Contact Info: Include phone, email, website at bottom in contrasting footer\n\n`;

    // CONTACT INFORMATION
    prompt += this.buildContactSection(brandProfile);

    // BUSINESS-SPECIFIC GUIDELINES
    prompt += this.getBusinessSpecificGuidelines(businessType, brandProfile);

    return prompt;
  }

  /**
   * Build design instructions for layout and styling
   */
  private buildDesignInstructions(
    designSpecs: DesignSpecifications,
    brandProfile: any,
    platform: string,
    businessType: string
  ): IntegratedPromptResult['designInstructions'] {
    return {
      layout: `${designSpecs.text_placement} with ${this.getLayoutStyle(platform, businessType)}`,
      colors: designSpecs.color_scheme,
      typography: `Headline (largest) > Subheadline > Caption > CTA hierarchy`,
      contact: this.buildContactInstructions(brandProfile),
    };
  }

  /**
   * Generate alignment notes for validation
   */
  private generateAlignmentNotes(
    content: AssistantContentResponse['content'],
    designSpecs: DesignSpecifications,
    brandProfile: any
  ): string[] {
    const notes: string[] = [];

    // Content-visual alignment
    notes.push(`Headline "${content.headline}" matches hero element "${designSpecs.hero_element}"`);
    notes.push(`Scene "${designSpecs.scene_description}" demonstrates caption story`);
    notes.push(`Mood "${designSpecs.mood_direction}" aligns with content tone`);

    // Brand alignment
    const primaryColor = brandProfile.brandColors?.primary || brandProfile.primaryColor;
    if (primaryColor) {
      notes.push(`Primary color ${primaryColor} used prominently`);
    }
    if (brandProfile.designStyle) {
      notes.push(`Design style matches brand personality: ${brandProfile.designStyle}`);
    }

    // CTA alignment
    notes.push(`CTA "${content.cta}" is logical next step from caption`);

    return notes;
  }

  /**
   * Get layout style based on platform and business type
   */
  private getLayoutStyle(platform: string, businessType: string): string {
    const platformStyles = {
      instagram: 'square grid layout with central focus',
      facebook: 'landscape format with left-aligned text',
      twitter: 'horizontal layout with compact design',
      linkedin: 'professional layout with business focus',
    };

    const businessStyles = {
      finance: 'clean, trustworthy, professional',
      retail: 'vibrant, product-focused, engaging',
      service: 'approachable, solution-oriented, clear',
      saas: 'modern, tech-forward, benefit-driven',
    };

    const platformStyle = platformStyles[platform.toLowerCase() as keyof typeof platformStyles] || 'balanced layout';
    const businessStyle = businessStyles[businessType.toLowerCase() as keyof typeof businessStyles] || 'professional';

    return `${platformStyle}, ${businessStyle} aesthetic`;
  }

  /**
   * Clean website URL by removing protocol prefix
   */
  private cleanWebsiteUrl(url: string): string {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '');
  }

  /**
   * Build contact information section
   */
  private buildContactSection(brandProfile: any): string {
    let contactSection = `**CONTACT INFORMATION (MANDATORY):**\n`;
    contactSection += `🚨 MUST INCLUDE ALL AVAILABLE CONTACT INFO EXACTLY AS PROVIDED 🚨\n`;
    contactSection += `⚠️ DO NOT MODIFY, CHANGE, OR REFORMAT THE CONTACT INFORMATION ⚠️\n`;

    // Extract contact info from multiple possible sources
    const phone = brandProfile.contactInfo?.phone || brandProfile.contact?.phone || '';
    const email = brandProfile.contactInfo?.email || brandProfile.contact?.email || '';
    const rawWebsite = brandProfile.websiteUrl || brandProfile.contactInfo?.website || brandProfile.contact?.website || brandProfile.website || '';
    const website = this.cleanWebsiteUrl(rawWebsite);

    if (phone) {
      contactSection += `- Phone: 📞 ${phone} (USE EXACTLY AS SHOWN - DO NOT CHANGE ANY DIGITS)\n`;
    }
    if (email) {
      contactSection += `- Email: 📧 ${email} (USE EXACTLY AS SHOWN)\n`;
    }
    if (website) {
      contactSection += `- Website: 🌐 ${website} (USE EXACTLY AS SHOWN)\n`;
    }

    contactSection += `\n**CONTACT DISPLAY REQUIREMENTS:**\n`;
    contactSection += `- Place in contrasting footer/strip at bottom of image\n`;
    contactSection += `- Use dark background with light text OR light background with dark text\n`;
    contactSection += `- Large enough to read (minimum 14px equivalent)\n`;
    contactSection += `- CRITICAL: Use the EXACT contact information provided above - DO NOT modify phone numbers, emails, or websites\n`;

    // Build the exact format string with actual values
    const contactParts: string[] = [];
    if (phone) contactParts.push(`📞 ${phone}`);
    if (email) contactParts.push(`📧 ${email}`);
    if (website) contactParts.push(`🌐 ${website}`);

    if (contactParts.length > 0) {
      contactSection += `- Exact Format Required: "${contactParts.join(' | ')}"\n`;
    }

    contactSection += `\n`;

    return contactSection;
  }

  /**
   * Build contact instructions for design
   */
  private buildContactInstructions(brandProfile: any): string {
    const phone = brandProfile.contactInfo?.phone || brandProfile.contact?.phone || '';
    const email = brandProfile.contactInfo?.email || brandProfile.contact?.email || '';
    const rawWebsite = brandProfile.websiteUrl || brandProfile.contactInfo?.website || brandProfile.contact?.website || brandProfile.website || '';
    const website = this.cleanWebsiteUrl(rawWebsite);

    // Build contact parts with explicit formatting
    const contactParts: string[] = [];
    if (phone) contactParts.push(`📞 ${phone}`);
    if (email) contactParts.push(`📧 ${email}`);
    if (website) contactParts.push(`🌐 ${website}`);

    if (contactParts.length === 0) {
      return 'Include business name prominently';
    }

    return `Footer with EXACT contact info: ${contactParts.join(' | ')} (DO NOT MODIFY THESE NUMBERS/ADDRESSES)`;
  }

  /**
   * Get business-specific visual guidelines
   */
  private getBusinessSpecificGuidelines(businessType: string, brandProfile: any): string {
    const location = brandProfile.location || 'local area';
    
    const guidelines = {
      finance: `**FINANCIAL SERVICES GUIDELINES:**
- Show REAL people using technology (not stock poses)
- Include mobile devices/smartphones for fintech context
- Demonstrate "before vs after" or "problem vs solution"
- Use authentic ${location} scenarios, not staged environments
- Show outcomes and results, not just processes
- Avoid complex charts or trading graphs - keep it relatable\n\n`,

      retail: `**RETAIL BUSINESS GUIDELINES:**
- Show products in real-world usage contexts
- Include customers interacting with products naturally
- Display pricing or value propositions clearly
- Use vibrant, engaging colors that attract attention
- Show the shopping or purchase experience
- Include local ${location} market context where relevant\n\n`,

      service: `**SERVICE BUSINESS GUIDELINES:**
- Show service providers interacting with customers
- Demonstrate the service process or outcome
- Use approachable, trustworthy imagery
- Include before/after transformations where applicable
- Show real people benefiting from the service
- Emphasize local ${location} community connection\n\n`,

      saas: `**SAAS/TECHNOLOGY GUIDELINES:**
- Show software interfaces in realistic usage scenarios
- Include people successfully using the technology
- Demonstrate efficiency gains or problem-solving
- Use modern, clean design aesthetics
- Show integration with existing workflows
- Avoid overly technical or complex visualizations\n\n`,
    };

    return guidelines[businessType.toLowerCase() as keyof typeof guidelines] || 
           `**BUSINESS GUIDELINES:**
- Show authentic business environment that connects with everyday life
- Include real people using your services/products
- Demonstrate clear value and outcomes
- Use professional yet approachable imagery
- Emphasize local ${location} community relevance\n\n`;
  }

  /**
   * Truncate caption for image display
   */
  private truncateForImage(caption: string, maxLength: number): string {
    if (caption.length <= maxLength) return caption;
    
    // Find the last complete sentence within the limit
    const truncated = caption.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    
    if (lastSentence > maxLength * 0.7) {
      return caption.substring(0, lastSentence + 1);
    }
    
    // If no good sentence break, truncate at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    return caption.substring(0, lastSpace) + '...';
  }
}

// Export singleton instance
export const integratedPromptGenerator = new IntegratedPromptGenerator();
