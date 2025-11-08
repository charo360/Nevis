/**
 * Assistant Manager - Core Orchestration System
 * 
 * This class manages all OpenAI Assistants for Revo 2.0.
 * It's designed to be completely generic - no business-type specific logic here.
 * All business logic is in assistant-configs.ts.
 */

import OpenAI from 'openai';
import type { BusinessTypeCategory } from '../adaptive/business-type-detector';
import { getAssistantConfig, isAssistantImplemented } from './assistant-configs';
import { openAIFileService } from '@/lib/services/openai-file-service';
import type { BrandDocument } from '@/types/documents';

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
          console.log(`✅ Loaded assistant for ${type}: ${assistantId}`);
        } else {
          console.warn(`⚠️  No assistant ID found for ${type} (${config.envVar})`);
        }
      }
    }
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

      const thread = await openai.beta.threads.create(threadOptions);
      console.log(`📝 [Assistant Manager] Created thread: ${thread.id}`);

      // Build message content
      const messageContent = this.buildMessageContent(request);

      // Add message to thread
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: messageContent,
      });

      // Run assistant with file_search tool if documents are available
      const runOptions: any = {
        assistant_id: assistantId,
      };

      // Enable file_search tool if we have documents
      if (vectorStoreId) {
        runOptions.tools = [
          { type: 'file_search' }
        ];
        console.log(`🔍 [Assistant Manager] Enabled file_search tool for document analysis`);
      }

      const run = await openai.beta.threads.runs.create(thread.id, runOptions);
      console.log(`🏃 [Assistant Manager] Started run: ${run.id}`);

      // Wait for completion
      const result = await this.waitForCompletion(thread.id, run.id);

      // Parse response
      const response = this.parseResponse(result);

      // Clean up resources
      try {
        await openai.beta.threads.delete(thread.id);
        console.log(`🗑️  [Assistant Manager] Deleted thread: ${thread.id}`);

        // Clean up vector store if created
        if (vectorStoreId) {
          await openAIFileService.deleteVectorStore(vectorStoreId);
          console.log(`🗑️  [Assistant Manager] Deleted vector store: ${vectorStoreId}`);
        }

        // Clean up uploaded files
        for (const fileId of uploadedFileIds) {
          await openAIFileService.deleteFile(fileId);
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

      // Clean up resources on error
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

    let message = `Generate perfectly aligned social media content with visual design specifications for optimal content-design integration:\n\n`;

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

    // Content-Design Alignment Requirements
    message += `**CONTENT-DESIGN ALIGNMENT REQUIREMENTS:**\n`;
    message += `1. Headline must introduce the main story theme and match the hero visual element\n`;
    message += `2. Subheadline must expand on the headline's promise and describe the visual scene\n`;
    message += `3. Caption must tell the complete story that the visual elements demonstrate\n`;
    message += `4. CTA must be the natural next step from the caption and match the action shown in the image\n`;
    message += `5. All elements must work together as ONE unified narrative\n`;
    message += `6. Visual specifications must support and enhance the text content\n\n`;

    message += `**VISUAL SPECIFICATIONS FOR DESIGN:**\n`;
    message += `- Text Hierarchy: Headline (largest) > Subheadline > Caption > CTA\n`;
    message += `- Color Usage: Primary (60%), Secondary (30%), Background (10%)\n`;
    message += `- Layout: Clear focal point with balanced composition\n`;
    message += `- Brand Consistency: Use specified colors and style\n`;
    message += `- Platform Optimization: ${platform} format with proper aspect ratio\n\n`;

    message += `**CONTENT REQUIREMENTS:**\n`;
    message += `1. Headline (4-6 words that match the main visual element)\n`;
    message += `2. Subheadline (15-25 words that describe what's happening in the scene)\n`;
    message += `3. Caption (50-100 words story that the visual demonstrates)\n`;
    message += `4. Call-to-Action (2-4 words matching the action in the image)\n`;
    message += `5. Hashtags (${platform.toLowerCase() === 'instagram' ? '5' : '3'} relevant tags)\n\n`;

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
   * Wait for assistant run to complete
   */
  private async waitForCompletion(threadId: string, runId: string, maxWaitTime = 60000): Promise<string> {
    const startTime = Date.now();
    let lastStatus = '';

    console.log(`⏳ [Assistant Manager] Waiting for completion - Thread: ${threadId}, Run: ${runId}`);

    while (Date.now() - startTime < maxWaitTime) {
      const run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });

      // Log status changes
      if (run.status !== lastStatus) {
        console.log(`🔄 [Assistant Manager] Run status: ${run.status}`);
        lastStatus = run.status;
      }

      if (run.status === 'completed') {
        // Get messages
        const messages = await openai.beta.threads.messages.list(threadId);
        const lastMessage = messages.data[0];

        if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
          return lastMessage.content[0].text.value;
        }

        throw new Error('No text response from assistant');
      }

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Assistant run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Assistant run timed out after 60 seconds');
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

