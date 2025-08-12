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
  Save
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CompleteBrandProfile } from '../cbrand-wizard';

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

    // Validate file size (max 2MB for localStorage compatibility)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload an image smaller than 2MB to avoid storage issues",
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
      console.error('Upload error:', error);
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
        // Calculate new dimensions (max 400x400 for logos)
        const maxSize = 400;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to compressed data URL (JPEG with 0.8 quality)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
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

    if (!brandProfile.logoDataUrl) {
      toast({
        variant: "destructive",
        title: "Logo Required",
        description: "Please upload a logo to complete your brand profile",
      });
      return;
    }

    setIsSaving(true);

    try {
      console.log('Starting save process...');

      // Check localStorage space before saving
      const testData = JSON.stringify(brandProfile);
      if (testData.length > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Profile data too large for storage');
      }

      // Create a simplified saved profile without external dependencies
      const now = new Date().toISOString();
      const savedProfile = {
        ...brandProfile,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
        version: '1.0',
      };

      // Clear any existing large data first
      localStorage.removeItem('completeBrandProfile');
      localStorage.removeItem('brandProfile');

      // Save to localStorage directly with error handling
      try {
        localStorage.setItem('completeBrandProfile', JSON.stringify(savedProfile));
      } catch (storageError) {
        // If still fails, try without logo for now
        const profileWithoutLogo = { ...savedProfile, logoDataUrl: '' };
        localStorage.setItem('completeBrandProfile', JSON.stringify(profileWithoutLogo));
        console.warn('Saved profile without logo due to storage constraints');
      }

      // Also save in legacy format for compatibility with existing content generation
      const legacyProfile = {
        businessName: brandProfile.businessName,
        businessType: brandProfile.businessType,
        location: brandProfile.location,
        description: brandProfile.description,
        services: brandProfile.services.map(service => `${service.name}: ${service.description}`).join('\n'),
        websiteUrl: brandProfile.websiteUrl,
        logoDataUrl: brandProfile.logoDataUrl,
        visualStyle: brandProfile.visualStyle,
        writingTone: brandProfile.writingTone,
        contentThemes: brandProfile.contentThemes,
        primaryColor: brandProfile.primaryColor,
        accentColor: brandProfile.accentColor,
        backgroundColor: brandProfile.backgroundColor,
        contactPhone: brandProfile.contactPhone,
        contactEmail: brandProfile.contactEmail,
        contactAddress: brandProfile.contactAddress,
        targetAudience: brandProfile.targetAudience,
        keyFeatures: brandProfile.keyFeatures,
        competitiveAdvantages: brandProfile.competitiveAdvantages,
        socialMedia: {
          facebook: brandProfile.facebookUrl,
          instagram: brandProfile.instagramUrl,
          twitter: brandProfile.twitterUrl,
          linkedin: brandProfile.linkedinUrl,
        },
      };

      try {
        localStorage.setItem('brandProfile', JSON.stringify(legacyProfile));
      } catch (storageError) {
        // If still fails, try without logo for legacy format too
        const legacyWithoutLogo = { ...legacyProfile, logoDataUrl: '' };
        localStorage.setItem('brandProfile', JSON.stringify(legacyWithoutLogo));
        console.warn('Saved legacy profile without logo due to storage constraints');
      }

      console.log('Save successful!');

      toast({
        title: "Brand Profile Saved!",
        description: "Your complete brand profile has been created successfully. You can now use it for content generation.",
      });

      // Optional: Redirect to content calendar after a delay
      setTimeout(() => {
        window.location.href = '/content-calendar';
      }, 2000);

    } catch (error) {
      console.error('Save error:', error);
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
          <CardTitle>Profile Summary</CardTitle>
          <p className="text-gray-600">
            Review your complete brand profile before saving
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div>
            <Label className="font-medium">Description</Label>
            <p className="text-gray-600 text-sm">
              {brandProfile.description ?
                (brandProfile.description.length > 150 ?
                  brandProfile.description.substring(0, 150) + '...' :
                  brandProfile.description
                ) :
                'Not set'
              }
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <Label className="font-medium">Brand Colors</Label>
              <div className="flex gap-2 mt-1">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: brandProfile.primaryColor }}
                  title="Primary Color"
                />
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: brandProfile.accentColor }}
                  title="Accent Color"
                />
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: brandProfile.backgroundColor }}
                  title="Background Color"
                />
              </div>
            </div>

            <div>
              <Label className="font-medium">Logo</Label>
              <p className="text-gray-600 text-sm">
                {brandProfile.logoDataUrl ? '✅ Uploaded' : '❌ Not uploaded'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous Step
        </Button>

        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving Profile...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Complete Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
