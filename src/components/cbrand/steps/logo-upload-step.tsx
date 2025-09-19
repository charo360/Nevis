'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Image as ImageIcon,
  X,
  Check,
  ChevronLeft,
  Save,
  Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CompleteBrandProfile } from '../cbrand-wizard';
import { useBrand } from '@/contexts/brand-context-mongo';
import { useAuth } from '@/hooks/use-auth-supabase';

interface LogoUploadStepProps {
  brandProfile: CompleteBrandProfile;
  updateBrandProfile: (updates: Partial<CompleteBrandProfile>) => void;
  onPrevious: () => void;
}

export function LogoUploadStep({
  brandProfile,
  updateBrandProfile,
  onPrevious
}: LogoUploadStepProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add database integration
  const { saveProfile } = useBrand();
  const { user } = useAuth();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, SVG, etc.)",
      });
      return;
    }

    // Validate file size (max 5MB for high-quality logos)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB for optimal performance",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Compress and convert to data URL
      const compressedDataUrl = await compressImage(file);
      updateBrandProfile({ logoDataUrl: compressedDataUrl });

      toast({
        title: "Logo Uploaded",
        description: "Your logo has been uploaded and optimized successfully!",
      });

      setIsUploading(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to process the image file",
      });
      setIsUploading(false);
    }
  };

  // Image compression function
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // STANDARDIZED LOGO PROCESSING: Always normalize to 200x200px
        // This ensures logos don't influence the AI's design dimensions
        const standardSize = 200;
        const { width: originalWidth, height: originalHeight } = img;

        // Always create a 200x200px canvas for consistent logo size
        canvas.width = standardSize;
        canvas.height = standardSize;

        // Calculate scaling to fit logo within 200x200 while maintaining aspect ratio
        const scale = Math.min(standardSize / originalWidth, standardSize / originalHeight);
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;

        // Center the logo in the 200x200 canvas
        const x = (standardSize - scaledWidth) / 2;
        const y = (standardSize - scaledHeight) / 2;

        // Fill with transparent background
        ctx?.clearRect(0, 0, standardSize, standardSize);

        // Draw logo centered and scaled
        ctx?.drawImage(img, x, y, scaledWidth, scaledHeight);

        // Convert to compressed data URL (PNG to preserve transparency)
        const compressedDataUrl = canvas.toDataURL('image/png', 0.9);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const removeLogo = () => {
    updateBrandProfile({ logoDataUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    // Validate required fields
    const missingFields = [];

    if (!brandProfile.businessName?.trim()) {
      missingFields.push('Business Name');
    }
    if (!brandProfile.businessType?.trim()) {
      missingFields.push('Business Type');
    }
    if (!brandProfile.location?.trim()) {
      missingFields.push('Location');
    }
    if (!brandProfile.description?.trim()) {
      missingFields.push('Business Description');
    }
    if (!brandProfile.services || brandProfile.services.length === 0) {
      missingFields.push('At least one Service/Product');
    } else {
      // Check if all services have names (description is optional)
      const incompleteServices = brandProfile.services.some(
        service => !service.name?.trim()
      );
      if (incompleteServices) {
        missingFields.push('All Service/Product names must be filled');
      }
    }

    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
      });
      return;
    }

    // Temporarily removed logo requirement to test logo persistence
    // if (!brandProfile.logoDataUrl) {
    //   toast({
    //     variant: "destructive",
    //     title: "Logo Required",
    //     description: "Please upload a logo to complete your brand profile",
    //   });
    //   return;
    // }

    if (!user?.userId) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to save your brand profile",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Convert the brand profile to MongoDB format
      const completeProfile = {
        id: '', // Will be generated by MongoDB
        userId: user.userId,
        businessName: brandProfile.businessName!,
        businessType: brandProfile.businessType!,
        description: brandProfile.description,
        location: typeof brandProfile.location === 'string'
          ? { city: brandProfile.location.split(',')[0]?.trim() || '', country: brandProfile.location.split(',')[1]?.trim() || '' }
          : brandProfile.location,
        contact: {
          email: brandProfile.contactEmail || '',
          phone: brandProfile.contactPhone || '',
          website: brandProfile.websiteUrl || '',
        },
        socialMedia: {
          instagram: brandProfile.instagramUrl || '',
          facebook: brandProfile.facebookUrl || '',
          twitter: brandProfile.twitterUrl || '',
          linkedin: brandProfile.linkedinUrl || '',
        },
        brandColors: {
          primary: brandProfile.primaryColor || '#3B82F6',
          secondary: brandProfile.accentColor || '#10B981',
          accent: brandProfile.backgroundColor || '#F8FAFC',
        },
        logoUrl: brandProfile.logoDataUrl || '',
        designExamples: brandProfile.designExamples || [],
        targetAudience: brandProfile.targetAudience || '',
        brandVoice: brandProfile.writingTone || '',
        services: brandProfile.services?.map(service => ({
          name: service.name,
          description: service.description || '',
        })) || [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to MongoDB database
      const profileId = await saveProfile(completeProfile);

      // Clear any existing localStorage data for cleanup
      localStorage.removeItem('completeBrandProfile');
      localStorage.removeItem('brandProfile');




      toast({
        title: "Brand Profile Saved!",
        description: `Your brand profile has been saved to the database successfully! Profile ID: ${profileId}`,
      });

      // Navigate to dashboard after successful save
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: `Failed to save your brand profile: ${error instanceof Error ? error.message : 'Unknown error'}. Try uploading a smaller logo image.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Upload Your Logo
          </CardTitle>
          <p className="text-gray-600">
            Upload your brand logo to complete your profile setup
          </p>
        </CardHeader>
        <CardContent>
          {!brandProfile.logoDataUrl ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="logo-upload"
              />

              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your logo here, or click to browse
                </h3>
                <p className="text-gray-500 mb-4">
                  Supports PNG, JPG, SVG files up to 5MB
                </p>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-block relative">
                <img
                  src={brandProfile.logoDataUrl}
                  alt="Brand Logo"
                  className="max-w-xs max-h-48 object-contain border rounded-lg"
                />
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-green-600 mt-4 flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                Logo uploaded successfully
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Profile Summary
              </CardTitle>
              <p className="text-gray-600">
                {brandProfile.businessName && brandProfile.logoDataUrl
                  ? 'Your complete brand profile information'
                  : 'Review your brand profile before saving'
                }
              </p>
            </div>
            {brandProfile.businessName && brandProfile.logoDataUrl && (
              <div className="text-right">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✅ Complete
                </div>
                <p className="text-xs text-gray-500 mt-1">Ready for content generation</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-medium">Business Name</Label>
                <p className="text-gray-600">{brandProfile.businessName || 'Not set'}</p>
              </div>
              <div>
                <Label className="font-medium">Business Type</Label>
                <p className="text-gray-600">{brandProfile.businessType || 'Not set'}</p>
              </div>
              <div>
                <Label className="font-medium">Location</Label>
                <p className="text-gray-600">{brandProfile.location || 'Not set'}</p>
              </div>
              <div>
                <Label className="font-medium">Website</Label>
                <p className="text-gray-600">{brandProfile.websiteUrl || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Business Description */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Business Description
            </h4>
            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
              {brandProfile.description || 'Not set'}
            </p>
          </div>

          {/* Services/Products */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Services/Products ({brandProfile.services?.length || 0})
            </h4>
            {brandProfile.services && brandProfile.services.length > 0 ? (
              <div className="space-y-2">
                {brandProfile.services.map((service, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                    <div className="font-medium text-gray-900">{service.name}</div>
                    {service.description && (
                      <div className="text-gray-600 mt-1">{service.description}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No services added</p>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="font-medium">Phone</Label>
                <p className="text-gray-600">{brandProfile.contactPhone || 'Not set'}</p>
              </div>
              <div>
                <Label className="font-medium">Email</Label>
                <p className="text-gray-600">{brandProfile.contactEmail || 'Not set'}</p>
              </div>
              <div>
                <Label className="font-medium">Address</Label>
                <p className="text-gray-600">{brandProfile.contactAddress || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Brand Identity */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              Brand Identity
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-medium">Target Audience</Label>
                <p className="text-gray-600">{brandProfile.targetAudience || 'Not set'}</p>
              </div>
              <div>
                <Label className="font-medium">Visual Style</Label>
                <p className="text-gray-600">{brandProfile.visualStyle || 'Not set'}</p>
              </div>
              <div>
                <Label className="font-medium">Writing Tone</Label>
                <p className="text-gray-600">{brandProfile.writingTone || 'Not set'}</p>
              </div>
              <div>
                <Label className="font-medium">Content Themes</Label>
                <p className="text-gray-600">{brandProfile.contentThemes || 'Not set'}</p>
              </div>
              <div>
                <Label className="font-medium">Key Features</Label>
                <p className="text-gray-600">{brandProfile.keyFeatures || 'Not set'}</p>
              </div>
              <div>
                <Label className="font-medium">Competitive Advantages</Label>
                <p className="text-gray-600">{brandProfile.competitiveAdvantages || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Brand Colors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="font-medium">Primary Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: brandProfile.primaryColor || '#3B82F6' }}
                  ></div>
                  <p className="text-gray-600">{brandProfile.primaryColor || '#3B82F6'}</p>
                </div>
              </div>
              <div>
                <Label className="font-medium">Accent Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: brandProfile.accentColor || '#10B981' }}
                  ></div>
                  <p className="text-gray-600">{brandProfile.accentColor || '#10B981'}</p>
                </div>
              </div>
              <div>
                <Label className="font-medium">Background Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: brandProfile.backgroundColor || '#F8FAFC' }}
                  ></div>
                  <p className="text-gray-600">{brandProfile.backgroundColor || '#F8FAFC'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media (Only show if any are filled) */}
          {(brandProfile.facebookUrl || brandProfile.instagramUrl || brandProfile.twitterUrl || brandProfile.linkedinUrl) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                Social Media
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {brandProfile.facebookUrl && (
                  <div>
                    <Label className="font-medium">Facebook</Label>
                    <p className="text-gray-600 truncate">{brandProfile.facebookUrl}</p>
                  </div>
                )}
                {brandProfile.instagramUrl && (
                  <div>
                    <Label className="font-medium">Instagram</Label>
                    <p className="text-gray-600 truncate">{brandProfile.instagramUrl}</p>
                  </div>
                )}
                {brandProfile.twitterUrl && (
                  <div>
                    <Label className="font-medium">Twitter/X</Label>
                    <p className="text-gray-600 truncate">{brandProfile.twitterUrl}</p>
                  </div>
                )}
                {brandProfile.linkedinUrl && (
                  <div>
                    <Label className="font-medium">LinkedIn</Label>
                    <p className="text-gray-600 truncate">{brandProfile.linkedinUrl}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logo Status */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Brand Logo
            </h4>
            <div className="flex items-center gap-3">
              {brandProfile.logoDataUrl ? (
                <>
                  <img
                    src={brandProfile.logoDataUrl}
                    alt="Brand Logo"
                    className="w-12 h-12 object-contain border rounded"
                  />
                  <div>
                    <p className="text-green-600 font-medium text-sm">✅ Logo uploaded</p>
                    <p className="text-gray-500 text-xs">Ready for content generation</p>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-red-600 font-medium text-sm">❌ Logo not uploaded</p>
                  <p className="text-gray-500 text-xs">Upload logo above to complete profile</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous Step
          </Button>

          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            variant={brandProfile.businessName && brandProfile.logoDataUrl ? "outline" : "default"}
            className={brandProfile.businessName && brandProfile.logoDataUrl ? "" : "bg-green-600 hover:bg-green-700"}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {brandProfile.businessName && brandProfile.logoDataUrl ? 'Updating...' : 'Saving Profile...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {brandProfile.businessName && brandProfile.logoDataUrl ? 'Update Profile' : 'Save Complete Profile'}
              </>
            )}
          </Button>
        </div>

        {/* Show "Go to Content Calendar" button when profile is complete */}
        {brandProfile.businessName && brandProfile.logoDataUrl && (
          <div className="border-t pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                ✅ Your brand profile is complete! You can now generate content or make further edits.
              </p>
              <Button
                onClick={() => window.location.href = '/content-calendar'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to Content Calendar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
