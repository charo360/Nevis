/**
 * Claude Client Service
 * Anthropic Claude API integration for superior content generation
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  model?: 'claude-sonnet-4-5-20250929' | 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229' | 'claude-3-haiku-20240307';
}

export interface ClaudeGenerationResult {
  text: string;
  model: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  finishReason: string;
  processingTime: number;
}

class ClaudeClientService {
  private client: Anthropic;
  private static instance: ClaudeClientService;

  private constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ClaudeClientService {
    if (!ClaudeClientService.instance) {
      ClaudeClientService.instance = new ClaudeClientService();
    }
    return ClaudeClientService.instance;
  }

  /**
   * Generate text content using Claude
   */
  async generateText(
    prompt: string,
    model: string = 'claude-sonnet-4-5-20250929',
    options: ClaudeGenerationOptions = {}
  ): Promise<ClaudeGenerationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 [Claude] Starting generation with ${model}`);
      console.log(`🌡️ [Claude] Temperature: ${options.temperature || 0.7}`);
      console.log(`📝 [Claude] Max tokens: ${options.maxTokens || 1000}`);

      const response = await this.client.messages.create({
        model: model as any,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const processingTime = Date.now() - startTime;
      
      // Extract text content
      const textContent = response.content
        .filter(content => content.type === 'text')
        .map(content => (content as any).text)
        .join('');

      const result: ClaudeGenerationResult = {
        text: textContent,
        model: model,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens
        },
        finishReason: response.stop_reason || 'end_turn',
        processingTime
      };

      console.log(`✅ [Claude] Generation completed in ${processingTime}ms`);
      console.log(`📊 [Claude] Tokens used: ${result.tokensUsed.total} (${result.tokensUsed.input} input + ${result.tokensUsed.output} output)`);
      console.log(`📄 [Claude] Content length: ${textContent.length} characters`);

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [Claude] Generation failed:', error);
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('rate_limit')) {
          throw new Error('Claude API rate limit exceeded. Please try again later.');
        } else if (error.message.includes('invalid_api_key')) {
          throw new Error('Invalid Claude API key. Please check your ANTHROPIC_API_KEY environment variable.');
        } else if (error.message.includes('insufficient_quota')) {
          throw new Error('Claude API quota exceeded. Please check your billing.');
        }
      }
      
      throw new Error(`Claude generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test Claude API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 [Claude] Testing API connection...');
      
      const result = await this.generateText(
        'Generate a brief, creative tagline for a fintech company called "TestCorp" in Kenya. Make it engaging and locally relevant.',
        'claude-sonnet-4-5-20250929',
        { 
          temperature: 0.7, 
          maxTokens: 100,
          timeout: 30000 
        }
      );

      console.log('✅ [Claude] Connection test successful!');
      console.log(`📝 [Claude] Sample response: "${result.text.substring(0, 100)}..."`);
      console.log(`📊 [Claude] Test tokens used: ${result.tokensUsed.total}`);
      
      return true;
    } catch (error) {
      console.error('❌ [Claude] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available Claude models
   */
  getAvailableModels(): Array<{
    id: string;
    name: string;
    description: string;
    maxTokens: number;
    strengths: string[];
    bestFor: string[];
  }> {
    return [
      {
        id: 'claude-sonnet-4-5-20250929',
        name: 'Claude Sonnet 4.5',
        description: 'Most advanced Claude model with superior intelligence and creativity',
        maxTokens: 8192,
        strengths: ['Maximum creativity', 'Advanced reasoning', 'Complex content', 'Cultural nuance', 'Code generation'],
        bestFor: ['Premium campaigns', 'Complex business content', 'Creative storytelling', 'Advanced marketing']
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Best balance of intelligence, speed, and cost for content generation',
        maxTokens: 8192,
        strengths: ['Creative writing', 'Marketing copy', 'Business content', 'Cultural nuance'],
        bestFor: ['Marketing campaigns', 'Social media content', 'Business communications', 'Creative copy']
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Highest intelligence and creativity for premium content generation',
        maxTokens: 4096,
        strengths: ['Maximum creativity', 'Complex reasoning', 'Nuanced understanding', 'Premium quality'],
        bestFor: ['Premium campaigns', 'Complex business content', 'Brand strategy', 'High-stakes content']
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fastest and most cost-effective for high-volume content generation',
        maxTokens: 4096,
        strengths: ['Speed', 'Cost efficiency', 'Consistent quality', 'High throughput'],
        bestFor: ['High-volume generation', 'Quick iterations', 'Cost-sensitive projects', 'Rapid prototyping']
      }
    ];
  }

  /**
   * Generate business-focused content with Claude
   */
  async generateBusinessContent(
    businessContext: {
      businessName: string;
      businessType: string;
      location: string;
      services: string[];
      targetAudience: string;
    },
    contentType: 'headline' | 'subheadline' | 'caption' | 'cta',
    requirements: {
      tone: string;
      maxWords: number;
      includeLocalLanguage?: boolean;
      avoidPatterns?: string[];
    },
    options: ClaudeGenerationOptions = {}
  ): Promise<ClaudeGenerationResult> {
    
    const prompt = this.buildBusinessContentPrompt(businessContext, contentType, requirements);
    
    return this.generateText(
      prompt,
      options.model || 'claude-sonnet-4-5-20250929',
      {
        temperature: options.temperature || 0.8, // Higher creativity for marketing content
        maxTokens: options.maxTokens || 500,
        ...options
      }
    );
  }

  /**
   * Build specialized business content prompt
   */
  private buildBusinessContentPrompt(
    businessContext: any,
    contentType: string,
    requirements: any
  ): string {
    return `You are an expert marketing copywriter specializing in ${businessContext.businessType} businesses in ${businessContext.location}.

BUSINESS CONTEXT:
- Company: ${businessContext.businessName}
- Industry: ${businessContext.businessType}
- Location: ${businessContext.location}
- Services: ${businessContext.services.join(', ')}
- Target Audience: ${businessContext.targetAudience}

CONTENT TYPE: ${contentType.toUpperCase()}
REQUIREMENTS:
- Tone: ${requirements.tone}
- Maximum words: ${requirements.maxWords}
- Local language integration: ${requirements.includeLocalLanguage ? 'Yes (30% local, 70% English)' : 'No (English only)'}
${requirements.avoidPatterns ? `- AVOID these patterns: ${requirements.avoidPatterns.join(', ')}` : ''}

CRITICAL INSTRUCTIONS:
- Create compelling, scroll-stopping ${contentType} content
- Use authentic, non-generic language that resonates with ${businessContext.location} audience
- Reference actual business services and benefits
- Avoid corporate jargon and template language
- Make it culturally relevant and locally appropriate
- Ensure it's engaging and conversion-focused

Generate only the ${contentType} content, nothing else:`;
  }
}

// Export singleton instance
export const getClaudeClient = (): ClaudeClientService => {
  return ClaudeClientService.getInstance();
};

export default ClaudeClientService;
