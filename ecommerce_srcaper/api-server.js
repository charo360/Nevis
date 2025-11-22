const express = require('express');
const cors = require('cors');
const { importStoreAssets } = require('./store-scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory cache (optional - prevents re-scraping same stores)
const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * POST /api/import-store
 * Body: { storeUrl: "https://example.com" }
 */
app.post('/api/import-store', async (req, res) => {
  try {
    const { storeUrl } = req.body;
    
    if (!storeUrl) {
      return res.status(400).json({
        success: false,
        error: 'storeUrl is required'
      });
    }
    
    // Check cache
    const cacheKey = storeUrl.toLowerCase().trim();
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Returning cached result for ${storeUrl}`);
      return res.json({
        ...cached.data,
        cached: true
      });
    }
    
    // Scrape store
    console.log(`Starting import for: ${storeUrl}`);
    const result = await importStoreAssets(storeUrl);
    
    if (result.success) {
      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cachedStores: cache.size
  });
});

/**
 * POST /api/clear-cache
 * Clear the cache (optional utility endpoint)
 */
app.post('/api/clear-cache', (req, res) => {
  cache.clear();
  res.json({
    success: true,
    message: 'Cache cleared'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Store Asset API running on http://localhost:${PORT}`);
  console.log(`📋 POST /api/import-store - Import store assets`);
  console.log(`💚 GET  /api/health - Health check`);
});

module.exports = app;
