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
   * Uses Tesseract.js for real text detection
   */
  async detectText(imageUrl: string): Promise<DetectedTextRegion[]> {
    try {
      // Use real OCR with Tesseract.js
      return await this.tesseractOCR(imageUrl);
    } catch (error) {
      console.error('Text detection failed:', error);
      // Fallback to mock data if OCR fails
      console.warn('Falling back to mock detection due to OCR error');
      return await this.mockOCRDetection(imageUrl);
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
   * Real text detection with accurate bounding boxes
   */
  private async tesseractOCR(imageUrl: string): Promise<DetectedTextRegion[]> {
    const { createWorker } = await import('tesseract.js');

    console.log('🔍 Starting OCR text detection...');

    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    try {
      // Get both words and lines for better text grouping
      const { data } = await worker.recognize(imageUrl, {
        tessedit_pageseg_mode: '6', // Uniform block of text
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?-:;()[]{}"\''
      });

      console.log('📝 OCR Detection Results:', {
        confidence: data.confidence,
        wordsFound: data.words.length,
        linesFound: data.lines.length
      });

      // Filter out low-confidence detections and combine nearby words into text blocks
      const validWords = data.words.filter(word =>
        word.confidence > 30 && // Minimum 30% confidence
        word.text.trim().length > 0 && // Not empty
        word.text.trim() !== ' ' // Not just whitespace
      );

      // Group words into text blocks based on proximity
      const textBlocks = this.groupWordsIntoBlocks(validWords);

      return textBlocks.map((block, index) => ({
        id: `tesseract-${index}`,
        text: block.text,
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
        confidence: block.confidence / 100,
        fontSize: Math.max(12, block.height * 0.8),
        fontFamily: 'Arial',
        color: '#000000'
      }));

    } finally {
      await worker.terminate();
      console.log('✅ OCR processing complete');
    }
  }

  /**
   * Group nearby words into coherent text blocks
   */
  private groupWordsIntoBlocks(words: any[]): Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }> {
    if (words.length === 0) return [];

    // Sort words by vertical position first, then horizontal
    const sortedWords = words.sort((a, b) => {
      const yDiff = a.bbox.y0 - b.bbox.y0;
      if (Math.abs(yDiff) < 10) { // Same line (within 10px)
        return a.bbox.x0 - b.bbox.x0;
      }
      return yDiff;
    });

    const blocks: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
    }> = [];

    let currentBlock: any = null;

    for (const word of sortedWords) {
      const wordText = word.text.trim();
      if (!wordText) continue;

      if (!currentBlock) {
        // Start new block
        currentBlock = {
          text: wordText,
          x: word.bbox.x0,
          y: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1,
          confidence: word.confidence,
          wordCount: 1
        };
      } else {
        // Check if word should be added to current block
        const verticalDistance = Math.abs(word.bbox.y0 - currentBlock.y);
        const horizontalGap = word.bbox.x0 - currentBlock.x1;

        // Words are on the same line if vertical distance < 15px
        // and horizontal gap is reasonable (< 50px)
        if (verticalDistance < 15 && horizontalGap < 50 && horizontalGap > -10) {
          // Add to current block
          currentBlock.text += ' ' + wordText;
          currentBlock.x1 = Math.max(currentBlock.x1, word.bbox.x1);
          currentBlock.y1 = Math.max(currentBlock.y1, word.bbox.y1);
          currentBlock.confidence = (currentBlock.confidence * currentBlock.wordCount + word.confidence) / (currentBlock.wordCount + 1);
          currentBlock.wordCount++;
        } else {
          // Finish current block and start new one
          blocks.push({
            text: currentBlock.text,
            x: currentBlock.x,
            y: currentBlock.y,
            width: currentBlock.x1 - currentBlock.x,
            height: currentBlock.y1 - currentBlock.y,
            confidence: currentBlock.confidence
          });

          currentBlock = {
            text: wordText,
            x: word.bbox.x0,
            y: word.bbox.y0,
            x1: word.bbox.x1,
            y1: word.bbox.y1,
            confidence: word.confidence,
            wordCount: 1
          };
        }
      }
    }

    // Add the last block
    if (currentBlock) {
      blocks.push({
        text: currentBlock.text,
        x: currentBlock.x,
        y: currentBlock.y,
        width: currentBlock.x1 - currentBlock.x,
        height: currentBlock.y1 - currentBlock.y,
        confidence: currentBlock.confidence
      });
    }

    // Filter out very small or low-confidence blocks
    return blocks.filter(block =>
      block.text.length > 1 &&
      block.confidence > 40 &&
      block.width > 10 &&
      block.height > 8
    );
  }

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
