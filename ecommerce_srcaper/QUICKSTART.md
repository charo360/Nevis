# 🚀 QUICK START GUIDE

Get the Crevo Store Scraper running in 2 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `puppeteer` - Browser automation
- `node-fetch` - HTTP requests
- `express` - API server
- `cors` - Cross-origin requests

## Step 2: Start the API Server

```bash
npm start
```

Server will run on: `http://localhost:3000`

## Step 3: Test It

### Option A: Use the Demo UI (Easiest)

1. Open `demo.html` in your browser
2. Enter a store URL (try: `https://shop.gymshark.com`)
3. Click "Import Assets"
4. See all products, images, logo, and colors!

### Option B: Use Command Line

```bash
# Test Shopify store
node store-scraper.js https://shop.gymshark.com

# Test any store
node store-scraper.js https://www.allbirds.com
```

### Option C: Use cURL

```bash
curl -X POST http://localhost:3000/api/import-store \
  -H "Content-Type: application/json" \
  -d '{"storeUrl": "https://shop.gymshark.com"}'
```

## Step 4: Integrate with Crevo

### Frontend Example (React)

```javascript
const handleImportStore = async () => {
  const storeUrl = userInput;
  
  setLoading(true);
  
  try {
    const response = await fetch('http://localhost:3000/api/import-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeUrl })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Save to user's brand profile
      await saveBrandAssets({
        brandId: selectedBrand.id,
        logo: data.logo,
        colors: data.brandColors,
        products: data.products,
        allImages: data.allImages
      });
      
      toast.success(`Imported ${data.totalImages} images!`);
      navigate('/asset-library');
    }
  } catch (error) {
    toast.error('Failed to import store');
  } finally {
    setLoading(false);
  }
};
```

### Backend Integration (Node.js)

```javascript
const { importStoreAssets } = require('./store-scraper');

app.post('/api/brands/:brandId/import-store', async (req, res) => {
  const { storeUrl } = req.body;
  const { brandId } = req.params;
  const userId = req.user.id;
  
  // Scrape the store
  const result = await importStoreAssets(storeUrl);
  
  if (result.success) {
    // Save to database
    await db.brands.update({
      _id: brandId,
      userId
    }, {
      $set: {
        storeUrl: result.storeUrl,
        platform: result.platform,
        logo: result.logo,
        brandColors: result.brandColors,
        lastScraped: new Date()
      }
    });
    
    // Save products/images
    await db.brandAssets.insertMany(
      result.products.map(product => ({
        brandId,
        userId,
        type: 'product',
        title: product.title,
        images: product.images,
        importedAt: new Date()
      }))
    );
    
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});
```

## Common Test URLs

**Shopify Stores (Fast)**
- https://shop.gymshark.com
- https://www.allbirds.com
- https://www.fashionnova.com
- https://kith.com

**WooCommerce**
- Most WordPress-based stores

**Custom**
- https://www.nike.com (might be slower)

## Troubleshooting

### Error: "Make sure the API server is running"
→ Run `npm start` first

### Error: "Timeout" or slow scraping
→ Generic stores take longer (5-10 seconds). Increase timeout in code if needed.

### Error: "Store not accessible"
→ Some stores block scrapers. Use your own store URL for testing.

### No products found
→ Store might use heavy JavaScript. Open an issue with the URL.

## What's Next?

1. **Deploy to production**: Railway, Render, or Fly.io
2. **Add to Crevo backend**: Integrate as an API endpoint
3. **Store images**: Upload to S3/Cloudinary instead of using URLs
4. **Add image processing**: Resize, compress, remove backgrounds
5. **Scheduled re-scraping**: Keep product catalogs updated

## File Structure

```
crevo-store-scraper/
├── store-scraper.js    # Main scraper logic
├── api-server.js       # Express API
├── demo.html          # Test UI
├── package.json       # Dependencies
├── README.md          # Full documentation
└── QUICKSTART.md      # This file
```

## Questions?

Read the full README.md for:
- Detailed API documentation
- Integration examples
- Performance tips
- Legal considerations
- Deployment guides

---

**Pro Tip**: Start with the demo.html to see it in action, then integrate the API into your Crevo backend!
