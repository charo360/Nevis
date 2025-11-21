/**
 * E-commerce Asset Importer
 * Automatically saves extracted e-commerce assets to the brand asset library
 */

import { BrandAssetLibraryService, SaveAssetFromUrlOptions } from '@/lib/brand-asset-library';

export interface EcommerceAssetImportResult {
  success: boolean;
  totalAssets: number;
  savedAssets: number;
  errors: Array<{ name: string; error: string }>;
  assets: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

/**
 * Import logo from e-commerce scraper results
 */
export async function importLogo(
  userId: string,
  brandProfileId: string,
  logoUrl: string,
  storeName: string
): Promise<void> {
  try {
    const options: SaveAssetFromUrlOptions = {
      name: `${storeName} Logo`,
      type: 'logo',
      source: 'ecommerce_scraper',
      originalUrl: logoUrl,
      metadata: {
        storeName,
        extractedAt: new Date().toISOString()
      },
      tags: ['logo', 'brand', 'ecommerce']
    };

    await BrandAssetLibraryService.saveAssetFromUrl(
      userId,
      brandProfileId,
      logoUrl,
      options
    );

    console.log(`✅ Logo imported successfully: ${storeName}`);
  } catch (error) {
    console.error('❌ Error importing logo:', error);
    throw error;
  }
}

/**
 * Import product images from e-commerce scraper results
 */
export async function importProductImages(
  userId: string,
  brandProfileId: string,
  products: Array<{
    id: string | number;
    title: string;
    images: Array<{
      url: string;
      alt?: string;
      width?: number;
      height?: number;
    }>;
  }>,
  maxImages: number = 20
): Promise<EcommerceAssetImportResult> {
  const result: EcommerceAssetImportResult = {
    success: true,
    totalAssets: 0,
    savedAssets: 0,
    errors: [],
    assets: []
  };

  try {
    // Collect all product images
    const allImages: Array<{
      url: string;
      productTitle: string;
      alt?: string;
      width?: number;
      height?: number;
    }> = [];

    for (const product of products) {
      for (const image of product.images) {
        allImages.push({
          url: image.url,
          productTitle: product.title,
          alt: image.alt,
          width: image.width,
          height: image.height
        });
      }
    }

    // Limit to maxImages
    const imagesToImport = allImages.slice(0, maxImages);
    result.totalAssets = imagesToImport.length;

    console.log(`📦 Importing ${imagesToImport.length} product images...`);

    // Import each image
    for (let i = 0; i < imagesToImport.length; i++) {
      const image = imagesToImport[i];
      
      try {
        const options: SaveAssetFromUrlOptions = {
          name: image.alt || `${image.productTitle} - Image ${i + 1}`,
          type: 'product_image',
          source: 'ecommerce_scraper',
          originalUrl: image.url,
          metadata: {
            productTitle: image.productTitle,
            alt: image.alt,
            extractedAt: new Date().toISOString(),
            productIndex: i
          },
          tags: ['product', 'ecommerce', image.productTitle.toLowerCase()],
          width: image.width,
          height: image.height
        };

        const asset = await BrandAssetLibraryService.saveAssetFromUrl(
          userId,
          brandProfileId,
          image.url,
          options
        );

        result.savedAssets++;
        result.assets.push({
          id: asset.id,
          name: asset.name,
          type: asset.type,
          url: asset.fileUrl
        });

        console.log(`✅ Imported product image ${i + 1}/${imagesToImport.length}: ${asset.name}`);
      } catch (error) {
        console.error(`❌ Error importing image ${i + 1}:`, error);
        result.errors.push({
          name: image.alt || `Image ${i + 1}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Import complete: ${result.savedAssets}/${result.totalAssets} assets saved`);
    
    if (result.errors.length > 0) {
      console.warn(`⚠️ ${result.errors.length} errors occurred during import`);
    }

    return result;
  } catch (error) {
    console.error('❌ Error in importProductImages:', error);
    result.success = false;
    return result;
  }
}

/**
 * Import all assets from e-commerce scraper results
 */
export async function importAllEcommerceAssets(
  userId: string,
  brandProfileId: string,
  ecommerceData: {
    logo?: string;
    products?: Array<{
      id: string | number;
      title: string;
      images: Array<{
        url: string;
        alt?: string;
        width?: number;
        height?: number;
      }>;
    }>;
    allImages?: string[];
  },
  options?: {
    maxProductImages?: number;
    importLogo?: boolean;
    importProducts?: boolean;
  }
): Promise<{
  logoImported: boolean;
  productImportResult: EcommerceAssetImportResult;
}> {
  const {
    maxProductImages = 20,
    importLogo = true,
    importProducts = true
  } = options || {};

  let logoImported = false;
  let productImportResult: EcommerceAssetImportResult = {
    success: true,
    totalAssets: 0,
    savedAssets: 0,
    errors: [],
    assets: []
  };

  try {
    // Import logo
    if (importLogo && ecommerceData.logo) {
      try {
        await importLogo(userId, brandProfileId, ecommerceData.logo, 'Store');
        logoImported = true;
      } catch (error) {
        console.error('❌ Error importing logo:', error);
      }
    }

    // Import product images
    if (importProducts && ecommerceData.products && ecommerceData.products.length > 0) {
      productImportResult = await importProductImages(
        userId,
        brandProfileId,
        ecommerceData.products,
        maxProductImages
      );
    }

    return {
      logoImported,
      productImportResult
    };
  } catch (error) {
    console.error('❌ Error in importAllEcommerceAssets:', error);
    return {
      logoImported,
      productImportResult
    };
  }
}

