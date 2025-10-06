/**
 * Frontend Integration Example for Website Analysis Multi-Model Fallback
 * 
 * This shows how to integrate the new website analysis system into your Nevis app
 * Replace the existing Genkit-based website analysis with this proxy-based approach
 */

// Types for the new website analysis system
interface WebsiteAnalysisRequest {
  website_content: string;
  website_url: string;
  user_id: string;
  user_tier?: string;
  design_images?: string[];
  temperature?: number;
  max_tokens?: number;
}

interface WebsiteAnalysisResponse {
  success: boolean;
  data: {
    businessName: string;
    businessType: string;
    description: string;
    services: string;
    keyFeatures: string;
    targetAudience: string;
    location: string;
    competitiveAdvantages: string;
    valueProposition: string;
    contactInfo: string;
    socialMedia: string;
    contentStrategy: string;
    callsToAction: string[];
  };
  model_used: string;
  provider_used: string;
  attempt: number;
  user_credits: number;
  analysis_type: string;
}

/**
 * New website analysis function using the proxy server
 * This replaces the existing analyzeBrand function
 */
export async function analyzeWebsiteWithProxy(
  websiteUrl: string,
  websiteContent: string,
  userId: string,
  userTier: string = 'free'
): Promise<WebsiteAnalysisResponse> {
  
  const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:8000';
  
  const payload: WebsiteAnalysisRequest = {
    website_content: websiteContent,
    website_url: websiteUrl,
    user_id: userId,
    user_tier: userTier,
    temperature: 0.3,  // Lower temperature for consistent analysis
    max_tokens: 8192
  };

  try {
    console.log('🌐 Starting website analysis with multi-model fallback...');
    console.log(`📄 Content length: ${websiteContent.length} characters`);
    
    const response = await fetch(`${proxyUrl}/analyze-website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Website analysis failed: ${errorData.detail || response.statusText}`);
    }

    const result: WebsiteAnalysisResponse = await response.json();
    
    console.log(`✅ Website analysis successful!`);
    console.log(`🤖 Model used: ${result.model_used}`);
    console.log(`🔧 Provider: ${result.provider_used}`);
    console.log(`🔄 Attempt: ${result.attempt}/3`);
    console.log(`💳 Credits remaining: ${result.user_credits}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Website analysis failed:', error);
    throw error;
  }
}

/**
 * Updated action function for the Nevis app
 * This replaces the existing analyzeBrandAction in src/app/actions.ts
 */
export async function analyzeBrandActionWithProxy(
  websiteUrl: string,
  designImageUris: string[] = [],
  userId: string = 'default_user',
  userTier: string = 'free'
) {
  try {
    // Step 1: Scrape website content (keep existing scraping logic)
    const scrapeResponse = await fetch('/api/scrape-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: websiteUrl }),
    });

    if (!scrapeResponse.ok) {
      const errorData = await scrapeResponse.json();
      return {
        success: false,
        error: errorData.error || 'Failed to scrape website',
        errorType: errorData.errorType || 'error'
      };
    }

    const scrapeResult = await scrapeResponse.json();
    
    // Step 2: Analyze with new multi-model system
    const analysisResult = await analyzeWebsiteWithProxy(
      websiteUrl,
      scrapeResult.content,
      userId,
      userTier
    );

    if (!analysisResult.success) {
      return {
        success: false,
        error: "Website analysis failed",
        errorType: 'error'
      };
    }

    // Step 3: Validate and return results
    const businessData = analysisResult.data;
    
    if (!businessData.businessName || businessData.businessName.trim().length === 0) {
      return {
        success: false,
        error: "AI could not extract a valid business name from the website.",
        errorType: 'error'
      };
    }

    return {
      success: true,
      data: businessData,
      metadata: {
        model_used: analysisResult.model_used,
        provider_used: analysisResult.provider_used,
        attempt: analysisResult.attempt,
        credits_remaining: analysisResult.user_credits
      }
    };

  } catch (error) {
    console.error('Brand analysis action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: 'error'
    };
  }
}

/**
 * Usage example in a React component
 */
export const WebsiteAnalysisExample = () => {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyzeWebsite = async (websiteUrl: string) => {
    setLoading(true);
    
    try {
      const result = await analyzeBrandActionWithProxy(
        websiteUrl,
        [], // design images
        'user123', // user ID
        'free' // user tier
      );
      
      if (result.success) {
        setAnalysisResult(result.data);
        console.log('🎉 Analysis completed:', result.data);
        
        // Show success message with model info
        if (result.metadata) {
          console.log(`Used ${result.metadata.model_used} (${result.metadata.provider_used})`);
          console.log(`Completed in attempt ${result.metadata.attempt}`);
          console.log(`Credits remaining: ${result.metadata.credits_remaining}`);
        }
      } else {
        console.error('Analysis failed:', result.error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && (
        <div>
          🤖 Analyzing website with multi-model fallback...
          <br />
          <small>Trying Claude 3 Haiku → GPT-4o-mini → GPT-3.5-turbo</small>
        </div>
      )}
      
      {analysisResult && (
        <div>
          <h3>✅ Analysis Complete!</h3>
          <p><strong>Business:</strong> {analysisResult.businessName}</p>
          <p><strong>Type:</strong> {analysisResult.businessType}</p>
          <p><strong>Location:</strong> {analysisResult.location}</p>
          {/* Display other extracted data */}
        </div>
      )}
    </div>
  );
};

/**
 * Environment variables to add to your .env.local:
 * 
 * NEXT_PUBLIC_PROXY_URL=http://localhost:8000
 * 
 * The proxy server handles all the OpenRouter API keys and model fallback logic
 */
