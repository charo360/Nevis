/**
 * Example Integration: Content Generation with Credit Tracking
 * 
 * This file demonstrates how to integrate the credit system with actual
 * content generation workflows in your application.
 */

import { withCreditTracking, ModelVersion, GenerationFeature } from '@/lib/credit-integration';

// Example: Social Media Content Generation
export async function generateSocialMediaContent(
  userId: string,
  prompt: string,
  modelVersion: ModelVersion = 'revo-1.5'
) {
  return await withCreditTracking(
    {
      userId,
      modelVersion,
      feature: 'social_media_content',
      generationType: 'social_post',
      metadata: {
        prompt_length: prompt.length,
        content_type: 'social_media'
      }
    },
    async () => {
      // Your actual AI generation logic here
      // This could be OpenAI, Gemini, or any other AI service
      
      // Example implementation:
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: modelVersion,
          type: 'social_media'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  );
}

// Example: Image Generation 
export async function generateImage(
  userId: string,
  prompt: string,
  modelVersion: ModelVersion = 'revo-2.0'
) {
  return await withCreditTracking(
    {
      userId,
      modelVersion,
      feature: 'image_generation',
      generationType: 'ai_image',
      metadata: {
        prompt,
        image_style: 'realistic'
      }
    },
    async () => {
      // Your image generation logic (DALL-E, Midjourney, etc.)
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: modelVersion
        })
      });
      
      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  );
}

// Example: AI Chat Conversation
export async function processChatMessage(
  userId: string,
  message: string,
  conversationHistory: any[] = [],
  modelVersion: ModelVersion = 'revo-1.0'
) {
  return await withCreditTracking(
    {
      userId,
      modelVersion,
      feature: 'ai_chat',
      generationType: 'chat_response',
      metadata: {
        message_length: message.length,
        conversation_length: conversationHistory.length
      }
    },
    async () => {
      // Your chat AI logic here
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: conversationHistory,
          model: modelVersion
        })
      });
      
      if (!response.ok) {
        throw new Error(`Chat processing failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  );
}

// Example: Template Generation
export async function generateTemplate(
  userId: string,
  templateType: string,
  customizations: Record<string, any>,
  modelVersion: ModelVersion = 'revo-1.5'
) {
  return await withCreditTracking(
    {
      userId,
      modelVersion,
      feature: 'template_generation',
      generationType: templateType,
      metadata: {
        template_type: templateType,
        customizations
      }
    },
    async () => {
      // Your template generation logic
      const response = await fetch('/api/ai/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: templateType,
          customizations,
          model: modelVersion
        })
      });
      
      if (!response.ok) {
        throw new Error(`Template generation failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  );
}

// Example: How to use these functions in your components

/*
// In your React component:

import { generateSocialMediaContent } from '@/lib/content-generation-examples';
import { useAuth } from '@/hooks/use-auth-supabase';

export function SocialMediaGenerator() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleGenerate = async () => {
    if (!user || !prompt) return;
    
    setLoading(true);
    try {
      const generation = await generateSocialMediaContent(
        user.id, 
        prompt, 
        'revo-1.5' // 3 credits
      );
      
      if (generation.success) {
        setResult(generation.result);
        // Show success message with credit info
      } else {
        // Handle insufficient credits or other errors
        alert(generation.error);
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <textarea 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your social media prompt..."
      />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Content (3 credits)'}
      </button>
      {result && <div>{JSON.stringify(result)}</div>}
    </div>
  );
}
*/