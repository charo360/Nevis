import { NextRequest, NextResponse } from 'next/server';

/**
 * Website Brand Assets Extraction API
 * Server-side endpoint to extract logos, colors, and images from external websites
 * This endpoint bypasses CORS restrictions by fetching on the server
 */

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({
                success: false,
                error: 'URL is required'
            }, { status: 400 });
        }

        console.log(`🎨 Extracting brand assets from website: ${url}`);

        // Import the server-side brand asset extractor
        const { extractBrandAssets } = await import('@/lib/services/ecommerce-scraper');

        // Extract assets server-side (bypasses CORS)
        const assets = await extractBrandAssets(url);

        console.log(`✅ Brand assets extracted: ${assets.brandColors?.length || 0} colors, ${assets.images?.length || 0} images, logo: ${!!assets.logo}`);

        return NextResponse.json({
            success: true,
            ...assets
        });

    } catch (error) {
        console.error('❌ Website brand assets extraction API error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to extract brand assets',
            brandColors: [],
            images: [],
            logo: undefined
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'Website Brand Assets Extraction API',
        description: 'Server-side extraction of logos, colors, and images from websites (bypasses CORS)',
        timestamp: new Date().toISOString()
    });
}
