'use client';

import React, { useState, useEffect } from 'react';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateRevo2ContentAction } from '@/app/actions/revo-2-actions';

export default function TestLogoDebugPage() {
  const { currentBrand, brands } = useUnifiedBrand();
  const [testResults, setTestResults] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const testLogoGeneration = async () => {
    if (!currentBrand) {
      alert('Please select a brand first');
      return;
    }

    setIsGenerating(true);
    try {

      const result = await generateRevo2ContentAction(
        currentBrand as any,
        'Instagram',
        { strictConsistency: false, followBrandColors: true },
        'Test logo integration'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Logo Debug Test - Revo 2.0 Integration</CardTitle>
            <p className="text-gray-600">
              This page tests whether logos are properly passed to AI generation
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
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

            {/* Test Generation */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Test Logo Generation</h3>
              <Button 
                onClick={testLogoGeneration}
                disabled={!currentBrand || isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  'Test Logo Integration with Revo 2.0'
                )}
              </Button>
            </div>

            {/* Database Test */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Test Database Persistence</h3>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="mr-4"
              >
                🔄 Refresh Page (Test Persistence)
              </Button>
              <Button 
                onClick={() => alert(JSON.stringify(currentBrand, null, 2))}
                variant="outline"
              >
                📋 Show Current Brand Data
              </Button>
            </div>

            {/* Test Results */}
            {testResults && (
              <div>
                <h3 className="text-lg font-semibold mb-3">AI Generation Test Results</h3>
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
                        <div><strong>Caption:</strong> {testResults.result.content}</div>
                        <div><strong>Hashtags:</strong> {Array.isArray(testResults.result.hashtags) ? testResults.result.hashtags.join(' ') : testResults.result.hashtags}</div>
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
              <h3 className="text-lg font-semibold mb-3">Debug Instructions</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                <p><strong>1.</strong> Select a brand that has a logo uploaded</p>
                <p><strong>2.</strong> Click "Test Logo Integration" to test Revo 2.0 generation</p>
                <p><strong>3.</strong> Check browser console for detailed logo processing logs</p>
                <p><strong>4.</strong> Verify if the generated image includes the brand logo</p>
                <p><strong>5.</strong> If logos are not appearing, check the debugging info above</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}