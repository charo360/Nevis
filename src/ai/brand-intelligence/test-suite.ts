// Brand Intelligence Test Suite
// Comprehensive testing for all brand analysis components

import { EnhancedWebScraper } from './enhanced-web-scraper';
import { SocialMediaScraper } from './social-media-scraper';
import { BrandDNAExtractor } from './brand-dna-extractor';
import { VisualAnalyzer } from './visual-analyzer';
import { BrandIntelligenceOrchestrator } from './orchestration-pipeline';
import { analyzeEnhancedBrand } from '../flows/enhanced-brand-analysis';

interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  details: string;
  error?: string;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    totalDuration: number;
  };
}

export class BrandIntelligenceTestSuite {
  private testWebsites = [
    'https://apple.com',
    'https://stripe.com',
    'https://airbnb.com',
    'https://shopify.com',
    'https://netflix.com'
  ];

  async runAllTests(): Promise<TestSuite[]> {
    console.log('🧪 Starting Brand Intelligence Test Suite...');
    
    const suites: TestSuite[] = [];

    // Test 1: Enhanced Web Scraper
    suites.push(await this.testEnhancedWebScraper());

    // Test 2: Social Media Scraper
    suites.push(await this.testSocialMediaScraper());

    // Test 3: Brand DNA Extractor
    suites.push(await this.testBrandDNAExtractor());

    // Test 4: Visual Analyzer
    suites.push(await this.testVisualAnalyzer());

    // Test 5: Orchestration Pipeline
    suites.push(await this.testOrchestrationPipeline());

    // Test 6: Enhanced Brand Analysis Flow
    suites.push(await this.testEnhancedBrandAnalysisFlow());

    // Print summary
    this.printTestSummary(suites);

    return suites;
  }

  private async testEnhancedWebScraper(): Promise<TestSuite> {
    const suiteName = 'Enhanced Web Scraper';
    const results: TestResult[] = [];
    
    console.log(`\n🔍 Testing ${suiteName}...`);

    // Test 1: Basic scraping functionality
    await this.runTest(results, 'Basic Website Scraping', async () => {
      const scraper = new EnhancedWebScraper({ maxPages: 3, maxDepth: 1 });
      const result = await scraper.scrapeComprehensively('https://example.com');
      
      if (!result.website.pages || result.website.pages.length === 0) {
        throw new Error('No pages scraped');
      }
      
      return `Scraped ${result.website.pages.length} pages successfully`;
    });

    // Test 2: Social media handle extraction
    await this.runTest(results, 'Social Media Handle Extraction', async () => {
      const scraper = new EnhancedWebScraper({ maxPages: 2 });
      const result = await scraper.scrapeComprehensively('https://stripe.com');
      
      const handleCount = Object.keys(result.socialMedia.handles).length;
      return `Extracted ${handleCount} social media handles`;
    });

    // Test 3: Business intelligence extraction
    await this.runTest(results, 'Business Intelligence Extraction', async () => {
      const scraper = new EnhancedWebScraper({ maxPages: 2 });
      const result = await scraper.scrapeComprehensively('https://shopify.com');
      
      if (!result.businessIntelligence.businessType) {
        throw new Error('Failed to extract business type');
      }
      
      return `Identified business type: ${result.businessIntelligence.businessType}`;
    });

    return this.createTestSuite(suiteName, results);
  }

  private async testSocialMediaScraper(): Promise<TestSuite> {
    const suiteName = 'Social Media Scraper';
    const results: TestResult[] = [];
    
    console.log(`\n📱 Testing ${suiteName}...`);

    // Test 1: Instagram profile scraping (using a known public profile)
    await this.runTest(results, 'Instagram Profile Scraping', async () => {
      const scraper = new SocialMediaScraper();
      const result = await scraper.scrapeInstagramProfile('instagram'); // Official Instagram account
      
      if (!result || !result.profile) {
        throw new Error('Failed to scrape Instagram profile');
      }
      
      return `Scraped profile: @${result.profile.username} with ${result.posts.length} posts`;
    });

    // Test 2: Multiple platform scraping
    await this.runTest(results, 'Multiple Platform Scraping', async () => {
      const scraper = new SocialMediaScraper();
      const handles = { instagram: 'instagram', facebook: 'facebook' };
      const result = await scraper.scrapeMultiplePlatforms(handles);
      
      const platformCount = Object.keys(result).length;
      return `Analyzed ${platformCount} social media platforms`;
    });

    return this.createTestSuite(suiteName, results);
  }

  private async testBrandDNAExtractor(): Promise<TestSuite> {
    const suiteName = 'Brand DNA Extractor';
    const results: TestResult[] = [];
    
    console.log(`\n🧬 Testing ${suiteName}...`);

    // Test 1: Text corpus creation
    await this.runTest(results, 'Text Corpus Creation', async () => {
      const extractor = new BrandDNAExtractor();
      const websiteContent = [
        'We are a leading technology company focused on innovation and quality.',
        'Our mission is to provide excellent customer service and reliable solutions.',
        'We help businesses grow through cutting-edge software and professional support.'
      ];
      const socialContent = [
        'Excited to announce our new product launch! #innovation #technology',
        'Thank you to our amazing customers for their trust and support.'
      ];
      
      const corpus = extractor.createTextCorpus(websiteContent, socialContent);
      
      if (corpus.metadata.totalWords < 10) {
        throw new Error('Text corpus too small');
      }
      
      return `Created corpus with ${corpus.metadata.totalWords} words, ${corpus.metadata.uniqueWords} unique`;
    });

    // Test 2: Brand DNA extraction
    await this.runTest(results, 'Brand DNA Extraction', async () => {
      const extractor = new BrandDNAExtractor();
      const corpus = extractor.createTextCorpus([
        'We are a professional consulting firm specializing in business strategy and growth. Our experienced team helps companies achieve their goals through innovative solutions and expert guidance. We pride ourselves on delivering quality results and building long-term partnerships with our clients.'
      ], []);
      
      const brandDNA = await extractor.extractBrandDNA(corpus);
      
      if (brandDNA.keywords.primary.length === 0) {
        throw new Error('No keywords extracted');
      }
      
      return `Extracted ${brandDNA.keywords.primary.length} primary keywords, archetype: ${brandDNA.brandPersonality.archetype}`;
    });

    return this.createTestSuite(suiteName, results);
  }

  private async testVisualAnalyzer(): Promise<TestSuite> {
    const suiteName = 'Visual Analyzer';
    const results: TestResult[] = [];
    
    console.log(`\n🎨 Testing ${suiteName}...`);

    // Test 1: Image analysis simulation
    await this.runTest(results, 'Image Analysis Simulation', async () => {
      const analyzer = new VisualAnalyzer();
      const imageUrls = [
        'https://example.com/logo.png',
        'https://example.com/hero-image.jpg',
        'https://example.com/product-photo.jpg'
      ];
      
      const result = await analyzer.analyzeImages(imageUrls);
      
      if (!result.colorScheme || !result.visualStyle) {
        throw new Error('Failed to analyze visual identity');
      }
      
      return `Analyzed ${imageUrls.length} images, style: ${result.visualStyle.overallStyle}`;
    });

    return this.createTestSuite(suiteName, results);
  }

  private async testOrchestrationPipeline(): Promise<TestSuite> {
    const suiteName = 'Orchestration Pipeline';
    const results: TestResult[] = [];
    
    console.log(`\n🎼 Testing ${suiteName}...`);

    // Test 1: Complete brand analysis
    await this.runTest(results, 'Complete Brand Analysis', async () => {
      const orchestrator = new BrandIntelligenceOrchestrator();
      const result = await orchestrator.analyzeBrand('https://example.com', {
        maxPages: 2,
        maxImages: 5,
        includeSocialMedia: false, // Disable for testing
        includeVisualAnalysis: false, // Disable for testing
        saveResults: false
      });
      
      if (!result.brandSummary || !result.brandDNA) {
        throw new Error('Incomplete brand analysis');
      }
      
      return `Analysis completed: ${result.brandSummary.businessType} in ${result.brandSummary.industry}`;
    });

    // Test 2: Quick report generation
    await this.runTest(results, 'Quick Report Generation', async () => {
      const orchestrator = new BrandIntelligenceOrchestrator();
      const result = await orchestrator.analyzeBrand('https://example.com', {
        maxPages: 1,
        includeSocialMedia: false,
        includeVisualAnalysis: false,
        saveResults: false
      });
      
      const report = orchestrator.generateQuickReport(result);
      
      if (report.length < 100) {
        throw new Error('Report too short');
      }
      
      return `Generated report with ${report.length} characters`;
    });

    return this.createTestSuite(suiteName, results);
  }

  private async testEnhancedBrandAnalysisFlow(): Promise<TestSuite> {
    const suiteName = 'Enhanced Brand Analysis Flow';
    const results: TestResult[] = [];
    
    console.log(`\n🚀 Testing ${suiteName}...`);

    // Test 1: Basic analysis
    await this.runTest(results, 'Basic Analysis Flow', async () => {
      const result = await analyzeEnhancedBrand({
        websiteUrl: 'https://example.com',
        analysisType: 'basic'
      });
      
      if (!result.basic || !result.metadata) {
        throw new Error('Basic analysis failed');
      }
      
      return `Basic analysis completed in ${result.metadata.duration}ms`;
    });

    // Test 2: Comprehensive analysis (with limited scope for testing)
    await this.runTest(results, 'Comprehensive Analysis Flow', async () => {
      const result = await analyzeEnhancedBrand({
        websiteUrl: 'https://example.com',
        analysisType: 'comprehensive',
        options: {
          maxPages: 2,
          maxImages: 3,
          includeSocialMedia: false,
          includeVisualAnalysis: false
        }
      });
      
      if (!result.comprehensive || !result.comprehensive.insights) {
        throw new Error('Comprehensive analysis failed');
      }
      
      return `Comprehensive analysis completed, brand strength: ${result.comprehensive.insights.brandStrength}/100`;
    });

    return this.createTestSuite(suiteName, results);
  }

  private async runTest(
    results: TestResult[], 
    testName: string, 
    testFunction: () => Promise<string>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const details = await testFunction();
      const duration = Date.now() - startTime;
      
      results.push({
        testName,
        status: 'passed',
        duration,
        details
      });
      
      console.log(`  ✅ ${testName}: ${details} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      results.push({
        testName,
        status: 'failed',
        duration,
        details: 'Test failed',
        error: error.message
      });
      
      console.log(`  ❌ ${testName}: ${error.message} (${duration}ms)`);
    }
  }

  private createTestSuite(suiteName: string, results: TestResult[]): TestSuite {
    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      warnings: results.filter(r => r.status === 'warning').length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    };

    return {
      suiteName,
      results,
      summary
    };
  }

  private printTestSummary(suites: TestSuite[]): void {
    console.log('\n📊 Test Suite Summary:');
    console.log('=' .repeat(50));
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    suites.forEach(suite => {
      console.log(`\n${suite.suiteName}:`);
      console.log(`  Tests: ${suite.summary.total}`);
      console.log(`  Passed: ${suite.summary.passed}`);
      console.log(`  Failed: ${suite.summary.failed}`);
      console.log(`  Duration: ${suite.summary.totalDuration}ms`);
      
      totalTests += suite.summary.total;
      totalPassed += suite.summary.passed;
      totalFailed += suite.summary.failed;
      totalDuration += suite.summary.totalDuration;
    });

    console.log('\n' + '='.repeat(50));
    console.log(`Overall Results:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed} (${Math.round((totalPassed/totalTests)*100)}%)`);
    console.log(`  Failed: ${totalFailed} (${Math.round((totalFailed/totalTests)*100)}%)`);
    console.log(`  Total Duration: ${Math.round(totalDuration/1000)}s`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log(`\n⚠️ ${totalFailed} test(s) failed. Check the details above.`);
    }
  }

  // Utility method to run a quick smoke test
  async runSmokeTest(): Promise<boolean> {
    console.log('🔥 Running Brand Intelligence Smoke Test...');
    
    try {
      // Test basic functionality
      const result = await analyzeEnhancedBrand({
        websiteUrl: 'https://example.com',
        analysisType: 'basic'
      });
      
      if (result.basic && result.metadata.status !== 'failed') {
        console.log('✅ Smoke test passed - Brand Intelligence system is operational');
        return true;
      } else {
        console.log('❌ Smoke test failed - System not operational');
        return false;
      }
      
    } catch (error) {
      console.log('❌ Smoke test failed:', error.message);
      return false;
    }
  }
}

// Export convenience functions
export async function runBrandIntelligenceTests(): Promise<TestSuite[]> {
  const testSuite = new BrandIntelligenceTestSuite();
  return testSuite.runAllTests();
}

export async function runSmokeTest(): Promise<boolean> {
  const testSuite = new BrandIntelligenceTestSuite();
  return testSuite.runSmokeTest();
}
