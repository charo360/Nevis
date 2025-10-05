/**
 * Revo 2.0 Proxy Integration Example
 * Shows how to integrate the AI Proxy into your existing Revo services
 */

import { aiProxyClient, getUserIdForProxy } from '@/lib/services/ai-proxy-client';

// Example: Integrating proxy into Revo 2.0 image generation
export async function generateImageWithProxy(
  prompt: string,
  brandProfile?: any
): Promise<string> {
  try {
    console.log('🔒 Using AI Proxy for cost-controlled image generation');
    
    // Check if user has quota remaining
    const userId = getUserIdForProxy();
    const quota = await aiProxyClient.getUserQuota(userId);
    
    if (quota.remaining <= 0) {
      throw new Error(`Monthly quota exceeded. Used ${quota.current_usage}/${quota.monthly_limit} requests this month.`);
    }
    
    console.log(`📊 Quota: ${quota.remaining}/${quota.monthly_limit} requests remaining`);
    
    // Generate image through proxy
    const result = await aiProxyClient.generateImage({
      prompt: prompt,
      user_id: userId,
      model: 'gemini-2.5-flash-image-preview' // Cost-effective model
    });
    
    if (!result.success) {
      throw new Error(`Image generation failed: ${result.error || 'Unknown error'}`);
    }
    
    console.log(`✅ Image generated successfully with ${result.model_used}`);
    console.log(`💰 Estimated cost: ~$0.039`);
    
    return result.data.image_url || result.data;
    
  } catch (error) {
    console.error('❌ Proxy image generation failed:', error);
    throw error;
  }
}

// Example: Integrating proxy into content generation
export async function generateContentWithProxy(
  prompt: string,
  businessType: string
): Promise<{ headline: string; caption: string; hashtags: string[] }> {
  try {
    console.log('🔒 Using AI Proxy for cost-controlled content generation');
    
    const userId = getUserIdForProxy();
    
    // Use the cheapest model for content generation
    const result = await aiProxyClient.generateText({
      prompt: `Generate social media content for ${businessType}: ${prompt}`,
      user_id: userId,
      model: 'gemini-2.5-flash-lite', // Cheapest option
      temperature: 0.7,
      max_tokens: 500
    });
    
    if (!result.success) {
      throw new Error(`Content generation failed: ${result.error || 'Unknown error'}`);
    }
    
    console.log(`✅ Content generated with ${result.model_used}`);
    console.log(`💰 Estimated cost: ~$0.001`);
    
    // Parse the generated content
    const content = result.data.text || result.data;
    
    // Simple parsing - in real implementation, you'd have more sophisticated parsing
    const lines = content.split('\n').filter(line => line.trim());
    const headline = lines[0] || 'Generated Headline';
    const caption = lines[1] || 'Generated caption content';
    const hashtags = lines.slice(2).filter(line => line.includes('#')).map(line => line.trim());
    
    return {
      headline,
      caption,
      hashtags
    };
    
  } catch (error) {
    console.error('❌ Proxy content generation failed:', error);
    throw error;
  }
}

// Example: Complete Revo 2.0 generation with proxy
export async function generateCompletePostWithProxy(
  businessType: string,
  location: string,
  brandProfile?: any
): Promise<{
  image: string;
  headline: string;
  caption: string;
  hashtags: string[];
  cost: number;
  quotaUsed: number;
}> {
  try {
    console.log('🚀 Starting complete post generation through AI Proxy');
    
    const userId = getUserIdForProxy();
    
    // Check quota before starting
    const initialQuota = await aiProxyClient.getUserQuota(userId);
    if (initialQuota.remaining < 2) {
      throw new Error('Insufficient quota for complete post generation (requires 2 requests)');
    }
    
    // Step 1: Generate content (cheap)
    const contentPrompt = `Create engaging social media content for a ${businessType} business in ${location}. Include compelling headline, engaging caption, and relevant hashtags.`;
    
    const content = await generateContentWithProxy(contentPrompt, businessType);
    
    // Step 2: Generate image (more expensive)
    const imagePrompt = `Professional marketing image for ${businessType} business in ${location}. Style: modern, clean, engaging. Include: ${content.headline}`;
    
    const image = await generateImageWithProxy(imagePrompt, brandProfile);
    
    // Check final quota
    const finalQuota = await aiProxyClient.getUserQuota(userId);
    const quotaUsed = initialQuota.current_usage - finalQuota.current_usage;
    
    console.log(`✅ Complete post generated successfully!`);
    console.log(`📊 Quota used: ${quotaUsed} requests`);
    console.log(`💰 Total estimated cost: ~$0.040`);
    
    return {
      image,
      headline: content.headline,
      caption: content.caption,
      hashtags: content.hashtags,
      cost: 0.040, // Estimated cost
      quotaUsed
    };
    
  } catch (error) {
    console.error('❌ Complete post generation failed:', error);
    throw error;
  }
}

// Example: Fallback strategy for when proxy is unavailable
export async function generateWithFallback(
  prompt: string,
  type: 'image' | 'text'
): Promise<any> {
  try {
    // Try proxy first
    if (aiProxyClient.isEnabled()) {
      const userId = getUserIdForProxy();
      
      if (type === 'image') {
        return await aiProxyClient.generateImage({
          prompt,
          user_id: userId,
          model: 'gemini-2.5-flash-image-preview'
        });
      } else {
        return await aiProxyClient.generateText({
          prompt,
          user_id: userId,
          model: 'gemini-2.5-flash-lite'
        });
      }
    } else {
      console.warn('⚠️ AI Proxy disabled, falling back to direct API');
      // Fallback to your existing direct API implementation
      throw new Error('Direct API fallback not implemented - proxy required for cost control');
    }
  } catch (error) {
    console.error('❌ Both proxy and fallback failed:', error);
    throw error;
  }
}

// Example: Quota monitoring utility
export async function checkUserQuotaStatus(userId?: string): Promise<{
  canGenerate: boolean;
  remaining: number;
  warningLevel: 'green' | 'yellow' | 'red';
  message: string;
}> {
  try {
    const actualUserId = userId || getUserIdForProxy();
    const quota = await aiProxyClient.getUserQuota(actualUserId);
    
    let warningLevel: 'green' | 'yellow' | 'red' = 'green';
    let message = `${quota.remaining} requests remaining this month`;
    
    if (quota.remaining <= 0) {
      warningLevel = 'red';
      message = 'Monthly quota exceeded. Upgrade or wait for next month.';
    } else if (quota.remaining <= 5) {
      warningLevel = 'red';
      message = `Only ${quota.remaining} requests left! Consider upgrading.`;
    } else if (quota.remaining <= 10) {
      warningLevel = 'yellow';
      message = `${quota.remaining} requests remaining. Plan accordingly.`;
    }
    
    return {
      canGenerate: quota.remaining > 0,
      remaining: quota.remaining,
      warningLevel,
      message
    };
  } catch (error) {
    console.error('Failed to check quota status:', error);
    return {
      canGenerate: true, // Allow on error
      remaining: 40,
      warningLevel: 'green',
      message: 'Could not check quota status'
    };
  }
}

// Example: Integration into existing API route
export async function handleQuickContentGeneration(
  businessType: string,
  location: string,
  platform: string
): Promise<any> {
  try {
    // Check quota first
    const quotaStatus = await checkUserQuotaStatus();
    if (!quotaStatus.canGenerate) {
      throw new Error(quotaStatus.message);
    }
    
    // Generate content through proxy
    const result = await generateCompletePostWithProxy(businessType, location);
    
    return {
      success: true,
      data: result,
      quota: quotaStatus,
      cost_info: {
        estimated_cost: result.cost,
        cost_per_generation: '$0.039',
        monthly_budget: '$1.56'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      quota: await checkUserQuotaStatus()
    };
  }
}
