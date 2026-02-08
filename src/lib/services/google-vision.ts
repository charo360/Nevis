/**
 * Google Vision API Integration
 * Provides professional-grade image analysis for Creative Studio
 * 
 * Features:
 * - Object/Label detection
 * - Dominant color extraction
 * - Text/OCR detection
 * - Logo recognition
 * - Web entity detection
 * - Safe search moderation
 */

export interface VisionLabel {
    description: string;
    score: number; // Confidence 0-1
    topicality?: number;
}

export interface VisionColor {
    red: number;
    green: number;
    blue: number;
    hex: string;
    score: number; // Prevalence 0-1
    pixelFraction: number;
}

export interface VisionLogo {
    description: string;
    score: number;
}

export interface VisionText {
    text: string;
    confidence: number;
}

export interface VisionWebEntity {
    entityId: string;
    description: string;
    score: number;
}

export interface VisionSafeSearch {
    adult: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
    violence: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
    racy: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
    spoof: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
    medical: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
}

export interface VisionAnalysisResult {
    labels: VisionLabel[];
    colors: VisionColor[];
    dominantColors: VisionColor[]; // Top 3-5 colors
    textAnnotations: VisionText[];
    fullTextAnnotation?: string; // Combined text
    logos: VisionLogo[];
    webDetection?: {
        webEntities: VisionWebEntity[];
        fullMatchingImages?: string[];
        partialMatchingImages?: string[];
    };
    safeSearch?: VisionSafeSearch;
    error?: string;
}

/**
 * Convert RGB to Hex color code
 */
function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
        .map(x => Math.round(x).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

/**
 * Analyze image using Google Cloud Vision API
 * @param imageDataUri Base64 data URI of the image
 * @returns Comprehensive image analysis
 */
export async function analyzeImageWithVision(
    imageDataUri: string
): Promise<VisionAnalysisResult> {
    try {
        console.log('🔍 [Vision API] Starting image analysis...');

        // Extract base64 content from data URI
        const base64Content = imageDataUri.split(',')[1];
        if (!base64Content) {
            throw new Error('Invalid data URI format');
        }

        // Call Vision API via our API route (to keep API key server-side)
        const response = await fetch('/api/vision/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Content }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Vision API error: ${error}`);
        }

        const result: VisionAnalysisResult = await response.json();

        console.log('✅ [Vision API] Analysis complete:', {
            labels: result.labels.length,
            colors: result.colors.length,
            text: result.textAnnotations.length,
            logos: result.logos.length,
        });

        return result;
    } catch (error) {
        console.error('❌ [Vision API] Analysis failed:', error);
        return {
            labels: [],
            colors: [],
            dominantColors: [],
            textAnnotations: [],
            logos: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Format Vision analysis for display to user
 */
export function formatVisionAnalysisForDisplay(
    analysis: VisionAnalysisResult
): string {
    const parts: string[] = [];

    if (analysis.labels.length > 0) {
        const topLabels = analysis.labels
            .slice(0, 5)
            .map(l => `${l.description} (${Math.round(l.score * 100)}%)`)
            .join(', ');
        parts.push(`Objects: ${topLabels}`);
    }

    if (analysis.dominantColors.length > 0) {
        const colorList = analysis.dominantColors
            .slice(0, 3)
            .map(c => c.hex)
            .join(', ');
        parts.push(`Colors: ${colorList}`);
    }

    if (analysis.textAnnotations.length > 0 && analysis.fullTextAnnotation) {
        parts.push(`Text: "${analysis.fullTextAnnotation.substring(0, 50)}..."`);
    }

    if (analysis.logos.length > 0) {
        parts.push(`Brands: ${analysis.logos.map(l => l.description).join(', ')}`);
    }

    return parts.join(' | ') || 'No analysis available';
}

/**
 * Format Vision analysis for AI prompt
 * Creates rich context for image understanding
 */
export function formatVisionAnalysisForAI(
    analysis: VisionAnalysisResult
): string {
    let prompt = '\n📊 **PROFESSIONAL IMAGE ANALYSIS (Google Vision API)**\n\n';

    // Labels/Objects
    if (analysis.labels.length > 0) {
        prompt += '**Detected Objects & Concepts:**\n';
        analysis.labels.slice(0, 10).forEach(label => {
            prompt += `- ${label.description} (${Math.round(label.score * 100)}% confidence)\n`;
        });
        prompt += '\n';
    }

    // Colors
    if (analysis.dominantColors.length > 0) {
        prompt += '**Dominant Colors (EXACT CODES - USE THESE):**\n';
        analysis.dominantColors.forEach((color, idx) => {
            prompt += `${idx + 1}. ${color.hex} (${Math.round(color.pixelFraction * 100)}% of image)\n`;
        });
        prompt += '\n';
    }

    // Text
    if (analysis.fullTextAnnotation) {
        prompt += '**Text Found in Image:**\n';
        prompt += `"${analysis.fullTextAnnotation}"\n\n`;
    }

    // Logos/Brands
    if (analysis.logos.length > 0) {
        prompt += '**Recognized Brands/Logos:**\n';
        analysis.logos.forEach(logo => {
            prompt += `- ${logo.description} (${Math.round(logo.score * 100)}% confidence)\n`;
        });
        prompt += '\n';
    }

    // Web entities (famous products/landmarks)
    if (analysis.webDetection?.webEntities && analysis.webDetection.webEntities.length > 0) {
        prompt += '**Web Entities (Known Products/Brands):**\n';
        analysis.webDetection.webEntities.slice(0, 5).forEach(entity => {
            if (entity.description) {
                prompt += `- ${entity.description}\n`;
            }
        });
        prompt += '\n';
    }

    // AI Instructions
    prompt += `🎯 **CRITICAL DESIGN REQUIREMENTS:**\n`;
    prompt += `✅ You MUST use these exact colors: ${analysis.dominantColors.slice(0, 3).map(c => c.hex).join(', ')}\n`;
    prompt += `✅ Reference these specific detected elements: ${analysis.labels.slice(0, 5).map(l => l.description).join(', ')}\n`;

    if (analysis.logos.length > 0) {
        prompt += `✅ Acknowledge and align with detected brand: ${analysis.logos[0].description}\n`;
    }

    if (analysis.fullTextAnnotation) {
        prompt += `✅ Consider or incorporate this text: "${analysis.fullTextAnnotation.substring(0, 100)}"\n`;
    }

    // CRITICAL BLENDING INSTRUCTIONS
    prompt += `\n🎨 **SEAMLESS COLOR BLENDING (MANDATORY):**\n`;
    prompt += `- EXTRACT colors directly from the uploaded image (the exact hex codes are provided above)\n`;
    prompt += `- USE those EXACT colors in ALL design elements: shapes, backgrounds, text backgrounds, accents, borders, gradients\n`;
    prompt += `- CREATE gradients that transition FROM image colors to slightly lighter/darker versions of the SAME colors\n`;
    prompt += `- BLEND edges where design elements meet the image (no harsh color clashes or jarring transitions)\n`;
    prompt += `- ECHO image colors throughout the design - if the image has blue (#1234AB), use that exact blue in 3+ different places\n`;
    prompt += `- ENSURE the uploaded image and all design elements share the SAME cohesive color palette\n`;
    prompt += `- MAKE it feel like ONE unified design where the image naturally blends with the graphics (not separate layers)\n`;
    prompt += `- SAMPLE colors from different parts of the image to create variety while maintaining harmony\n`;

    // CRITICAL: DO NOT MODIFY THE UPLOADED IMAGE
    prompt += `\n🚨 **CRITICAL - DO NOT MODIFY THE UPLOADED IMAGE:**\n`;
    prompt += `- The uploaded image/photo MUST be used EXACTLY as provided - 100% unchanged\n`;
    prompt += `- DO NOT add objects to people's hands (tablets, phones, products, etc.)\n`;
    prompt += `- DO NOT modify what people are holding or touching\n`;
    prompt += `- DO NOT regenerate or alter any part of the uploaded photo\n`;
    prompt += `- DO NOT change facial features, clothing, backgrounds within the photo itself\n`;
    prompt += `- The uploaded image is a REFERENCE PHOTO to include as-is, NOT a reference for generation\n`;
    prompt += `- Add design elements (text, shapes, graphics) AROUND the image, not modifying the image itself\n`;
    prompt += `- Think of it as: photo stays perfect, design elements go around/beside it\n`;

    prompt += `\n❌ NEVER introduce random colors that don't exist in the uploaded image\n`;
    prompt += `❌ NEVER make the image feel separate or disconnected from the design elements\n`;
    prompt += `❌ NEVER use generic brand colors if they clash with the image's natural palette\n`;
    prompt += `❌ NEVER modify, alter, or regenerate the uploaded image in any way\n`;
    prompt += `✅ ALWAYS sample and reuse the image's exact colors everywhere in the design\n`;
    prompt += `✅ ALWAYS create smooth color transitions that connect the image to design elements\n`;
    prompt += `✅ ALWAYS prioritize visual harmony - the design should look like it "grew out of" the image\n`;
    prompt += `✅ ALWAYS preserve the uploaded image exactly as provided - 100% unchanged\n`;

    prompt += '\n';

    return prompt;
}

/**
 * Determine if image should have background removed
 * Based on Vision API analysis
 */
export function shouldRemoveBackground(analysis: VisionAnalysisResult): {
    shouldRemove: boolean;
    reason: string;
    confidence: number;
} {
    // Product indicators
    const productLabels = [
        'product',
        'item',
        'object',
        'merchandise',
        'bottle',
        'package',
        'container',
        'box',
        'device',
        'tool',
        'equipment',
        'clothing',
        'accessory',
    ];

    // Clean background indicators
    const cleanBackgroundLabels = [
        'white background',
        'plain background',
        'studio photograph',
        'isolated',
        'clean',
    ];

    // Busy/distracting background indicators
    const busyBackgroundLabels = [
        'outdoor',
        'indoor',
        'room',
        'street',
        'nature',
        'landscape',
        'building',
        'furniture',
    ];

    // Check for product
    const productDetection = analysis.labels.find(l =>
        productLabels.some(p => l.description.toLowerCase().includes(p))
    );

    // Check for clean background
    const hasCleanBackground = analysis.labels.some(l =>
        cleanBackgroundLabels.some(b => l.description.toLowerCase().includes(b))
    );

    // Check for busy background
    const hasBusyBackground = analysis.labels.some(l =>
        busyBackgroundLabels.some(b => l.description.toLowerCase().includes(b))
    );

    // Decision logic
    if (productDetection && hasBusyBackground && !hasCleanBackground) {
        return {
            shouldRemove: true,
            reason: `Detected ${productDetection.description} on distracting background`,
            confidence: productDetection.score,
        };
    }

    if (productDetection && analysis.labels.length > 10 && !hasCleanBackground) {
        return {
            shouldRemove: true,
            reason: `Product photo with multiple background elements`,
            confidence: 0.7,
        };
    }

    return {
        shouldRemove: false,
        reason: hasCleanBackground
            ? 'Background already clean'
            : 'Not a product photo or background is acceptable',
        confidence: 0.5,
    };
}
