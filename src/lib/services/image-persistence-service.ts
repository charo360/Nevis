// Image Persistence Service
// Handles converting temporary image URLs to persistent storage

export interface ImagePersistenceOptions {
  maxSize?: number; // Maximum file size in bytes
  quality?: number; // JPEG quality (0-1)
  format?: 'jpeg' | 'png' | 'webp';
  timeout?: number; // Request timeout in ms
}

export interface PersistentImageResult {
  success: boolean;
  url?: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
}

class ImagePersistenceService {
  private readonly DEFAULT_OPTIONS: Required<ImagePersistenceOptions> = {
    maxSize: 2 * 1024 * 1024, // 2MB
    quality: 0.8,
    format: 'jpeg',
    timeout: 10000 // 10 seconds
  };

  /**
   * Convert any image URL to a persistent data URL
   */
  async persistImageUrl(url: string, options: ImagePersistenceOptions = {}): Promise<PersistentImageResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {

      // If it's already a data URL, validate and potentially compress it
      if (url.startsWith('data:')) {
        return this.handleDataUrl(url, opts);
      }

      // If it's a blob URL or HTTP URL, fetch and convert
      if (url.startsWith('blob:') || url.startsWith('http')) {
        return await this.fetchAndConvert(url, opts);
      }

      // If it's a placeholder or invalid URL, return error
      if (url.includes('[') && url.includes(']')) {
        return {
          success: false,
          error: 'Image data was previously removed due to size constraints'
        };
      }

      return {
        success: false,
        error: 'Unsupported URL format'
      };

    } catch (error) {
      console.error('❌ Failed to persist image URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle data URLs - validate and potentially compress
   */
  private handleDataUrl(dataUrl: string, options: Required<ImagePersistenceOptions>): PersistentImageResult {
    try {
      const sizeInBytes = Math.round((dataUrl.length * 3) / 4); // Approximate size of base64 data

      if (sizeInBytes <= options.maxSize) {
        return {
          success: true,
          url: dataUrl,
          originalSize: sizeInBytes,
          compressedSize: sizeInBytes
        };
      }

      // If too large, try to compress
      return this.compressDataUrl(dataUrl, options);

    } catch (error) {
      return {
        success: false,
        error: 'Failed to process data URL'
      };
    }
  }

  /**
   * Fetch URL and convert to data URL
   */
  private async fetchAndConvert(url: string, options: Required<ImagePersistenceOptions>): Promise<PersistentImageResult> {
    try {

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const originalSize = blob.size;

      if (originalSize > options.maxSize) {
        return await this.compressBlob(blob, options, originalSize);
      }

      // Convert to data URL
      const dataUrl = await this.blobToDataUrl(blob);
      
      return {
        success: true,
        url: dataUrl,
        originalSize,
        compressedSize: originalSize
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - image may be too large or server unresponsive'
        };
      }

      return {
        success: false,
        error: `Failed to fetch image: ${error.message}`
      };
    }
  }

  /**
   * Compress a data URL
   */
  private compressDataUrl(dataUrl: string, options: Required<ImagePersistenceOptions>): PersistentImageResult {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve({
              success: false,
              error: 'Canvas context not available'
            });
            return;
          }

          // Calculate new dimensions to reduce file size
          const maxDimension = 1200; // Max width or height
          let { width, height } = img;
          
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL(`image/${options.format}`, options.quality);
          
          const originalSize = Math.round((dataUrl.length * 3) / 4);
          const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);

          resolve({
            success: true,
            url: compressedDataUrl,
            originalSize,
            compressedSize
          });

        } catch (error) {
          resolve({
            success: false,
            error: 'Compression failed'
          });
        }
      };

      img.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to load image for compression'
        });
      };

      img.src = dataUrl;
    });
  }

  /**
   * Compress a blob
   */
  private async compressBlob(blob: Blob, options: Required<ImagePersistenceOptions>, originalSize: number): Promise<PersistentImageResult> {
    try {
      const dataUrl = await this.blobToDataUrl(blob);
      const result = await this.compressDataUrl(dataUrl, options);
      
      if (result.success) {
        result.originalSize = originalSize;
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Blob compression failed'
      };
    }
  }

  /**
   * Convert blob to data URL
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Batch persist multiple image URLs
   */
  async persistMultipleImages(urls: string[], options: ImagePersistenceOptions = {}): Promise<Map<string, PersistentImageResult>> {
    const results = new Map<string, PersistentImageResult>();
    
    
    // Process images in parallel but limit concurrency
    const concurrency = 3;
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(async (url) => {
        const result = await this.persistImageUrl(url, options);
        results.set(url, result);
        return result;
      });
      
      await Promise.all(batchPromises);
    }
    
    const successCount = Array.from(results.values()).filter(r => r.success).length;
    
    return results;
  }
}

// Export singleton instance
export const imagePersistenceService = new ImagePersistenceService();

// Export utility functions
export const persistImageUrl = (url: string, options?: ImagePersistenceOptions) => 
  imagePersistenceService.persistImageUrl(url, options);

export const persistMultipleImages = (urls: string[], options?: ImagePersistenceOptions) =>
  imagePersistenceService.persistMultipleImages(urls, options);
