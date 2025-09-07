// Text Detection and OCR Service
export interface DetectedTextRegion {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

export interface TextEditRequest {
  imageUrl: string;
  textEdits: {
    region: DetectedTextRegion;
    newText: string;
  }[];
}

export class TextDetectionService {
  private static instance: TextDetectionService;

  public static getInstance(): TextDetectionService {
    if (!TextDetectionService.instance) {
      TextDetectionService.instance = new TextDetectionService();
    }
    return TextDetectionService.instance;
  }

  /**
   * Detect text in an image using OCR
   * In production, this would integrate with services like:
   * - Google Cloud Vision API
   * - AWS Textract
   * - Azure Computer Vision
   * - Tesseract.js for client-side OCR
   */
  async detectText(imageUrl: string): Promise<DetectedTextRegion[]> {
    try {
      // For now, we'll use a mock implementation
      // In production, replace this with actual OCR service
      return await this.mockOCRDetection(imageUrl);
      
      // Example integration with Tesseract.js:
      // return await this.tesseractOCR(imageUrl);
      
      // Example integration with Google Vision API:
      // return await this.googleVisionOCR(imageUrl);
    } catch (error) {
      console.error('Text detection failed:', error);
      throw new Error('Failed to detect text in image');
    }
  }

  /**
   * Mock OCR implementation for development
   */
  private async mockOCRDetection(imageUrl: string): Promise<DetectedTextRegion[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Analyze image to provide more realistic mock data
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve([]);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Generate mock text regions based on image analysis
        const mockRegions: DetectedTextRegion[] = this.generateMockTextRegions(img.width, img.height);
        resolve(mockRegions);
      };
      
      img.onerror = () => resolve([]);
      img.src = imageUrl;
    });
  }

  /**
   * Generate realistic mock text regions
   */
  private generateMockTextRegions(imageWidth: number, imageHeight: number): DetectedTextRegion[] {
    const regions: DetectedTextRegion[] = [];
    const commonTexts = [
      'SALE', 'NEW', 'LIMITED TIME', 'SPECIAL OFFER', 'DISCOUNT',
      'PREMIUM QUALITY', 'BEST SELLER', 'FREE SHIPPING', 'ORDER NOW',
      'EXCLUSIVE', 'TRENDING', 'POPULAR', 'FEATURED', 'RECOMMENDED'
    ];

    // Generate 2-5 random text regions
    const numRegions = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < numRegions; i++) {
      const text = commonTexts[Math.floor(Math.random() * commonTexts.length)];
      const fontSize = Math.floor(Math.random() * 30) + 16; // 16-46px
      const textWidth = text.length * (fontSize * 0.6); // Approximate width
      const textHeight = fontSize * 1.2; // Approximate height
      
      regions.push({
        id: `mock-${i + 1}`,
        text,
        x: Math.floor(Math.random() * (imageWidth - textWidth)),
        y: Math.floor(Math.random() * (imageHeight - textHeight)) + textHeight,
        width: textWidth,
        height: textHeight,
        confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
        fontSize,
        fontFamily: 'Arial',
        color: '#000000'
      });
    }

    return regions;
  }

  /**
   * Client-side OCR using Tesseract.js
   * Uncomment and install tesseract.js to use: npm install tesseract.js
   */
  /*
  private async tesseractOCR(imageUrl: string): Promise<DetectedTextRegion[]> {
    const { createWorker } = await import('tesseract.js');
    
    const worker = await createWorker('eng');
    const { data: { words } } = await worker.recognize(imageUrl);
    await worker.terminate();

    return words.map((word, index) => ({
      id: `tesseract-${index}`,
      text: word.text,
      x: word.bbox.x0,
      y: word.bbox.y0,
      width: word.bbox.x1 - word.bbox.x0,
      height: word.bbox.y1 - word.bbox.y0,
      confidence: word.confidence / 100,
      fontSize: word.bbox.y1 - word.bbox.y0,
      fontFamily: 'Arial',
      color: '#000000'
    }));
  }
  */

  /**
   * Google Cloud Vision API integration
   */
  /*
  private async googleVisionOCR(imageUrl: string): Promise<DetectedTextRegion[]> {
    const response = await fetch('/api/ocr/google-vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    });

    if (!response.ok) {
      throw new Error('Google Vision OCR failed');
    }

    const data = await response.json();
    return data.textAnnotations.map((annotation, index) => ({
      id: `google-${index}`,
      text: annotation.description,
      x: annotation.boundingPoly.vertices[0].x,
      y: annotation.boundingPoly.vertices[0].y,
      width: annotation.boundingPoly.vertices[2].x - annotation.boundingPoly.vertices[0].x,
      height: annotation.boundingPoly.vertices[2].y - annotation.boundingPoly.vertices[0].y,
      confidence: annotation.confidence || 0.9,
      fontSize: annotation.boundingPoly.vertices[2].y - annotation.boundingPoly.vertices[0].y,
      fontFamily: 'Arial',
      color: '#000000'
    }));
  }
  */

  /**
   * Process image with text edits
   * This would integrate with inpainting services to remove original text
   * and add new text in the same locations
   */
  async processImageWithTextEdits(request: TextEditRequest): Promise<string> {
    try {
      // For now, return mock processed image
      // In production, this would:
      // 1. Use inpainting to remove original text
      // 2. Add new text with matching styling
      // 3. Return the edited image URL
      
      return await this.mockImageProcessing(request);
      
      // Example integration with inpainting service:
      // return await this.inpaintAndReplaceText(request);
    } catch (error) {
      console.error('Image processing failed:', error);
      throw new Error('Failed to process image with text edits');
    }
  }

  /**
   * Mock image processing for development
   */
  private async mockImageProcessing(request: TextEditRequest): Promise<string> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real implementation, this would:
    // 1. Load the original image
    // 2. Use inpainting to remove text at specified regions
    // 3. Add new text with canvas drawing or AI text generation
    // 4. Return the processed image as a blob URL or upload to storage

    // For now, return the original image URL
    // In production, this would be the processed image URL
    return request.imageUrl;
  }

  /**
   * Real inpainting and text replacement implementation
   */
  /*
  private async inpaintAndReplaceText(request: TextEditRequest): Promise<string> {
    // Step 1: Create mask for text regions to be removed
    const mask = await this.createTextMask(request.imageUrl, request.textEdits.map(edit => edit.region));
    
    // Step 2: Use inpainting to remove original text
    const inpaintedImageUrl = await this.inpaintImage(request.imageUrl, mask);
    
    // Step 3: Add new text to the inpainted image
    const finalImageUrl = await this.addTextToImage(inpaintedImageUrl, request.textEdits);
    
    return finalImageUrl;
  }

  private async createTextMask(imageUrl: string, regions: DetectedTextRegion[]): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Create white mask with black regions for text areas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'black';
        regions.forEach(region => {
          ctx.fillRect(region.x, region.y, region.width, region.height);
        });
        
        canvas.toBlob(blob => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create mask'));
          }
        });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  private async inpaintImage(imageUrl: string, maskUrl: string): Promise<string> {
    // Call inpainting API (e.g., Replicate, RunwayML, or custom service)
    const response = await fetch('/api/inpaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, maskUrl })
    });

    if (!response.ok) {
      throw new Error('Inpainting failed');
    }

    const data = await response.json();
    return data.inpaintedImageUrl;
  }

  private async addTextToImage(imageUrl: string, textEdits: { region: DetectedTextRegion; newText: string }[]): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Add new text
        textEdits.forEach(edit => {
          const { region, newText } = edit;
          ctx.font = `${region.fontSize || 20}px ${region.fontFamily || 'Arial'}`;
          ctx.fillStyle = region.color || '#000000';
          ctx.fillText(newText, region.x, region.y + (region.height || 20));
        });
        
        canvas.toBlob(blob => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to add text'));
          }
        });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }
  */

  /**
   * Analyze image to estimate text properties
   */
  async analyzeTextProperties(imageUrl: string, region: DetectedTextRegion): Promise<{
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: string;
  }> {
    // In production, this would use AI to analyze the text styling
    // For now, return reasonable defaults
    return {
      fontSize: region.fontSize || Math.max(16, region.height * 0.8),
      fontFamily: region.fontFamily || 'Arial',
      color: region.color || '#000000',
      fontWeight: 'normal'
    };
  }
}

// Export singleton instance
export const textDetectionService = TextDetectionService.getInstance();
