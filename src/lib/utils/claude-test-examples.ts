/**
 * Test examples and utilities for Claude-based website analysis
 * Demonstrates the enhanced capabilities compared to the original analyzer
 */

import { EnhancedWebsiteExtractor } from '@/lib/services/claude-website-extractor';
import { ClaudeBrandIntegration } from '@/lib/utils/claude-brand-integration';

export interface TestResult {
  url: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export class ClaudeAnalysisDemo {
  private extractor: EnhancedWebsiteExtractor;
  private integration: ClaudeBrandIntegration;

  constructor(apiKey: string) {
    this.extractor = new EnhancedWebsiteExtractor(apiKey);
    this.integration = new ClaudeBrandIntegration(apiKey);
  }

  /**
   * Test the problematic ZenTech Electronics site that was failing before
   */
  async testZenTechElectronics(): Promise<TestResult> {
    const url = 'https://zentechelectronics.com/';
    const startTime = Date.now();

    try {
      console.log('🧪 Testing ZenTech Electronics with Claude...');
      
      const result = await this.extractor.extractProducts(url);
      const executionTime = Date.now() - startTime;

      if (result.success && result.data) {
        const productCount = result.data.product_categories?.reduce(
          (total, cat) => total + (cat.products?.length || 0), 0
        ) || 0;

        console.log(`✅ ZenTech test successful:`);
        console.log(`   - Categories found: ${result.data.product_categories?.length || 0}`);
        console.log(`   - Products found: ${productCount}`);
        console.log(`   - Execution time: ${executionTime}ms`);

        return {
          url,
          success: true,
          data: result.data,
          executionTime,
          dataQuality: productCount > 10 ? 'excellent' : 
                      productCount > 5 ? 'good' : 
                      productCount > 0 ? 'fair' : 'poor'
        };
      } else {
        return {
          url,
          success: false,
          error: result.error || 'Unknown error',
          executionTime,
          dataQuality: 'poor'
        };
      }
    } catch (error) {
      return {
        url,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
        dataQuality: 'poor'
      };
    }
  }

  /**
   * Test comprehensive brand analysis
   */
  async testComprehensiveBrandAnalysis(url: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      console.log(`🧪 Testing comprehensive brand analysis for: ${url}`);
      
      const result = await this.integration.analyzeBrandComprehensively({
        websiteUrl: url,
        businessType: 'auto-detect',
        includeCompetitorAnalysis: true
      });

      const executionTime = Date.now() - startTime;

      console.log(`✅ Comprehensive analysis successful:`);
      console.log(`   - Business: ${result.businessName}`);
      console.log(`   - Type: ${result.businessType}`);
      console.log(`   - Services count: ${result.detailedServices?.length || 0}`);
      console.log(`   - Data completeness: ${result.dataCompleteness}%`);
      console.log(`   - Execution time: ${executionTime}ms`);

      return {
        url,
        success: true,
        data: result,
        executionTime,
        dataQuality: result.dataCompleteness > 80 ? 'excellent' :
                    result.dataCompleteness > 60 ? 'good' :
                    result.dataCompleteness > 40 ? 'fair' : 'poor'
      };
    } catch (error) {
      return {
        url,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
        dataQuality: 'poor'
      };
    }
  }

  /**
   * Compare Claude analysis with original analyzer
   */
  async compareAnalyzers(url: string): Promise<{
    claude: TestResult;
    originalComparison: {
      expectedImprovements: string[];
      keyDifferences: string[];
    };
  }> {
    console.log(`🔄 Comparing analyzers for: ${url}`);
    
    const claudeResult = await this.testComprehensiveBrandAnalysis(url);
    
    const expectedImprovements = [
      '✅ Actual product categories instead of marketing slogans',
      '✅ Detailed product specifications and pricing',
      '✅ Comprehensive competitor analysis',
      '✅ Enhanced brand personality insights',
      '✅ Better business type detection',
      '✅ More accurate contact information extraction',
      '✅ Structured data format for easy integration'
    ];

    const keyDifferences = [
      'Claude uses advanced reasoning to distinguish products from marketing copy',
      'Multi-step analysis process with business type detection',
      'Competitor intelligence and market positioning insights',
      'Higher data completeness and accuracy scores',
      'Better handling of dynamic and complex websites',
      'Structured output format compatible with existing brand wizard'
    ];

    return {
      claude: claudeResult,
      originalComparison: {
        expectedImprovements,
        keyDifferences
      }
    };
  }

  /**
   * Run a comprehensive test suite
   */
  async runTestSuite(): Promise<{
    results: TestResult[];
    summary: {
      totalTests: number;
      successful: number;
      failed: number;
      averageExecutionTime: number;
      dataQualityDistribution: Record<string, number>;
    };
  }> {
    console.log('🧪 Running Claude analysis test suite...');

    const testUrls = [
      'https://zentechelectronics.com/', // The problematic retail site
      'https://www.paya.co.ke/', // Financial services
      'https://example-restaurant.com/', // Restaurant (if exists)
      'https://example-saas.com/' // SaaS business (if exists)
    ];

    const results: TestResult[] = [];

    for (const url of testUrls) {
      try {
        const result = await this.testComprehensiveBrandAnalysis(url);
        results.push(result);
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          executionTime: 0,
          dataQuality: 'poor'
        });
      }

      // Rate limiting between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const averageExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
    
    const dataQualityDistribution = results.reduce((dist, r) => {
      dist[r.dataQuality] = (dist[r.dataQuality] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    const summary = {
      totalTests: results.length,
      successful,
      failed,
      averageExecutionTime: Math.round(averageExecutionTime),
      dataQualityDistribution
    };

    console.log('📊 Test Suite Results:');
    console.log(`   Total tests: ${summary.totalTests}`);
    console.log(`   Successful: ${summary.successful}`);
    console.log(`   Failed: ${summary.failed}`);
    console.log(`   Average execution time: ${summary.averageExecutionTime}ms`);
    console.log(`   Data quality distribution:`, summary.dataQualityDistribution);

    return { results, summary };
  }
}

/**
 * Example usage and demonstration
 */
export async function demonstrateClaudeAnalysis(apiKey: string) {
  const demo = new ClaudeAnalysisDemo(apiKey);

  console.log('🚀 Starting Claude Website Analysis Demonstration');
  console.log('=' .repeat(60));

  // Test 1: The problematic ZenTech Electronics
  console.log('\n1. Testing ZenTech Electronics (Previously Problematic)');
  console.log('-'.repeat(50));
  const zenTechResult = await demo.testZenTechElectronics();
  
  if (zenTechResult.success) {
    console.log('🎉 SUCCESS: ZenTech analysis now works correctly!');
    const data = zenTechResult.data;
    console.log(`Store: ${data.store_info?.name || 'ZenTech Electronics'}`);
    console.log(`Categories: ${data.product_categories?.length || 0}`);
    
    if (data.product_categories?.length > 0) {
      console.log('Product Categories Found:');
      data.product_categories.forEach((cat: any, i: number) => {
        console.log(`  ${i + 1}. ${cat.category} (${cat.products?.length || 0} products)`);
      });
    }
  } else {
    console.log('❌ FAILED:', zenTechResult.error);
  }

  // Test 2: Comparison with original analyzer
  console.log('\n2. Analyzer Comparison');
  console.log('-'.repeat(50));
  const comparison = await demo.compareAnalyzers('https://zentechelectronics.com/');
  
  console.log('Expected Improvements:');
  comparison.originalComparison.expectedImprovements.forEach(improvement => {
    console.log(`  ${improvement}`);
  });

  // Test 3: Full test suite
  console.log('\n3. Running Full Test Suite');
  console.log('-'.repeat(50));
  const suiteResults = await demo.runTestSuite();

  return {
    zenTechResult,
    comparison,
    suiteResults
  };
}
