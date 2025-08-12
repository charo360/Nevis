'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Globe, Sparkles, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CompleteBrandProfile } from '../cbrand-wizard';

interface WebsiteAnalysisStepProps {
  brandProfile: CompleteBrandProfile;
  updateBrandProfile: (updates: Partial<CompleteBrandProfile>) => void;
  onNext: () => void;
}

export function WebsiteAnalysisStep({
  brandProfile,
  updateBrandProfile,
  onNext
}: WebsiteAnalysisStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(brandProfile.websiteUrl || '');
  const [designImages, setDesignImages] = useState<File[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      toast({
        variant: "destructive",
        title: "Invalid Files",
        description: "Please upload only image files.",
      });
    }

    setDesignImages(prev => [...prev, ...imageFiles].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index: number) => {
    setDesignImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Website URL Required",
        description: "Please enter a website URL to analyze.",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Convert images to data URLs
      const designImageUris: string[] = [];
      for (const file of designImages) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        designImageUris.push(dataUrl);
      }

      // Call the existing analyzeBrandAction (reusing without modification)
      const { analyzeBrandAction } = await import('@/app/actions');
      const result = await analyzeBrandAction(websiteUrl, designImageUris);

      // Parse services from AI result and convert to array format
      const servicesArray = result.services
        ? result.services.split('\n').filter(service => service.trim()).map(service => {
          // Try to split by colon or dash to separate name and description
          const parts = service.split(/[:\-]/);
          if (parts.length >= 2) {
            return {
              name: parts[0].trim(),
              description: parts.slice(1).join(':').trim()
            };
          } else {
            return {
              name: service.trim(),
              description: ''
            };
          }
        })
        : [];

      // Update the brand profile with analysis results
      updateBrandProfile({
        websiteUrl,
        description: result.description,
        services: servicesArray,
        visualStyle: result.visualStyle,
        writingTone: result.writingTone,
        contentThemes: result.contentThemes,
        contactPhone: result.contactInfo.phone || '',
        contactEmail: result.contactInfo.email || '',
        contactAddress: result.contactInfo.address || '',
      });

      setAnalysisComplete(true);

      toast({
        title: "Analysis Complete!",
        description: "AI analysis has been completed. Review the results and proceed to the next step.",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSkipAnalysis = () => {
    updateBrandProfile({ websiteUrl });
    onNext();
  };

  const handleNext = () => {
    if (analysisComplete || brandProfile.description) {
      onNext();
    } else {
      toast({
        variant: "destructive",
        title: "Analysis Required",
        description: "Please run the website analysis or skip to continue manually.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Website URL Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="website-url">Website URL</Label>
            <Input
              id="website-url"
              type="url"
              placeholder="https://your-website.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Design Images Upload */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Design Examples</Label>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Recommended
              </span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-800 font-medium mb-1">
                📸 Upload up to 5 design examples to help AI understand your visual style
              </p>
              <p className="text-xs text-blue-700">
                <strong>For exact brand consistency:</strong> If you want the AI to produce content that matches your current brand design,
                please upload at least 3-5 examples of your previous designs (social posts, marketing materials, brochures, ads, etc.)
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="design-upload"
                disabled={designImages.length >= 5}
              />
              <label
                htmlFor="design-upload"
                className={`flex flex-col items-center justify-center cursor-pointer ${designImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 text-center">
                  {designImages.length >= 5
                    ? 'Maximum 5 images reached'
                    : 'Upload social posts, marketing materials, ads (PNG, JPG, SVG)'
                  }
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {designImages.length}/5 uploaded
                </span>
              </label>
            </div>

            {/* Uploaded Images Preview */}
            {designImages.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Uploaded Design Examples ({designImages.length}/5)
                  </span>
                  {designImages.length >= 3 && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Great! This should help AI understand your style
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {designImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Design ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>

                {designImages.length < 3 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                    💡 <strong>Tip:</strong> Upload at least 3 examples for better AI understanding of your brand style
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !websiteUrl.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Website...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Website with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results Preview */}
      {analysisComplete && brandProfile.description && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Business Description</Label>
              <Textarea
                value={brandProfile.description}
                onChange={(e) => updateBrandProfile({ description: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Visual Style</Label>
                <Textarea
                  value={brandProfile.visualStyle}
                  onChange={(e) => updateBrandProfile({ visualStyle: e.target.value })}
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Writing Tone</Label>
                <Textarea
                  value={brandProfile.writingTone}
                  onChange={(e) => updateBrandProfile({ writingTone: e.target.value })}
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleSkipAnalysis}
        >
          Skip Analysis
        </Button>

        <Button
          onClick={handleNext}
          disabled={!analysisComplete && !brandProfile.description}
        >
          Continue to Brand Details
        </Button>
      </div>
    </div>
  );
}
