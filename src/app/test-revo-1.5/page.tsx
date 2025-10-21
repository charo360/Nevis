'use client';

import React, { useState, useEffect } from 'react';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateRevo15ContentAction, testRevo15LogoIntegrationAction, getRevo15CapabilitiesAction } from '@/app/actions/revo-1.5-actions';

export default function TestRevo15Page() {
  const { currentBrand, brands } = useUnifiedBrand();
  const [testResults, setTestResults] = useState<any>(null);
  const [logoTest, setLogoTest] = useState<any>(null);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Load capabilities on mount
    getRevo15CapabilitiesAction().then(setCapabilities);
  }, []);

  const testLogoIntegration = async () => {
    if (!currentBrand) {
      alert('Please select a brand first');
      return;
    }

    setIsTesting(true);
    try {
      const result = await testRevo15LogoIntegrationAction(currentBrand as any);
      setLogoTest(result);
    } catch (error) {
      setLogoTest({
        success: false,
        logoProcessed: false,
        logoSource: 'none',
        logoSize: 0,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testContentGeneration = async () => {
    if (!currentBrand) {
      alert('Please select a brand first');
      return;
    }

    setIsGenerating(true);
    try {

      const result = await generateRevo15ContentAction(
        currentBrand as any,
        'Instagram',
        { strictConsistency: false, followBrandColors: true },
        'Test Revo 1.5 logo integration'
      );

      setTestResults({
        success: true,
        result,
        brandUsed: {
          businessName: currentBrand.businessName,
          hasLogoDataUrl: !!currentBrand.logoDataUrl,
          hasLogoUrl: !!currentBrand.logoUrl,
          logoDataUrlLength: currentBrand.logoDataUrl?.length || 0,
          logoUrlLength: currentBrand.logoUrl?.length || 0
        }
      });
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        brandUsed: {
          businessName: currentBrand.businessName,
          hasLogoDataUrl: !!currentBrand.logoDataUrl,
          hasLogoUrl: !!currentBrand.logoUrl
        }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Revo 1.5 Logo Integration Test</CardTitle>
            <p className="text-gray-600">
              Test Revo 1.5 enhanced content generation with logo support
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Revo 1.5 Capabilities */}
            {capabilities && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Revo 1.5 Capabilities</h3>
                <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                  <div><strong>Name:</strong> {capabilities.name}</div>
                  <div><strong>Description:</strong> {capabilities.description}</div>
                  <div><strong>Quality Range:</strong> {capabilities.qualityRange}</div>
                  <div><strong>Logo Support:</strong> {capabilities.logoSupport ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>Status:</strong> {capabilities.status}</div>
                  <div className="mt-3">
                    <strong>Features:</strong>
                    <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                      {capabilities.features.map((feature: string, index: number) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Current Brand Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Current Brand Information</h3>
              {currentBrand ? (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div><strong>Business Name:</strong> {currentBrand.businessName}</div>
                  <div><strong>Business Type:</strong> {currentBrand.businessType}</div>
                  <div><strong>Has logoDataUrl (base64):</strong> {currentBrand.logoDataUrl ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>Has logoUrl (storage):</strong> {currentBrand.logoUrl ? '✅ Yes' : '❌ No'}</div>
                  {currentBrand.logoDataUrl && (
                    <div><strong>LogoDataUrl Length:</strong> {currentBrand.logoDataUrl.length} chars</div>
                  )}
                  {currentBrand.logoUrl && (
                    <div><strong>LogoUrl:</strong> {currentBrand.logoUrl.substring(0, 100)}...</div>
                  )}
                  
                  {/* Logo Preview */}
                  {(currentBrand.logoDataUrl || currentBrand.logoUrl) && (
                    <div className="mt-4">
                      <strong>Logo Preview:</strong>
                      <div className="mt-2 p-4 bg-white border rounded">
                        <img 
                          src={currentBrand.logoDataUrl || currentBrand.logoUrl} 
                          alt="Brand Logo" 
                          className="max-w-[200px] max-h-[200px] object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p>No brand selected. Available brands: {brands.length}</p>
                  {brands.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {brands.map((brand, index) => (
                        <div key={brand.id || index} className="text-sm">
                          • {brand.businessName} - Logo: {(brand.logoDataUrl || brand.logoUrl) ? '✅' : '❌'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Test Logo Integration */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Test Logo Integration</h3>
              <Button 
                onClick={testLogoIntegration}
                disabled={!currentBrand || isTesting}
                className="bg-purple-600 hover:bg-purple-700 mr-4"
              >
                {isTesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing...
                  </>
                ) : (
                  'Test Logo Integration'
                )}
              </Button>

              {logoTest && (
                <div className={`mt-4 p-4 rounded-lg ${logoTest.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="space-y-2">
                    <div><strong>Status:</strong> {logoTest.success ? '✅ Success' : '❌ Failed'}</div>
                    <div><strong>Logo Processed:</strong> {logoTest.logoProcessed ? '✅ Yes' : '❌ No'}</div>
                    <div><strong>Logo Source:</strong> {logoTest.logoSource}</div>
                    <div><strong>Logo Size:</strong> {logoTest.logoSize} chars</div>
                    <div><strong>Message:</strong> {logoTest.message}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Test Content Generation */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Test Content Generation</h3>
              <Button 
                onClick={testContentGeneration}
                disabled={!currentBrand || isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Test Revo 1.5 Generation with Logo'
                )}
              </Button>
            </div>

            {/* Test Results */}
            {testResults && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Revo 1.5 Generation Test Results</h3>
                <div className={`p-4 rounded-lg ${testResults.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="mb-4">
                    <strong>Status:</strong> {testResults.success ? '✅ Success' : '❌ Failed'}
                  </div>
                  
                  <div className="mb-4">
                    <strong>Brand Used:</strong>
                    <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(testResults.brandUsed, null, 2)}
                    </pre>
                  </div>

                  {testResults.success ? (
                    <div>
                      <strong>Generated Content:</strong>
                      <div className="mt-2 space-y-2">
                        <div><strong>Content:</strong> {testResults.result.content}</div>
                        <div><strong>Hashtags:</strong> {testResults.result.hashtags}</div>
                        <div><strong>Model:</strong> {testResults.result.metadata?.model}</div>
                        <div><strong>Quality Score:</strong> {testResults.result.metadata?.qualityScore}</div>
                        <div><strong>Processing Time:</strong> {testResults.result.metadata?.processingTime}ms</div>
                        {testResults.result.imageUrl && (
                          <div>
                            <strong>Generated Image:</strong>
                            <div className="mt-2">
                              <img 
                                src={testResults.result.imageUrl} 
                                alt="Generated Content" 
                                className="max-w-md border rounded"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong>Error:</strong>
                      <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto">
                        {testResults.error}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Test Instructions</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                <p><strong>1.</strong> Select a brand that has a logo uploaded</p>
                <p><strong>2.</strong> Click "Test Logo Integration" to verify logo processing</p>
                <p><strong>3.</strong> Click "Test Revo 1.5 Generation" to test content creation</p>
                <p><strong>4.</strong> Check browser console for detailed logs</p>
                <p><strong>5.</strong> Verify if the generated image includes the brand logo</p>
                <p><strong>6.</strong> Compare with Revo 1.0 and 2.0 results to ensure consistency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}