# Multi-Assistant Implementation Guide

## Overview

This guide provides complete code examples for implementing the multi-assistant architecture, if you decide to proceed with this approach.

**⚠️ Important**: Read `MULTI_ASSISTANT_ARCHITECTURE_ANALYSIS.md` first to understand the costs, complexity, and trade-offs.

---

## Step 1: Create Assistant Manager

### `src/ai/assistants/assistant-manager.ts`

```typescript
import OpenAI from 'openai';
import type { BusinessTypeCategory } from '../adaptive/business-type-detector';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  timeout: 60000,
  maxRetries: 3,
});

export interface AssistantContentRequest {
  businessType: BusinessTypeCategory;
  brandProfile: any;
  concept: any;
  imagePrompt: string;
  platform: string;
  marketingAngle?: any;
  useLocalLanguage?: boolean;
}

export interface AssistantContentResponse {
  headline: string;
  subheadline?: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export class AssistantManager {
  private assistantIds: Record<BusinessTypeCategory, string>;
  
  constructor() {
    // Load assistant IDs from environment variables
    this.assistantIds = {
      retail: process.env.OPENAI_ASSISTANT_RETAIL || '',
      service: process.env.OPENAI_ASSISTANT_SERVICE || '',
      saas: process.env.OPENAI_ASSISTANT_SAAS || '',
      food: process.env.OPENAI_ASSISTANT_FOOD || '',
      finance: process.env.OPENAI_ASSISTANT_FINANCE || '',
      healthcare: process.env.OPENAI_ASSISTANT_HEALTHCARE || '',
      realestate: process.env.OPENAI_ASSISTANT_REALESTATE || '',
      education: process.env.OPENAI_ASSISTANT_EDUCATION || '',
      b2b: process.env.OPENAI_ASSISTANT_B2B || '',
      nonprofit: process.env.OPENAI_ASSISTANT_NONPROFIT || '',
    };
  }
  
  /**
   * Generate content using appropriate assistant
   */
  async generateContent(request: AssistantContentRequest): Promise<AssistantContentResponse> {
    const assistantId = this.assistantIds[request.businessType];
    
    if (!assistantId) {
      throw new Error(`No assistant configured for business type: ${request.businessType}`);
    }
    
    console.log(`🤖 Using assistant ${assistantId} for ${request.businessType}`);
    
    // Create thread
    const thread = await openai.beta.threads.create();
    
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
    
    // Wait for completion
    const result = await this.waitForCompletion(thread.id, run.id);
    
    // Parse response
    const response = this.parseResponse(result);
    
    // Clean up thread (optional - costs money to store)
    await openai.beta.threads.del(thread.id);
    
    return response;
  }
  
  /**
   * Build message content for assistant
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
    
    message += `**Business Information:**\n`;
    message += `- Name: ${brandProfile.businessName}\n`;
    message += `- Type: ${brandProfile.businessType}\n`;
    message += `- Location: ${brandProfile.location || 'Global'}\n`;
    message += `- Platform: ${platform}\n\n`;
    
    if (brandProfile.description) {
      message += `**Description:** ${brandProfile.description}\n\n`;
    }
    
    if (brandProfile.services && brandProfile.services.length > 0) {
      message += `**Services:** ${brandProfile.services.join(', ')}\n\n`;
    }
    
    if (brandProfile.targetAudience) {
      message += `**Target Audience:** ${brandProfile.targetAudience}\n\n`;
    }
    
    message += `**Visual Concept:** ${concept.concept}\n\n`;
    
    if (imagePrompt) {
      message += `**Image Elements:** ${imagePrompt}\n\n`;
    }
    
    if (marketingAngle) {
      message += `**Marketing Angle:** ${marketingAngle.name}\n`;
      message += `${marketingAngle.description}\n\n`;
    }
    
    if (useLocalLanguage && brandProfile.location) {
      message += `**Language:** Mix English with local ${brandProfile.location} language elements naturally\n\n`;
    }
    
    // Add product catalog for retail
    if (request.businessType === 'retail' && brandProfile.productCatalog) {
      message += `**Available Products:**\n`;
      brandProfile.productCatalog.slice(0, 5).forEach((product: any) => {
        message += `- ${product.name}`;
        if (product.price) message += ` (${product.price})`;
        if (product.discount) message += ` - ${product.discount}`;
        message += `\n`;
      });
      message += `\n`;
    }
    
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
    
    while (Date.now() - startTime < maxWaitTime) {
      const run = await openai.beta.threads.runs.retrieve(threadId, runId);
      
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
    
    throw new Error('Assistant run timed out');
  }
  
  /**
   * Parse assistant response
   */
  private parseResponse(responseText: string): AssistantContentResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        headline: parsed.headline || '',
        subheadline: parsed.subheadline || '',
        caption: parsed.caption || '',
        cta: parsed.cta || '',
        hashtags: parsed.hashtags || [],
      };
    } catch (error) {
      console.error('Failed to parse assistant response:', error);
      throw new Error('Invalid response format from assistant');
    }
  }
}
```

---

## Step 2: Create Assistant Configurations

### `src/ai/assistants/assistant-configs.ts`

```typescript
import type { BusinessTypeCategory } from '../adaptive/business-type-detector';

export interface AssistantConfig {
  name: string;
  model: string;
  instructions: string;
  tools?: Array<{ type: string }>;
}

export const ASSISTANT_CONFIGS: Record<BusinessTypeCategory, AssistantConfig> = {
  retail: {
    name: 'Revo 2.0 - Retail Business Assistant',
    model: 'gpt-4-turbo-preview',
    instructions: `You are a specialized marketing content generator for retail and e-commerce businesses.

CORE REQUIREMENTS:
- Always include specific product names and pricing
- Use transactional CTAs: "Shop Now", "Buy Today", "Order Now"
- Emphasize stock status and urgency
- Include trust signals (warranty, authenticity, quality)

CONTENT STRUCTURE:
- Headline: 4-6 words, product-focused
- Subheadline: 15-25 words, benefit-driven
- Caption: 50-100 words, includes pricing and features
- CTA: Transactional and urgent

MARKETING ANGLES:
- Price-focused: Emphasize savings and value
- Product launch: Highlight new arrivals
- Seasonal/sale: Create urgency with limited-time offers
- Bundle/package: Show combined value

BANNED PATTERNS:
- Generic corporate jargon
- Vague claims without specifics
- Repetitive formulas

Always return valid JSON format.`,
    tools: [{ type: 'code_interpreter' }],
  },
  
  service: {
    name: 'Revo 2.0 - Service Business Assistant',
    model: 'gpt-4-turbo-preview',
    instructions: `You are a specialized marketing content generator for service-based businesses.

CORE REQUIREMENTS:
- Highlight expertise and credentials
- Use consultation CTAs: "Book Appointment", "Schedule Consultation"
- Focus on problem-solution approach
- Show transformation and results

CONTENT STRUCTURE:
- Headline: 4-6 words, expertise-focused
- Subheadline: 15-25 words, problem-solution
- Caption: 50-100 words, emphasizes outcomes
- CTA: Consultation-oriented

MARKETING ANGLES:
- Expertise/credential: Show qualifications
- Process/methodology: Explain approach
- Specialization: Highlight niche expertise
- Emergency/urgent: For time-sensitive services

Always return valid JSON format.`,
  },
  
  saas: {
    name: 'Revo 2.0 - SaaS Business Assistant',
    model: 'gpt-4-turbo-preview',
    instructions: `You are a specialized marketing content generator for SaaS and digital products.

CORE REQUIREMENTS:
- Emphasize feature benefits, not just features
- Use trial CTAs: "Try Free", "Start Free Trial"
- Show use-case scenarios
- Highlight ease of use

CONTENT STRUCTURE:
- Headline: 4-6 words, benefit-focused
- Subheadline: 15-25 words, use-case driven
- Caption: 50-100 words, includes ROI
- CTA: Trial-oriented

MARKETING ANGLES:
- Feature comparison: Show advantages
- Integration: Highlight compatibility
- Automation: Emphasize time-saving
- ROI/cost-savings: Quantify value

Always return valid JSON format.`,
  },
  
  food: {
    name: 'Revo 2.0 - Food & Beverage Assistant',
    model: 'gpt-4-turbo-preview',
    instructions: `You are a specialized marketing content generator for food and beverage businesses.

CORE REQUIREMENTS:
- Use sensory language (taste, texture, aroma)
- Feature signature dishes
- Use dining CTAs: "Reserve Table", "Order Now"
- Include location/delivery info

CONTENT STRUCTURE:
- Headline: 4-6 words, appetite-appeal
- Subheadline: 15-25 words, sensory-driven
- Caption: 50-100 words, mouth-watering
- CTA: Dining-oriented

MARKETING ANGLES:
- Signature dish: Highlight specialties
- Cuisine/style: Emphasize authenticity
- Occasion: Target specific events
- Dietary: Accommodate preferences

Always return valid JSON format.`,
  },
  
  finance: {
    name: 'Revo 2.0 - Financial Services Assistant',
    model: 'gpt-4-turbo-preview',
    instructions: `You are a specialized marketing content generator for financial services.

CORE REQUIREMENTS:
- Emphasize security and trust
- Show rates/fees transparently
- Quantify financial benefits
- Use low-friction CTAs: "Learn More", "Get Quote"

CONTENT STRUCTURE:
- Headline: 4-6 words, trust-focused
- Subheadline: 15-25 words, benefit-driven
- Caption: 50-100 words, includes ROI
- CTA: Low-friction

MARKETING ANGLES:
- Security/protection: Emphasize safety
- ROI/growth: Show financial gains
- Simplification: Make finance easy
- Speed/convenience: Highlight efficiency

Always return valid JSON format.`,
  },
  
  healthcare: {
    name: 'Revo 2.0 - Healthcare Assistant',
    model: 'gpt-4-turbo-preview',
    instructions: `You are a specialized marketing content generator for healthcare businesses.

CORE REQUIREMENTS:
- Focus on health outcomes
- Show professional expertise
- Emphasize patient-centered care
- Use appointment CTAs: "Book Appointment"

CONTENT STRUCTURE:
- Headline: 4-6 words, care-focused
- Subheadline: 15-25 words, outcome-driven
- Caption: 50-100 words, emphasizes quality
- CTA: Appointment-oriented

MARKETING ANGLES:
- Prevention: Emphasize proactive care
- Expertise: Show credentials
- Technology: Highlight modern facilities
- Results: Show patient outcomes

Always return valid JSON format.`,
  },
  
  // Add remaining business types...
  realestate: { name: '', model: 'gpt-4-turbo-preview', instructions: '' },
  education: { name: '', model: 'gpt-4-turbo-preview', instructions: '' },
  b2b: { name: '', model: 'gpt-4-turbo-preview', instructions: '' },
  nonprofit: { name: '', model: 'gpt-4-turbo-preview', instructions: '' },
};
```

---

## Step 3: Create Assistants in OpenAI Dashboard

### Script to Create Assistants

```typescript
// scripts/create-assistants.ts

import OpenAI from 'openai';
import { ASSISTANT_CONFIGS } from '../src/ai/assistants/assistant-configs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function createAssistants() {
  console.log('Creating OpenAI Assistants for Revo 2.0...\n');
  
  const envVars: string[] = [];
  
  for (const [businessType, config] of Object.entries(ASSISTANT_CONFIGS)) {
    if (!config.instructions) {
      console.log(`⏭️  Skipping ${businessType} (no instructions)`);
      continue;
    }
    
    console.log(`Creating assistant for ${businessType}...`);
    
    const assistant = await openai.beta.assistants.create({
      name: config.name,
      model: config.model,
      instructions: config.instructions,
      tools: config.tools || [],
    });
    
    console.log(`✅ Created: ${assistant.id}`);
    envVars.push(`OPENAI_ASSISTANT_${businessType.toUpperCase()}=${assistant.id}`);
  }
  
  console.log('\n📋 Add these to your .env file:\n');
  envVars.forEach(line => console.log(line));
}

createAssistants().catch(console.error);
```

Run with:
```bash
npx ts-node scripts/create-assistants.ts
```

---

## Step 4: Integrate with Revo 2.0 Service

### Modify `src/ai/revo-2.0-service.ts`

```typescript
// Add imports at top
import { AssistantManager } from './assistants/assistant-manager';
import { detectBusinessType } from './adaptive/business-type-detector';

// Initialize assistant manager
const assistantManager = new AssistantManager();

// Modify generateCaptionAndHashtags function
export async function generateCaptionAndHashtags(
  options: Revo20GenerationOptions,
  concept: any,
  imagePrompt: string,
  imageUrl?: string,
  textGenerator: TextGenerationHandler = defaultClaudeGenerator
): Promise<{
  caption: string;
  hashtags: string[];
  headline?: string;
  subheadline?: string;
  cta?: string;
}> {
  const { businessType, brandProfile, platform } = options;
  
  // Detect business type
  const detection = detectBusinessType(brandProfile);
  
  // Check if we should use assistants (feature flag)
  const useAssistants = shouldUseAssistants(detection.primaryType);
  
  if (useAssistants) {
    console.log(`🤖 Using OpenAI Assistant for ${detection.primaryType}`);
    
    try {
      const response = await assistantManager.generateContent({
        businessType: detection.primaryType,
        brandProfile: brandProfile,
        concept: concept,
        imagePrompt: imagePrompt,
        platform: platform,
        marketingAngle: assignMarketingAngle(getBrandKey(brandProfile, platform), options),
        useLocalLanguage: options.useLocalLanguage,
      });
      
      return {
        headline: response.headline,
        subheadline: response.subheadline,
        caption: response.caption,
        cta: response.cta,
        hashtags: response.hashtags,
      };
    } catch (error) {
      console.error('❌ Assistant generation failed, falling back to adaptive framework:', error);
      // Fall through to adaptive framework
    }
  }
  
  // Use existing adaptive framework (current implementation)
  console.log(`🎯 Using Adaptive Framework for ${detection.primaryType}`);
  // ... existing code ...
}

function shouldUseAssistants(businessType: string): boolean {
  const rolloutPercentages: Record<string, number> = {
    retail: parseFloat(process.env.ASSISTANT_ROLLOUT_RETAIL || '0'),
    service: parseFloat(process.env.ASSISTANT_ROLLOUT_SERVICE || '0'),
    saas: parseFloat(process.env.ASSISTANT_ROLLOUT_SAAS || '0'),
    food: parseFloat(process.env.ASSISTANT_ROLLOUT_FOOD || '0'),
    finance: parseFloat(process.env.ASSISTANT_ROLLOUT_FINANCE || '0'),
    healthcare: parseFloat(process.env.ASSISTANT_ROLLOUT_HEALTHCARE || '0'),
  };
  
  const percentage = rolloutPercentages[businessType] || 0;
  return Math.random() * 100 < percentage;
}
```

---

## Step 5: Environment Configuration

### `.env`

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-...

# Assistant IDs (from Step 3)
OPENAI_ASSISTANT_RETAIL=asst_...
OPENAI_ASSISTANT_SERVICE=asst_...
OPENAI_ASSISTANT_SAAS=asst_...
OPENAI_ASSISTANT_FOOD=asst_...
OPENAI_ASSISTANT_FINANCE=asst_...
OPENAI_ASSISTANT_HEALTHCARE=asst_...

# Gradual Rollout (0-100)
ASSISTANT_ROLLOUT_RETAIL=10
ASSISTANT_ROLLOUT_SERVICE=0
ASSISTANT_ROLLOUT_SAAS=0
ASSISTANT_ROLLOUT_FOOD=0
ASSISTANT_ROLLOUT_FINANCE=0
ASSISTANT_ROLLOUT_HEALTHCARE=0
```

---

## Testing

### Test Script

```typescript
// scripts/test-assistants.ts

import { AssistantManager } from '../src/ai/assistants/assistant-manager';

const testBrands = {
  retail: {
    businessName: 'TechHub Electronics',
    businessType: 'Electronics Store',
    description: 'We sell smartphones and laptops',
    location: 'Nairobi, Kenya',
    productCatalog: [
      { name: 'iPhone 15 Pro', price: 'KES 145,000', discount: '12% off' }
    ]
  },
  // Add more test brands...
};

async function testAssistants() {
  const manager = new AssistantManager();
  
  for (const [type, brand] of Object.entries(testBrands)) {
    console.log(`\nTesting ${type} assistant...`);
    
    const result = await manager.generateContent({
      businessType: type as any,
      brandProfile: brand,
      concept: { concept: 'Modern tech showcase' },
      imagePrompt: 'Smartphone in hand',
      platform: 'Instagram',
    });
    
    console.log('Result:', JSON.stringify(result, null, 2));
  }
}

testAssistants().catch(console.error);
```

---

## Monitoring

### Add Logging

```typescript
// src/ai/assistants/assistant-manager.ts

async generateContent(request: AssistantContentRequest): Promise<AssistantContentResponse> {
  const startTime = Date.now();
  
  try {
    const result = await this.generateContentInternal(request);
    
    // Log success metrics
    console.log('✅ Assistant generation successful:', {
      businessType: request.businessType,
      duration: Date.now() - startTime,
      headline: result.headline,
    });
    
    return result;
  } catch (error) {
    // Log failure metrics
    console.error('❌ Assistant generation failed:', {
      businessType: request.businessType,
      duration: Date.now() - startTime,
      error: error.message,
    });
    
    throw error;
  }
}
```

---

## Summary

This implementation guide provides all the code needed to implement the multi-assistant architecture. However, **please review the cost and complexity analysis** in `MULTI_ASSISTANT_ARCHITECTURE_ANALYSIS.md` before proceeding.

**Key Takeaways**:
- 80% cost increase
- 700-1500ms latency increase
- More complex to maintain
- Vendor lock-in to OpenAI

**Recommendation**: Improve the current adaptive framework instead of switching to multi-assistant architecture.

