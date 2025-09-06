'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
// Image persistence functions will be implemented inline

export default function TestImagesPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testImagePersistence = async () => {
    setIsLoading(true);
    addTestResult('🧪 Testing image persistence service...');

    // Test URLs
    const testUrls = [
      'https://via.placeholder.com/400x400/ff0000/ffffff?text=Test+Image+1',
      'https://via.placeholder.com/600x400/00ff00/ffffff?text=Test+Image+2',
      'https://via.placeholder.com/800x600/0000ff/ffffff?text=Large+Test+Image',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U1ZHPC90ZXh0Pjwvc3ZnPg==',
      'invalid-url-test',
      '[Large image data removed - use URL instead]'
    ];

    try {
      const results = await persistMultipleImages(testUrls, {
        maxSize: 500 * 1024, // 500KB limit for testing
        quality: 0.7,
        format: 'jpeg'
      });

      results.forEach((result, url) => {
        if (result.success) {
          addTestResult(`✅ ${url.substring(0, 30)}... - Success (${result.compressedSize ? Math.round(result.compressedSize / 1024) + 'KB' : 'N/A'})`);
        } else {
          addTestResult(`❌ ${url.substring(0, 30)}... - Failed: ${result.error}`);
        }
      });

      addTestResult(`📊 Batch test complete: ${Array.from(results.values()).filter(r => r.success).length}/${testUrls.length} successful`);

    } catch (error) {
      addTestResult(`❌ Batch test failed: ${error}`);
    }

    setIsLoading(false);
  };

  const testSingleImage = async () => {
    setIsLoading(true);
    addTestResult('🔄 Testing single image persistence...');

    try {
      const result = await persistImageUrl('https://via.placeholder.com/1200x800/purple/white?text=Single+Test+Image', {
        maxSize: 200 * 1024, // 200KB limit to force compression
        quality: 0.6,
        format: 'jpeg'
      });

      if (result.success) {
        addTestResult(`✅ Single image test successful`);
        addTestResult(`📊 Original: ${result.originalSize ? Math.round(result.originalSize / 1024) + 'KB' : 'N/A'}, Compressed: ${result.compressedSize ? Math.round(result.compressedSize / 1024) + 'KB' : 'N/A'}`);

        // Show the persisted image
        if (result.url) {
          const img = document.createElement('img');
          img.src = result.url;
          img.style.maxWidth = '200px';
          img.style.maxHeight = '200px';
          img.style.border = '2px solid green';
          img.style.borderRadius = '8px';
          img.style.margin = '10px';

          const container = document.getElementById('test-images-container');
          if (container) {
            container.appendChild(img);
          }
        }
      } else {
        addTestResult(`❌ Single image test failed: ${result.error}`);
      }

    } catch (error) {
      addTestResult(`❌ Single image test error: ${error}`);
    }

    setIsLoading(false);
  };

  const testDataUrlHandling = async () => {
    setIsLoading(true);
    addTestResult('🔄 Testing data URL handling...');

    // Create a small data URL
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DATA', 50, 55);

      const smallDataUrl = canvas.toDataURL('image/png');

      try {
        const result = await persistImageUrl(smallDataUrl, {
          maxSize: 50 * 1024, // 50KB limit
          quality: 0.8,
          format: 'jpeg'
        });

        if (result.success) {
          addTestResult(`✅ Data URL test successful`);
          addTestResult(`📊 Size: ${result.compressedSize ? Math.round(result.compressedSize / 1024) + 'KB' : 'N/A'}`);
        } else {
          addTestResult(`❌ Data URL test failed: ${result.error}`);
        }

      } catch (error) {
        addTestResult(`❌ Data URL test error: ${error}`);
      }
    } else {
      addTestResult(`❌ Canvas context not available`);
    }

    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
    const container = document.getElementById('test-images-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🖼️ Image Persistence Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button
                onClick={testImagePersistence}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Testing...' : 'Test Batch Images'}
              </Button>
              <Button
                onClick={testSingleImage}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Testing...' : 'Test Single Image'}
              </Button>
              <Button
                onClick={testDataUrlHandling}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? 'Testing...' : 'Test Data URL'}
              </Button>
            </div>

            <div className="flex gap-4">
              <Button onClick={clearResults} variant="secondary">
                Clear Results
              </Button>
              <Button onClick={() => router.push('/quick-content')} variant="outline">
                Test in Quick Content
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Images Display */}
        <Card>
          <CardHeader>
            <CardTitle>📸 Persisted Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="test-images-container" className="flex flex-wrap gap-4">
              <p className="text-muted-foreground">Persisted images will appear here after testing.</p>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              {testResults.length > 0 ? (
                <div className="space-y-1 font-mono text-sm">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-gray-800">
                      {result}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No test results yet. Click a test button above.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Navigation Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Dashboard
              </Button>
              <Button onClick={() => router.push('/quick-content')} variant="outline">
                Quick Content
              </Button>
              <Button onClick={() => router.push('/test-colors')} variant="outline">
                Test Colors
              </Button>
              <Button onClick={() => router.push('/test-persistence')} variant="outline">
                Test Persistence
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Test image persistence, then navigate to Quick Content to generate posts and verify images persist across navigation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
