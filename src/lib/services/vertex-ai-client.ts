/**
 * Vertex AI Direct Client
 * Uses Google Cloud service account credentials to make direct calls to Vertex AI
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface VertexAICredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

interface VertexAIRequest {
  contents: Array<{
    role: string;
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
  }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    responseModalities?: string[];
  };
}

interface VertexAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
    finishReason: string;
  }>;
}

class VertexAIClient {
  private credentials: VertexAICredentials;
  private projectId: string;
  private location: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Secondary fallback credentials
  private secondaryCredentials: VertexAICredentials | null = null;
  private secondaryProjectId: string | null = null;
  private secondaryLocation: string | null = null;
  private secondaryAccessToken: string | null = null;
  private secondaryTokenExpiry: number = 0;

  constructor() {
    // Load primary credentials
    this.loadPrimaryCredentials();

    // Load secondary credentials if enabled
    this.loadSecondaryCredentials();
  }

  private loadPrimaryCredentials() {
    // Prefer loading credentials from environment variable (for Vercel compatibility)
    const envCreds = process.env.VERTEX_AI_CREDENTIALS;
    if (envCreds) {
      try {
        this.credentials = JSON.parse(envCreds);
        this.projectId = process.env.VERTEX_AI_PROJECT_ID || this.credentials.project_id;
        this.location = process.env.VERTEX_AI_LOCATION || 'us-central1';
        console.log('✅ [Vertex AI] Primary credentials loaded from environment variable');
        return;
      } catch (error) {
        throw new Error('🔑 Vertex AI credentials invalid. Please check VERTEX_AI_CREDENTIALS in .env.local');
      }
    }

    // Fallback: load from file (for local/dev)
    const credentialsPath = process.env.VERTEX_AI_CREDENTIALS_PATH || 'proxy-server/vertex-ai-credentials.json';
    const fullPath = join(process.cwd(), credentialsPath);
    try {
      const credentialsData = readFileSync(fullPath, 'utf8');
      this.credentials = JSON.parse(credentialsData);
      this.projectId = process.env.VERTEX_AI_PROJECT_ID || this.credentials.project_id;
      this.location = process.env.VERTEX_AI_LOCATION || 'us-central1';
      console.log('✅ [Vertex AI] Primary credentials loaded from file');
    } catch (error) {
      throw new Error(`🔑 Vertex AI requires credentials. Please add VERTEX_AI_CREDENTIALS to .env.local. Error: ${error}`);
    }
  }

  private loadSecondaryCredentials() {
    // Check if secondary fallback is enabled
    if (process.env.VERTEX_AI_SECONDARY_ENABLED !== 'true') {
      console.log('ℹ️ [Vertex AI] Secondary fallback disabled');
      return;
    }

    // Prefer loading credentials from environment variable (for Vercel/production)
    const envSecondaryCredsString = process.env.VERTEX_AI_SECONDARY_CREDENTIALS;
    if (envSecondaryCredsString) {
      try {
        this.secondaryCredentials = JSON.parse(envSecondaryCredsString);
        this.secondaryProjectId = process.env.VERTEX_AI_SECONDARY_PROJECT_ID || this.secondaryCredentials?.project_id || 'unknown';
        this.secondaryLocation = process.env.VERTEX_AI_SECONDARY_LOCATION || 'us-central1';
        console.log('✅ [Vertex AI] Secondary credentials loaded from environment variable');
        return;
      } catch (error) {
        console.warn('⚠️ [Vertex AI] Failed to parse VERTEX_AI_SECONDARY_CREDENTIALS:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Fallback: load from file (for local/dev)
    try {
      const secondaryKeyFile = process.env.VERTEX_AI_SECONDARY_KEY_FILE || 'vertex-ai-secondary-credentials.json';
      const secondaryPath = join(process.cwd(), secondaryKeyFile);
      const secondaryData = readFileSync(secondaryPath, 'utf8');
      this.secondaryCredentials = JSON.parse(secondaryData);
      this.secondaryProjectId = process.env.VERTEX_AI_SECONDARY_PROJECT_ID || this.secondaryCredentials?.project_id || 'unknown';
      this.secondaryLocation = process.env.VERTEX_AI_SECONDARY_LOCATION || 'us-central1';
      console.log('✅ [Vertex AI] Secondary fallback credentials loaded from file');
    } catch (error) {
      console.warn('⚠️ [Vertex AI] Secondary credentials not available:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get access token using service account credentials
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Create JWT for service account authentication
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: this.credentials.token_uri,
      exp: now + 3600, // 1 hour
      iat: now
    };

    // Create JWT header and payload
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Sign with private key
    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${payloadStr}`);
    const signature = sign.sign(this.credentials.private_key, 'base64url');

    const jwt = `${header}.${payloadStr}.${signature}`;

    // Exchange JWT for access token
    const response = await fetch(this.credentials.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();
    this.accessToken = tokenData.access_token || null;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // Refresh 1 minute early

    return this.accessToken || '';
  }

  /**
   * Get access token for secondary Vertex AI account
   */
  private async getSecondaryAccessToken(): Promise<string> {
    if (!this.secondaryCredentials) {
      throw new Error('Secondary credentials not available');
    }

    // Check if we have a valid token
    if (this.secondaryAccessToken && Date.now() < this.secondaryTokenExpiry) {
      return this.secondaryAccessToken;
    }

    // Create JWT for service account authentication
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.secondaryCredentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: this.secondaryCredentials.token_uri,
      exp: now + 3600, // 1 hour
      iat: now
    };

    // Create JWT header and payload
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Sign with private key
    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${payloadStr}`);
    const signature = sign.sign(this.secondaryCredentials.private_key, 'base64url');

    const jwt = `${header}.${payloadStr}.${signature}`;

    // Exchange JWT for access token
    const response = await fetch(this.secondaryCredentials.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get secondary access token: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();
    this.secondaryAccessToken = tokenData.access_token || null;
    this.secondaryTokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // Refresh 1 minute early

    return this.secondaryAccessToken || '';
  }

  /**
   * Generate content using Vertex AI with fallback support
   */
  async generateContent(
    model: string,
    request: VertexAIRequest
  ): Promise<VertexAIResponse> {
    // Try primary Vertex AI first
    try {
      return await this.generateContentWithCredentials(
        model,
        request,
        this.credentials,
        this.projectId,
        this.location,
        await this.getAccessToken()
      );
    } catch (primaryError) {
      console.warn('⚠️ [Vertex AI] Primary account failed, trying secondary fallback:', primaryError instanceof Error ? primaryError.message : 'Unknown error');

      // Try secondary Vertex AI if available and fallback is enabled
      if (this.secondaryCredentials && process.env.VERTEX_FALLBACK_ENABLED === 'true') {
        try {
          return await this.generateContentWithCredentials(
            model,
            request,
            this.secondaryCredentials,
            this.secondaryProjectId!,
            this.secondaryLocation!,
            await this.getSecondaryAccessToken()
          );
        } catch (secondaryError) {
          console.error('❌ [Vertex AI] Secondary account also failed:', secondaryError instanceof Error ? secondaryError.message : 'Unknown error');
          throw new Error(`Both primary and secondary Vertex AI accounts failed. Primary: ${primaryError instanceof Error ? primaryError.message : 'Unknown'}. Secondary: ${secondaryError instanceof Error ? secondaryError.message : 'Unknown'}`);
        }
      } else {
        // No secondary fallback available
        throw primaryError;
      }
    }
  }

  /**
   * Generate content with specific credentials
   */
  private async generateContentWithCredentials(
    model: string,
    request: VertexAIRequest,
    credentials: VertexAICredentials,
    projectId: string,
    location: string,
    accessToken: string
  ): Promise<VertexAIResponse> {
    // Clean model name (remove any prefixes)
    const cleanModel = model.replace(/^(googleai\/|anthropic\/|openai\/)/, '');

    // Construct Vertex AI endpoint
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${cleanModel}:generateContent`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Generate text content
   */
  async generateText(
    prompt: string,
    model: string = 'gemini-2.5-flash',
    options: {
      temperature?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<{ text: string; finishReason: string }> {
    const request: VertexAIRequest = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxOutputTokens || 16384  // Increased from 8192 to 16384
      }
    };

    const response = await this.generateContent(model, request);

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates returned from Vertex AI');
    }

    const candidate = response.candidates[0];
    const text = candidate.content.parts[0]?.text || '';

    return {
      text,
      finishReason: candidate.finishReason
    };
  }

  /**
   * Generate image content with Gemini 3 Pro support
   */
  async generateImage(
    prompt: string,
    model: string = 'gemini-2.5-flash-image-preview',
    options: {
      temperature?: number;
      maxOutputTokens?: number;
      uploadedImage?: string; // Base64 data URL for user-uploaded image
      logoImage?: string; // Base64 data URL for brand logo
      aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'; // Gemini 3 Pro aspect ratio
      imageSize?: '256' | '512' | '1K' | '2K'; // Gemini 3 Pro image size
      brandColors?: {
        primary?: string;
        accent?: string;
        background?: string;
      };
    } = {}
  ): Promise<{ imageData: string; mimeType: string; finishReason: string }> {
    const parts: any[] = [{ text: prompt }];

    // Add uploaded image if provided (should be added BEFORE logo for proper hierarchy)
    if (options.uploadedImage && options.uploadedImage.startsWith('data:image/')) {
      const [mimeInfo, base64Data] = options.uploadedImage.split(',');
      const mimeType = mimeInfo.split(':')[1].split(';')[0];

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });

      console.log('✅ [Vertex AI Client] Added uploaded image to parts:', {
        mimeType,
        dataLength: base64Data.length
      });
    }

    // Add logo image if provided
    if (options.logoImage) {
      console.log('🔍 [Vertex AI Client] Logo image provided:', {
        hasLogo: !!options.logoImage,
        format: options.logoImage.startsWith('data:') ? 'data-url' : 'url',
        length: options.logoImage.length,
        preview: options.logoImage.substring(0, 50) + '...'
      });
      
      if (options.logoImage.startsWith('data:image/')) {
        const [mimeInfo, base64Data] = options.logoImage.split(',');
        const mimeType = mimeInfo.split(':')[1].split(';')[0];

        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });

        // Add critical logo instruction to the prompt text
        // This is required for the model to understand it must use the provided image as a logo
        const logoInstruction = `\n\n🎯 CRITICAL LOGO REQUIREMENT - THIS IS MANDATORY:
        You MUST include the exact brand logo image that was provided above in your design. This is not optional.
        - Integrate the logo naturally into the layout
        - The logo should be prominently displayed but not overwhelming
        - Position the logo in a professional manner (top-left, top-right, or center as appropriate)
        - Maintain the logo's aspect ratio and clarity
        - Ensure the logo is clearly visible against the background
        - FAILURE TO INCLUDE THE LOGO IS UNACCEPTABLE.`;
        
        // Append instruction to the text part (which is always at index 0)
        parts[0].text += logoInstruction;

        console.log('✅ [Vertex AI Client] Successfully added logo image and instructions to parts:', {
          mimeType,
          dataLength: base64Data.length,
          totalParts: parts.length,
          hasLogoInstructions: parts[0].text.includes('CRITICAL LOGO REQUIREMENT')
        });
      } else {
        console.error('❌ [Vertex AI Client] Logo image provided but INVALID FORMAT (must start with data:image/):', {
          provided: options.logoImage.substring(0, 50) + '...',
          expectedFormat: 'data:image/[type];base64,[data]'
        });
      }
    } else {
      console.log('ℹ️ [Vertex AI Client] No logo image provided for generation');
    }

    // Add brand color instructions if provided
    if (options.brandColors && (options.brandColors.primary || options.brandColors.accent)) {
      console.log('🎨 [Vertex AI Client] Brand colors provided:', {
        primary: options.brandColors.primary,
        accent: options.brandColors.accent,
        background: options.brandColors.background
      });
      
      const brandColorInstruction = `\n\n🎨 CRITICAL BRAND COLOR REQUIREMENT:
You MUST use the following brand colors in your design:
- Primary Color: ${options.brandColors.primary || '#3B82F6'}
- Accent Color: ${options.brandColors.accent || options.brandColors.primary || '#1E40AF'}
- Background Color: ${options.brandColors.background || '#FFFFFF'}
These colors are mandatory and must be prominently featured in the design.`;
      
      // Append brand color instruction to the text part (which is always at index 0)
      parts[0].text += brandColorInstruction;
      
      console.log('✅ [Vertex AI Client] Added brand color instructions to prompt');
    } else {
      console.log('ℹ️ [Vertex AI Client] No brand colors provided for generation');
    }

    // Build generation config with Gemini 3 Pro support
    const generationConfig: any = {
      temperature: options.temperature || 0.7,
      maxOutputTokens: options.maxOutputTokens || 8192,
      responseModalities: ['IMAGE']
    };

    // Add imageConfig for models that support it (Gemini 2.0 Flash Exp, future Gemini 3 Pro)
    if (model.includes('gemini-3-pro-image') || model.includes('gemini-2.0-flash-exp')) {
      generationConfig.imageConfig = {
        aspectRatio: options.aspectRatio || '3:4', // Default to Instagram portrait
        imageSize: options.imageSize || '1K' // Default to high resolution
      };
      console.log('✅ [Vertex AI Client] Using enhanced model with imageConfig:', generationConfig.imageConfig);
    }

    const request: VertexAIRequest = {
      contents: [{
        role: 'user',
        parts
      }],
      generationConfig
    };

    const response = await this.generateContent(model, request);

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates returned from Vertex AI');
    }

    const candidate = response.candidates[0];
    const imagePart = candidate.content.parts[0]?.inlineData;

    if (!imagePart) {
      throw new Error('No image data returned from Vertex AI');
    }

    return {
      imageData: imagePart.data,
      mimeType: imagePart.mimeType,
      finishReason: candidate.finishReason
    };
  }
}

// Export singleton instance

let vertexAIClientInstance: VertexAIClient | null = null;
export function getVertexAIClient(): VertexAIClient {
  if (!vertexAIClientInstance) {
    vertexAIClientInstance = new VertexAIClient();
  }
  return vertexAIClientInstance;
}
