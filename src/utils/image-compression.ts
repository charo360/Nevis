/**
 * Image Compression Utilities
 * Compress images before sending to API to avoid 413 errors
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  maxSizeMB?: number;
}

/**
 * Compress a base64 image
 */
export async function compressBase64Image(
  base64Data: string,
  mimeType: string,
  options: CompressionOptions = {}
): Promise<{ base64: string; mimeType: string; compressed: boolean }> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    maxSizeMB = 10
  } = options;

  // Convert base64 to blob
  const base64WithoutPrefix = base64Data.includes(',') 
    ? base64Data.split(',')[1] 
    : base64Data;
  
  const binaryString = atob(base64WithoutPrefix);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  // Check if compression is needed
  const sizeMB = blob.size / (1024 * 1024);
  if (sizeMB < maxSizeMB) {
    console.log(`✅ [Image Compression] Image size (${sizeMB.toFixed(2)}MB) is within limit, no compression needed`);
    return { base64: base64Data, mimeType, compressed: false };
  }

  console.log(`🔄 [Image Compression] Compressing image from ${sizeMB.toFixed(2)}MB...`);

  // Create image element
  const img = new Image();
  const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
  img.src = URL.createObjectURL(blob);
  await imageLoadPromise;

  // Calculate new dimensions
  let { width, height } = img;
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    if (width > height) {
      width = Math.min(width, maxWidth);
      height = width / aspectRatio;
    } else {
      height = Math.min(height, maxHeight);
      width = height * aspectRatio;
    }
  }

  // Create canvas and compress
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Convert to base64 with compression
  const compressedDataUrl = canvas.toDataURL(mimeType, quality);
  const compressedBase64 = compressedDataUrl.split(',')[1];

  // Check compressed size
  const compressedSizeMB = (compressedBase64.length * 0.75) / (1024 * 1024);
  console.log(`✅ [Image Compression] Compressed to ${compressedSizeMB.toFixed(2)}MB (${((1 - compressedSizeMB / sizeMB) * 100).toFixed(1)}% reduction)`);

  // Clean up
  URL.revokeObjectURL(img.src);

  return {
    base64: compressedBase64,
    mimeType,
    compressed: true
  };
}

/**
 * Compress an image data URL
 */
export async function compressImageDataUrl(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> {
  const [mimeInfo, base64Data] = dataUrl.split(',');
  const mimeType = mimeInfo.split(':')[1].split(';')[0];

  const result = await compressBase64Image(base64Data, mimeType, options);
  return `data:${result.mimeType};base64,${result.base64}`;
}

/**
 * Estimate base64 size in MB
 */
export function estimateBase64SizeMB(base64: string): number {
  // Base64 encoding increases size by ~33%, so actual size is ~75% of base64 length
  return (base64.length * 0.75) / (1024 * 1024);
}

/**
 * Check if image needs compression
 */
export function needsCompression(base64: string, maxSizeMB: number = 10): boolean {
  return estimateBase64SizeMB(base64) > maxSizeMB;
}
