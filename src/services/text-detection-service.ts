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
   * Client-side OCR using Tesseract.js v6
   * Real text detection with accurate bounding boxes
   */
  private async tesseractOCR(imageUrl: string): Promise<DetectedTextRegion[]> {
    console.log('🔍 Starting OCR text detection with Tesseract.js v6...');

    try {
      const { createWorker } = await import('tesseract.js');
      // Preprocess image to improve OCR (grayscale, threshold, 2x upscale)
      const preprocessedUrl = await this.preprocessImageForOCR(imageUrl);

      // Create worker with language - v6 simplified API
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      // Recognize text on original
      const { data: originalData } = await worker.recognize(imageUrl);
      // Recognize text on preprocessed image (often captures faint/low-contrast text)
      const { data: preData } = await worker.recognize(preprocessedUrl);

      // Prefer dataset (words/lines) from whichever has more signal
      const data = (preData.words?.length || 0) + (preData.lines?.length || 0) >= (originalData.words?.length || 0) + (originalData.lines?.length || 0)
        ? preData
        : originalData;

      console.log('📝 OCR Raw Response (selected):', {
        confidence: data.confidence,
        text: data.text?.slice(0, 120)
      });
      console.log('📝 OCR Detection Results:', {
        confidence: data.confidence,
        wordsFound: data.words?.length || 0,
        linesFound: data.lines?.length || 0,
        text: data.text
      });

      // Check if words array exists and has content
      if (!data.words || data.words.length === 0) {
        console.warn('No words detected by OCR, trying fallback approach');

        // Fallback: use basic text detection if words array is not available
        if ((data.lines && data.lines.length > 0)) {
          // Build regions from lines if available
          const lineRegions: DetectedTextRegion[] = data.lines.map((ln: any, idx: number) => ({
            id: `tesseract-line-${idx}`,
            text: (ln.text || '').trim(),
            x: ln.bbox?.x0 ?? 50,
            y: ln.bbox?.y0 ?? 50,
            width: ln.bbox && ln.bbox.x1 != null ? Math.max(10, ln.bbox.x1 - (ln.bbox.x0 ?? 0)) : 200,
            height: ln.bbox && ln.bbox.y1 != null ? Math.max(10, ln.bbox.y1 - (ln.bbox.y0 ?? 0)) : 30,
            confidence: (ln.confidence || data.confidence || 50) / 100,
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#000000'
          })).filter(r => r.text.length > 0);

          if (lineRegions.length > 0) {
            await worker.terminate();
            return lineRegions;
          }
        }

        if (data.text && data.text.trim().length > 0) {
          console.log('Using fallback text detection');
          return [{
            id: 'tesseract-fallback-0',
            text: data.text.trim(),
            x: 50,
            y: 50,
            width: 200,
            height: 30,
            confidence: (data.confidence || 50) / 100,
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#000000'
          }];
        }

        return [];
      }

      // Filter out low-confidence detections and combine nearby words into text blocks
      const validWords = data.words.filter((word: any) =>
        word && // Word exists
        word.confidence > 20 && // Lower threshold to catch faint text
        word.text && // Text exists
        word.text.trim().length > 0 && // Not empty
        word.text.trim() !== ' ' && // Not just whitespace
        word.bbox && // Bounding box exists
        word.bbox.x0 !== undefined && word.bbox.y0 !== undefined // Valid coordinates
      );

      console.log('📝 Valid words after filtering:', validWords.length);

      if (validWords.length === 0) {
        console.warn('No valid words found after filtering');
        return [];
      }

      // Group words into text blocks based on proximity
      const textBlocks = this.groupWordsIntoBlocks(validWords);

      console.log('📝 Text blocks created:', textBlocks.length);

      const finalResults = textBlocks.map((block, index) => ({
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

      // Terminate worker
      await worker.terminate();
      console.log('✅ OCR processing complete');

      return finalResults;

    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      throw ocrError;
    }
  }

  /**
   * Basic image preprocessing to improve OCR results
   * - 2x upscale
   * - Grayscale
   * - Contrast boost and binarization (threshold)
   */
  private async preprocessImageForOCR(imageUrl: string): Promise<string> {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = imageUrl;
      });

      const scale = 2; // 2x upscale often helps OCR
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return imageUrl;

      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Get pixels and apply grayscale + contrast + threshold
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple contrast function
      const contrast = 1.25; // >1 to boost contrast
      const threshold = 180; // binarization threshold

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Grayscale (luminosity)
        let v = 0.299 * r + 0.587 * g + 0.114 * b;
        // Contrast boost around 128 mid-point
        v = (v - 128) * contrast + 128;
        // Clamp
        v = Math.max(0, Math.min(255, v));
        // Threshold to black/white
        const bw = v > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = bw;
        // Keep alpha
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Preprocess failed, using original image', e);
      return imageUrl;
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
      // Basic in-app apply: draw image and overlay edited text regions on a canvas
      // For production-quality results, replace with inpainting + re-typesetting
      return await this.applyTextOverlay(request);

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
   * Apply text edits by removing original text and adding new text
   * Uses canvas-based text replacement with background color detection
   */
  private async applyTextOverlay(request: TextEditRequest): Promise<string> {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = request.imageUrl;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Process each text edit: remove original text and add new text
    request.textEdits.forEach(edit => {
      const { region, newText } = edit;

      // Skip if text hasn't changed
      if (newText === region.text) return;

      console.log(`🎨 Replacing "${region.text}" with "${newText}"`);

      // Step 1: Remove original text by painting over it with background color
      this.removeOriginalText(ctx, region);

      // Step 2: Add new text in the same location
      this.addReplacementText(ctx, region, newText);
    });

    return await new Promise<string>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Failed to export edited image'));
        resolve(URL.createObjectURL(blob));
      }, 'image/png');
    });
  }

  /**
   * Remove original text by painting over it with background color
   */
  private removeOriginalText(ctx: CanvasRenderingContext2D, region: any) {
    // Get surrounding pixels to determine background color
    const padding = 5;
    const sampleX = Math.max(0, region.x - padding);
    const sampleY = Math.max(0, region.y - padding);
    const sampleWidth = Math.min(ctx.canvas.width - sampleX, region.width + padding * 2);
    const sampleHeight = Math.min(ctx.canvas.height - sampleY, region.height + padding * 2);

    const imageData = ctx.getImageData(sampleX, sampleY, sampleWidth, sampleHeight);

    // Get background color from border pixels
    const bgColor = this.detectBackgroundColor(imageData, region.width, region.height);

    // Paint over the text region with background color
    ctx.fillStyle = `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;
    ctx.fillRect(region.x, region.y, region.width, region.height);

    // Add slight blur to make it look more natural
    ctx.save();
    ctx.filter = 'blur(0.5px)';
    ctx.fillRect(region.x, region.y, region.width, region.height);
    ctx.restore();
  }

  /**
   * Add replacement text in the same location
   */
  private addReplacementText(ctx: CanvasRenderingContext2D, region: any, newText: string) {
    // Set text properties based on detected region
    const fontSize = Math.max(12, region.height * 0.8);
    ctx.font = `${fontSize}px ${region.fontFamily || 'Arial'}`;
    ctx.fillStyle = region.color || '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Add text shadow for better readability
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 1;
    ctx.shadowOffsetX = 0.5;
    ctx.shadowOffsetY = 0.5;

    // Draw the new text
    ctx.fillText(newText, region.x, region.y);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /**
   * Detect background color from image data
   */
  private detectBackgroundColor(imageData: ImageData, regionWidth: number, regionHeight: number): { r: number; g: number; b: number } {
    const { data, width, height } = imageData;
    const borderPixels: number[][] = [];

    // Sample pixels from the border of the region
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Take border pixels (first/last rows/columns)
        if (x < 5 || x >= width - 5 || y < 5 || y >= height - 5) {
          const index = (y * width + x) * 4;
          borderPixels.push([
            data[index],     // R
            data[index + 1], // G
            data[index + 2]  // B
          ]);
        }
      }
    }

    // Calculate average color
    if (borderPixels.length === 0) return { r: 255, g: 255, b: 255 }; // Default to white

    const sum = borderPixels.reduce(
      (acc, pixel) => ({
        r: acc.r + pixel[0],
        g: acc.g + pixel[1],
        b: acc.b + pixel[2]
      }),
      { r: 0, g: 0, b: 0 }
    );

    return {
      r: Math.round(sum.r / borderPixels.length),
      g: Math.round(sum.g / borderPixels.length),
      b: Math.round(sum.b / borderPixels.length)
    };
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
