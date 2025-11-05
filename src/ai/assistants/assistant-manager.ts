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
 * Response structure from assistant
 */
export interface AssistantContentResponse {
  headline: string;
  subheadline?: string;
  caption: string;
  cta: string;
  hashtags: string[];
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

    try {
      // Create thread
      const thread = await openai.beta.threads.create();
      console.log(`📝 [Assistant Manager] Created thread: ${thread.id}`);

      // Build message content
      const messageContent = this.buildMessageContent(request);

      // Add message to thread
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: messageContent,
      });

      // Run assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
      });
      console.log(`🏃 [Assistant Manager] Started run: ${run.id}`);

      // Wait for completion
      const result = await this.waitForCompletion(thread.id, run.id);

      // Parse response
      const response = this.parseResponse(result);

      // Clean up thread (optional - saves storage costs)
      try {
        await openai.beta.threads.delete(thread.id);
        console.log(`🗑️  [Assistant Manager] Deleted thread: ${thread.id}`);
      } catch (error) {
        console.warn(`⚠️  Failed to delete thread: ${error}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ [Assistant Manager] Generation successful in ${duration}ms`);
      console.log(`📊 [Assistant Manager] Headline: "${response.headline}"`);

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [Assistant Manager] Generation failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Build message content for assistant
   * This is generic - works for all business types
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

    let message = `Generate social media content for the following business:\n\n`;

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

    // Visual Concept
    message += `**Visual Concept:** ${concept.concept}\n\n`;

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

    // Content Requirements
    message += `Please generate:\n`;
    message += `1. Headline (4-6 words)\n`;
    message += `2. Subheadline (15-25 words)\n`;
    message += `3. Caption (50-100 words)\n`;
    message += `4. Call-to-Action (2-4 words)\n`;
    message += `5. Hashtags (${platform.toLowerCase() === 'instagram' ? '5' : '3'} tags)\n\n`;

    message += `Return as JSON:\n`;
    message += `{\n`;
    message += `  "headline": "...",\n`;
    message += `  "subheadline": "...",\n`;
    message += `  "caption": "...",\n`;
    message += `  "cta": "...",\n`;
    message += `  "hashtags": ["...", "...", "..."]\n`;
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

      // Validate required fields
      if (!parsed.headline || !parsed.caption || !parsed.cta) {
        console.error('❌ [Assistant Manager] Missing required fields:', parsed);
        throw new Error('Missing required fields in response');
      }

      return {
        headline: parsed.headline || '',
        subheadline: parsed.subheadline || '',
        caption: parsed.caption || '',
        cta: parsed.cta || '',
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
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

