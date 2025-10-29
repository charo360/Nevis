// LLM Integration Layer - Multi-provider support with fallback chains

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { LLMGenerationOptions } from './types'

export class LLMClient {
  private anthropic: Anthropic | null = null
  private openai: OpenAI | null = null
  private google: GoogleGenerativeAI | null = null
  
  private fallbackChain: Array<'claude' | 'gpt4' | 'gemini'> = ['claude', 'gpt4', 'gemini']
  
  constructor() {
    // Initialize clients if API keys are available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    }
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
    
    if (process.env.GOOGLE_API_KEY) {
      this.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
    }
  }
  
  /**
   * Generate content using the specified model or fallback chain
   */
  async generate(options: LLMGenerationOptions): Promise<string> {
    const { prompt, temperature, maxTokens, model } = options
    
    // If model specified, try that first
    const tryModels = model 
      ? [model, ...this.fallbackChain.filter(m => m !== model)]
      : this.fallbackChain
    
    let lastError: Error | null = null
    
    for (const currentModel of tryModels) {
      try {
        console.log(`🤖 Attempting generation with ${currentModel}...`)
        
        switch (currentModel) {
          case 'claude':
            if (this.anthropic) {
              return await this.generateWithClaude(prompt, temperature, maxTokens)
            }
            break
            
          case 'gpt4':
            if (this.openai) {
              return await this.generateWithGPT4(prompt, temperature, maxTokens)
            }
            break
            
          case 'gemini':
            if (this.google) {
              return await this.generateWithGemini(prompt, temperature, maxTokens)
            }
            break
        }
      } catch (error) {
        console.warn(`⚠️ ${currentModel} failed:`, error.message)
        lastError = error as Error
        continue
      }
    }
    
    throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`)
  }
  
  /**
   * Generate with Claude (Anthropic)
   */
  private async generateWithClaude(
    prompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized')
    }
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
    
    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response')
    }
    
    return textContent.text
  }
  
  /**
   * Generate with GPT-4 (OpenAI)
   */
  private async generateWithGPT4(
    prompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized')
    }
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing copywriter with 20+ years of experience.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature,
      max_tokens: maxTokens
    })
    
    return response.choices[0]?.message?.content || ''
  }
  
  /**
   * Generate with Gemini (Google)
   */
  private async generateWithGemini(
    prompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.google) {
      throw new Error('Google AI client not initialized')
    }
    
    const model = this.google.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    })
    
    const result = await model.generateContent(prompt)
    const response = result.response
    return response.text()
  }
  
  /**
   * Estimate cost for generation (approximate)
   */
  estimateCost(model: 'claude' | 'gpt4' | 'gemini', tokens: number): number {
    const costPerMillion = {
      claude: 15.0, // Claude 3.5 Sonnet
      gpt4: 30.0,   // GPT-4 Turbo
      gemini: 7.0   // Gemini 1.5 Pro
    }
    
    return (tokens / 1_000_000) * costPerMillion[model]
  }
  
  /**
   * Check which providers are available
   */
  getAvailableProviders(): Array<'claude' | 'gpt4' | 'gemini'> {
    const available: Array<'claude' | 'gpt4' | 'gemini'> = []
    
    if (this.anthropic) available.push('claude')
    if (this.openai) available.push('gpt4')
    if (this.google) available.push('gemini')
    
    return available
  }
}

// Singleton instance
let llmClientInstance: LLMClient | null = null

export function getLLMClient(): LLMClient {
  if (!llmClientInstance) {
    llmClientInstance = new LLMClient()
  }
  return llmClientInstance
}
