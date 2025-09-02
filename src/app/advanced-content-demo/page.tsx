'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Target, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface AdvancedContentResult {
  headline: string;
  subheadline: string;
  caption: string;
  cta: string;
  hashtags: string[];
  intelligence: {
    trendingKeywords: string[];
    seasonalThemes: string[];
    industryBuzz: string[];
    performanceRecommendations: string[];
    competitiveAdvantages: string[];
    nextIterationFocus: string[];
    contentOptimization: {
      strengths: string[];
      improvements: string[];
    };
  };
  performance: {
    hashtagCount: number;
    captionLength: number;
    headlineLength: number;
    trendingKeywords: number;
    recommendations: number;
  };
  quality: {
    hasHeadline: boolean;
    hasSubheadline: boolean;
    hasCTA: boolean;
    hashtagOptimized: boolean;
    captionOptimized: boolean;
    trendingIntegrated: boolean;
    performanceAnalyzed: boolean;
  };
}

export default function AdvancedContentDemo() {
  const [formData, setFormData] = useState({
    businessName: 'Bella Vista Restaurant',
    businessType: 'restaurant',
    location: 'New York, NY',
    platform: 'instagram',
    writingTone: 'friendly',
    targetAudience: 'food lovers and families',
    services: 'Fine dining, catering, private events',
    keyFeatures: 'Fresh ingredients, authentic recipes, cozy atmosphere',
    competitiveAdvantages: 'Family-owned, locally sourced, 20+ years experience'
  });

  const [result, setResult] = useState<AdvancedContentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/advanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to generate content');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Brain className="h-10 w-10 text-purple-600" />
          Advanced Content Generator
        </h1>
        <p className="text-gray-600 text-lg">
          Deep business intelligence • Cultural awareness • Performance optimization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Business Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="beauty">Beauty</SelectItem>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
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
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="services">Services</Label>
              <Textarea
                id="services"
                value={formData.services}
                onChange={(e) => handleInputChange('services', e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="competitiveAdvantages">Competitive Advantages</Label>
              <Textarea
                id="competitiveAdvantages"
                value={formData.competitiveAdvantages}
                onChange={(e) => handleInputChange('competitiveAdvantages', e.target.value)}
                rows={2}
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Advanced Content...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Advanced Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Generated Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {result && (
              <Tabs defaultValue="content" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="quality">Quality</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Headline</Label>
                    <div className="bg-gray-50 p-3 rounded-lg mt-1">
                      <p className="font-semibold">{result.headline}</p>
                    </div>
                  </div>

                  {result.subheadline && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Subheadline</Label>
                      <div className="bg-gray-50 p-3 rounded-lg mt-1">
                        <p>{result.subheadline}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Caption</Label>
                    <div className="bg-gray-50 p-3 rounded-lg mt-1 max-h-40 overflow-y-auto">
                      <p className="whitespace-pre-wrap">{result.caption}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Call to Action</Label>
                    <div className="bg-blue-50 p-3 rounded-lg mt-1">
                      <p className="text-blue-700 font-medium">{result.cta}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Hashtags ({result.hashtags.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {result.hashtags.map((hashtag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="intelligence" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Trending Keywords</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {result.intelligence.trendingKeywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-green-600">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Performance Recommendations</Label>
                    <div className="space-y-2 mt-2">
                      {result.intelligence.performanceRecommendations.map((rec, index) => (
                        <div key={index} className="bg-blue-50 p-2 rounded text-sm">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Competitive Advantages</Label>
                    <div className="space-y-2 mt-2">
                      {result.intelligence.competitiveAdvantages.map((advantage, index) => (
                        <div key={index} className="bg-purple-50 p-2 rounded text-sm">
                          {advantage}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{result.performance.hashtagCount}</div>
                      <div className="text-sm text-gray-600">Hashtags</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{result.performance.captionLength}</div>
                      <div className="text-sm text-gray-600">Caption Length</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{result.performance.trendingKeywords}</div>
                      <div className="text-sm text-gray-600">Trending Keywords</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{result.performance.recommendations}</div>
                      <div className="text-sm text-gray-600">Recommendations</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="quality" className="space-y-3">
                  {Object.entries(result.quality).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      {value ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            )}

            {!result && !loading && (
              <div className="text-center py-12 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure your business details and generate advanced content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
