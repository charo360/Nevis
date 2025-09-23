'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { saveTestBrandToLocalStorage, loadTestBrandFromLocalStorage, clearTestBrandFromLocalStorage } from '@/utils/test-brand-fallback';
import { AlertCircle, CheckCircle, RefreshCw, Database, Wifi, WifiOff } from 'lucide-react';

export default function DebugBrandsPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testBrand, setTestBrand] = useState<any>(null);
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const checkNetworkStatus = async () => {
    setNetworkStatus('checking');
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache'
      });
      setNetworkStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setNetworkStatus('offline');
    }
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    setStatus('Testing Supabase connection...');
    
    try {
      const response = await fetch('/api/debug-brands', {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(`✅ Supabase connection successful! Found ${data.totalProfiles} brand profiles.`);
      } else {
        setStatus(`❌ Supabase connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestBrand = () => {
    try {
      const brand = saveTestBrandToLocalStorage();
      setTestBrand(brand);
      setStatus('✅ Test brand created and saved to localStorage!');
    } catch (error) {
      setStatus(`❌ Failed to create test brand: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadTestBrand = () => {
    try {
      const brand = loadTestBrandFromLocalStorage();
      if (brand) {
        setTestBrand(brand);
        setStatus('✅ Test brand loaded from localStorage!');
      } else {
        setStatus('⚠️ No test brand found in localStorage');
      }
    } catch (error) {
      setStatus(`❌ Failed to load test brand: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearTestBrand = () => {
    try {
      clearTestBrandFromLocalStorage();
      setTestBrand(null);
      setStatus('✅ Test brand cleared from localStorage!');
    } catch (error) {
      setStatus(`❌ Failed to clear test brand: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testBrandProfilesAPI = async () => {
    setLoading(true);
    setStatus('Testing brand profiles API...');
    
    try {
      const response = await fetch('/api/brand-profiles', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer test-token`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(`✅ Brand profiles API successful! Found ${data.length} profiles.`);
      } else {
        setStatus(`❌ Brand profiles API failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setStatus(`❌ API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Brand Loading Debug Tool</h1>
        <p className="text-gray-600">
          Use this tool to diagnose and fix brand loading issues in the Creative Studio.
        </p>
      </div>

      {/* Network Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {networkStatus === 'online' && <Wifi className="w-5 h-5 text-green-500" />}
            {networkStatus === 'offline' && <WifiOff className="w-5 h-5 text-red-500" />}
            {networkStatus === 'checking' && <RefreshCw className="w-5 h-5 animate-spin" />}
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={networkStatus === 'online' ? 'default' : 'destructive'}>
              {networkStatus === 'checking' ? 'Checking...' : networkStatus.toUpperCase()}
            </Badge>
            <Button onClick={checkNetworkStatus} variant="outline" size="sm">
              Check Network
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Supabase Connection
            </CardTitle>
            <CardDescription>
              Test the connection to Supabase database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testSupabaseConnection} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Test Supabase
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Profiles API</CardTitle>
            <CardDescription>
              Test the brand profiles API endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testBrandProfilesAPI} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Test API
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Brand Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Brand Management</CardTitle>
          <CardDescription>
            Create, load, or clear a test brand profile for development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={createTestBrand} variant="default">
              Create Test Brand
            </Button>
            <Button onClick={loadTestBrand} variant="outline">
              Load Test Brand
            </Button>
            <Button onClick={clearTestBrand} variant="destructive">
              Clear Test Brand
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Display */}
      {status && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status.includes('✅') ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm bg-gray-100 p-3 rounded">{status}</p>
          </CardContent>
        </Card>
      )}

      {/* Test Brand Display */}
      {testBrand && (
        <Card>
          <CardHeader>
            <CardTitle>Current Test Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {testBrand.businessName}</p>
              <p><strong>Type:</strong> {testBrand.businessType}</p>
              <p><strong>Location:</strong> {testBrand.location}</p>
              <p><strong>ID:</strong> {testBrand.id}</p>
              <p><strong>Active:</strong> {testBrand.isActive ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
