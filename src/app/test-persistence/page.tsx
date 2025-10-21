'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { useRouter } from 'next/navigation';

export default function TestPersistencePage() {
  const { currentBrand, brands, selectBrand } = useUnifiedBrand();
  const [testResults, setTestResults] = useState<string[]>([]);
  const router = useRouter();

  // Inline persistence functions
  const getPersistedColors = () => {
    try {
      const savedColors = localStorage.getItem('brandColors');
      if (savedColors) {
        return JSON.parse(savedColors);
      }
    } catch (error) {
      console.error('Failed to get persisted colors:', error);
    }
    return null;
  };

  const clearPersistedData = () => {
    localStorage.removeItem('selectedBrandId');
    localStorage.removeItem('currentBrandData');
    localStorage.removeItem('brandColors');
  };

  const forceBrandRestore = () => {
    try {
      const savedBrandData = localStorage.getItem('currentBrandData');
      if (savedBrandData) {
        const parsedData = JSON.parse(savedBrandData);
        const matchingBrand = brands.find(b => b.id === parsedData.id);
        if (matchingBrand) {
          selectBrand(matchingBrand);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to restore brand:', error);
      return false;
    }
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testBrandPersistence = () => {
    addTestResult('🧪 Testing brand persistence...');

    if (currentBrand) {
      addTestResult(`✅ Current brand: ${currentBrand.businessName || currentBrand.name}`);
      addTestResult(`🎨 Colors: Primary=${currentBrand.primaryColor}, Accent=${currentBrand.accentColor}`);

      // Test localStorage persistence
      const savedBrandId = localStorage.getItem('selectedBrandId');
      const savedBrandData = localStorage.getItem('currentBrandData');

      addTestResult(`💾 Saved brand ID: ${savedBrandId ? '✅ Found' : '❌ Missing'}`);
      addTestResult(`💾 Saved brand data: ${savedBrandData ? '✅ Found' : '❌ Missing'}`);

      if (savedBrandData) {
        try {
          const parsed = JSON.parse(savedBrandData);
          addTestResult(`🔍 Parsed data: ${parsed.businessName || parsed.name} (${parsed.primaryColor})`);
        } catch (error) {
          addTestResult(`❌ Failed to parse saved data: ${error}`);
        }
      }
    } else {
      addTestResult('❌ No current brand selected');
    }
  };

  const testColorPersistence = () => {
    addTestResult('🎨 Testing color persistence...');

    const persistedColors = getPersistedColors();
    if (persistedColors) {
      addTestResult(`✅ Persisted colors found: ${persistedColors.primaryColor}, ${persistedColors.accentColor}`);
      addTestResult(`🏷️ Brand: ${persistedColors.brandName} (ID: ${persistedColors.brandId})`);
    } else {
      addTestResult('❌ No persisted colors found');
    }
  };

  const testBrandRestore = () => {
    addTestResult('🔧 Testing brand restoration...');

    const restored = forceBrandRestore();
    if (restored) {
      addTestResult('✅ Brand restoration successful');
    } else {
      addTestResult('❌ Brand restoration failed');
    }
  };

  const simulateNavigation = () => {
    addTestResult('🔄 Simulating navigation to dashboard...');
    router.push('/dashboard');
  };

  const clearAllData = () => {
    addTestResult('🗑️ Clearing all persisted data...');
    clearPersistedData();
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Brand & Image Persistence Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={testBrandPersistence} variant="outline">
                Test Brand Persistence
              </Button>
              <Button onClick={testColorPersistence} variant="outline">
                Test Color Persistence
              </Button>
              <Button onClick={testBrandRestore} variant="outline">
                Test Brand Restore
              </Button>
              <Button onClick={simulateNavigation} variant="outline">
                Navigate to Dashboard
              </Button>
            </div>

            <div className="flex gap-4">
              <Button onClick={clearAllData} variant="destructive">
                Clear All Data
              </Button>
              <Button onClick={() => setTestResults([])} variant="secondary">
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Brand Status */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Current Brand Status</CardTitle>
          </CardHeader>
          <CardContent>
            {currentBrand ? (
              <div className="space-y-2">
                <p><strong>Name:</strong> {currentBrand.businessName || currentBrand.name}</p>
                <p><strong>ID:</strong> {currentBrand.id}</p>
                <div className="flex items-center gap-2">
                  <strong>Colors:</strong>
                  <div className="flex gap-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: currentBrand.primaryColor }}
                      title={`Primary: ${currentBrand.primaryColor}`}
                    />
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: currentBrand.accentColor }}
                      title={`Accent: ${currentBrand.accentColor}`}
                    />
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: currentBrand.backgroundColor }}
                      title={`Background: ${currentBrand.backgroundColor}`}
                    />
                  </div>
                </div>
                <p><strong>Type:</strong> {currentBrand.businessType}</p>
                <p><strong>Location:</strong> {currentBrand.location}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No brand selected</p>
            )}
          </CardContent>
        </Card>

        {/* Available Brands */}
        <Card>
          <CardHeader>
            <CardTitle>🏢 Available Brands ({brands.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Badge
                  key={brand.id}
                  variant={currentBrand?.id === brand.id ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => selectBrand(brand)}
                >
                  {brand.businessName || brand.name}
                </Badge>
              ))}
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

        {/* Navigation Links */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Navigation Test Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Dashboard
              </Button>
              <Button onClick={() => router.push('/quick-content')} variant="outline">
                Quick Content
              </Button>
              <Button onClick={() => router.push('/brand-profile')} variant="outline">
                Brand Profile
              </Button>
              <Button onClick={() => router.push('/content-calendar')} variant="outline">
                Content Calendar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Use these links to test navigation. Brand data and colors should persist across all pages.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
