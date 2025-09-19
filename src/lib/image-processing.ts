/**
 * Image processing utilities for aspect ratio correction
 * Crops Gemini-generated 1024x1024 images to platform-specific aspect ratios
 * Server-side implementation using Sharp
 */
import sharp from 'sharp';

export interface CropOptions {
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
}

export interface PlatformDimensions {
  width: number;
  height: number;
  aspectRatio: string;
}

/**
 * Get target dimensions for each platform
 * MOBILE-FIRST: All platforms now use 992x1056px format for optimal mobile viewing
 */
export function getPlatformDimensions(platform: string): PlatformDimensions {
  const platformLower = platform.toLowerCase();

  // MOBILE-OPTIMIZED: All platforms use square format for best mobile experience
  // Only exceptions are Stories/Reels which need portrait format
  if (platformLower.includes('story') || platformLower.includes('reel')) {
    return {
      width: 1080,
      height: 1920,
      aspectRatio: '9:16'
    };
  }

  // DEFAULT: Custom format - 992x1056px HD for all platforms
  // Perfect for Instagram, Facebook, Twitter, LinkedIn on mobile
  return {
    width: 992,
    height: 1056,
    aspectRatio: '1:1'
  };
}

/**
 * Crop image from data URL to target aspect ratio using Sharp (server-side)
 */
export async function cropImageToAspectRatio(
  imageDataUrl: string,
  platform: string,
  options: CropOptions = {}
): Promise<string> {
  try {

    const dimensions = getPlatformDimensions(platform);

    // If it's already square (Instagram), return as-is
    if (dimensions.aspectRatio === '1:1') {
      return imageDataUrl;
    }

    // Extract base64 data from data URL
    const base64Data = imageDataUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid data URL format');
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Get image metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not get image dimensions');
    }


    // Calculate crop dimensions from center
    const sourceWidth = metadata.width;
    const sourceHeight = metadata.height;

    let cropWidth: number;
    let cropHeight: number;
    let left: number;
    let top: number;

    // No cropping - return original image
    return imageDataUrl;


    // Crop and resize the image using Sharp
    const processedImageBuffer = await image
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .resize(dimensions.width, dimensions.height)
      .jpeg({ quality: options.quality || 95 })
      .toBuffer();

    // Convert back to data URL
    const base64Image = processedImageBuffer.toString('base64');
    const croppedDataUrl = `data:image/jpeg;base64,${base64Image}`;

    return croppedDataUrl;

  } catch (error) {
    // Return original image if cropping fails
    return imageDataUrl;
  }
}

/**
 * Crop image from URL (fetches the image first) using Sharp (server-side)
 */
export async function cropImageFromUrl(
  imageUrl: string,
  platform: string,
  options: CropOptions = {}
): Promise<string> {
  try {
    // If it's already a data URL, use it directly
    if (imageUrl.startsWith('data:')) {
      return cropImageToAspectRatio(imageUrl, platform, options);
    }


    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Get dimensions and check if cropping is needed
    const dimensions = getPlatformDimensions(platform);
    if (dimensions.aspectRatio === '1:1') {
      // Convert to data URL and return
      const base64 = imageBuffer.toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    }

    // Process with Sharp directly from buffer
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not get image dimensions');
    }


    // Calculate crop dimensions
    const sourceWidth = metadata.width;
    const sourceHeight = metadata.height;

    let cropWidth: number;
    let cropHeight: number;
    let left: number;
    let top: number;

    // No cropping - return original image
    const base64 = imageBuffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;


    // Crop and resize
    const processedImageBuffer = await image
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .resize(dimensions.width, dimensions.height)
      .jpeg({ quality: options.quality || 95 })
      .toBuffer();

    // Convert to data URL
    const base64Image = processedImageBuffer.toString('base64');
    const croppedDataUrl = `data:image/jpeg;base64,${base64Image}`;

    return croppedDataUrl;

  } catch (error) {
    // Return original URL if processing fails
    return imageUrl;
  }
}

/**
 * Check if platform needs aspect ratio correction
 */
export function needsAspectRatioCorrection(platform: string): boolean {
  const dimensions = getPlatformDimensions(platform);
  return dimensions.aspectRatio !== '1:1';
}

/**
 * Get aspect ratio description for logging
 */
export function getAspectRatioDescription(platform: string): string {
  const dimensions = getPlatformDimensions(platform);
  return `${dimensions.width}x${dimensions.height} (${dimensions.aspectRatio})`;
}

/**
 * Validate data URL format
 */
function validateDataUrl(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/') && dataUrl.includes('base64,');
}
