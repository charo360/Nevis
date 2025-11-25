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
  includeContacts?: boolean; // Whether to include contact information in the design
  strictConsistency?: boolean; // NEW: Whether to enforce EXACT brand colors with NO fallbacks
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
    const { assistantResponse, brandProfile, platform, aspectRatio, businessType, includeContacts = true, strictConsistency = false } = request;
    const { content, design_specifications } = assistantResponse;

    console.log(`🎨 [Integrated Prompt Generator] Creating unified prompt for ${brandProfile.businessName}`);
    console.log(`📱 [Platform]: ${platform}, Aspect: ${aspectRatio}`);
    console.log(`🎯 [Hero Element]: ${design_specifications.hero_element}`);
    console.log(`📞 [Include Contacts]: ${includeContacts}`);
    console.log(`🚨 [Strict Mode]: ${strictConsistency}`);

    // Build the integrated image prompt
    const imagePrompt = this.buildUnifiedImagePrompt(
      content,
      design_specifications,
      brandProfile,
      platform,
      aspectRatio,
      businessType,
      includeContacts,
      strictConsistency
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
      businessType,
      includeContacts
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
    businessType: string,
    includeContacts: boolean = true,
    strictConsistency: boolean = false
  ): string {
    // Check if this is an African country
    const location = brandProfile.location || '';
    const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'botswana', 'malawi'];
    const isAfricanCountry = africanCountries.some(country => location.toLowerCase().includes(country.toLowerCase()));
    
    let prompt = `Create a professional ${platform} social media design for ${brandProfile.businessName}:\n\n`;
    
    // AFRICAN REPRESENTATION - FIRST PRIORITY
    if (isAfricanCountry) {
      prompt += `🚨🚨🚨 CRITICAL: AFRICAN REPRESENTATION REQUIREMENT 🚨🚨🚨\n`;
      prompt += `THIS BUSINESS IS IN ${location.toUpperCase()} - AN AFRICAN COUNTRY\n\n`;
      prompt += `BEFORE YOU GENERATE ANYTHING, READ THIS:\n`;
      prompt += `- If you include ANY people in this image, they MUST be 100% Black/African\n`;
      prompt += `- ZERO white people allowed - this is ABSOLUTE and NON-NEGOTIABLE\n`;
      prompt += `- ZERO light-skinned people - only dark-skinned Black/African people\n`;
      prompt += `- All people must have authentic African features, hairstyles, and appearance\n`;
      prompt += `- If you cannot guarantee this, DO NOT include people at all\n`;
      prompt += `- Better NO people than wrong people\n\n`;
      prompt += `VALIDATION: Can you guarantee ONLY Black/African people? If NO, exclude people entirely.\n`;
      prompt += `🚨🚨🚨 THIS IS THE #1 PRIORITY - NOTHING OVERRIDES THIS 🚨🚨🚨\n\n`;
    }

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

    // STRICT MODE: Enforce exact colors with NO fallbacks
    if (strictConsistency && primaryColor && secondaryColor && backgroundColor) {
      prompt += `\n🚨🚨🚨 STRICT MODE - EXACT COLOR ENFORCEMENT 🚨🚨🚨\n`;
      prompt += `- Primary Color: ${primaryColor} (60% usage) - USE THIS EXACT HEX CODE ONLY\n`;
      prompt += `- Secondary Color: ${secondaryColor} (30% usage) - USE THIS EXACT HEX CODE ONLY\n`;
      prompt += `- Background Color: ${backgroundColor} (10% usage) - USE THIS EXACT HEX CODE ONLY\n`;
      prompt += `- ZERO tolerance for color variations - use ONLY these 3 exact hex codes\n`;
      prompt += `- DO NOT use similar shades, DO NOT use variations, DO NOT use alternatives\n`;
      prompt += `- If background is ${backgroundColor}, use EXACTLY ${backgroundColor} - NOT #FFFFFF, NOT #F5F5F5\n`;
      prompt += `- This is STRICT MODE - color precision is CRITICAL and will be verified\n\n`;
    } else {
      // NORMAL MODE: Use colors with fallbacks
      if (primaryColor) {
        prompt += `- Primary Color: ${primaryColor} (60% usage - main brand color)\n`;
      }
      if (secondaryColor) {
        prompt += `- Secondary Color: ${secondaryColor} (30% usage - accent color)\n`;
      }
      if (backgroundColor) {
        prompt += `- Background Color: ${backgroundColor} (10% usage - background/neutral)\n`;
      }
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

    // ANTI-AI VISUAL RULES (CRITICAL)
    prompt += `**🚫 ANTI-AI VISUAL RULES (MANDATORY - NO EXCEPTIONS):**\n`;
    prompt += `ABSOLUTELY FORBIDDEN - DO NOT INCLUDE ANY OF THESE:\n`;
    prompt += `❌ NO flowing lines, waves, streams, or ribbons coming from devices/phones\n`;
    prompt += `❌ NO glowing trails, light beams, energy effects, or halos around objects\n`;
    prompt += `❌ NO abstract colorful swirls, flowing elements, or decorative curves\n`;
    prompt += `❌ NO neon glows, artificial lighting effects, or fantasy glows\n`;
    prompt += `❌ NO computer-generated visual effects or CGI-style elements\n`;
    prompt += `❌ NO floating icons, symbols, or graphic overlays on the image\n`;
    prompt += `❌ NO abstract data visualizations, charts, or graphs overlaid on photos\n`;
    prompt += `❌ NO holographic effects, digital overlays, or futuristic elements\n`;
    prompt += `❌ NO particle effects, sparkles, or magical elements\n`;
    prompt += `❌ NO geometric patterns overlaid on realistic photos\n\n`;
    prompt += `✅ INSTEAD, CREATE:\n`;
    prompt += `✓ Clean, realistic photography without artificial effects\n`;
    prompt += `✓ Natural lighting and authentic environments\n`;
    prompt += `✓ Real people in natural settings (not staged poses)\n`;
    prompt += `✓ Actual products/devices shown clearly without effects\n`;
    prompt += `✓ Simple, professional compositions\n`;
    prompt += `✓ Authentic interactions with technology\n`;
    prompt += `✓ Real-world scenarios that people can relate to\n\n`;

    // FORBIDDEN VISUAL ELEMENTS
    prompt += `🚫 **FORBIDDEN VISUAL ELEMENTS - DO NOT INCLUDE:**\n`;
    prompt += `❌ NO circuit boards, circuit lines, or electronic circuits\n`;
    prompt += `❌ NO light beams, laser beams, or glowing light rays\n`;
    prompt += `❌ NO connection lines between phones and icons/objects\n`;
    prompt += `❌ NO lines connecting devices to floating elements\n`;
    prompt += `❌ NO network lines, data transfer lines, or connectivity visualizations\n`;
    prompt += `❌ NO lines of any kind connecting objects or people\n`;
    prompt += `❌ NO digital tunnels, tech corridors, or futuristic hallways\n`;
    prompt += `❌ NO holographic projections or floating digital screens\n`;
    prompt += `❌ NO robotic elements, mechanical parts, or artificial-looking tech\n`;
    prompt += `❌ NO matrix-style code, binary numbers, or data streams\n`;
    prompt += `❌ NO neon grids, wireframe overlays, or geometric light patterns\n`;
    prompt += `❌ NO floating icons with connection lines to devices\n`;
    prompt += `❌ ABSOLUTELY NO LINES - no connection lines, no network lines, no data lines\n`;
    prompt += `✅ INSTEAD: Use natural, realistic, human-centered scenes\n`;
    prompt += `✅ INSTEAD: Show real people in authentic environments\n`;
    prompt += `✅ INSTEAD: Use clean, modern designs without artificial tech elements\n`;
    prompt += `✅ INSTEAD: If showing phones, just show people holding phones naturally - NO LINES!\n\n`;

    // TECHNICAL REQUIREMENTS
    prompt += `**TECHNICAL REQUIREMENTS:**\n`;
    prompt += `- Platform: ${platform} optimized\n`;
    prompt += `- Text Hierarchy: Clear size differences (Headline > Subheadline > Caption > CTA)\n`;
    prompt += `- Readability: High contrast, legible fonts, minimum 14px equivalent\n`;
    prompt += `- Professional Quality: Clean, modern, trustworthy appearance\n`;

    // Only add contact info instruction if contacts toggle is ON
    if (includeContacts) {
      prompt += `- Contact Info: Include phone, email, website at bottom in contrasting footer\n\n`;
      // CONTACT INFORMATION
      prompt += this.buildContactSection(brandProfile);
    } else {
      prompt += `\n🚫 **CRITICAL: DO NOT INCLUDE CONTACT INFORMATION:**\n`;
      prompt += `- DO NOT include phone numbers, email addresses, or website URLs in the design\n`;
      prompt += `- DO NOT add contact details in footer or anywhere else\n`;
      prompt += `- Contact toggle is OFF - no contact information should appear\n`;
      prompt += `- Focus on the main message without contact details\n\n`;
    }

    // BUSINESS-SPECIFIC GUIDELINES
    prompt += this.getBusinessSpecificGuidelines(businessType, brandProfile);

    // FINAL AFRICAN REPRESENTATION REMINDER
    if (isAfricanCountry) {
      prompt += `\n🚨🚨🚨 FINAL REMINDER - AFRICAN REPRESENTATION 🚨🚨🚨\n`;
      prompt += `Before you generate, answer this question:\n`;
      prompt += `"Will EVERY person in this image be Black/African with dark skin?"\n\n`;
      prompt += `If the answer is NOT a definite YES, then EXCLUDE all people from the image.\n`;
      prompt += `This business is in ${location} - cultural authenticity is MANDATORY.\n`;
      prompt += `🚨🚨🚨 ZERO WHITE PEOPLE - THIS IS NON-NEGOTIABLE 🚨🚨🚨\n`;
    }

    return prompt;
  }

  /**
   * Build design instructions for layout and styling
   */
  private buildDesignInstructions(
    designSpecs: DesignSpecifications,
    brandProfile: any,
    platform: string,
    businessType: string,
    includeContacts: boolean = true
  ): IntegratedPromptResult['designInstructions'] {
    return {
      layout: `${designSpecs.text_placement} with ${this.getLayoutStyle(platform, businessType)}`,
      colors: designSpecs.color_scheme,
      typography: `Headline (largest) > Subheadline > Caption > CTA hierarchy`,
      contact: includeContacts ? this.buildContactInstructions(brandProfile) : 'No contact information',
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
- Avoid complex charts or trading graphs - keep it relatable
- 🚫 CRITICAL: NO flowing money lines, glowing payment trails, or abstract financial swirls
- 🚫 NO colorful waves/streams coming from phones or devices
- 🚫 NO artificial glowing effects around mobile banking interfaces
- ✅ SHOW: Clean phone screens with actual banking interfaces, real people in natural settings\n\n`,

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
