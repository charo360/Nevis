/**
 * Logo Normalization Service
 * Ensures logos are standardized to prevent them from affecting AI design dimensions
 */

export interface LogoNormalizationOptions {
  standardSize?: number;
  quality?: number;
  format?: 'png' | 'jpeg';
  backgroundColor?: string;
}

export interface NormalizedLogoResult {
  dataUrl: string;
  originalDimensions: { width: number; height: number };
  normalizedDimensions: { width: number; height: number };
  aspectRatio: number;
  format: string;
}

export class LogoNormalizationService {
  private static readonly DEFAULT_OPTIONS: Required<LogoNormalizationOptions> = {
    standardSize: 200,
    quality: 0.9,
    format: 'png',
    backgroundColor: 'transparent'
  };

  /**
   * Normalize logo to standard dimensions to prevent AI design size influence
   */
  static async normalizeLogo(
    logoDataUrl: string,
    options: LogoNormalizationOptions = {}
  ): Promise<NormalizedLogoResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // Server-side fallback - return original logo URL
    if (typeof window === 'undefined') {
      return Promise.resolve({
        normalizedUrl: logoDataUrl,
        width: opts.standardSize,
        height: opts.standardSize,
        aspectRatio: 1,
        success: true
      });
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      img.onload = () => {
        const { width: originalWidth, height: originalHeight } = img;
        const originalAspectRatio = originalWidth / originalHeight;

        // Always create a standardized canvas size
        canvas.width = opts.standardSize;
        canvas.height = opts.standardSize;

        // Calculate scaling to fit logo within standard size while maintaining aspect ratio
        const scale = Math.min(opts.standardSize / originalWidth, opts.standardSize / originalHeight);
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;

        // Center the logo in the standard canvas
        const x = (opts.standardSize - scaledWidth) / 2;
        const y = (opts.standardSize - scaledHeight) / 2;

        // Set background
        if (opts.backgroundColor !== 'transparent') {
          ctx.fillStyle = opts.backgroundColor;
          ctx.fillRect(0, 0, opts.standardSize, opts.standardSize);
        } else {
          ctx.clearRect(0, 0, opts.standardSize, opts.standardSize);
        }

        // Draw logo centered and scaled
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        // Convert to data URL with specified format and quality
        const mimeType = opts.format === 'png' ? 'image/png' : 'image/jpeg';
        const normalizedDataUrl = canvas.toDataURL(mimeType, opts.quality);

        resolve({
          dataUrl: normalizedDataUrl,
          originalDimensions: { width: originalWidth, height: originalHeight },
          normalizedDimensions: { width: opts.standardSize, height: opts.standardSize },
          aspectRatio: originalAspectRatio,
          format: opts.format
        });
      };

      img.onerror = () => reject(new Error('Failed to load logo image'));
      img.src = logoDataUrl;
    });
  }

  /**
   * Normalize logo from URL (for storage URLs)
   */
  static async normalizeLogoFromUrl(
    logoUrl: string,
    options: LogoNormalizationOptions = {}
  ): Promise<NormalizedLogoResult> {
    try {
      // Fetch the image and convert to data URL first
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = reader.result as string;
            const result = await this.normalizeLogo(dataUrl, options);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read logo file'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to fetch logo from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get AI prompt instructions for normalized logo
   */
  static getLogoPromptInstructions(normalizedResult: NormalizedLogoResult): string {
    const { originalDimensions, aspectRatio } = normalizedResult;
    
    let shapeDescription = 'square';
    if (aspectRatio > 1.5) {
      shapeDescription = 'horizontal/wide';
    } else if (aspectRatio < 0.67) {
      shapeDescription = 'vertical/tall';
    }

    return `
🎯 LOGO INTEGRATION INSTRUCTIONS:
- The provided logo has been normalized to 200x200px for consistent processing
- Original logo was ${shapeDescription} (${originalDimensions.width}x${originalDimensions.height}px)
- Logo aspect ratio: ${aspectRatio.toFixed(2)}
- CRITICAL: The logo size should NOT influence the overall design dimensions
- Design must remain exactly 992x1056px regardless of logo size or shape
- Logo should be integrated naturally but sized appropriately within the design
- Logo placement should be prominent but not dominate the entire design space
- Maintain design composition balance with logo as one element among others`;
  }

  /**
   * Validate if logo needs normalization
   */
  static needsNormalization(logoDataUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        // Check if logo is not already standardized or is too large/small
        const isStandardSize = width === 200 && height === 200;
        const isTooLarge = width > 400 || height > 400;
        const isTooSmall = width < 50 || height < 50;
        const hasExtremeAspectRatio = (width / height) > 3 || (height / width) > 3;
        
        resolve(!isStandardSize || isTooLarge || isTooSmall || hasExtremeAspectRatio);
      };
      img.onerror = () => resolve(true); // If can't load, assume needs normalization
      img.src = logoDataUrl;
    });
  }
}
