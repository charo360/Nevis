'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  imageUrl?: string;
  qualityScore?: number;
  enhancementsApplied?: string[];
  processingTime?: number;
  error?: string;
}

export default function TestOpenAIPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [formData, setFormData] = useState({
    businessType: 'restaurant',
    platform: 'instagram',
    visualStyle: 'modern',
    imageText: 'Fresh Coffee Daily',
    businessName: 'Test Business'
  });

  const testOpenAI = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      
      // Create a mock brand profile for testing
      const mockBrandProfile = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        primaryColor: '#2563eb',
        accentColor: '#f59e0b',
        description: 'Test business for OpenAI DALL-E 3 testing',
        targetAudience: 'General audience',
        writingTone: 'Professional',
        keyFeatures: ['Quality', 'Service', 'Innovation'],
        competitiveAdvantages: ['Best in class', 'Customer focused'],
        location: 'New York, NY',
        services: ['Premium service', 'Expert consultation']
      };

      // Import and test the OpenAI enhanced design function
      const { generateOpenAIEnhancedDesign } = await import('@/ai/openai-enhanced-design');
      
      const testInput = {
        businessType: formData.businessType,
        platform: formData.platform,
        visualStyle: formData.visualStyle,
        imageText: formData.imageText,
        brandProfile: mockBrandProfile,
        brandConsistency: {
          strictConsistency: true,
          followBrandColors: true
        }
      };


      const testResult = await generateOpenAIEnhancedDesign(testInput);
      

      setResult({
        success: true,
        imageUrl: testResult.imageUrl,
        qualityScore: testResult.qualityScore,
        enhancementsApplied: testResult.enhancementsApplied,
        processingTime: testResult.processingTime
      });

    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">OpenAI DALL-E 3 Latest Model Test</h1>
        <p className="text-muted-foreground">
          Test the upgraded OpenAI DALL-E 3 implementation with enhanced capabilities
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure the test parameters for DALL-E 3 generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Select value={formData.businessType} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, businessType: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={formData.platform} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, platform: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="visualStyle">Visual Style</Label>
              <Select value={formData.visualStyle} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, visualStyle: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="elegant">Elegant</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="imageText">Image Text</Label>
              <Input
                id="imageText"
                value={formData.imageText}
                onChange={(e) => setFormData(prev => ({ ...prev, imageText: e.target.value }))}
                placeholder="Enter text to display on image"
              />
            </div>

            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Enter business name"
              />
            </div>

            <Button 
              onClick={testOpenAI} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing DALL-E 3...
                </>
              ) : (
                'Test OpenAI DALL-E 3'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result?.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : result?.success === false ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
              Test Results
            </CardTitle>
            <CardDescription>
              Results from the OpenAI DALL-E 3 test
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result && (
              <div className="text-center py-8 text-muted-foreground">
                Click "Test OpenAI DALL-E 3" to run the test
              </div>
            )}

            {result?.success && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Quality Score:</strong> {result.qualityScore}/10
                  </div>
                  <div>
                    <strong>Processing Time:</strong> {result.processingTime}ms
                  </div>
                </div>

                {result.enhancementsApplied && (
                  <div>
                    <strong>Enhancements Applied:</strong>
                    <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                      {result.enhancementsApplied.map((enhancement, index) => (
                        <li key={index}>{enhancement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.imageUrl && (
                  <div>
                    <strong>Generated Image:</strong>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img 
                        src={result.imageUrl} 
                        alt="Generated by DALL-E 3"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {result?.success === false && (
              <div className="text-red-600">
                <strong>Error:</strong> {result.error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🚀 DALL-E 3 Latest Model Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">✨ Enhanced Capabilities</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Pixel-perfect text rendering</li>
                <li>• Ultra-high definition (4K quality)</li>
                <li>• Advanced typography and anti-aliasing</li>
                <li>• Professional design principles</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎯 Optimizations</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Platform-specific designs</li>
                <li>• Enhanced brand color compliance</li>
                <li>• Golden ratio layouts</li>
                <li>• 7:1 contrast ratios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
