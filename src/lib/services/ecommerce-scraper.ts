/**
 * E-commerce Store Asset Scraper
 * Extracts products, images, logos, and brand colors from e-commerce stores
 * Supports Shopify, WooCommerce, and generic stores
 */

interface StoreProduct {
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
}

interface StoreAssets {
  success: boolean;
  platform?: string;
  storeUrl?: string;
  products?: StoreProduct[];
  totalProducts?: number;
  totalImages?: number;
  logo?: string;
  brandColors?: string[];
  allImages?: string[];
  scrapedAt?: string;
  error?: string;
}

/**
 * Main function to import store assets
 */
export async function importStoreAssets(storeUrl: string): Promise<StoreAssets> {
  try {
    console.log(`🛒 Starting asset extraction for: ${storeUrl}`);
    
    // Normalize URL
    const normalizedUrl = normalizeUrl(storeUrl);
    
    // Detect platform
    const platform = await detectPlatform(normalizedUrl);
    console.log(`📱 Detected platform: ${platform}`);
    
    // Extract based on platform
    let assets: Omit<StoreAssets, 'success' | 'platform' | 'storeUrl' | 'scrapedAt'>;
    
    switch(platform) {
      case 'shopify':
        assets = await scrapeShopify(normalizedUrl);
        break;
      case 'woocommerce':
        assets = await scrapeWooCommerce(normalizedUrl);
        break;
      default:
        assets = await scrapeGeneric(normalizedUrl);
    }
    
    return {
      success: true,
      platform,
      storeUrl: normalizedUrl,
      ...assets,
      scrapedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error importing store assets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Normalize URL to ensure proper format
 */
function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Detect e-commerce platform
 */
export async function detectPlatform(url: string): Promise<string> {
  try {
    // Try Shopify first (fastest detection)
    const shopifyTest = await fetch(`${url}/products.json?limit=1`);
    if (shopifyTest.ok) {
      return 'shopify';
    }
    
    // Try WooCommerce API
    const wooTest = await fetch(`${url}/wp-json/wc/v3/products?per_page=1`);
    if (wooTest.ok) {
      return 'woocommerce';
    }
    
    // Check page content for platform indicators
    const response = await fetch(url);
    const html = await response.text();
    
    if (html.includes('Shopify') || html.includes('shopify')) {
      return 'shopify';
    }
    
    if (html.includes('WooCommerce') || html.includes('wp-content')) {
      return 'woocommerce';
    }
    
    return 'generic';
    
  } catch (error) {
    console.warn('⚠️ Platform detection failed, using generic scraper');
    return 'generic';
  }
}

/**
 * Scrape Shopify store using JSON endpoints
 */
async function scrapeShopify(url: string): Promise<Omit<StoreAssets, 'success' | 'platform' | 'storeUrl' | 'scrapedAt'>> {
  try {
    console.log('🏪 Scraping Shopify store...');
    
    // Get products from Shopify API
    const productsResponse = await fetch(`${url}/products.json?limit=250`);
    if (!productsResponse.ok) {
      throw new Error('Failed to fetch Shopify products');
    }
    
    const productsData = await productsResponse.json();
    const products: StoreProduct[] = [];
    const allImages: string[] = [];
    
    for (const product of productsData.products) {
      const productImages = product.images.map((img: any) => ({
        url: img.src,
        alt: img.alt || product.title,
        width: img.width,
        height: img.height
      }));
      
      products.push({
        id: product.id,
        title: product.title,
        description: product.body_html?.replace(/<[^>]*>/g, '').substring(0, 200),
        images: productImages,
        variants: product.variants?.length || 0,
        productUrl: `${url}/products/${product.handle}`
      });
      
      // Collect all image URLs
      productImages.forEach(img => allImages.push(img.url));
    }
    
    // Try to get logo and brand colors from main page
    const { logo, brandColors } = await extractBrandAssets(url);
    
    return {
      products,
      totalProducts: products.length,
      totalImages: allImages.length,
      logo,
      brandColors,
      allImages
    };
    
  } catch (error) {
    console.error('❌ Shopify scraping failed:', error);
    throw error;
  }
}

/**
 * Scrape WooCommerce store
 */
async function scrapeWooCommerce(url: string): Promise<Omit<StoreAssets, 'success' | 'platform' | 'storeUrl' | 'scrapedAt'>> {
  try {
    console.log('🛍️ Scraping WooCommerce store...');
    
    // Try WooCommerce REST API first
    try {
      const apiResponse = await fetch(`${url}/wp-json/wc/v3/products?per_page=100`);
      if (apiResponse.ok) {
        const apiProducts = await apiResponse.json();
        return await processWooCommerceProducts(apiProducts, url);
      }
    } catch (apiError) {
      console.warn('⚠️ WooCommerce API failed, falling back to scraping');
    }
    
    // Fallback to generic scraping
    return await scrapeGeneric(url);
    
  } catch (error) {
    console.error('❌ WooCommerce scraping failed:', error);
    throw error;
  }
}

/**
 * Process WooCommerce products from API
 */
async function processWooCommerceProducts(apiProducts: any[], baseUrl: string): Promise<Omit<StoreAssets, 'success' | 'platform' | 'storeUrl' | 'scrapedAt'>> {
  const products: StoreProduct[] = [];
  const allImages: string[] = [];
  
  for (const product of apiProducts) {
    const productImages = product.images?.map((img: any) => ({
      url: img.src,
      alt: img.alt || product.name,
      width: img.width,
      height: img.height
    })) || [];
    
    products.push({
      id: product.id,
      title: product.name,
      description: product.short_description?.replace(/<[^>]*>/g, '').substring(0, 200),
      images: productImages,
      variants: product.variations?.length || 0,
      productUrl: product.permalink
    });
    
    productImages.forEach((img: any) => allImages.push(img.url));
  }
  
  const { logo, brandColors } = await extractBrandAssets(baseUrl);
  
  return {
    products,
    totalProducts: products.length,
    totalImages: allImages.length,
    logo,
    brandColors,
    allImages
  };
}

/**
 * Generic store scraping using Puppeteer (fallback)
 */
async function scrapeGeneric(url: string): Promise<Omit<StoreAssets, 'success' | 'platform' | 'storeUrl' | 'scrapedAt'>> {
  try {
    console.log('🌐 Using generic scraping...');
    
    // For now, return basic brand assets extraction
    // In production, you'd use Puppeteer here
    const { logo, brandColors } = await extractBrandAssets(url);
    
    return {
      products: [],
      totalProducts: 0,
      totalImages: 0,
      logo,
      brandColors,
      allImages: []
    };
    
  } catch (error) {
    console.error('❌ Generic scraping failed:', error);
    throw error;
  }
}

/**
 * Extract logo, images, and brand colors from any website
 */
export async function extractBrandAssets(url: string): Promise<{ 
  logo?: string; 
  brandColors?: string[];
  images?: string[];
  favicon?: string;
}> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Enhanced logo extraction
    let logo: string | undefined;
    const images: string[] = [];
    let favicon: string | undefined;
    
    // 1. Look for logo in common patterns
    const logoPatterns = [
      /<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
      /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["']/i,
      /<img[^>]*(?:class|id|alt)=["'][^"']*brand[^"']*["'][^>]*src=["']([^"']+)["']/i,
      /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*brand[^"']*["']/i,
    ];
    
    for (const pattern of logoPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        logo = match[1].startsWith('http') ? match[1] : new URL(match[1], url).href;
        break;
      }
    }
    
    // 2. Extract favicon
    const faviconPatterns = [
      /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i,
    ];
    
    for (const pattern of faviconPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        favicon = match[1].startsWith('http') ? match[1] : new URL(match[1], url).href;
        break;
      }
    }
    
    // 3. Extract other relevant images (hero images, banners, etc.)
    const imageMatches = html.match(/<img[^>]*src=["']([^"']+)["']/gi) || [];
    imageMatches.forEach(match => {
      const srcMatch = match.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        const imgSrc = srcMatch[1].startsWith('http') ? srcMatch[1] : new URL(srcMatch[1], url).href;
        // Filter out small icons, tracking pixels, etc.
        if (!imgSrc.includes('icon') && !imgSrc.includes('pixel') && !imgSrc.includes('1x1')) {
          images.push(imgSrc);
        }
      }
    });
    
    // Limit images to prevent overwhelming results
    const limitedImages = images.slice(0, 10);
    
    // Enhanced brand color extraction
    const brandColors: string[] = [];
    
    // 1. CSS custom properties (--primary-color, --brand-color, etc.)
    const cssVarMatches = html.match(/--[^:]*(?:primary|brand|main|accent|theme)[^:]*color[^:]*:\s*([^;]+)/gi) || [];
    cssVarMatches.forEach(match => {
      const color = match.split(':')[1]?.trim();
      if (color && (color.startsWith('#') || color.startsWith('rgb'))) {
        brandColors.push(color);
      }
    });
    
    // 2. Inline styles with common brand color patterns
    const inlineColorMatches = html.match(/(?:background-color|color):\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\))/gi) || [];
    inlineColorMatches.forEach(match => {
      const color = match.split(':')[1]?.trim();
      if (color) brandColors.push(color);
    });
    
    // 3. Common CSS class patterns
    const classColorMatches = html.match(/class="[^"]*(?:primary|brand|main|accent|theme)[^"]*"/gi) || [];
    
    // 4. Meta theme colors
    const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i);
    if (themeColorMatch && themeColorMatch[1]) {
      brandColors.push(themeColorMatch[1]);
    }
    
    // 5. Remove duplicates and invalid colors, limit to 5 most relevant
    const uniqueColors = [...new Set(brandColors)]
      .filter(color => {
        // Filter out common non-brand colors
        const commonColors = ['#ffffff', '#000000', '#fff', '#000', 'rgb(255,255,255)', 'rgb(0,0,0)'];
        return !commonColors.includes(color.toLowerCase());
      })
      .slice(0, 5);
    
    return { 
      logo, 
      brandColors: uniqueColors, 
      images: limitedImages,
      favicon 
    };
    
  } catch (error) {
    console.warn('⚠️ Brand assets extraction failed:', error);
    return {};
  }
}
