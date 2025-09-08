/**
 * Firebase Storage Test Component
 * Tests Firebase Storage connection and image upload/display functionality
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { firebaseImageStorage } from '@/lib/services/firebase-image-storage';
import { Loader2, CheckCircle, XCircle, Upload, Eye } from 'lucide-react';

interface TestResult {
  success: boolean;
  canUpload: boolean;
  canRead: boolean;
  error?: string;
  testImageUrl?: string;
}

export function FirebaseStorageTest() {
  const { user } = useFirebaseAuth();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null);

  const runStorageTest = async () => {
    if (!user?.userId) {
      setTestResult({
        success: false,
        canUpload: false,
        canRead: false,
        error: 'Please sign in to test Firebase Storage'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    setTestImageUrl(null);

    try {
      console.log('🧪 Starting Firebase Storage test...');
      
      // Test connection and rules
      const connectionTest = await firebaseImageStorage.testConnection(user.userId);
      
      if (connectionTest.success && connectionTest.canUpload) {
        // Create a test image (1x1 pixel PNG)
        const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        // Upload test image
        const uploadResult = await firebaseImageStorage.uploadImageDataUrl(
          testImageData,
          user.userId,
          'storage-test',
          'main'
        );
        
        if (uploadResult.success && uploadResult.url) {
          setTestImageUrl(uploadResult.url);
          
          // Test if image is publicly accessible
          try {
            const response = await fetch(uploadResult.url);
            const canRead = response.ok;
            
            setTestResult({
              success: true,
              canUpload: true,
              canRead,
              testImageUrl: uploadResult.url
            });
          } catch (readError) {
            setTestResult({
              success: true,
              canUpload: true,
              canRead: false,
              error: 'Upload successful but image may not be publicly readable',
              testImageUrl: uploadResult.url
            });
          }
        } else {
          setTestResult({
            success: false,
            canUpload: false,
            canRead: false,
            error: uploadResult.error || 'Upload failed'
          });
        }
      } else {
        setTestResult(connectionTest);
      }
    } catch (error) {
      console.error('❌ Storage test error:', error);
      setTestResult({
        success: false,
        canUpload: false,
        canRead: false,
        error: error instanceof Error ? error.message : 'Unknown test error'
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (success: boolean, label: string) => (
    <Badge variant={success ? "default" : "destructive"} className="flex items-center gap-1">
      {success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </Badge>
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Firebase Storage Test
        </CardTitle>
        <CardDescription>
          Test Firebase Storage connection, upload functionality, and public image access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Please sign in to test Firebase Storage</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">User: {user.email}</p>
                <p className="text-sm text-muted-foreground">User ID: {user.userId}</p>
              </div>
              <Button 
                onClick={runStorageTest} 
                disabled={testing}
                className="flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Test Storage
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <div className="space-y-3 p-4 border rounded-lg">
                <h3 className="font-medium">Test Results:</h3>
                
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(testResult.canUpload, 'Upload')}
                  {getStatusBadge(testResult.canRead, 'Public Read')}
                  {getStatusBadge(testResult.success, 'Overall')}
                </div>

                {testResult.error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive font-medium">Error:</p>
                    <p className="text-sm text-destructive">{testResult.error}</p>
                  </div>
                )}

                {testImageUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Test Image (should display if public read works):
                    </p>
                    <div className="p-2 border rounded-md bg-muted/50">
                      <img 
                        src={testImageUrl} 
                        alt="Firebase Storage Test" 
                        className="w-8 h-8 border"
                        onLoad={() => console.log('✅ Test image loaded successfully')}
                        onError={() => console.error('❌ Test image failed to load')}
                      />
                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        {testImageUrl}
                      </p>
                    </div>
                  </div>
                )}

                {testResult.success && testResult.canUpload && testResult.canRead && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 font-medium">
                      ✅ Firebase Storage is working correctly!
                    </p>
                    <p className="text-sm text-green-700">
                      Images will be uploaded and displayed properly after generation.
                    </p>
                  </div>
                )}

                {testResult.canUpload && !testResult.canRead && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ Upload works but images may not display
                    </p>
                    <p className="text-sm text-yellow-700">
                      Firebase Storage rules may need to be deployed for public read access.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>What this test does:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Tests Firebase Storage connection</li>
                <li>Uploads a small test image</li>
                <li>Verifies public read access</li>
                <li>Checks if images will display after generation</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
