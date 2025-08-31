/**
 * Canvas-based Text Overlay Service
 * Browser-based alternative to Python PIL/Pillow service
 */

export interface CanvasTextOverlayOptions {
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  fontFamily?: string;
  addBackground?: boolean;
  padding?: number;
}

export class CanvasTextOverlay {
  /**
   * Overlay text on a background image using HTML5 Canvas
   */
  async overlayText(
    imageUrl: string,
    text: string,
    options: CanvasTextOverlayOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🎨 Starting canvas text overlay...');
        console.log('📝 Text to overlay:', text);

        // Create image element
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Could not get canvas context');
            }

            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw background image
            ctx.drawImage(img, 0, 0);

            // Apply text overlay
            this.drawTextOverlay(ctx, text, canvas.width, canvas.height, options);

            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            
            console.log('✅ Canvas text overlay completed');
            resolve(dataUrl);
          } catch (error) {
            console.error('❌ Canvas text overlay failed:', error);
            reject(error);
          }
        };

        img.onerror = () => {
          const error = new Error('Failed to load background image');
          console.error('❌ Image load failed:', error);
          reject(error);
        };

        img.src = imageUrl;
      } catch (error) {
        console.error('❌ Canvas text overlay setup failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Draw text overlay on canvas context
   */
  private drawTextOverlay(
    ctx: CanvasRenderingContext2D,
    text: string,
    canvasWidth: number,
    canvasHeight: number,
    options: CanvasTextOverlayOptions
  ): void {
    // Set default options
    const {
      fontSize = this.getOptimalFontSize(text, canvasWidth, canvasHeight),
      fontColor = '#FFFFFF',
      backgroundColor = '#000000',
      backgroundOpacity = 0.7,
      position = 'center',
      fontFamily = 'Arial, sans-serif',
      addBackground = true,
      padding = 20,
    } = options;

    // Set font
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate text position
    const textPosition = this.getTextPosition(
      ctx,
      text,
      canvasWidth,
      canvasHeight,
      position
    );

    // Add semi-transparent background if requested
    if (addBackground) {
      this.drawTextBackground(
        ctx,
        text,
        textPosition.x,
        textPosition.y,
        backgroundColor,
        backgroundOpacity,
        padding
      );
    }

    // Draw text with outline for better readability
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(text, textPosition.x, textPosition.y);

    // Draw main text
    ctx.fillStyle = fontColor;
    ctx.fillText(text, textPosition.x, textPosition.y);
  }

  /**
   * Calculate optimal font size based on canvas and text dimensions
   */
  private getOptimalFontSize(text: string, canvasWidth: number, canvasHeight: number): number {
    const baseSize = Math.min(canvasWidth, canvasHeight) / 15;
    const textLength = text.length;

    let multiplier = 1.0;
    if (textLength > 50) {
      multiplier = 0.7;
    } else if (textLength > 30) {
      multiplier = 0.8;
    } else if (textLength < 15) {
      multiplier = 1.2;
    }

    const fontSize = baseSize * multiplier;
    return Math.max(16, Math.min(fontSize, canvasWidth / 8));
  }

  /**
   * Calculate text position based on alignment
   */
  private getTextPosition(
    ctx: CanvasRenderingContext2D,
    text: string,
    canvasWidth: number,
    canvasHeight: number,
    position: string
  ): { x: number; y: number } {
    let x: number, y: number;

    switch (position) {
      case 'top':
        x = canvasWidth / 2;
        y = canvasHeight / 6;
        break;
      case 'bottom':
        x = canvasWidth / 2;
        y = canvasHeight - canvasHeight / 6;
        break;
      case 'left':
        x = canvasWidth / 4;
        y = canvasHeight / 2;
        break;
      case 'right':
        x = (canvasWidth * 3) / 4;
        y = canvasHeight / 2;
        break;
      case 'center':
      default:
        x = canvasWidth / 2;
        y = canvasHeight / 2;
        break;
    }

    return { x, y };
  }

  /**
   * Draw semi-transparent background behind text
   */
  private drawTextBackground(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    backgroundColor: string,
    opacity: number,
    padding: number
  ): void {
    // Measure text
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = parseInt(ctx.font.match(/\d+/)?.[0] || '20');

    // Calculate background rectangle
    const bgX = x - textWidth / 2 - padding;
    const bgY = y - textHeight / 2 - padding;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding * 2;

    // Draw background with opacity
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
    ctx.restore();
  }

  /**
   * Get platform-specific options
   */
  getOptimalOptions(platform: string, businessType: string): CanvasTextOverlayOptions {
    const platformOptions: Record<string, CanvasTextOverlayOptions> = {
      instagram: {
        position: 'center',
        fontFamily: 'Arial, sans-serif',
        addBackground: true,
        backgroundOpacity: 0.7,
      },
      linkedin: {
        position: 'bottom',
        fontFamily: 'Arial, sans-serif',
        addBackground: true,
        backgroundOpacity: 0.8,
        fontColor: '#FFFFFF',
        backgroundColor: '#0077B5',
      },
      twitter: {
        position: 'center',
        fontFamily: 'Arial, sans-serif',
        addBackground: true,
        backgroundOpacity: 0.6,
      },
      facebook: {
        position: 'center',
        fontFamily: 'Arial, sans-serif',
        addBackground: true,
        backgroundOpacity: 0.7,
      },
    };

    return platformOptions[platform.toLowerCase()] || platformOptions.instagram;
  }
}

// Export singleton instance
export const canvasTextOverlay = new CanvasTextOverlay();

/**
 * Utility function for easy canvas text overlay
 */
export async function overlayTextOnImageCanvas(
  backgroundImageUrl: string,
  text: string,
  platform: string = 'instagram',
  businessType: string = 'general',
  customOptions?: CanvasTextOverlayOptions
): Promise<string> {
  const overlay = new CanvasTextOverlay();
  
  // Get optimal options and merge with custom options
  const optimalOptions = overlay.getOptimalOptions(platform, businessType);
  const finalOptions = { ...optimalOptions, ...customOptions };

  return await overlay.overlayText(backgroundImageUrl, text, finalOptions);
}
