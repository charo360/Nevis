'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Globe, Sparkles, Upload, X, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [analysisError, setAnalysisError] = useState('');

  // Dialog states for friendly error handling
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'blocked' | 'timeout' | 'error'>('error');
  const [dialogMessage, setDialogMessage] = useState('');

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

    // Check file sizes to prevent storage issues
    const totalSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 25 * 1024 * 1024; // 25MB total limit for design files (increased for high-quality images)

    if (totalSize > maxSize) {
      toast({
        variant: "destructive",
        title: "Files Too Large",
        description: "Design examples are too large. Please use smaller images (max 25MB total).",
      });
      return;
    }

    // Limit to 3 design examples to prevent storage overflow
    setDesignImages(prev => [...prev, ...imageFiles].slice(0, 3)); // Max 3 images for storage optimization

    if (imageFiles.length > 0) {
      toast({
        title: "Design Examples Added",
        description: `${imageFiles.length} design example(s) uploaded successfully.`,
      });
    }
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
    setAnalysisComplete(false);
    setAnalysisError('');
    setAnalysisProgress('Preparing comprehensive analysis...');

    try {
      // Convert images to data URLs with progress feedback
      setAnalysisProgress('Processing design examples...');
      const designImageUris: string[] = [];
      for (let i = 0; i < designImages.length; i++) {
        const file = designImages[i];
        setAnalysisProgress(`Processing design example ${i + 1}/${designImages.length}...`);
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        designImageUris.push(dataUrl);
      }

      // Start comprehensive AI analysis with website scraping
      setAnalysisProgress('🌐 Scraping website content and extracting text...');
      const { analyzeBrandAction } = await import('@/app/actions');

      // Add progress feedback for AI analysis
      setAnalysisProgress('🤖 AI is analyzing website content and extracting company-specific information...');
      const analysisResult = await analyzeBrandAction(websiteUrl, designImageUris);

      // Check if analysis failed
      if (!analysisResult.success) {
        setAnalysisProgress('');
        setDialogType(analysisResult.errorType);
        setDialogMessage(analysisResult.error);
        setShowAnalysisDialog(true);
        return;
      }

      const result = analysisResult.data;

      setAnalysisProgress('📊 Processing analysis results and organizing data...');

      // Parse services from AI result and convert to array format
      const servicesArray = result.services
        ? result.services.split('\n').filter(service => service.trim()).map(service => {
          // Enhanced parsing to handle detailed service descriptions
          const colonIndex = service.indexOf(':');
          if (colonIndex > 0) {
            return {
              name: service.substring(0, colonIndex).trim(),
              description: service.substring(colonIndex + 1).trim()
            };
          } else {
            // If no colon, check for dash
            const dashIndex = service.indexOf(' - ');
            if (dashIndex > 0) {
              return {
                name: service.substring(0, dashIndex).trim(),
                description: service.substring(dashIndex + 3).trim()
              };
            } else {
              // If no separator, use the whole thing as name
              return {
                name: service.trim(),
                description: ''
              };
            }
          }
        })
        : [];

      // Extract color palette information
      const primaryColor = result.colorPalette?.primary || '#3B82F6';
      const accentColor = result.colorPalette?.secondary || result.colorPalette?.accent || '#10B981';
      const backgroundColor = '#F8FAFC'; // Default background

      // Update the brand profile with comprehensive analysis results
      updateBrandProfile({
        // Basic Information
        businessName: result.businessName || '',
        websiteUrl,
        description: result.description,
        businessType: result.businessType || '',
        location: result.location || '',

        // Services and Products
        services: servicesArray,
        keyFeatures: result.keyFeatures || '',
        competitiveAdvantages: result.competitiveAdvantages || '',
        targetAudience: result.targetAudience || 'Target audience not specified on website',

        // Brand Identity
        visualStyle: result.visualStyle,
        writingTone: result.writingTone,
        contentThemes: result.contentThemes,

        // Colors (extracted from AI analysis)
        primaryColor,
        accentColor,
        backgroundColor,

        // Contact Information
        contactPhone: result.contactInfo?.phone || '',
        contactEmail: result.contactInfo?.email || '',
        contactAddress: result.contactInfo?.address || '',

        // Social Media (if found by AI)
        facebookUrl: result.socialMedia?.facebook || '',
        instagramUrl: result.socialMedia?.instagram || '',
        twitterUrl: result.socialMedia?.twitter || '',
        linkedinUrl: result.socialMedia?.linkedin || '',

        // Store design examples for future AI reference
        designExamples: designImageUris,
      });

      setAnalysisProgress('Analysis complete! Extracted comprehensive brand information.');
      setAnalysisComplete(true);

      // Count extracted information for feedback
      const extractedCount = [
        result.description,
        result.businessType,
        result.services,
        result.visualStyle,
        result.writingTone,
        result.contentThemes,
        result.targetAudience,
        result.keyFeatures,
        result.competitiveAdvantages,
        result.contactInfo?.phone,
        result.contactInfo?.email,
        result.contactInfo?.address,
        result.socialMedia?.facebook,
        result.socialMedia?.instagram,
        result.socialMedia?.twitter,
        result.socialMedia?.linkedin,
        result.colorPalette?.primary,
        result.location
      ].filter(Boolean).length;

      toast({
        title: "🎉 Enhanced Analysis Complete!",
        description: `AI extracted ${extractedCount} pieces of detailed brand information including target audience, comprehensive services, and color analysis from your designs.`,
      });

    } catch (error) {
      // This catch is now for unexpected errors only
      console.error('Unexpected analysis error:', error);
      setAnalysisProgress('');
      setDialogType('error');
      setDialogMessage('An unexpected error occurred during analysis.');
      setShowAnalysisDialog(true);
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
            AI Website Analysis
          </CardTitle>
          <p className="text-gray-600">
            Our AI will analyze your specific website and extract detailed, company-specific information
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🎯 Company-Specific Analysis:</strong> The AI will extract your exact service descriptions,
              your specific target audience, your unique competitive advantages, and your actual brand voice -
              not generic industry information.
            </p>
          </div>
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
                📸 Upload up to 3 design examples to help AI understand your visual style (max 10MB total)
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
                {analysisProgress || 'Analyzing Website...'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Website with AI
              </>
            )}
          </Button>

          {/* Progress Feedback */}
          {isAnalyzing && analysisProgress && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-sm text-blue-800">{analysisProgress}</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {analysisError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Analysis Error:</strong> {analysisError}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comprehensive Analysis Results */}
      {analysisComplete && brandProfile.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              AI Analysis Results
            </CardTitle>
            <p className="text-sm text-gray-600">
              Review and edit the extracted information. All fields are editable and will be used to populate your brand profile.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Core Business Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Core Business Information
              </h4>
              <div className="space-y-4">
                <div>
                  <Label>Business Description</Label>
                  <Textarea
                    value={brandProfile.description}
                    onChange={(e) => updateBrandProfile({ description: e.target.value })}
                    rows={3}
                    className="mt-1"
                    placeholder="Comprehensive business description..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Business Type</Label>
                    <Input
                      value={brandProfile.businessType}
                      onChange={(e) => updateBrandProfile({ businessType: e.target.value })}
                      placeholder="e.g., Digital Marketing Agency"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={brandProfile.location}
                      onChange={(e) => updateBrandProfile({ location: e.target.value })}
                      placeholder="e.g., New York, NY"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Services and Target Audience */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Services & Audience
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Target Audience</Label>
                  <Textarea
                    value={brandProfile.targetAudience}
                    onChange={(e) => updateBrandProfile({ targetAudience: e.target.value })}
                    rows={2}
                    className="mt-1"
                    placeholder="Target customer description..."
                  />
                </div>
                <div>
                  <Label>Key Features</Label>
                  <Textarea
                    value={brandProfile.keyFeatures}
                    onChange={(e) => updateBrandProfile({ keyFeatures: e.target.value })}
                    rows={2}
                    className="mt-1"
                    placeholder="Key features and benefits..."
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label>Competitive Advantages</Label>
                <Textarea
                  value={brandProfile.competitiveAdvantages}
                  onChange={(e) => updateBrandProfile({ competitiveAdvantages: e.target.value })}
                  rows={2}
                  className="mt-1"
                  placeholder="What makes this business unique..."
                />
              </div>
            </div>

            {/* Brand Identity */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Brand Identity & Voice
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Visual Style</Label>
                  <Textarea
                    value={brandProfile.visualStyle}
                    onChange={(e) => updateBrandProfile({ visualStyle: e.target.value })}
                    rows={3}
                    className="mt-1"
                    placeholder="Visual style and design characteristics..."
                  />
                </div>
                <div>
                  <Label>Writing Tone</Label>
                  <Textarea
                    value={brandProfile.writingTone}
                    onChange={(e) => updateBrandProfile({ writingTone: e.target.value })}
                    rows={3}
                    className="mt-1"
                    placeholder="Brand voice and communication style..."
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label>Content Themes</Label>
                <Textarea
                  value={brandProfile.contentThemes}
                  onChange={(e) => updateBrandProfile({ contentThemes: e.target.value })}
                  rows={2}
                  className="mt-1"
                  placeholder="Common content themes and topics..."
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={brandProfile.contactPhone}
                    onChange={(e) => updateBrandProfile({ contactPhone: e.target.value })}
                    placeholder="Phone number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={brandProfile.contactEmail}
                    onChange={(e) => updateBrandProfile({ contactEmail: e.target.value })}
                    placeholder="Email address"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={brandProfile.contactAddress}
                    onChange={(e) => updateBrandProfile({ contactAddress: e.target.value })}
                    placeholder="Business address"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            {(brandProfile.facebookUrl || brandProfile.instagramUrl || brandProfile.twitterUrl || brandProfile.linkedinUrl) && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  Social Media (Found by AI)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brandProfile.facebookUrl && (
                    <div>
                      <Label>Facebook</Label>
                      <Input
                        value={brandProfile.facebookUrl}
                        onChange={(e) => updateBrandProfile({ facebookUrl: e.target.value })}
                        placeholder="Facebook URL"
                        className="mt-1"
                      />
                    </div>
                  )}
                  {brandProfile.instagramUrl && (
                    <div>
                      <Label>Instagram</Label>
                      <Input
                        value={brandProfile.instagramUrl}
                        onChange={(e) => updateBrandProfile({ instagramUrl: e.target.value })}
                        placeholder="Instagram URL"
                        className="mt-1"
                      />
                    </div>
                  )}
                  {brandProfile.twitterUrl && (
                    <div>
                      <Label>Twitter/X</Label>
                      <Input
                        value={brandProfile.twitterUrl}
                        onChange={(e) => updateBrandProfile({ twitterUrl: e.target.value })}
                        placeholder="Twitter URL"
                        className="mt-1"
                      />
                    </div>
                  )}
                  {brandProfile.linkedinUrl && (
                    <div>
                      <Label>LinkedIn</Label>
                      <Input
                        value={brandProfile.linkedinUrl}
                        onChange={(e) => updateBrandProfile({ linkedinUrl: e.target.value })}
                        placeholder="LinkedIn URL"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Brand Colors */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Brand Colors (AI Detected)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: brandProfile.primaryColor }}
                    ></div>
                    <Input
                      value={brandProfile.primaryColor}
                      onChange={(e) => updateBrandProfile({ primaryColor: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: brandProfile.accentColor }}
                    ></div>
                    <Input
                      value={brandProfile.accentColor}
                      onChange={(e) => updateBrandProfile({ accentColor: e.target.value })}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: brandProfile.backgroundColor }}
                    ></div>
                    <Input
                      value={brandProfile.backgroundColor}
                      onChange={(e) => updateBrandProfile({ backgroundColor: e.target.value })}
                      placeholder="#F8FAFC"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    AI Analysis Complete!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    The AI has extracted comprehensive information from your website and design examples.
                    You can edit any field above, and this information will be used to populate your brand profile in the next steps.
                  </p>
                </div>
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

      {/* Friendly Analysis Dialog */}
      <AlertDialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {dialogType === 'blocked' && <Shield className="h-5 w-5 text-blue-500" />}
              {dialogType === 'timeout' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {dialogType === 'error' && <AlertTriangle className="h-5 w-5 text-orange-500" />}

              {dialogType === 'blocked' && 'Website Analysis Blocked'}
              {dialogType === 'timeout' && 'Analysis Timed Out'}
              {dialogType === 'error' && 'Analysis Unavailable'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{dialogMessage}</p>

              {dialogType === 'blocked' && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Don't worry!</strong> Many professional websites block automated tools for security.
                    You can still create an amazing brand profile by filling in the details manually.
                  </p>
                </div>
              )}

              {dialogType === 'timeout' && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>No problem!</strong> You can try again later or proceed manually.
                    The manual setup gives you full control over your brand information.
                  </p>
                </div>
              )}

              {dialogType === 'error' && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>That's okay!</strong> Technical issues happen sometimes.
                    You can create an excellent brand profile by entering the information yourself.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWebsiteUrl('')}>
              Try Different Website
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowAnalysisDialog(false);
              handleSkipAnalysis();
            }}>
              Continue Manually
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
