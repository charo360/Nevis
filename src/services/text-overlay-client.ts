/**
 * Text Overlay Client
 * Interfaces with the Python PIL/Pillow text overlay service
 * Falls back to canvas-based overlay if service unavailable
 */

import { overlayTextOnImageCanvas } from './canvas-text-overlay';

export interface TextOverlayOptions {
  font_size?: number;
  font_color?: string;
  bg_color?: string;
  bg_opacity?: number;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  font_family?: string;
  add_background?: boolean;
}

export interface TextOverlayRequest {
  image_url: string;
  text: string;
  options?: TextOverlayOptions;
}

export interface TextOverlayResponse {
  success: boolean;
  image_url?: string;
  error?: string;
  message?: string;
}

export class TextOverlayClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.TEXT_OVERLAY_SERVICE_URL || 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Overlay text on a background image using PIL/Pillow
   */
  async overlayText(request: TextOverlayRequest): Promise<string> {
    try {
      console.log('🎨 Attempting text overlay service...');
      console.log('📝 Text to overlay:', request.text);
      console.log('🖼️ Background image URL:', request.image_url.substring(0, 100) + '...');

      // First check if service is available
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        console.warn('⚠️ Text overlay service not available, using background image only');
        return request.image_url; // Return original background image
      }

      const response = await fetch(`${this.baseUrl}/overlay-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        timeout: 30000, // 30 second timeout
      });

      if (!response.ok) {
        console.warn(`⚠️ Text overlay service error (${response.status}), using background image only`);
        return request.image_url; // Return original background image
      }

      const result: TextOverlayResponse = await response.json();

      if (!result.success) {
        console.warn('⚠️ Text overlay failed, using background image only:', result.error);
        return request.image_url; // Return original background image
      }

      if (!result.image_url) {
        console.warn('⚠️ No image URL returned, using background image only');
        return request.image_url; // Return original background image
      }

      console.log('✅ Text overlay completed successfully');
      return result.image_url;

    } catch (error) {
      console.warn('⚠️ Text overlay service unavailable, trying canvas fallback:', error);

      try {
        // Fallback to canvas-based text overlay
        console.log('🎨 Using canvas-based text overlay as fallback...');
        const canvasResult = await overlayTextOnImageCanvas(
          request.image_url,
          request.text,
          'instagram', // Default platform
          'general'    // Default business type
        );

        console.log('✅ Canvas text overlay completed successfully');
        return canvasResult;
      } catch (canvasError) {
        console.warn('⚠️ Canvas text overlay also failed, using background image only:', canvasError);
        return request.image_url; // Return original background image as final fallback
      }
    }
  }

  /**
   * Check if the text overlay service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000,
      });

      return response.ok;
    } catch (error) {
      console.warn('Text overlay service health check failed:', error);
      return false;
    }
  }

  /**
   * Get optimal text overlay options based on platform and business type
   */
  getOptimalOptions(platform: string, businessType: string, imageText: string): TextOverlayOptions {
    const textLength = imageText.length;

    // Platform-specific optimizations
    const platformOptions: Record<string, Partial<TextOverlayOptions>> = {
      instagram: {
        position: 'center',
        font_family: 'arial',
        add_background: true,
        bg_opacity: 0.7,
      },
      linkedin: {
        position: 'bottom',
        font_family: 'arial',
        add_background: true,
        bg_opacity: 0.8,
        font_color: '#FFFFFF',
        bg_color: '#0077B5', // LinkedIn blue
      },
      twitter: {
        position: 'center',
        font_family: 'arial',
        add_background: true,
        bg_opacity: 0.6,
      },
      facebook: {
        position: 'center',
        font_family: 'arial',
        add_background: true,
        bg_opacity: 0.7,
      },
    };

    // Business type specific adjustments
    const businessTypeAdjustments: Record<string, Partial<TextOverlayOptions>> = {
      'tech': {
        font_color: '#00FF88',
        bg_color: '#000000',
      },
      'healthcare': {
        font_color: '#FFFFFF',
        bg_color: '#2E8B57',
      },
      'finance': {
        font_color: '#FFFFFF',
        bg_color: '#1E3A8A',
      },
      'retail': {
        font_color: '#FFFFFF',
        bg_color: '#DC2626',
      },
      'food': {
        font_color: '#FFFFFF',
        bg_color: '#F59E0B',
      },
    };

    // Text length adjustments
    let fontSizeMultiplier = 1.0;
    if (textLength > 50) {
      fontSizeMultiplier = 0.8;
    } else if (textLength > 30) {
      fontSizeMultiplier = 0.9;
    } else if (textLength < 15) {
      fontSizeMultiplier = 1.2;
    }

    // Combine all options
    const baseOptions = platformOptions[platform.toLowerCase()] || platformOptions.instagram;
    const businessOptions = businessTypeAdjustments[businessType.toLowerCase()] || {};

    return {
      ...baseOptions,
      ...businessOptions,
      // Apply font size multiplier if needed
      ...(fontSizeMultiplier !== 1.0 && { font_size: Math.round(48 * fontSizeMultiplier) }),
    };
  }
}

// Export singleton instance
export const textOverlayClient = new TextOverlayClient();

/**
 * Utility function for easy text overlay
 */
export async function overlayTextOnImage(
  backgroundImageUrl: string,
  text: string,
  platform: string = 'instagram',
  businessType: string = 'general',
  customOptions?: TextOverlayOptions
): Promise<string> {
  const client = new TextOverlayClient();

  // Get optimal options and merge with custom options
  const optimalOptions = client.getOptimalOptions(platform, businessType, text);
  const finalOptions = { ...optimalOptions, ...customOptions };

  return await client.overlayText({
    image_url: backgroundImageUrl,
    text,
    options: finalOptions,
  });
}
