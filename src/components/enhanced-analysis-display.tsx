'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Globe, 
  Sparkles, 
  ShoppingCart, 
  Target, 
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Camera,
  Star,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { enhancedAnalyzeBrandAction, type EnhancedAnalysisResult } from '@/app/enhanced-actions';
import { toast } from '@/hooks/use-toast';

interface EnhancedAnalysisDisplayProps {
  websiteUrl?: string;
}

export function EnhancedAnalysisDisplay({ websiteUrl = '' }: EnhancedAnalysisDisplayProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EnhancedAnalysisResult | null>(null);
  const [url, setUrl] = useState(websiteUrl);

  const handleEnhancedAnalysis = async () => {
    if (!url.trim()) {
      toast({
        variant: "destructive",
        title: "Website URL Required",
        description: "Please enter a website URL to analyze.",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await enhancedAnalyzeBrandAction(url);
      setAnalysisResult(result);

      if (result.success) {
        toast({
          title: "🎉 Enhanced Analysis Complete!",
          description: `Found ${result.data?.products.length || 0} products, ${result.data?.totalImagesFound || 0} images, and ${result.data?.uniqueSellingPropositions.length || 0} unique selling points.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: result.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: (error as Error).message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Enhanced Website Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <input
              type="url"
              placeholder="https://zentechelectronics.com/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button 
              onClick={handleEnhancedAnalysis} 
              disabled={isAnalyzing}
              className="min-w-[140px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Analyze Everything
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This will scrape ALL information: products, images, prices, services, competitors, and opportunities.
          </p>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult?.success && analysisResult.data && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Name:</strong> {analysisResult.data.businessName}</div>
                  <div><strong>Type:</strong> {analysisResult.data.businessType}</div>
                  <div><strong>Industry:</strong> {analysisResult.data.industry}</div>
                  <div><strong>Location:</strong> {analysisResult.data.location}</div>
                  <div className="pt-2">
                    <strong>Description:</strong>
                    <p className="text-sm text-muted-foreground mt-1">
                      {analysisResult.data.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analysis Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Data Completeness:</span>
                    <Badge variant="secondary">
                      {analysisResult.data.analysisMetadata.dataCompleteness}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence Score:</span>
                    <Badge variant="secondary">
                      {analysisResult.data.analysisMetadata.confidenceScore}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Products Found:</span>
                    <Badge>{analysisResult.data.analysisMetadata.productsFound}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Images Found:</span>
                    <Badge>{analysisResult.data.analysisMetadata.imagesDownloaded}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Target Audience & Value Props
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <strong>Target Audience:</strong>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analysisResult.data.targetAudience}
                  </p>
                </div>
                
                {analysisResult.data.valuePropositions.length > 0 && (
                  <div>
                    <strong>Value Propositions:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analysisResult.data.valuePropositions.slice(0, 6).map((prop, index) => (
                        <Badge key={index} variant="outline">{prop}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Products Found ({analysisResult.data.products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult.data.products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysisResult.data.products.slice(0, 9).map((product, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">{product.name}</h4>
                          {product.inStock ? (
                            <Badge variant="secondary" className="text-xs">In Stock</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                          )}
                        </div>
                        {product.price && (
                          <div className="text-lg font-bold text-green-600">{product.price}</div>
                        )}
                        <div className="text-xs text-muted-foreground">{product.category}</div>
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No products found on this website.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Services Offered ({analysisResult.data.services.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult.data.services.length > 0 ? (
                  <div className="space-y-3">
                    {analysisResult.data.services.slice(0, 6).map((service, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No services information found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Unique Selling Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.data.uniqueSellingPropositions.length > 0 ? (
                    <div className="space-y-2">
                      {analysisResult.data.uniqueSellingPropositions.map((usp, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{usp}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No USPs identified.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Pain Points</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.data.customerPainPoints.length > 0 ? (
                    <div className="space-y-2">
                      {analysisResult.data.customerPainPoints.map((pain, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{pain}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No pain points identified.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ad Campaign Angles</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult.data.adCampaignAngles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysisResult.data.adCampaignAngles.map((angle, index) => (
                      <div key={index} className="bg-muted/50 p-3 rounded-lg">
                        <span className="text-sm">{angle}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No campaign angles generated.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Media Assets Found
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisResult.data.totalImagesFound}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analysisResult.data.productImages.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Product Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysisResult.data.logoUrls.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Logo Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {analysisResult.data.contactInfo.socialMedia.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Social Platforms</div>
                  </div>
                </div>

                {analysisResult.data.productImages.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Sample Product Images:</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {analysisResult.data.productImages.slice(0, 5).map((url, index) => (
                        <div key={index} className="truncate">
                          • {url}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.data.contactInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{analysisResult.data.contactInfo.phone}</span>
                    </div>
                  )}
                  {analysisResult.data.contactInfo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{analysisResult.data.contactInfo.email}</span>
                    </div>
                  )}
                  {analysisResult.data.contactInfo.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{analysisResult.data.contactInfo.address}</span>
                    </div>
                  )}
                  {analysisResult.data.contactInfo.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{analysisResult.data.contactInfo.website}</span>
                    </div>
                  )}
                </div>

                {analysisResult.data.contactInfo.socialMedia.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Social Media:</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.data.contactInfo.socialMedia.map((social, index) => (
                        <Badge key={index} variant="outline">
                          {social.platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Market Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.data.marketGaps.length > 0 ? (
                    <div className="space-y-2">
                      {analysisResult.data.marketGaps.map((gap, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{gap}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No market gaps identified.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Content Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.data.contentOpportunities.length > 0 ? (
                    <div className="space-y-2">
                      {analysisResult.data.contentOpportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No content opportunities identified.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Areas</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult.data.improvementAreas.length > 0 ? (
                  <div className="space-y-2">
                    {analysisResult.data.improvementAreas.map((area, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No improvement areas identified.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Error Display */}
      {analysisResult && !analysisResult.success && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Analysis Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{analysisResult.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
