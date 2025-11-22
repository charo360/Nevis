const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

/**
 * Main function to import store assets
 * @param {string} storeUrl - The store URL to scrape
 * @returns {Object} - Extracted assets including products, logo, and colors
 */
async function importStoreAssets(storeUrl) {
  try {
    console.log(`Starting asset extraction for: ${storeUrl}`);
    
    // Normalize URL
    const normalizedUrl = normalizeUrl(storeUrl);
    
    // Detect platform
    const platform = await detectPlatform(normalizedUrl);
    console.log(`Detected platform: ${platform}`);
    
    // Extract based on platform
    let assets;
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
    console.error('Error importing store assets:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Normalize URL to ensure it has proper format
 */
function normalizeUrl(url) {
  // Add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  // Remove trailing slash
  return url.replace(/\/$/, '');
}

/**
 * Detect e-commerce platform
 */
async function detectPlatform(url) {
  try {
    // First, try Shopify JSON endpoint (fastest check)
    try {
      const shopifyTest = await fetch(`${url}/products.json`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (shopifyTest.ok) {
        const data = await shopifyTest.json();
        if (data.products) {
          return 'shopify';
        }
      }
    } catch (e) {
      // Not Shopify, continue checking
    }
    
    // Fetch homepage HTML for other checks
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();
    
    // Check for platform indicators
    if (html.includes('Shopify.theme') || 
        html.includes('cdn.shopify.com') || 
        html.includes('shopify-analytics')) {
      return 'shopify';
    }
    
    if (html.includes('woocommerce') || 
        html.includes('wp-content') ||
        html.includes('wc-ajax')) {
      return 'woocommerce';
    }
    
    if (html.includes('magento') || html.includes('Mage.')) {
      return 'magento';
    }
    
    if (html.includes('bigcommerce')) {
      return 'bigcommerce';
    }
    
    return 'generic';
    
  } catch (error) {
    console.error('Error detecting platform:', error);
    return 'generic';
  }
}

/**
 * Scrape Shopify store (using JSON endpoints - no browser needed!)
 */
async function scrapeShopify(url) {
  try {
    console.log('Scraping Shopify store via JSON endpoints...');
    
    // Fetch all products
    const productsResponse = await fetch(`${url}/products.json?limit=250`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const productsData = await productsResponse.json();
    
    // Extract product information
    const products = productsData.products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.body_html?.replace(/<[^>]*>/g, '').substring(0, 200), // Strip HTML
      images: product.images.map(img => ({
        url: img.src,
        alt: img.alt || product.title,
        width: img.width,
        height: img.height
      })),
      variants: product.variants?.length || 0,
      productUrl: `${url}/products/${product.handle}`
    }));
    
    // Get logo and colors using Puppeteer (quick visit)
    const { logo, colors } = await extractBrandAssets(url);
    
    // Get all unique images
    const allImages = products.flatMap(p => p.images.map(img => img.url));
    const uniqueImages = [...new Set(allImages)];
    
    return {
      products,
      totalProducts: products.length,
      totalImages: uniqueImages.length,
      logo,
      brandColors: colors,
      allImages: uniqueImages
    };
    
  } catch (error) {
    console.error('Error scraping Shopify:', error);
    // Fallback to generic scraping
    return await scrapeGeneric(url);
  }
}

/**
 * Scrape WooCommerce store
 */
async function scrapeWooCommerce(url) {
  try {
    console.log('Attempting WooCommerce REST API...');
    
    // Try public REST API endpoint
    const apiUrl = `${url}/wp-json/wc/v3/products`;
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.ok) {
      const productsData = await response.json();
      
      const products = productsData.map(product => ({
        id: product.id,
        title: product.name,
        description: product.short_description?.replace(/<[^>]*>/g, '').substring(0, 200),
        images: product.images.map(img => ({
          url: img.src,
          alt: img.alt || product.name
        })),
        productUrl: product.permalink
      }));
      
      const { logo, colors } = await extractBrandAssets(url);
      const allImages = products.flatMap(p => p.images.map(img => img.url));
      
      return {
        products,
        totalProducts: products.length,
        totalImages: allImages.length,
        logo,
        brandColors: colors,
        allImages: [...new Set(allImages)]
      };
    }
    
  } catch (error) {
    console.log('WooCommerce API not accessible, falling back to generic scraping');
  }
  
  // Fallback to generic scraping
  return await scrapeGeneric(url);
}

/**
 * Generic scraper using Puppeteer (works for any store)
 */
async function scrapeGeneric(url) {
  let browser;
  
  try {
    console.log('Using generic scraping with Puppeteer...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigate to store
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Extract all assets
    const assets = await page.evaluate(() => {
      // Helper function to get absolute URL
      const getAbsoluteUrl = (url) => {
        try {
          return new URL(url, window.location.href).href;
        } catch {
          return url;
        }
      };
      
      // Extract product images (various common selectors)
      const productSelectors = [
        'img[alt*="product" i]',
        '.product img',
        '[class*="product" i] img',
        '.product-image img',
        '[data-product] img',
        '.item img',
        '.grid img',
        'main img'
      ];
      
      const productImages = [];
      const seenUrls = new Set();
      
      productSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(img => {
          const src = img.src || img.dataset.src || img.dataset.lazySrc;
          if (src && !seenUrls.has(src) && !src.includes('icon') && !src.includes('logo')) {
            const absoluteUrl = getAbsoluteUrl(src);
            // Filter out tiny images (likely icons)
            if (img.naturalWidth > 100 && img.naturalHeight > 100) {
              productImages.push({
                url: absoluteUrl,
                alt: img.alt || '',
                width: img.naturalWidth,
                height: img.naturalHeight
              });
              seenUrls.add(src);
            }
          }
        });
      });
      
      // Extract logo
      const logoSelectors = [
        'header img',
        '.logo img',
        '[class*="logo" i] img',
        'nav img',
        '.brand img',
        '[class*="brand" i] img'
      ];
      
      let logo = null;
      for (const selector of logoSelectors) {
        const logoImg = document.querySelector(selector);
        if (logoImg && logoImg.src) {
          logo = getAbsoluteUrl(logoImg.src);
          break;
        }
      }
      
      // Extract brand colors from CSS
      const colors = [];
      const rootStyles = getComputedStyle(document.documentElement);
      
      // Common CSS variable names for brand colors
      const colorVars = [
        '--primary-color',
        '--brand-color',
        '--accent-color',
        '--main-color',
        '--color-primary',
        '--color-brand'
      ];
      
      colorVars.forEach(varName => {
        const color = rootStyles.getPropertyValue(varName).trim();
        if (color && color.startsWith('#')) {
          colors.push(color);
        }
      });
      
      // Extract colors from header/navbar background
      const header = document.querySelector('header, nav, .navbar');
      if (header) {
        const bgColor = getComputedStyle(header).backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          colors.push(bgColor);
        }
      }
      
      return {
        productImages,
        logo,
        colors: [...new Set(colors)]
      };
    });
    
    await browser.close();
    
    return {
      products: assets.productImages.map((img, idx) => ({
        id: `generic-${idx}`,
        title: img.alt || `Product ${idx + 1}`,
        images: [img],
        productUrl: url
      })),
      totalProducts: assets.productImages.length,
      totalImages: assets.productImages.length,
      logo: assets.logo,
      brandColors: assets.colors,
      allImages: assets.productImages.map(img => img.url)
    };
    
  } catch (error) {
    console.error('Error in generic scraping:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extract brand assets (logo and colors) using Puppeteer
 */
async function extractBrandAssets(url) {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    const assets = await page.evaluate(() => {
      // Extract logo
      const logoSelectors = ['header img', '.logo img', '[class*="logo" i] img', 'nav img'];
      let logo = null;
      
      for (const selector of logoSelectors) {
        const logoImg = document.querySelector(selector);
        if (logoImg && logoImg.src) {
          logo = new URL(logoImg.src, window.location.href).href;
          break;
        }
      }
      
      // Extract colors
      const colors = [];
      const rootStyles = getComputedStyle(document.documentElement);
      const colorVars = ['--primary-color', '--brand-color', '--accent-color'];
      
      colorVars.forEach(varName => {
        const color = rootStyles.getPropertyValue(varName).trim();
        if (color) colors.push(color);
      });
      
      const header = document.querySelector('header, nav');
      if (header) {
        const bgColor = getComputedStyle(header).backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          colors.push(bgColor);
        }
      }
      
      return { logo, colors: [...new Set(colors)] };
    });
    
    await browser.close();
    return assets;
    
  } catch (error) {
    console.error('Error extracting brand assets:', error);
    return { logo: null, colors: [] };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  importStoreAssets
};

// Test if run directly
if (require.main === module) {
  const testUrl = process.argv[2];
  
  if (!testUrl) {
    console.log('Usage: node store-scraper.js <store-url>');
    console.log('Example: node store-scraper.js https://example.myshopify.com');
    process.exit(1);
  }
  
  importStoreAssets(testUrl).then(result => {
    console.log('\n=== RESULTS ===');
    console.log(JSON.stringify(result, null, 2));
  });
}
