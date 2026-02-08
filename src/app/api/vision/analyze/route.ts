import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

// Initialize Vision API client using existing Google Cloud credentials
const client = new vision.ImageAnnotatorClient({
    keyFilename: './vertex-ai-secondary-credentials.json',
});

/**
 * RGB to Hex converter
 */
function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
        .map(x => Math.round(x).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

/**
 * POST /api/vision/analyze
 * Analyzes an image using Google Cloud Vision API
 * 
 * Request body: { image: string } (base64-encoded image)
 * Response: VisionAnalysisResult
 */
export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        console.log('🔍 [Vision API Route] Analyzing image...');

        // Prepare Vision API request with multiple features
        const [result] = await client.annotateImage({
            image: { content: image },
            features: [
                { type: 'LABEL_DETECTION', maxResults: 20 }, // Objects/concepts
                { type: 'IMAGE_PROPERTIES' }, // Colors
                { type: 'TEXT_DETECTION' }, // OCR
                { type: 'LOGO_DETECTION', maxResults: 10 }, // Brand logos
                { type: 'WEB_DETECTION', maxResults: 10 }, // Web entities
                { type: 'SAFE_SEARCH_DETECTION' }, // Content moderation
            ],
        });

        // Process label detection
        const labels =
            result.labelAnnotations?.map(label => ({
                description: label.description || '',
                score: label.score || 0,
                topicality: label.topicality || 0,
            })) || [];

        // Process color detection
        const colorInfo = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
        const colors = colorInfo.map(colorObj => {
            const c = colorObj.color!;
            return {
                red: c.red || 0,
                green: c.green || 0,
                blue: c.blue || 0,
                hex: rgbToHex(c.red || 0, c.green || 0, c.blue || 0),
                score: colorObj.score || 0,
                pixelFraction: colorObj.pixelFraction || 0,
            };
        });

        // Get top dominant colors (sorted by pixel fraction)
        const dominantColors = [...colors]
            .sort((a, b) => b.pixelFraction - a.pixelFraction)
            .slice(0, 5);

        // Process text detection
        const textAnnotations =
            result.textAnnotations?.map(text => ({
                text: text.description || '',
                confidence: text.confidence || 0,
            })) || [];

        // First text annotation is the full text
        const fullTextAnnotation = textAnnotations[0]?.text || '';

        // Process logo detection
        const logos =
            result.logoAnnotations?.map(logo => ({
                description: logo.description || '',
                score: logo.score || 0,
            })) || [];

        // Process web detection
        const webDetection = result.webDetection
            ? {
                webEntities:
                    result.webDetection.webEntities?.map(entity => ({
                        entityId: entity.entityId || '',
                        description: entity.description || '',
                        score: entity.score || 0,
                    })) || [],
                fullMatchingImages:
                    result.webDetection.fullMatchingImages?.map(img => img.url || '') || [],
                partialMatchingImages:
                    result.webDetection.partialMatchingImages?.map(img => img.url || '') || [],
            }
            : undefined;

        // Process safe search
        const safeSearch = result.safeSearchAnnotation
            ? {
                adult: result.safeSearchAnnotation.adult || 'UNKNOWN',
                violence: result.safeSearchAnnotation.violence || 'UNKNOWN',
                racy: result.safeSearchAnnotation.racy || 'UNKNOWN',
                spoof: result.safeSearchAnnotation.spoof || 'UNKNOWN',
                medical: result.safeSearchAnnotation.medical || 'UNKNOWN',
            }
            : undefined;

        const response = {
            labels,
            colors,
            dominantColors,
            textAnnotations: textAnnotations.slice(1), // Skip first (full text)
            fullTextAnnotation,
            logos,
            webDetection,
            safeSearch,
        };

        console.log('✅ [Vision API Route] Analysis complete:', {
            labels: labels.length,
            colors: colors.length,
            dominantColors: dominantColors.length,
            text: fullTextAnnotation ? 'found' : 'none',
            logos: logos.length,
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error('❌ [Vision API Route] Error:', error);

        // Check for common errors
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return NextResponse.json(
                    { error: 'Vision API key not configured. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_VISION_API_KEY' },
                    { status: 500 }
                );
            }
            if (error.message.includes('quota')) {
                return NextResponse.json(
                    { error: 'Vision API quota exceeded. Please check your Google Cloud billing.' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Vision API analysis failed' },
            { status: 500 }
        );
    }
}
