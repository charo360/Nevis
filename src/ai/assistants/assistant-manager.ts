/**
 * Assistant Manager - Core Orchestration System
 *
 * This class manages all OpenAI Assistants for Revo 2.0.
 * It's designed to be completely generic - no business-type specific logic here.
 * All business logic is in assistant-configs.ts.
 * Fixed: Added safety check for undefined platform parameter
 */

import OpenAI from 'openai';
import type { BusinessTypeCategory } from '../adaptive/business-type-detector';
import { getAssistantConfig, isAssistantImplemented } from './assistant-configs';
import { openAIFileService } from '@/lib/services/openai-file-service';
import type { BrandDocument } from '@/types/documents';
import { withRetry, openAIRetryManagers } from '@/lib/utils/openai-retry-manager';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  timeout: 60000,
  maxRetries: 3,
});

/**
 * Request structure for content generation
 */
export interface AssistantContentRequest {
  businessType: BusinessTypeCategory;
  brandProfile: any;
  concept: any;
  imagePrompt: string;
  platform: string;
  marketingAngle?: any;
  useLocalLanguage?: boolean;
  businessIntelligence?: any;
  deepBusinessUnderstanding?: any; // Deep business understanding from business-understanding system
  avoidListText?: string;
}

/**
 * Design specifications from assistant
 */
export interface DesignSpecifications {
  hero_element: string;
  scene_description: string;
  text_placement: string;
  color_scheme: string;
  mood_direction: string;
}

/**
 * Enhanced response structure from assistant with design specifications
 */
export interface AssistantContentResponse {
  content: {
    headline: string;
    subheadline?: string;
    caption: string;
    cta: string;
    hashtags: string[];
  };
  design_specifications: DesignSpecifications;
  alignment_validation: string;
}

/**
 * Assistant Manager Class
 * Handles all assistant operations generically
 */
export class AssistantManager {
  private assistantIds: Map<BusinessTypeCategory, string>;

  constructor() {
    // Load assistant IDs from environment variables
    this.assistantIds = new Map();

    console.log('🔧 [Assistant Manager] Initializing assistant manager...');
    console.log('🔧 [Assistant Manager] Environment check:', {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV
    });

    // Dynamically load all assistant IDs from environment
    const businessTypes: BusinessTypeCategory[] = [
      'retail', 'finance', 'service', 'saas', 'food',
      'healthcare', 'realestate', 'education', 'b2b', 'nonprofit'
    ];

    for (const type of businessTypes) {
      const config = getAssistantConfig(type);
      if (config && config.implemented) {
        const assistantId = process.env[config.envVar];
        if (assistantId) {
          this.assistantIds.set(type, assistantId);
          console.log(`✅ [Assistant Manager] Loaded assistant for ${type}: ${assistantId}`);
        } else {
          console.warn(`⚠️  [Assistant Manager] No assistant ID found for ${type} (${config.envVar})`);
          console.warn(`    Looking for: process.env.${config.envVar}`);
        }
      } else {
        console.log(`⏭️  [Assistant Manager] Skipping ${type} (not implemented or no config)`);
      }
    }

    console.log(`📊 [Assistant Manager] Total assistants loaded: ${this.assistantIds.size}/10`);
  }

  /**
   * Check if assistant is available for a business type
   */
  isAvailable(businessType: BusinessTypeCategory): boolean {
    return this.assistantIds.has(businessType) && isAssistantImplemented(businessType);
  }

  /**
   * Generate content using appropriate assistant
   */
  async generateContent(request: AssistantContentRequest): Promise<AssistantContentResponse> {
    const startTime = Date.now();

    // Validate platform parameter
    if (!request.platform) {
      console.warn(`⚠️ [Assistant Manager] Platform not provided, defaulting to 'instagram'`);
      request.platform = 'instagram';
    }

    // Validate assistant is available
    if (!this.isAvailable(request.businessType)) {
      throw new Error(`No assistant available for business type: ${request.businessType}`);
    }

    const assistantId = this.assistantIds.get(request.businessType)!;

    console.log(`🤖 [Assistant Manager] Using ${request.businessType} assistant: ${assistantId}`);

    let vectorStoreId: string | undefined;
    let uploadedFileIds: string[] = [];

    try {
      // Upload documents to OpenAI if available
      if (request.brandProfile.documents && request.brandProfile.documents.length > 0) {
        console.log(`📄 [Assistant Manager] Found ${request.brandProfile.documents.length} documents to upload`);

        try {
          // Upload files to OpenAI
          const uploadResults = await openAIFileService.uploadMultipleFiles(request.brandProfile.documents);
          uploadedFileIds = uploadResults.map(r => r.fileId);

          if (uploadedFileIds.length > 0) {
            console.log(`✅ [Assistant Manager] Uploaded ${uploadedFileIds.length} files to OpenAI`);

            // Create vector store with uploaded files
            const vectorStore = await openAIFileService.createVectorStore(
              uploadedFileIds,
              `${request.brandProfile.businessName} - Brand Documents`
            );
            vectorStoreId = vectorStore.vectorStoreId;
            console.log(`📚 [Assistant Manager] Created vector store: ${vectorStoreId}`);
          }
        } catch (uploadError) {
          console.error(`⚠️  [Assistant Manager] File upload failed, continuing without files:`, uploadError);
          // Continue without files if upload fails
        }
      }

      // Create thread with vector store if available
      const threadOptions: any = {};
      if (vectorStoreId) {
        threadOptions.tool_resources = {
          file_search: {
            vector_store_ids: [vectorStoreId]
          }
        };
      }

      const thread = await withRetry(
        () => openai.beta.threads.create(threadOptions),
        'Create Thread',
        'threadOperations'
      );
      console.log(`📝 [Assistant Manager] Created thread: ${thread.id}`);

      // Build message content
      const messageContent = this.buildMessageContent(request);

      // Add message to thread
      await withRetry(
        () => openai.beta.threads.messages.create(thread.id, {
          role: 'user',
          content: messageContent,
        }),
        'Add Message to Thread',
        'threadOperations'
      );

      // Run assistant with file_search tool if documents are available
      const runOptions: any = {
        assistant_id: assistantId,
        temperature: 1.0, // High temperature for maximum creativity and variety
      };

      // Enable file_search tool if we have documents
      if (vectorStoreId) {
        runOptions.tools = [
          { type: 'file_search' }
        ];
        console.log(`🔍 [Assistant Manager] Enabled file_search tool for document analysis`);
      }

      const run = await withRetry(
        () => openai.beta.threads.runs.create(thread.id, runOptions),
        'Start Assistant Run',
        'contentGeneration'
      );
      console.log(`🏃 [Assistant Manager] Started run: ${run.id}`);

      // Wait for completion
      const result = await this.waitForCompletion(thread.id, run.id);

      // Parse response
      const response = this.parseResponse(result);

      // Clean up resources with retry logic
      try {
        await withRetry(
          () => openai.beta.threads.delete(thread.id),
          'Delete Thread',
          'quickOperations'
        );
        console.log(`🗑️  [Assistant Manager] Deleted thread: ${thread.id}`);

        // Clean up vector store if created
        if (vectorStoreId) {
          await withRetry(
            () => openAIFileService.deleteVectorStore(vectorStoreId!),
            'Delete Vector Store',
            'fileOperations'
          );
          console.log(`🗑️  [Assistant Manager] Deleted vector store: ${vectorStoreId}`);
        }

        // Clean up uploaded files
        for (const fileId of uploadedFileIds) {
          await withRetry(
            () => openAIFileService.deleteFile(fileId),
            `Delete File ${fileId}`,
            'fileOperations'
          );
        }
        if (uploadedFileIds.length > 0) {
          console.log(`🗑️  [Assistant Manager] Deleted ${uploadedFileIds.length} uploaded files`);
        }
      } catch (cleanupError) {
        console.warn(`⚠️  Failed to clean up resources:`, cleanupError);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ [Assistant Manager] Generation successful in ${duration}ms`);
      console.log(`📊 [Assistant Manager] Headline: "${response.content.headline}"`);
      console.log(`🎨 [Assistant Manager] Design Hero: "${response.design_specifications.hero_element}"`);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [Assistant Manager] Generation failed after ${duration}ms:`, error);

      // Clean up resources on error (best effort, no retry to avoid further delays)
      try {
        if (vectorStoreId) {
          await openAIFileService.deleteVectorStore(vectorStoreId);
        }
        for (const fileId of uploadedFileIds) {
          await openAIFileService.deleteFile(fileId);
        }
      } catch (cleanupError) {
        console.warn(`⚠️  Failed to clean up resources after error:`, cleanupError);
      }

      throw error;
    }
  }

  /**
   * Build enhanced message content for assistant with design specifications
   * This creates unified content-design generation for perfect alignment
   */
  private buildMessageContent(request: AssistantContentRequest): string {
    const {
      brandProfile,
      concept,
      imagePrompt,
      platform,
      marketingAngle,
      useLocalLanguage,
    } = request;

    // Safety check for platform
    const safePlatform = platform || 'instagram';

    let message = `🎨 **CRITICAL: MAXIMUM VARIETY REQUIRED**\n`;
    message += `This is request #${Date.now() % 1000} - you MUST create completely UNIQUE content.\n`;
    message += `- Use a DIFFERENT selling angle than your last 10 generations\n`;
    message += `- Use a DIFFERENT caption opening structure\n`;
    message += `- Use a DIFFERENT emotional tone\n`;
    message += `- Think: "What's a way I HAVEN'T tried yet?"\n\n`;

    message += `Generate perfectly aligned social media content with visual design specifications for optimal content-design integration:\n\n`;

    // DEEP BUSINESS UNDERSTANDING (if available)
    if (request.deepBusinessUnderstanding) {
      const dbu = request.deepBusinessUnderstanding;
      message += `🧠 **DEEP BUSINESS UNDERSTANDING** (USE THIS TO GUIDE ALL CONTENT):\n\n`;
      
      if (dbu.promptGuidelines) {
        message += dbu.promptGuidelines;
        message += `\n\n`;
      } else {
        // Fallback: construct from insights
        const insight = dbu.businessInsight;
        if (insight) {
          message += `**Business Model:** ${insight.businessModel.type}\n`;
          message += `**Core Innovation:** ${insight.innovation.uniqueApproach}\n`;
          message += `**Key Differentiator:** ${insight.innovation.keyDifferentiator}\n`;
          message += `**Target Audience:** ${insight.targetAudience.primary.segment}\n`;
          message += `**Decision Maker:** ${insight.targetAudience.decisionMaker}\n`;
          message += `**End User:** ${insight.targetAudience.endUser}\n`;
          message += `**Core Value:** ${insight.valueProposition.coreValue}\n`;
          message += `**Mission:** ${insight.mission.corePurpose}\n`;
          if (insight.mission.socialImpact) {
            message += `**⚠️ SOCIAL IMPACT BUSINESS** - Emphasize mission and impact!\n`;
          }
          message += `\n`;
        }
      }
    }

    // Business Information
    message += `**Business Information:**\n`;
    message += `- Name: ${brandProfile.businessName}\n`;
    message += `- Type: ${brandProfile.businessType}\n`;
    message += `- Location: ${brandProfile.location || 'Global'}\n`;
    message += `- Platform: ${platform}\n\n`;

    if (brandProfile.description) {
      message += `**Description:** ${brandProfile.description}\n\n`;
    }

    // Services/Products - Handle both arrays and objects
    if (brandProfile.services) {
      const servicesText = Array.isArray(brandProfile.services)
        ? brandProfile.services.slice(0, 5).join(', ')
        : typeof brandProfile.services === 'object'
          ? Object.values(brandProfile.services).slice(0, 5).map((s: any) => s.name || s.serviceName || String(s)).join(', ')
          : String(brandProfile.services);

      if (servicesText) {
        message += `**Services:** ${servicesText}\n\n`;
      }
    }

    if (brandProfile.products) {
      const productsText = Array.isArray(brandProfile.products)
        ? brandProfile.products.slice(0, 5).join(', ')
        : typeof brandProfile.products === 'object'
          ? Object.values(brandProfile.products).slice(0, 5).map((p: any) => p.name || p.productName || String(p)).join(', ')
          : String(brandProfile.products);

      if (productsText) {
        message += `**Products:** ${productsText}\n\n`;
      }
    }

    // Target Audience
    if (brandProfile.targetAudience) {
      message += `**Target Audience:** ${brandProfile.targetAudience}\n\n`;
    }

    // Visual Brand Identity
    message += `**Visual Brand Identity:**\n`;
    if (brandProfile.brandColors) {
      if (brandProfile.brandColors.primary) {
        message += `- Primary Color: ${brandProfile.brandColors.primary}\n`;
      }
      if (brandProfile.brandColors.secondary) {
        message += `- Secondary Color: ${brandProfile.brandColors.secondary}\n`;
      }
    }
    if (brandProfile.designStyle) {
      message += `- Design Style: ${brandProfile.designStyle}\n`;
    }
    if (brandProfile.brandPersonality) {
      message += `- Brand Personality: ${brandProfile.brandPersonality}\n`;
    }
    message += `\n`;

    // Visual Concept
    message += `**Creative Concept:**\n`;
    message += `- Concept: ${concept.concept}\n`;
    if (concept.visualTheme) {
      message += `- Visual Theme: ${concept.visualTheme}\n`;
    }
    if (concept.emotionalTone) {
      message += `- Emotional Tone: ${concept.emotionalTone}\n`;
    }
    message += `\n`;

    if (imagePrompt) {
      message += `**Image Elements:** ${imagePrompt}\n\n`;
    }

    // Marketing Angle
    if (marketingAngle) {
      message += `**Marketing Angle:** ${marketingAngle.name}\n`;
      message += `${marketingAngle.description}\n\n`;
    }

    if (request.avoidListText) {
      message += `**ANTI-REPETITION GUIDANCE:**\n`;
      message += `${request.avoidListText}\n\n`;
    }

    // Local Language
    if (useLocalLanguage && brandProfile.location) {
      message += `**Language:** Mix English with local ${brandProfile.location} language elements naturally (70% English, 30% local)\n\n`;
    }

    // Product Catalog (for retail)
    if (request.businessType === 'retail' && brandProfile.productCatalog && brandProfile.productCatalog.length > 0) {
      message += `**Available Products:**\n`;
      brandProfile.productCatalog.slice(0, 5).forEach((product: any) => {
        message += `- ${product.name}`;
        if (product.price) message += ` (${product.price})`;
        if (product.discount) message += ` - ${product.discount}`;
        message += `\n`;
      });
      message += `\n`;
    }

    // Financial Services (for finance)
    if (request.businessType === 'finance' && brandProfile.services) {
      message += `**Financial Services:**\n`;
      brandProfile.services.slice(0, 5).forEach((service: any) => {
        if (typeof service === 'string') {
          message += `- ${service}\n`;
        } else if (service.serviceName) {
          message += `- ${service.serviceName}`;
          if (service.description) message += `: ${service.description}`;
          message += `\n`;
        }
      });
      message += `\n`;
    }

    // Document Data (if available)
    if (brandProfile.documents && brandProfile.documents.length > 0) {
      message += `**Business Documents Data:**\n`;
      message += `The following information has been extracted from uploaded business documents:\n\n`;

      brandProfile.documents.forEach((doc: any) => {
        if (doc.extractedData) {
          const data = doc.extractedData;

          // Pricing Information
          if (data.pricing && data.pricing.length > 0) {
            message += `**Pricing:**\n`;
            data.pricing.slice(0, 10).forEach((item: any) => {
              message += `- ${item.item}: ${item.price}`;
              if (item.description) message += ` (${item.description})`;
              if (item.discount) message += ` - ${item.discount}`;
              message += `\n`;
            });
            message += `\n`;
          }

          // Products
          if (data.products && data.products.length > 0) {
            message += `**Products:**\n`;
            data.products.slice(0, 10).forEach((product: any) => {
              message += `- ${product.name}`;
              if (product.description) message += `: ${product.description}`;
              if (product.features && product.features.length > 0) {
                message += ` (Features: ${product.features.slice(0, 3).join(', ')})`;
              }
              message += `\n`;
            });
            message += `\n`;
          }

          // Services
          if (data.services && data.services.length > 0) {
            message += `**Services:**\n`;
            data.services.slice(0, 10).forEach((service: any) => {
              message += `- ${service.name}`;
              if (service.description) message += `: ${service.description}`;
              if (service.benefits && service.benefits.length > 0) {
                message += ` (Benefits: ${service.benefits.slice(0, 3).join(', ')})`;
              }
              message += `\n`;
            });
            message += `\n`;
          }

          // Value Propositions
          if (data.valuePropositions && data.valuePropositions.length > 0) {
            message += `**Value Propositions:**\n`;
            data.valuePropositions.slice(0, 5).forEach((vp: string) => {
              message += `- ${vp}\n`;
            });
            message += `\n`;
          }

          // Competitive Advantages
          if (data.competitiveAdvantages && data.competitiveAdvantages.length > 0) {
            message += `**Competitive Advantages:**\n`;
            data.competitiveAdvantages.slice(0, 5).forEach((ca: string) => {
              message += `- ${ca}\n`;
            });
            message += `\n`;
          }

          // Brand Messaging
          if (data.brandMessaging) {
            const bm = data.brandMessaging;
            if (bm.tagline) message += `**Tagline:** ${bm.tagline}\n`;
            if (bm.missionStatement) message += `**Mission:** ${bm.missionStatement}\n`;
            if (bm.keyMessages && bm.keyMessages.length > 0) {
              message += `**Key Messages:** ${bm.keyMessages.slice(0, 3).join(', ')}\n`;
            }
            message += `\n`;
          }
        }
      });

      message += `**IMPORTANT:** Use ONLY the data provided above from business documents. Do not invent or hallucinate any pricing, features, or product/service details not explicitly mentioned.\n\n`;
      message += `**NOTE:** The full business documents have been uploaded and are available for you to search and analyze using the file_search tool. You can reference specific details, pricing, and information directly from these documents.\n\n`;
    }

    // 🎯 CORE BUSINESS UNDERSTANDING (MOST IMPORTANT - USE THIS FIRST!)
    if (request.businessIntelligence && request.businessIntelligence.coreBusinessUnderstanding) {
      const core = request.businessIntelligence.coreBusinessUnderstanding;
      message += `🎯 **CORE BUSINESS UNDERSTANDING** (USE THIS TO GUIDE ALL CONTENT):\n\n`;
      message += `📍 **What They Do:** ${core.whatTheyDo}\n`;
      message += `👥 **Who It's For:** ${core.whoItsFor}\n`;
      message += `🔧 **How They Do It:** ${core.howTheyDoIt}\n`;
      message += `💡 **Why It Matters:** ${core.whyItMatters}\n`;
      message += `🌍 **Context:** ${core.localContext}\n\n`;
      message += `**🚨 CRITICAL:** Base ALL content on this understanding. This is WHO they are and WHAT they offer.\n`;
      message += `- Headlines should reflect WHAT THEY DO and WHY IT MATTERS\n`;
      message += `- Captions should speak to WHO IT'S FOR and address their needs\n`;
      message += `- Avoid generic corporate language that could apply to any business\n`;
      message += `- Be specific about their actual offerings and value\n\n`;
    }

    // Business Intelligence Context
    if (request.businessIntelligence) {
      const bi = request.businessIntelligence;
      message += `**BUSINESS INTELLIGENCE CONTEXT:**\n`;

      if (bi.competitive) {
        message += `**Competitive Landscape:**\n`;
        message += `- Main Competitors: ${bi.competitive.mainCompetitors.slice(0, 3).join(', ')}\n`;
        message += `- Market Position: ${bi.competitive.marketPosition}\n`;
        message += `- Key Advantages: ${bi.competitive.competitiveAdvantages.slice(0, 3).join(', ')}\n`;
        message += `- Market Opportunities: ${bi.competitive.differentiationOpportunities.slice(0, 2).join(', ')}\n`;
      }

      if (bi.customer) {
        message += `**Customer Insights:**\n`;
        message += `- Primary Audience: ${bi.customer.primaryAudience}\n`;
        message += `- Key Pain Points: ${bi.customer.painPoints.slice(0, 3).join(', ')}\n`;
        message += `- Main Motivations: ${bi.customer.motivations.slice(0, 3).join(', ')}\n`;
        message += `- Preferred Channels: ${bi.customer.preferredChannels.slice(0, 2).join(', ')}\n`;
      }

      if (bi.content) {
        message += `**Content Strategy:**\n`;
        message += `- Key Messages: ${bi.content.keyMessages.slice(0, 3).join(', ')}\n`;
        message += `- Value Propositions: ${bi.content.valuePropositions.slice(0, 3).join(', ')}\n`;
        message += `- Recommended Tone: ${bi.content.toneOfVoice}\n`;
      }

      if (bi.recommendations && bi.recommendations.content) {
        message += `**Content Guidelines:**\n`;
        bi.recommendations.content.forEach((rec: string) => {
          message += `- ${rec}\n`;
        });
      }

      message += `\n**IMPORTANT:** Use this business intelligence to create highly targeted, competitive, and strategic content that addresses specific customer needs and market opportunities.\n\n`;
    }

    // Content-Design Alignment Requirements
    message += `**CONTENT-DESIGN ALIGNMENT REQUIREMENTS:**\n`;
    message += `1. Headline must introduce the main story theme and match the hero visual element\n`;
    message += `2. Subheadline must expand on the headline's promise and describe the visual scene\n`;
    message += `3. Caption must tell the complete story that the visual elements demonstrate\n`;
    message += `4. CTA must be the natural next step from the caption and match the action shown in the image\n`;
    message += `5. All elements must work together as ONE unified narrative\n`;
    message += `6. Visual specifications must support and enhance the text content\n\n`;

    // CRITICAL: Story Coherence Requirements from Revo 1.0
    message += `**🔗 ENHANCED STORY COHERENCE REQUIREMENTS (CRITICAL - FIXES CAPTION-HEADLINE MISMATCH):**\n\n`;
    
    message += `**🚨 STORY UNITY PRINCIPLE:**\n`;
    message += `Headline + Caption must tell ONE unified story, not two separate messages.\n`;
    message += `The caption should feel like the natural next sentence after reading the headline.\n\n`;
    
    message += `**✅ STORY COHERENCE CHECKLIST (MANDATORY):**\n`;
    message += `1. **Theme Consistency**: If headline focuses on SPEED, caption must also focus on SPEED (not security/quality/etc.)\n`;
    message += `2. **Tone Matching**: If headline is URGENT, caption must be URGENT (not calm/professional)\n`;
    message += `3. **Audience Alignment**: If headline targets STUDENTS, caption must speak to STUDENTS (not business owners)\n`;
    message += `4. **Benefit Delivery**: If headline promises INSTANT PAYMENTS, caption must explain HOW to get instant payments\n`;
    message += `5. **Narrative Flow**: Caption must answer the question or complete the thought started by headline\n\n`;
    
    message += `**🚫 STORY MISMATCH PATTERNS TO AVOID:**\n`;
    message += `- Headline: "Pay in 3 Seconds" → Caption talks about security features ❌\n`;
    message += `- Headline: "Student Budget Tight?" → Caption speaks to business owners ❌\n`;
    message += `- Headline: "Tired of Bank Queues?" → Caption discusses app features (not queue solution) ❌\n`;
    message += `- Headline: Urgent tone → Caption: Professional/calm tone ❌\n\n`;
    
    message += `**✅ CORRECT STORY COHERENCE EXAMPLES (ACTION-ORIENTED):**\n`;
    message += `- Headline: "Pay in 3 Seconds" → Caption: "No more waiting. Our instant transfer system processes your payment in just 3 seconds. Open app, select amount, confirm. Done. Your supplier gets paid while you're still drinking your coffee..." ✅\n`;
    message += `- Headline: "Student Budget Tight?" → Caption: "It's week 3. Professor just assigned 5 textbooks at KES 400 each. Your account says KES 500. With Paya, get every book today, pay over time. Stay in class, not behind..." ✅\n`;
    message += `- Headline: "Tired of Bank Queues?" → Caption: "It's Monday morning. You need to pay rent. Traditional banks mean 2-hour queues. With Paya, three taps on your phone. Payment sent. Confirmation received. You're back to work in 30 seconds..." ✅\n`;
    message += `- Notice: Captions are ACTION and BENEFIT focused, NOT describing the picture\n\n`;
    
    message += `**🎯 STORY COMPLETION REQUIREMENTS:**\n`;
    message += `- If headline asks a question → Caption must answer it\n`;
    message += `- If headline makes a promise → Caption must explain how to achieve it\n`;
    message += `- If headline identifies a problem → Caption must provide the solution\n`;
    message += `- If headline uses urgent tone → Caption must maintain urgency and provide immediate action\n\n`;
    
    message += `**🔗 STORY COHERENCE VALIDATION (NON-NEGOTIABLE):**\n`;
    message += `- HEADLINE and CAPTION must share common keywords or themes\n`;
    message += `- If headline mentions "PAYMENTS" → caption MUST mention money transfers/transactions/payments\n`;
    message += `- If headline mentions "SECURE" → caption MUST mention security/protection/safety\n`;
    message += `- If headline mentions "DAILY" → caption MUST mention everyday/routine activities\n`;
    message += `- If headline mentions "BUSINESS" → caption MUST mention business operations/growth/management\n`;
    message += `- If headline mentions "MOBILE" → caption MUST mention phone/app/mobile banking\n`;
    message += `- NEVER write generic captions that could work with any headline\n`;
    message += `- Caption must SPECIFICALLY relate to and expand on the headline message\n\n`;

    message += `**🎨 DESIGN UNIQUENESS & CREATIVITY (CRITICAL):**\n`;
    message += `Each design should look like it came from a DIFFERENT creative team with a unique vision.\n`;
    message += `Think like a world-class design agency: Apple, Nike, Airbnb, Spotify - they never repeat themselves.\n\n`;
    
    message += `**DESIGN VARIETY DIMENSIONS:**\n`;
    message += `1. **Visual Approach**: Vary between minimalist, bold, illustrative, photographic, abstract, metaphorical\n`;
    message += `2. **Layout Style**: Vary composition - centered, asymmetric, grid-based, flowing, layered\n`;
    message += `3. **Color Treatment**: Vary mood - vibrant, muted, high-contrast, monochromatic, gradient\n`;
    message += `4. **Typography Style**: Vary text treatment - bold statements, elegant subtlety, dynamic angles\n`;
    message += `5. **Visual Metaphor**: Find unique ways to represent the benefit visually\n`;
    message += `6. **Emotional Mood**: Match design emotion to content - urgent, calm, exciting, trustworthy\n\n`;
    
    message += `**VISUAL SPECIFICATIONS FOR DESIGN:**\n`;
    message += `- Text Hierarchy: Headline (largest) > Subheadline > Caption > CTA\n`;
    message += `- Color Usage: Primary (60%), Secondary (30%), Background (10%)\n`;
    message += `- Layout: Clear focal point with balanced composition\n`;
    message += `- Brand Consistency: Use specified colors and style while varying execution\n`;
    message += `- Platform Optimization: ${platform} format with proper aspect ratio\n`;
    message += `- Creative Excellence: Each design should be portfolio-worthy\n\n`;
    
    message += `**🚫 PHYSICAL REALISM RULES (CRITICAL FOR PRODUCT VISUALS):**\n`;
    message += `When showing phones, tablets, laptops, or any electronic devices:\n`;
    message += `- ❌ NEVER show screens on BOTH sides (back of device glowing like a screen)\n`;
    message += `- ❌ NEVER show the back of a tablet/phone lit up as if it's a screen\n`;
    message += `- ✅ Screens ONLY on the front face of devices\n`;
    message += `- ✅ Back of devices should be solid (logo, camera, normal back panel)\n`;
    message += `- ✅ If showing multiple devices, ensure each has screen on ONE side only\n`;
    message += `- ✅ Maintain physical accuracy - devices work like real products\n\n`;
    
    message += `**REALISTIC DEVICE DISPLAY EXAMPLES:**\n`;
    message += `- ✅ Tablet held by person, screen facing viewer, back is solid\n`;
    message += `- ✅ Phone on table, screen visible, back against surface\n`;
    message += `- ✅ Multiple devices arranged, all screens facing same direction\n`;
    message += `- ❌ Tablet floating with glowing back like it has two screens\n`;
    message += `- ❌ Phone with light emanating from both front and back\n`;
    message += `- ❌ Device that looks like it has screens on all sides\n\n`;

    message += `**🚫 BANNED CORPORATE PHRASES (NEVER USE):**\n`;
    message += `- "authentic, high-impact", "BNPL is today's focus", "puts Buy Now Pay Later (BNPL) front and center today"\n`;
    message += `- "makes it practical, useful, and...", "timing is everything", "We've all been there"\n`;
    message += `- "brings a human, professional touch", "See how [Business] makes it..."\n`;
    message += `- "Professional services that...", "Solutions that actually work"\n`;
    message += `- "Serving the community with...", "Quality service you can trust"\n`;
    message += `- "Experience the excellence of...", "Committed to providing..."\n`;
    message += `- Generic filler that could work for ANY business\n\n`;
    
    message += `**🎨 CREATIVE FREEDOM & VARIETY (CRITICAL):**\n`;
    message += `You are a WORLD-CLASS creative marketing team, not a template-following robot.\n`;
    message += `Each ad should feel like it was crafted by a different creative director with a unique vision.\n\n`;
    
    message += `**🚫 BANNED: Repetitive Patterns**\n`;
    message += `- NEVER start multiple captions the same way ("Imagine a world where...", "Picture this...", "What if...")\n`;
    message += `- NEVER use the same opening structure twice in a row\n`;
    message += `- NEVER fall into predictable formulas or templates\n`;
    message += `- Each caption should surprise and engage in a DIFFERENT way\n\n`;
    
    message += `**✅ HIGH-LEVEL MARKETING PRINCIPLES:**\n`;
    message += `1. **Match the Visual**: Caption should flow naturally from what's shown in the image\n`;
    message += `2. **Authentic Voice**: Write like a human having a real conversation, not a corporate announcement\n`;
    message += `3. **Emotional Connection**: Make readers FEEL something - urgency, relief, excitement, hope\n`;
    message += `4. **Specific Details**: Use real numbers, real scenarios, real pain points from the business context\n`;
    message += `5. **Unique Angle**: Find a fresh perspective on the benefit - what would a creative agency pitch?\n`;
    message += `6. **Story Arc**: Beginning (hook) → Middle (context) → End (resolution/CTA)\n`;
    message += `7. **Conversational Flow**: Read it aloud - does it sound natural or corporate?\n\n`;
    
    message += `**🎯 CREATIVE VARIETY TECHNIQUES:**\n`;
    message += `- Vary sentence length: Mix short punchy sentences with longer flowing ones\n`;
    message += `- Vary tone: Urgent vs calm, playful vs serious, aspirational vs practical\n`;
    message += `- Vary perspective: First person, second person, third person, or no character\n`;
    message += `- Vary structure: Question, statement, dialogue, timeline, before/after\n`;
    message += `- Vary focus: Problem, solution, transformation, social proof, innovation\n`;
    message += `- Think: "If Apple/Nike/Airbnb marketed this, how would they make it unique?"\n\n`;
    
    message += `**💡 ENGAGEMENT QUALITY TEST:**\n`;
    message += `Before finalizing, ask yourself:\n`;
    message += `- Would I stop scrolling to read this?\n`;
    message += `- Does this sound different from the last 10 ads I wrote?\n`;
    message += `- Would a professional creative agency be proud of this?\n`;
    message += `- Does it connect emotionally or just inform?\n`;
    message += `- Is it memorable or forgettable?\n\n`;
    
    message += `**✅ COMPLETE CAPTIONS (NO TRAILING OFF):**\n`;
    message += `- BANNED: Captions ending with "..." (incomplete thoughts)\n`;
    message += `- BANNED: "makes it practical, useful, and..." ← FINISH THE SENTENCE!\n`;
    message += `- REQUIRED: Complete thoughts with strong endings\n`;
    message += `- Each caption UNIQUE and SPECIFIC to its headline theme\n`;
    message += `- Write like a friend, not a corporation\n\n`;

    message += `**🚨 CRITICAL: CAPTION PURPOSE - DIRECT SELLING, NOT STORYTELLING:**\n`;
    message += `Captions are SALES COPY, not creative writing. Your job is to SELL, not entertain.\n\n`;
    
    message += `**❌ BANNED: Narrative/Storytelling Openings (NEVER USE):**\n`;
    message += `- "In the dynamic world of..." ❌ (Scene-setting)\n`;
    message += `- "Picture this: Exams are looming..." ❌ (Dramatic scenario)\n`;
    message += `- "Tired of the weight of..." ❌ (Creative writing intro)\n`;
    message += `- "Witness the transformation as..." ❌ (Flowery language)\n`;
    message += `- "Imagine a beautiful scene where..." ❌ (Describing visuals)\n`;
    message += `- "See the modern office where..." ❌ (Describing picture)\n`;
    message += `- Any scene-setting, dramatic buildup, or creative writing opening\n\n`;
    
    message += `**❌ WRONG CAPTION STRUCTURE (Storytelling/Narrative):**\n`;
    message += `Scene-setting intro (15-20 words) → Product mention → Benefits (maybe) → [Truncated]\n`;
    message += `This BURIES THE LEAD and wastes reader attention.\n\n`;
    
    message += `**✅ CORRECT CAPTION STRUCTURE (Direct Retail Selling):**\n`;
    message += `Product + Price (if applicable) → Key Features/Benefits → Target Customer → CTA\n`;
    message += `Lead with what matters. No buildup. No drama. Just clear value.\n\n`;
    
    message += `**✅ DIRECT SELLING CAPTION PRINCIPLES:**\n`;
    message += `1. **Lead with Value**: Product name/price first, not scene-setting\n`;
    message += `2. **List Benefits Directly**: No buildup, just features that matter\n`;
    message += `3. **Identify Audience**: Who is this for? Say it clearly\n`;
    message += `4. **Clear CTA**: What should they do next?\n`;
    message += `5. **Length**: 30-50 words maximum for retail, 50-100 for services\n`;
    message += `6. **Tone**: Direct salesperson, not creative novelist\n\n`;
    
    message += `**RETAIL vs SERVICE CAPTION APPROACH:**\n`;
    message += `- **RETAIL** (Products): Lead with product + price, list features, identify buyer, CTA\n`;
    message += `- **SERVICE** (Finance/SaaS): Lead with benefit, show how it works, address pain point, CTA\n`;
    message += `- **BOTH**: NO scene-setting, NO storytelling intros, NO dramatic buildup\n\n`;
    
    message += `**🛒 RETAIL FINANCING & BNPL SELLING ANGLE (CRITICAL):**\n`;
    message += `For RETAIL businesses, check if they offer Buy Now Pay Later (BNPL) or financing options.\n`;
    message += `If YES, use this as a POWERFUL selling point in SOME ads (not all - vary your approach).\n\n`;
    
    message += `**HOW TO CHECK FOR FINANCING:**\n`;
    message += `- Look in business documents for: "Buy Now Pay Later", "BNPL", "Financing", "Installments", "Pay in installments"\n`;
    message += `- Check services/features for payment plans or financing options\n`;
    message += `- If found, this is a MAJOR selling point - removes price barrier\n`;
    message += `- ONLY mention if explicitly confirmed in business data - DO NOT INVENT\n\n`;
    
    message += `**FINANCING SELLING EXAMPLES (If Available):**\n`;
    message += `✅ "Zentech tablets from KES 12,999. Or pay KES 2,000/month for 6 months. No interest. Get yours today, pay over time."\n`;
    message += `✅ "Can't pay upfront? No problem. Buy now, pay later. Zentech tablets with flexible payment plans. Start learning today."\n`;
    message += `✅ "KES 12,999 too much at once? Split it. Pay in 3 installments. Zero interest. Your tablet, your timeline."\n\n`;
    
    message += `**VARIETY IN SELLING THE SAME PRODUCT (CRITICAL):**\n`;
    message += `Create DIFFERENT selling angles for the same product across multiple ads.\n`;
    message += `Use ACTUAL business data - these are just EXAMPLE ANGLES (not hardcoded content):\n\n`;
    
    message += `1. **Price-Focused Angle**: Lead with actual product price and value proposition\n`;
    message += `   - Example concept: "From [ACTUAL PRICE]. Best value [PRODUCT TYPE] in [LOCATION]."\n`;
    message += `   - Use REAL pricing from business documents\n\n`;
    
    message += `2. **Financing-Focused Angle**: If BNPL/financing available, lead with payment plan\n`;
    message += `   - Example concept: "Pay [ACTUAL MONTHLY AMOUNT]/month. Own in [ACTUAL TERM]."\n`;
    message += `   - Use REAL financing terms from business documents\n`;
    message += `   - ONLY if financing is confirmed in business data\n\n`;
    
    message += `3. **Feature-Focused Angle**: Lead with actual product specifications\n`;
    message += `   - Example concept: "[ACTUAL FEATURE 1]. [ACTUAL FEATURE 2]. [ACTUAL FEATURE 3]."\n`;
    message += `   - Use REAL features from product documents\n\n`;
    
    message += `4. **Benefit-Focused Angle**: Lead with actual customer benefits\n`;
    message += `   - Example concept: "[BENEFIT 1]. [BENEFIT 2]. [BENEFIT 3]."\n`;
    message += `   - Use REAL benefits from business value propositions\n\n`;
    
    message += `5. **Audience-Focused Angle**: Lead with actual target customer\n`;
    message += `   - Example concept: "Perfect for [ACTUAL TARGET AUDIENCE]. Built for [ACTUAL USE CASE]."\n`;
    message += `   - Use REAL target audience from business profile\n\n`;
    
    message += `6. **Problem-Solution Angle**: Lead with actual problem the product solves\n`;
    message += `   - Example concept: "[ACTUAL PROBLEM]? [ACTUAL SOLUTION]."\n`;
    message += `   - Use REAL pain points from business intelligence\n\n`;
    
    message += `**SELLING VARIETY RULES:**\n`;
    message += `- NEVER use the same selling angle twice in a row\n`;
    message += `- Rotate between price, financing, features, benefits, audience, problem-solution\n`;
    message += `- Each ad should highlight a DIFFERENT aspect of the same product\n`;
    message += `- Use ACTUAL business data for all content - DO NOT use example text\n`;
    message += `- Make the product SELLABLE from multiple angles using REAL information\n`;
    message += `- Confirm all information from business data - DO NOT INVENT\n\n`;
    
    message += `**🎨 MAXIMUM CREATIVE VARIETY (CRITICAL):**\n`;
    message += `Your goal: Find AS MANY DIFFERENT WAYS AS POSSIBLE to present the same thing.\n`;
    message += `Think like 10 different creative directors, each with a unique approach.\n\n`;
    
    message += `**UNLIMITED VARIETY DIMENSIONS:**\n`;
    message += `For the SAME product/service, you can vary:\n`;
    message += `1. **Selling Angle**: Price, financing, features, benefits, audience, problem-solution, social proof, urgency, exclusivity, transformation\n`;
    message += `2. **Emotional Tone**: Urgent, calm, exciting, reassuring, aspirational, practical, playful, serious, confident, empowering\n`;
    message += `3. **Customer Persona**: Students, professionals, parents, entrepreneurs, families, seniors, youth, businesses, individuals\n`;
    message += `4. **Use Case**: Work, study, entertainment, family time, business growth, personal development, social connection, creativity\n`;
    message += `5. **Time Context**: Morning routine, workday, evening, weekend, special occasions, daily life, future planning\n`;
    message += `6. **Pain Point Focus**: Cost, time, complexity, quality, accessibility, reliability, convenience, status\n`;
    message += `7. **Benefit Emphasis**: Speed, savings, quality, ease, security, growth, freedom, connection, innovation\n`;
    message += `8. **Visual Style**: Minimalist, bold, lifestyle, product-focused, metaphorical, abstract, photographic, illustrative\n`;
    message += `9. **Headline Structure**: Question, statement, command, benefit, problem, solution, comparison, testimonial\n`;
    message += `10. **Caption Approach**: Direct sell, story, comparison, list, problem-solution, social proof, urgency, education\n\n`;
    
    message += `**CREATIVE MULTIPLICATION PRINCIPLE:**\n`;
    message += `If you have 10 selling angles × 10 emotional tones × 9 customer personas = 900+ possible combinations.\n`;
    message += `Your job: NEVER repeat the same combination. Always find a NEW way.\n\n`;
    
    message += `**EXAMPLES - SAME PRODUCT, INFINITE WAYS:**\n`;
    message += `Product: Tablet at KES 12,999\n\n`;
    message += `Way 1: Price + Students + Urgent → "KES 12,999. Semester starts Monday. Get yours now."\n`;
    message += `Way 2: Features + Professionals + Confident → "8-hour battery. 64GB storage. Built for your workday."\n`;
    message += `Way 3: Problem + Parents + Reassuring → "Heavy backpacks hurting your child? Switch to digital learning."\n`;
    message += `Way 4: Benefit + Entrepreneurs + Aspirational → "Work from anywhere. Your mobile office in one device."\n`;
    message += `Way 5: Financing + Families + Practical → "Pay KES 2,000/month. Everyone gets their own tablet."\n`;
    message += `Way 6: Social Proof + Youth + Exciting → "10,000+ students already switched. Join the digital revolution."\n`;
    message += `Way 7: Comparison + Seniors + Simple → "Easier than a computer. Lighter than a book. Perfect for you."\n`;
    message += `Way 8: Transformation + Creatives + Empowering → "Sketch. Design. Create. Your ideas, unlimited."\n`;
    message += `Way 9: Urgency + Shoppers + FOMO → "Limited stock. 50 left. Don't miss out."\n`;
    message += `Way 10: Quality + Professionals + Trustworthy → "Premium build. 2-year warranty. Investment that lasts."\n\n`;
    
    message += `**VARIETY CHALLENGE:**\n`;
    message += `Before creating an ad, ask yourself:\n`;
    message += `- What's a way I HAVEN'T tried yet?\n`;
    message += `- Can I combine different dimensions for a unique angle?\n`;
    message += `- Would this feel fresh to someone who saw my last 10 ads?\n`;
    message += `- Am I exploring the full range of possibilities or staying safe?\n\n`;
    
    message += `**FREEDOM TO EXPERIMENT:**\n`;
    message += `You have PERMISSION to:\n`;
    message += `- Try unconventional combinations\n`;
    message += `- Mix emotional tones within reason\n`;
    message += `- Target unexpected customer personas\n`;
    message += `- Highlight overlooked benefits\n`;
    message += `- Create surprising visual concepts\n`;
    message += `- Find fresh angles on familiar features\n`;
    message += `As long as: Information is accurate, tone is professional, and message is clear.\n\n`;
    
    message += `**🎯 TARGET BUYER vs TARGET USER (CRITICAL):**\n`;
    message += `Know the difference between who USES the product and who BUYS the product.\n`;
    message += `Your message must address the BUYER (decision maker), not just the user.\n\n`;
    
    message += `**BUYER-USER DISTINCTION:**\n\n`;
    
    message += `**Kids Products (Tablets, Toys, Educational Items):**\n`;
    message += `- TARGET USER: Children\n`;
    message += `- TARGET BUYER: Parents\n`;
    message += `- MESSAGE FOR: Parents (they make the purchase decision)\n`;
    message += `- BENEFITS FOCUS: What parents care about (safety, education, value, durability)\n`;
    message += `- VISUAL: Show kids using it (appeals to parents' desire to see their child happy/learning)\n`;
    message += `- TONE: Speak to parents, not children\n\n`;
    
    message += `**Example - Kids Tablet:**\n`;
    message += `❌ WRONG (Speaking to kids): "Hey kids! Want a cool tablet? It's super fun and has games!"\n`;
    message += `✅ RIGHT (Speaking to parents): "Kids tablets from KES 12,999. Educational apps, parental controls, and durable design. Keep your child learning and safe. Built for active hands."\n`;
    message += `- Visual shows: Child happily learning\n`;
    message += `- Message addresses: Parent concerns (education, safety, durability, value)\n\n`;
    
    message += `**B2B Products (Business Software, Equipment):**\n`;
    message += `- TARGET USER: Employees/staff\n`;
    message += `- TARGET BUYER: Business owners/managers/procurement\n`;
    message += `- MESSAGE FOR: Decision makers (ROI, efficiency, cost savings)\n`;
    message += `- BENEFITS FOCUS: Business outcomes (productivity, savings, growth, competitive advantage)\n`;
    message += `- VISUAL: Show business context and results\n`;
    message += `- TONE: Professional, ROI-focused\n\n`;
    
    message += `**Example - Business Payment System:**\n`;
    message += `❌ WRONG (Speaking to employees): "Make your job easier with our payment system!"\n`;
    message += `✅ RIGHT (Speaking to business owner): "Accept payments instantly. Reduce transaction costs by 40%. Grow your business with real-time sales tracking. For merchants who want to scale."\n`;
    message += `- Visual shows: Business owner checking sales dashboard\n`;
    message += `- Message addresses: Owner concerns (cost, growth, efficiency)\n\n`;
    
    message += `**Gifts (Jewelry, Watches, Luxury Items):**\n`;
    message += `- TARGET USER: Gift recipient\n`;
    message += `- TARGET BUYER: Gift giver\n`;
    message += `- MESSAGE FOR: Gift giver (they make the purchase)\n`;
    message += `- BENEFITS FOCUS: Emotional impact, impression, meaning, quality\n`;
    message += `- VISUAL: Show recipient's joy or the gift's elegance\n`;
    message += `- TONE: Emotional, aspirational\n\n`;
    
    message += `**Family Products (Cars, Homes, Appliances):**\n`;
    message += `- TARGET USER: Entire family\n`;
    message += `- TARGET BUYER: Primary decision maker (often parent/head of household)\n`;
    message += `- MESSAGE FOR: Decision maker with family benefits\n`;
    message += `- BENEFITS FOCUS: Family safety, comfort, value, practicality\n`;
    message += `- VISUAL: Show family enjoying together\n`;
    message += `- TONE: Reassuring, practical, family-focused\n\n`;
    
    message += `**BUYER IDENTIFICATION CHECKLIST:**\n`;
    message += `Before creating content, ask:\n`;
    message += `1. Who will actually PAY for this product?\n`;
    message += `2. Who makes the PURCHASE DECISION?\n`;
    message += `3. What are the BUYER'S concerns (not just user's wants)?\n`;
    message += `4. What benefits matter to the DECISION MAKER?\n`;
    message += `5. Am I addressing the right person in my message?\n\n`;
    
    message += `**COMMON BUYER-USER SCENARIOS:**\n`;
    message += `- Kids products → Sell to parents (safety, education, value)\n`;
    message += `- B2B products → Sell to business owners (ROI, efficiency, growth)\n`;
    message += `- Gifts → Sell to gift givers (emotional impact, quality, meaning)\n`;
    message += `- Family products → Sell to primary decision maker (family benefits)\n`;
    message += `- Student products → Sell to parents OR students (depends on price point)\n`;
    message += `- Enterprise software → Sell to IT managers/executives (security, scalability, support)\n`;
    message += `- Medical products → Sell to patients OR doctors (depends on product type)\n\n`;
    
    message += `**KEY PRINCIPLE:**\n`;
    message += `Show the USER enjoying the product (visual appeal).\n`;
    message += `Speak to the BUYER about their concerns (message content).\n`;
    message += `Example: Kids tablet ad shows child learning happily (visual) but caption addresses parent concerns about education and safety (message).\n\n`;
    
    message += `**🔥 CREATE DESIRE & URGENCY (CRITICAL):**\n`;
    message += `Your job is not just to INFORM - it's to make people WANT to buy.\n`;
    message += `Create emotional desire, urgency, and compelling reasons to act NOW.\n\n`;
    
    message += `**DESIRE-BUILDING TECHNIQUES:**\n\n`;
    
    message += `**1. Paint the Transformation (Before → After):**\n`;
    message += `Show the emotional journey from problem to solution.\n`;
    message += `❌ WEAK: "Our tablets have 8-hour battery."\n`;
    message += `✅ STRONG: "Stop worrying about dead batteries mid-class. 8 hours means full school day covered."\n`;
    message += `- Focus on the FEELING of the transformation, not just the feature\n\n`;
    
    message += `**2. Create FOMO (Fear of Missing Out):**\n`;
    message += `Make them feel they'll lose out if they don't act.\n`;
    message += `- "Limited stock. 50 left this week."\n`;
    message += `- "10,000+ already switched. Don't get left behind."\n`;
    message += `- "Offer ends Sunday. Last chance for this price."\n`;
    message += `- "While competitors wait, you'll be ahead."\n\n`;
    
    message += `**3. Use Social Proof:**\n`;
    message += `Show others are already benefiting.\n`;
    message += `- "Join 10,000+ students who already upgraded."\n`;
    message += `- "Trusted by 500+ Kenyan businesses."\n`;
    message += `- "Rated 4.8/5 by parents nationwide."\n`;
    message += `- "The choice of leading professionals."\n\n`;
    
    message += `**4. Highlight What They'll Lose (Loss Aversion):**\n`;
    message += `People fear loss more than they desire gain.\n`;
    message += `❌ WEAK: "Save time with instant payments."\n`;
    message += `✅ STRONG: "Stop losing customers to slow checkout. Every minute of delay costs you sales."\n`;
    message += `- Emphasize what they're LOSING by not having your product\n\n`;
    
    message += `**5. Make It Personal & Relatable:**\n`;
    message += `Use scenarios they recognize from their own life.\n`;
    message += `- "It's Monday morning. Your supplier needs payment NOW. But the bank opens at 9am..."\n`;
    message += `- "Week 3 of semester. Professor assigns 5 textbooks. Your account shows KES 500..."\n`;
    message += `- "Your child's backpack weighs 8kg. They're 7 years old..."\n\n`;
    
    message += `**6. Create Aspirational Vision:**\n`;
    message += `Show the better version of their life.\n`;
    message += `- "Work from anywhere. Your office is wherever you are."\n`;
    message += `- "Watch your business grow while you sleep. Real-time tracking, 24/7."\n`;
    message += `- "Your child learning, creating, exploring. All in one device."\n\n`;
    
    message += `**7. Remove Barriers (Make It Easy):**\n`;
    message += `Address objections before they think of them.\n`;
    message += `- "Can't pay upfront? Pay KES 2,000/month."\n`;
    message += `- "No technical skills needed. Set up in 5 minutes."\n`;
    message += `- "Free delivery. Free setup. Zero hassle."\n`;
    message += `- "Try risk-free. 30-day money-back guarantee."\n\n`;
    
    message += `**8. Use Power Words:**\n`;
    message += `Words that trigger emotional response:\n`;
    message += `- Urgency: NOW, TODAY, LIMITED, LAST CHANCE, ENDING SOON\n`;
    message += `- Exclusivity: EXCLUSIVE, PREMIUM, SELECT, ELITE, MEMBERS ONLY\n`;
    message += `- Benefit: FREE, GUARANTEED, PROVEN, INSTANT, EASY\n`;
    message += `- Transformation: NEW, REVOLUTIONARY, BREAKTHROUGH, GAME-CHANGING\n`;
    message += `- Security: SAFE, PROTECTED, SECURE, TRUSTED, CERTIFIED\n\n`;
    
    message += `**9. Create Urgency (Time-Sensitive):**\n`;
    message += `Give them a reason to act NOW, not later.\n`;
    message += `- "Semester starts Monday. Order today for delivery Friday."\n`;
    message += `- "Price increases next week. Lock in KES 12,999 now."\n`;
    message += `- "Only 3 days left at this price."\n`;
    message += `- "First 100 customers get free accessories."\n\n`;
    
    message += `**10. Show Immediate Gratification:**\n`;
    message += `Emphasize how quickly they get the benefit.\n`;
    message += `- "Order now. Learning starts tomorrow."\n`;
    message += `- "Instant setup. Accept payments in 5 minutes."\n`;
    message += `- "Download today. Start creating tonight."\n`;
    message += `- "Same-day delivery available."\n\n`;
    
    message += `**DESIRE-BUILDING FORMULA:**\n`;
    message += `1. **Hook**: Relatable problem or aspiration\n`;
    message += `2. **Agitate**: Make them FEEL the pain/desire\n`;
    message += `3. **Solution**: Your product as the answer\n`;
    message += `4. **Proof**: Social proof or guarantee\n`;
    message += `5. **Urgency**: Reason to act NOW\n`;
    message += `6. **CTA**: Clear next step\n\n`;
    
    message += `**EXAMPLE - DESIRE-DRIVEN CAPTION:**\n`;
    message += `❌ INFORMATIVE (Weak): "Tablets with 8-hour battery, 64GB storage, and educational apps. KES 12,999."\n\n`;
    message += `✅ DESIRE-DRIVEN (Strong): "Your child's backpack weighs 8kg. They're struggling. Switch to digital learning - all textbooks, all apps, one lightweight tablet. 8-hour battery means full school day covered. 10,000+ parents already made the switch. KES 12,999 or pay KES 2,000/month. Limited stock - 50 left this week. Give your child the advantage."\n\n`;
    
    message += `**PERSUASION CHECKLIST:**\n`;
    message += `Before finalizing, ask:\n`;
    message += `- Does this make them FEEL something (not just know something)?\n`;
    message += `- Is there urgency (reason to act NOW, not later)?\n`;
    message += `- Did I show transformation (before → after)?\n`;
    message += `- Is there social proof (others already benefiting)?\n`;
    message += `- Did I address objections (price, complexity, risk)?\n`;
    message += `- Is there a clear, compelling CTA?\n`;
    message += `- Would I personally feel compelled to buy after reading this?\n\n`;
    
    message += `**EMOTIONAL TRIGGERS TO USE:**\n`;
    message += `- Fear of missing out (FOMO)\n`;
    message += `- Fear of loss (losing money, time, opportunities)\n`;
    message += `- Desire for status (be ahead, be first, be elite)\n`;
    message += `- Desire for ease (remove friction, save time)\n`;
    message += `- Desire for security (safety, protection, guarantee)\n`;
    message += `- Desire for belonging (join others, be part of community)\n`;
    message += `- Desire for transformation (better life, better results)\n`;
    message += `- Parental love (for kids products - safety, success, happiness)\n\n`;
    
    message += `**EXAMPLES - RETAIL (Direct Selling):**\n`;
    message += `❌ WRONG: "In the dynamic world of Nairobi, time and efficiency are the currencies of success. Our Zentech..."\n`;
    message += `✅ RIGHT: "Zentech tablets from KES 12,999. Perfect for urban professionals on the go. Stay connected, stream entertainment, manage work anywhere. Kids-friendly content included. Shop now."\n\n`;
    
    message += `❌ WRONG: "Picture this: Exams are looming, and the pressure's mounting. Then, a Zentech tablet appears..."\n`;
    message += `✅ RIGHT: "Study together, succeed together. Zentech tablets from KES 12,999 make group learning easy. Share notes, access educational content, collaborate on projects. Available now."\n\n`;
    
    message += `**EXAMPLES - SERVICE (Direct Benefit):**\n`;
    message += `❌ WRONG: "Imagine a world where financial barriers don't dictate your choices..."\n`;
    message += `✅ RIGHT: "Your supplier needs payment NOW. Open app. Three taps. Done. No bank queues, no delays. Instant payments that keep your business moving."\n\n`;
    
    message += `❌ WRONG: "In the fast-paced world of modern business, timing is everything..."\n`;
    message += `✅ RIGHT: "Payroll is due Friday. With Paya, payments clear instantly. Your team gets paid on time, every time. Zero delays, zero excuses."\n\n`;
    
    message += `**CAPTION QUALITY TEST:**\n`;
    message += `Before finalizing, ask:\n`;
    message += `- Did I lead with product/benefit or scene-setting? (Must be product/benefit)\n`;
    message += `- Is this under 50 words? (Retail should be 30-40, service can be 50-100)\n`;
    message += `- Would a salesperson say this or a novelist? (Must be salesperson)\n`;
    message += `- Are benefits listed directly or buried after intro? (Must be direct)\n`;
    message += `- Does it sound like advertising copy or creative writing? (Must be advertising)\n\n`;
    
    message += `**CONTENT REQUIREMENTS:**\n`;
    message += `1. Headline (4-6 words that match the main visual element)\n`;
    message += `2. Subheadline (15-25 words that expand on the headline's promise)\n`;
    message += `3. Caption (50-100 words ACTION-ORIENTED story from headline/subheadline - NOT picture description)\n`;
    message += `4. Call-to-Action (2-4 words matching the benefit)\n`;
    message += `5. Hashtags (${safePlatform.toLowerCase() === 'instagram' ? '5' : '3'} relevant tags)\n\n`;

    message += `Return as JSON with both content and design specifications:\n`;
    message += `{\n`;
    message += `  "content": {\n`;
    message += `    "headline": "4-6 words that match the main visual element",\n`;
    message += `    "subheadline": "15-25 words that describe what's happening in the scene",\n`;
    message += `    "caption": "50-100 words story that the visual demonstrates",\n`;
    message += `    "cta": "2-4 words matching the action in the image",\n`;
    message += `    "hashtags": ["relevant", "tags"]\n`;
    message += `  },\n`;
    message += `  "design_specifications": {\n`;
    message += `    "hero_element": "Main focal point of the image",\n`;
    message += `    "scene_description": "Detailed visual scene that supports the content",\n`;
    message += `    "text_placement": "Where each text element should be positioned",\n`;
    message += `    "color_scheme": "How brand colors should be applied",\n`;
    message += `    "mood_direction": "Specific visual mood and atmosphere"\n`;
    message += `  },\n`;
    message += `  "alignment_validation": "Explain how content and visuals work together as one unified story"\n`;
    message += `}`;

    return message;
  }

  /**
   * Wait for assistant run to complete with enhanced retry logic
   */
  private async waitForCompletion(threadId: string, runId: string, maxWaitTime = 180000): Promise<string> {
    const startTime = Date.now();
    let lastStatus = '';
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    console.log(`⏳ [Assistant Manager] Waiting for completion - Thread: ${threadId}, Run: ${runId}`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Use retry logic for status checks
        const run = await withRetry(
          () => openai.beta.threads.runs.retrieve(runId, { thread_id: threadId }),
          'Check Run Status',
          'quickOperations'
        );

        // Reset error counter on successful status check
        consecutiveErrors = 0;

        // Log status changes
        if (run.status !== lastStatus) {
          console.log(`🔄 [Assistant Manager] Run status: ${run.status}`);
          lastStatus = run.status;
        }

        if (run.status === 'completed') {
          // Get messages with retry
          const messages = await withRetry(
            () => openai.beta.threads.messages.list(threadId),
            'Get Thread Messages',
            'quickOperations'
          );
          const lastMessage = messages.data[0];

          if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
            const duration = Date.now() - startTime;
            console.log(`✅ [Assistant Manager] Run completed successfully in ${duration}ms`);
            return lastMessage.content[0].text.value;
          }

          throw new Error('No text response from assistant');
        }

        if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
          throw new Error(`Assistant run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
        }

        // Adaptive polling interval based on run status
        let pollInterval = 1000; // Default 1 second
        if (run.status === 'in_progress') {
          pollInterval = 2000; // Slower polling when actively processing
        } else if (run.status === 'queued') {
          pollInterval = 3000; // Even slower when queued
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        consecutiveErrors++;
        console.warn(`⚠️ [Assistant Manager] Status check error ${consecutiveErrors}/${maxConsecutiveErrors}:`, error);

        // If too many consecutive errors, fail fast
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`Too many consecutive status check failures: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Wait longer before retrying after error
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const duration = Date.now() - startTime;
    throw new Error(`Assistant run timed out after ${duration}ms (max: ${maxWaitTime}ms)`);
  }

  /**
   * Parse assistant response
   * Extracts JSON from response text
   */
  private parseResponse(responseText: string): AssistantContentResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ [Assistant Manager] No JSON found in response:', responseText);
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields in new nested structure
      if (!parsed.content || !parsed.content.headline || !parsed.content.caption || !parsed.content.cta) {
        console.error('❌ [Assistant Manager] Missing required content fields:', parsed);
        throw new Error('Missing required content fields in response');
      }

      if (!parsed.design_specifications) {
        console.error('❌ [Assistant Manager] Missing design specifications:', parsed);
        throw new Error('Missing design specifications in response');
      }

      return {
        content: {
          headline: parsed.content.headline || '',
          subheadline: parsed.content.subheadline || '',
          caption: parsed.content.caption || '',
          cta: parsed.content.cta || '',
          hashtags: Array.isArray(parsed.content.hashtags) ? parsed.content.hashtags : [],
        },
        design_specifications: {
          hero_element: parsed.design_specifications.hero_element || '',
          scene_description: parsed.design_specifications.scene_description || '',
          text_placement: parsed.design_specifications.text_placement || '',
          color_scheme: parsed.design_specifications.color_scheme || '',
          mood_direction: parsed.design_specifications.mood_direction || '',
        },
        alignment_validation: parsed.alignment_validation || '',
      };
    } catch (error) {
      console.error('❌ [Assistant Manager] Failed to parse response:', error);
      console.error('Response text:', responseText);
      throw new Error(`Invalid response format from assistant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const assistantManager = new AssistantManager();

