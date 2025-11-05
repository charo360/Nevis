# Brand Intelligence System

A comprehensive AI-powered brand analysis system that extracts deep insights from websites and social media to understand brand identity, positioning, and strategy.

## 🎯 Overview

The Brand Intelligence System provides two levels of analysis:

- **Basic Analysis**: Fast OpenRouter-based analysis for quick brand insights
- **Comprehensive Analysis**: Deep multi-source analysis with web scraping, social media analysis, NLP processing, and visual identity extraction

## 🏗️ Architecture

```
Brand Intelligence System
├── Enhanced Web Scraper      # Multi-page website scraping with rate limiting
├── Social Media Scraper      # Instagram, Facebook, LinkedIn, Twitter analysis
├── Brand DNA Extractor       # NLP processing for brand personality & tone
├── Visual Analyzer          # Color palette, style, and image analysis
├── Orchestration Pipeline   # Coordinates all components
└── Enhanced Brand Analysis  # Main API interface
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { analyzeEnhancedBrand } from '@/ai/flows/enhanced-brand-analysis';

// Basic analysis (fast)
const result = await analyzeEnhancedBrand({
  websiteUrl: 'https://example.com',
  analysisType: 'basic'
});

console.log(result.basic.businessType);
console.log(result.basic.brandPersonality);
```

### Comprehensive Analysis

```typescript
// Comprehensive analysis (detailed)
const result = await analyzeEnhancedBrand({
  websiteUrl: 'https://example.com',
  analysisType: 'comprehensive',
  options: {
    includeSocialMedia: true,
    includeVisualAnalysis: true,
    maxPages: 25,
    maxImages: 30
  }
});

console.log(result.comprehensive.insights.brandStrength); // 0-100 score
console.log(result.comprehensive.brandIntelligence.brandSummary);
```

### API Endpoint

```bash
# Basic analysis
curl -X POST http://localhost:3001/api/analyze-brand-enhanced \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://example.com", "analysisType": "basic"}'

# Comprehensive analysis
curl -X POST http://localhost:3001/api/analyze-brand-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "https://example.com",
    "analysisType": "comprehensive",
    "options": {
      "includeSocialMedia": true,
      "includeVisualAnalysis": true,
      "maxPages": 30
    }
  }'
```

## 📊 Components

### 1. Enhanced Web Scraper (`enhanced-web-scraper.ts`)

**Features:**
- Multi-page crawling (up to 50 pages)
- Rate limiting and user agent rotation
- Social media handle extraction
- Business intelligence extraction
- Open Graph and JSON-LD parsing

**Usage:**
```typescript
const scraper = new EnhancedWebScraper({
  maxPages: 25,
  maxDepth: 3,
  delayBetweenRequests: 1000
});

const data = await scraper.scrapeComprehensively('https://example.com');
```

### 2. Social Media Scraper (`social-media-scraper.ts`)

**Features:**
- Instagram public profile and posts scraping
- No API keys required (uses unofficial endpoints)
- Anti-detection measures
- Engagement metrics calculation
- Content theme analysis

**Usage:**
```typescript
const scraper = new SocialMediaScraper();
const result = await scraper.scrapeInstagramProfile('username');
```

### 3. Brand DNA Extractor (`brand-dna-extractor.ts`)

**Features:**
- TF-IDF keyword extraction
- Topic modeling (LDA-like)
- Sentiment analysis
- Brand archetype identification
- Communication style analysis

**Usage:**
```typescript
const extractor = new BrandDNAExtractor();
const corpus = extractor.createTextCorpus(websiteContent, socialContent);
const brandDNA = await extractor.extractBrandDNA(corpus);
```

### 4. Visual Analyzer (`visual-analyzer.ts`)

**Features:**
- Color palette extraction
- Image content classification
- Visual style analysis
- Brand consistency scoring
- Technical quality assessment

**Usage:**
```typescript
const analyzer = new VisualAnalyzer();
const identity = await analyzer.analyzeImages(imageUrls);
```

### 5. Orchestration Pipeline (`orchestration-pipeline.ts`)

**Features:**
- Coordinates all analysis components
- Error handling and partial results
- Performance monitoring
- Report generation
- Strategic recommendations

**Usage:**
```typescript
const orchestrator = new BrandIntelligenceOrchestrator();
const analysis = await orchestrator.analyzeBrand('https://example.com');
```

## 📈 Analysis Results

### Basic Analysis Results

```typescript
interface BrandAnalysisResult {
  businessName: string;
  businessType: string;
  industry: string;
  targetAudience: string;
  services: string;
  brandPersonality: string;
  visualStyle: string;
  writingTone: string;
  competitiveAdvantages: string;
  // ... more fields
}
```

### Comprehensive Analysis Results

```typescript
interface CompleteBrandIntelligence {
  websiteData: ComprehensiveBrandData;
  socialMediaData?: SocialMediaData;
  brandDNA: BrandDNA;
  visualIdentity?: BrandVisualIdentity;
  brandSummary: {
    businessType: string;
    brandArchetype: string;
    keyStrengths: string[];
    marketPosition: string;
    // ... more insights
  };
  contentStrategy: {
    toneOfVoice: string[];
    contentThemes: string[];
    messagingFramework: object;
    // ... strategy recommendations
  };
  marketingInsights: {
    socialMediaStrategy: object;
    brandPositioning: object;
    // ... marketing recommendations
  };
}
```

### Scoring System

The comprehensive analysis provides 0-100 scores for:

- **Brand Strength**: Overall brand coherence and differentiation
- **Digital Presence**: Website and social media presence quality
- **Content Quality**: Content depth, sentiment, and messaging clarity
- **Visual Consistency**: Color consistency and design quality

## 🧪 Testing

### Run All Tests

```typescript
import { runBrandIntelligenceTests } from '@/ai/brand-intelligence/test-suite';

const results = await runBrandIntelligenceTests();
```

### Smoke Test

```typescript
import { runSmokeTest } from '@/ai/brand-intelligence/test-suite';

const isOperational = await runSmokeTest();
```

### Test Coverage

- Enhanced Web Scraper: Basic scraping, social media extraction, business intelligence
- Social Media Scraper: Instagram profile scraping, multi-platform analysis
- Brand DNA Extractor: Text corpus creation, brand DNA extraction
- Visual Analyzer: Image analysis simulation
- Orchestration Pipeline: Complete analysis, report generation
- Enhanced Brand Analysis Flow: Basic and comprehensive analysis flows

## ⚙️ Configuration

### Web Scraper Configuration

```typescript
interface ScrapingConfig {
  maxPages: number;        // Maximum pages to scrape (default: 50)
  maxDepth: number;        // Maximum crawl depth (default: 3)
  respectRobots: boolean;  // Respect robots.txt (default: true)
  delayBetweenRequests: number; // Delay in ms (default: 1000)
  maxRetries: number;      // Retry attempts (default: 3)
  timeout: number;         // Request timeout (default: 30000)
}
```

### Analysis Options

```typescript
interface BrandAnalysisConfig {
  maxPages: number;           // Pages to scrape (default: 25)
  maxImages: number;          // Images to analyze (default: 30)
  includeSocialMedia: boolean; // Include social analysis (default: true)
  includeVisualAnalysis: boolean; // Include visual analysis (default: true)
  generateEmbeddings: boolean; // Generate embeddings (default: false)
  saveResults: boolean;       // Save results (default: true)
}
```

## 🔧 Integration

### With Existing Brand Analysis

The system integrates with the existing `analyze-brand.ts` flow:

```typescript
// Enhanced analysis wraps the basic analysis
const enhancedResult = await analyzeEnhancedBrand({
  websiteUrl: 'https://example.com',
  analysisType: 'comprehensive'
});

// Access basic results
const basicResult = enhancedResult.basic;

// Access comprehensive results
const comprehensiveResult = enhancedResult.comprehensive;
```

### API Integration

```typescript
// Use the new enhanced API endpoint
const response = await fetch('/api/analyze-brand-enhanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    websiteUrl: 'https://example.com',
    analysisType: 'comprehensive'
  })
});

const result = await response.json();
```

## 🚨 Error Handling

The system provides robust error handling:

- **Partial Results**: Returns available data even if some components fail
- **Graceful Degradation**: Falls back to basic analysis if comprehensive fails
- **Detailed Error Reporting**: Specific error messages for debugging
- **Retry Logic**: Automatic retries with exponential backoff

## 📝 Logging

Comprehensive logging throughout the system:

```
🚀 Starting comprehensive brand analysis for: https://example.com
🔍 Step 1: Scraping website content...
✅ Scraped 15 pages
📱 Step 2: Analyzing social media presence...
✅ Found Instagram: @username with 24 posts
🧬 Step 3: Extracting brand DNA...
✅ Extracted 18 primary keywords and 4 main topics
🎨 Step 4: Analyzing visual identity...
✅ Analyzed 25 images for visual identity
📋 Step 5: Generating brand insights...
🎉 Brand analysis completed in 45s
```

## 🔮 Future Enhancements

- **Vector Embeddings**: FAISS indexing for semantic search
- **More Social Platforms**: Twitter, LinkedIn, TikTok scraping
- **Advanced Visual Analysis**: CLIP model integration, OCR
- **Real-time Monitoring**: Brand mention tracking
- **Competitive Analysis**: Multi-brand comparison
- **API Rate Limiting**: Built-in rate limiting for production use

## 📄 License

Part of the Nevis AI project. See main project license for details.
