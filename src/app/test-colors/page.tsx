'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { useRouter } from 'next/navigation';

export default function TestColorsPage() {
  const { currentBrand, selectBrand, updateProfile } = useUnifiedBrand();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentColors, setCurrentColors] = useState({
    primaryColor: '#3b82f6',
    accentColor: '#10b981',
    backgroundColor: '#f8fafc'
  });
  const router = useRouter();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Update current colors when brand changes
  useEffect(() => {
    if (currentBrand) {
      setCurrentColors({
        primaryColor: currentBrand.primaryColor || '#3b82f6',
        accentColor: currentBrand.accentColor || '#10b981',
        backgroundColor: currentBrand.backgroundColor || '#f8fafc'
      });
    }
  }, [currentBrand]);

  const testColorUpdate = async (newColor: string, colorType: 'primaryColor' | 'accentColor' | 'backgroundColor') => {
    if (!currentBrand) {
      addTestResult('❌ No current brand selected');
      return;
    }

    addTestResult(`🎨 Testing ${colorType} update to ${newColor}...`);

    try {
      // Update the brand profile
      await updateProfile(currentBrand.id, { [colorType]: newColor });
      addTestResult(`✅ Updated ${colorType} in Firebase`);

      // Update local state
      setCurrentColors(prev => ({ ...prev, [colorType]: newColor }));

      // Force re-select the brand to trigger color updates
      const updatedBrand = { ...currentBrand, [colorType]: newColor };
      selectBrand(updatedBrand);
      addTestResult(`✅ Re-selected brand with new ${colorType}`);

      // Check localStorage
      const savedColors = localStorage.getItem('brandColors');
      if (savedColors) {
        const parsed = JSON.parse(savedColors);
        if (parsed[colorType] === newColor) {
          addTestResult(`✅ ${colorType} persisted to localStorage`);
        } else {
          addTestResult(`❌ ${colorType} NOT persisted to localStorage`);
        }
      } else {
        addTestResult(`❌ No colors found in localStorage`);
      }

    } catch (error) {
      addTestResult(`❌ Failed to update ${colorType}: ${error}`);
    }
  };

  const testNavigation = (path: string) => {
    addTestResult(`🔄 Navigating to ${path}...`);
    router.push(path);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testPresetColors = () => {
    const presets = [
      { name: 'Red Theme', primary: '#e11d48', accent: '#f59e0b', background: '#fef2f2' },
      { name: 'Green Theme', primary: '#059669', accent: '#3b82f6', background: '#f0fdf4' },
      { name: 'Purple Theme', primary: '#7c3aed', accent: '#ec4899', background: '#faf5ff' },
      { name: 'Blue Theme', primary: '#2563eb', accent: '#10b981', background: '#eff6ff' }
    ];

    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    addTestResult(`🎨 Testing ${randomPreset.name}...`);

    testColorUpdate(randomPreset.primary, 'primaryColor');
    setTimeout(() => testColorUpdate(randomPreset.accent, 'accentColor'), 1000);
    setTimeout(() => testColorUpdate(randomPreset.background, 'backgroundColor'), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🎨 Color Persistence Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => testColorUpdate('#e11d48', 'primaryColor')} 
                variant="outline"
                style={{ backgroundColor: '#e11d48', color: 'white' }}
              >
                Test Red Primary
              </Button>
              <Button 
                onClick={() => testColorUpdate('#059669', 'accentColor')} 
                variant="outline"
                style={{ backgroundColor: '#059669', color: 'white' }}
              >
                Test Green Accent
              </Button>
              <Button 
                onClick={() => testColorUpdate('#7c3aed', 'primaryColor')} 
                variant="outline"
                style={{ backgroundColor: '#7c3aed', color: 'white' }}
              >
                Test Purple Primary
              </Button>
              <Button 
                onClick={testPresetColors} 
                variant="outline"
              >
                Test Random Theme
              </Button>
            </div>
            
            <div className="flex gap-4">
              <Button onClick={clearResults} variant="secondary">
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Colors Display */}
        <Card>
          <CardHeader>
            <CardTitle>🎨 Current Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div 
                  className="w-20 h-20 rounded-lg border mx-auto mb-2"
                  style={{ backgroundColor: currentColors.primaryColor }}
                />
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-muted-foreground">{currentColors.primaryColor}</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-20 h-20 rounded-lg border mx-auto mb-2"
                  style={{ backgroundColor: currentColors.accentColor }}
                />
                <p className="text-sm font-medium">Accent</p>
                <p className="text-xs text-muted-foreground">{currentColors.accentColor}</p>
              </div>
              <div className="text-center">
                <div 
                  className="w-20 h-20 rounded-lg border mx-auto mb-2"
                  style={{ backgroundColor: currentColors.backgroundColor }}
                />
                <p className="text-sm font-medium">Background</p>
                <p className="text-xs text-muted-foreground">{currentColors.backgroundColor}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Test */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Navigation Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => testNavigation('/dashboard')} variant="outline">
                Dashboard
              </Button>
              <Button onClick={() => testNavigation('/quick-content')} variant="outline">
                Quick Content
              </Button>
              <Button onClick={() => testNavigation('/brand-profile')} variant="outline">
                Brand Profile
              </Button>
              <Button onClick={() => testNavigation('/test-colors')} variant="outline">
                Refresh This Page
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Update colors above, then navigate to test persistence. Colors should remain consistent.
            </p>
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
                <p className="text-muted-foreground">No test results yet. Click a color test button above.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Brand Info */}
        {currentBrand && (
          <Card>
            <CardHeader>
              <CardTitle>🏢 Current Brand</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {currentBrand.businessName || currentBrand.name}</p>
                <p><strong>ID:</strong> {currentBrand.id}</p>
                <p><strong>Type:</strong> {currentBrand.businessType}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
