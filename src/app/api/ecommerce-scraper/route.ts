import { NextRequest, NextResponse } from 'next/server';

/**
 * E-commerce Store Scraper API
 * Extracts products, images, logos, and brand colors from e-commerce stores
 */

interface StoreAssets {
  success: boolean;
  platform?: string;
  storeUrl?: string;
  products?: Array<{
    id: string | number;
    title: string;
    description?: string;
    images: Array<{
      url: string;
      alt?: string;
      width?: number;
      height?: number;
    }>;
    variants?: number;
    productUrl?: string;
  }>;
  totalProducts?: number;
  totalImages?: number;
  logo?: string;
  brandColors?: string[];
  allImages?: string[];
  scrapedAt?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { storeUrl, detectOnly, saveToLibrary, userId, brandProfileId } = await request.json();

    if (!storeUrl) {
      return NextResponse.json({
        success: false,
        error: 'Store URL is required'
      }, { status: 400 });
    }

    console.log(`🛒 Starting e-commerce ${detectOnly ? 'detection' : 'analysis'} for: ${storeUrl}`);

    // Import the scraper function
    const { importStoreAssets, detectPlatform } = await import('@/lib/services/ecommerce-scraper');

    if (detectOnly) {
      // Just detect the platform without full scraping
      const platform = await detectPlatform(storeUrl);
      const isEcommerce = platform !== 'generic';

      return NextResponse.json({
        success: isEcommerce,
        platform: isEcommerce ? platform : undefined,
        isEcommerce
      });
    }

    // Full scraping
    const result = await importStoreAssets(storeUrl);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to analyze store'
      }, { status: 400 });
    }

    console.log(`✅ E-commerce analysis complete: ${result.totalProducts} products, ${result.totalImages} images`);

    // Optionally save assets to library
    let assetImportResult: any = undefined;
    if (saveToLibrary && userId && brandProfileId) {
      console.log(`📦 Saving assets to library for brand: ${brandProfileId}`);

      try {
        const { importAllEcommerceAssets } = await import('@/lib/services/ecommerce-asset-importer');

        assetImportResult = await importAllEcommerceAssets(
          userId,
          brandProfileId,
          {
            logo: result.logo,
            products: result.products,
            allImages: result.allImages
          },
          {
            maxProductImages: 20,
            importLogo: true,
            importProducts: true
          }
        );

        console.log(`✅ Assets saved: ${assetImportResult.productImportResult.savedAssets} product images, logo: ${assetImportResult.logoImported}`);
      } catch (error) {
        console.error('❌ Error saving assets to library:', error);
        // Don't fail the whole request if asset saving fails
      }
    }

    return NextResponse.json({
      ...result,
      assetImportResult
    });

  } catch (error) {
    console.error('❌ E-commerce scraper API error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'E-commerce Store Scraper',
    timestamp: new Date().toISOString()
  });
}
