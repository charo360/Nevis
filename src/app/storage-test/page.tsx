"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Database,
  TestTube,
  CheckCircle,
  XCircle,
  Zap,
  Shield
} from "lucide-react";
import { useBrand } from "@/contexts/brand-context-supabase";
import { useQuickContentStorage, useCreativeStudioStorage, useStorageMonitor } from "@/hooks/use-feature-storage";
import { UnifiedBrandLayout, BrandContent } from "@/components/layout/unified-brand-layout";

export default function StorageTestPage() {
  const { currentBrand } = useBrand();
  const quickContentStorage = useQuickContentStorage();
  const creativeStudioStorage = useCreativeStudioStorage();
  const storageMonitor = useStorageMonitor();

  const [qcTestData, setQcTestData] = useState('');
  const [csTestData, setCsTestData] = useState('');
  const [testResults, setTestResults] = useState<{
    isolation: boolean;
    qcSave: boolean;
    csSave: boolean;
    qcLoad: boolean;
    csLoad: boolean;
  } | null>(null);

  // Run isolation test
  const runIsolationTest = () => {
    console.log('🧪 Running storage isolation test...');

    // Test data
    const qcData = { type: 'quick-content', data: qcTestData || 'QC Test Data', timestamp: Date.now() };
    const csData = { type: 'creative-studio', data: csTestData || 'CS Test Data', timestamp: Date.now() };

    // Save to both storages
    const qcSaveResult = quickContentStorage.savePosts([qcData]);
    const csSaveResult = creativeStudioStorage.saveProjects([csData]);

    // Load from both storages
    const qcLoadResult = quickContentStorage.loadPosts();
    const csLoadResult = creativeStudioStorage.loadProjects();

    // Check isolation - QC should not see CS data and vice versa
    const qcHasOnlyQcData = qcLoadResult.length > 0 && qcLoadResult[0].type === 'quick-content';
    const csHasOnlyCsData = csLoadResult.length > 0 && csLoadResult[0].type === 'creative-studio';
    const isolationTest = qcHasOnlyQcData && csHasOnlyCsData;

    setTestResults({
      isolation: isolationTest,
      qcSave: qcSaveResult,
      csSave: csSaveResult,
      qcLoad: qcLoadResult.length > 0,
      csLoad: csLoadResult.length > 0,
    });

    console.log('✅ Storage isolation test completed');
  };

  // Clear all test data
  const clearTestData = () => {
    quickContentStorage.clearAll();
    creativeStudioStorage.clearAll();
    setTestResults(null);
    storageMonitor.refreshStats();
    console.log('🧹 Test data cleared');
  };

  // Auto-refresh stats
  useEffect(() => {
    const interval = setInterval(() => {
      storageMonitor.refreshStats();
    }, 2000);
    return () => clearInterval(interval);
  }, [storageMonitor]);

  return (
    <UnifiedBrandLayout>
      <BrandContent>
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <TestTube className="h-8 w-8 text-blue-600" />
                Storage Isolation Test
              </h1>
              <p className="text-muted-foreground mt-1">
                Test that Quick Content and Creative Studio storage are completely isolated
              </p>
            </div>

            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Brand: {currentBrand?.businessName || 'Default'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Test Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Quick Content Test Data</label>
                  <Input
                    placeholder="Enter test data for Quick Content"
                    value={qcTestData}
                    onChange={(e) => setQcTestData(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Creative Studio Test Data</label>
                  <Input
                    placeholder="Enter test data for Creative Studio"
                    value={csTestData}
                    onChange={(e) => setCsTestData(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button onClick={runIsolationTest} className="flex-1">
                    <TestTube className="h-4 w-4 mr-2" />
                    Run Test
                  </Button>
                  <Button variant="outline" onClick={clearTestData}>
                    Clear Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResults ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Storage Isolation</span>
                      {testResults.isolation ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quick Content Save</span>
                      {testResults.qcSave ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Creative Studio Save</span>
                      {testResults.csSave ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quick Content Load</span>
                      {testResults.qcLoad ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Creative Studio Load</span>
                      {testResults.csLoad ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <Separator />

                    <div className="text-center">
                      {testResults.isolation && testResults.qcSave && testResults.csSave && testResults.qcLoad && testResults.csLoad ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          ✅ All Tests Passed - Storage is Isolated
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          ❌ Some Tests Failed
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TestTube className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Run a test to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Storage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Storage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {storageMonitor.storageStats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <h3 className="font-medium text-blue-600">Quick Content</h3>
                    <p className="text-2xl font-bold">{storageMonitor.storageStats.quickContent.totalKeys}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(storageMonitor.storageStats.quickContent.estimatedSize / 1024)} KB
                    </p>
                    <div className="mt-2">
                      {storageMonitor.storageStats.quickContent.categories.map(cat => (
                        <Badge key={cat} variant="outline" className="text-xs mr-1">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-center p-4 border rounded">
                    <h3 className="font-medium text-purple-600">Creative Studio</h3>
                    <p className="text-2xl font-bold">{storageMonitor.storageStats.creativeStudio.totalKeys}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(storageMonitor.storageStats.creativeStudio.estimatedSize / 1024)} KB
                    </p>
                    <div className="mt-2">
                      {storageMonitor.storageStats.creativeStudio.categories.map(cat => (
                        <Badge key={cat} variant="outline" className="text-xs mr-1">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-center p-4 border rounded">
                    <h3 className="font-medium text-green-600">Total</h3>
                    <p className="text-2xl font-bold">{storageMonitor.storageStats.total.keys}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(storageMonitor.storageStats.total.size / 1024)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Loading storage statistics...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-blue-800">
                  <h3 className="font-medium mb-1">Storage Isolation Explained</h3>
                  <p className="text-sm">
                    Quick Content and Creative Studio now use completely separate localStorage keys with different prefixes:
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Quick Content: <code className="bg-blue-100 px-1 rounded">qc-{'{brandId}'}-{'{category}'}</code></li>
                    <li>• Creative Studio: <code className="bg-blue-100 px-1 rounded">cs-{'{brandId}'}-{'{category}'}</code></li>
                  </ul>
                  <p className="text-sm mt-2">
                    This ensures that data from one feature never interferes with the other, even when using the same brand.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </BrandContent>
    </UnifiedBrandLayout>
  );
}
