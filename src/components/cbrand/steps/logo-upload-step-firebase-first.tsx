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
import { saveBrandProfileFirebaseFirst } from '@/lib/firebase/services/brand-profile-firebase-first';
import { useUserId } from '@/hooks/use-firebase-auth';

interface LogoUploadStepFirebaseFirstProps {
  brandProfile: CompleteBrandProfile;
  updateBrandProfile: (updates: Partial<CompleteBrandProfile>) => void;
  onPrevious: () => void;
  onSaveComplete?: (profileId: string) => void;
}

export function LogoUploadStepFirebaseFirst({
  brandProfile,
  updateBrandProfile,
  onPrevious,
  onSaveComplete
}: LogoUploadStepFirebaseFirstProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = useUserId();

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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, SVG)",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
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
    } catch (error) {
      console.error('Logo upload failed:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 800x600 while maintaining aspect ratio)
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
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
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to save your profile",
      });
      return;
    }

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
    }

    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
      });
      return;
    }

    // Logo validation
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
      console.log('🔄 Starting Firebase-first save process for:', brandProfile.businessName);

      // Prepare profile for saving
      const profileToSave = {
        ...brandProfile,
        isComplete: true,
        version: '1.0',
      };

      console.log('💾 Saving profile to Firebase with logo data:', {
        businessName: profileToSave.businessName,
        hasLogo: !!profileToSave.logoDataUrl,
        logoLength: profileToSave.logoDataUrl?.length || 0
      });

      // Save to Firebase first (primary storage)
      const profileId = await saveBrandProfileFirebaseFirst(profileToSave, userId);
      
      console.log('✅ Profile saved to Firebase successfully:', profileId);

      toast({
        title: "Profile Saved Successfully!",
        description: "Your brand profile has been saved to the cloud with logo included.",
      });

      // Call completion callback
      if (onSaveComplete) {
        onSaveComplete(profileId);
      }

    } catch (error) {
      console.error('❌ Failed to save profile:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isProfileComplete = brandProfile.businessName && 
                           brandProfile.businessType && 
                           brandProfile.location && 
                           brandProfile.description && 
                           brandProfile.services?.length > 0 && 
                           brandProfile.logoDataUrl;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Logo Upload Section */}
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
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop your logo here, or click to browse
              </h3>
              <p className="text-gray-500 mb-4">
                Supports PNG, JPG, SVG files up to 5MB
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? 'Uploading...' : 'Choose File'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
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
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-4 text-green-600 font-medium flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                Logo uploaded successfully
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Summary
          </CardTitle>
          <p className="text-gray-600">
            {isProfileComplete
              ? 'Your complete brand profile information'
              : 'Review your brand profile before saving'
            }
          </p>
          {isProfileComplete && (
            <div className="text-right">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✅ Complete
              </div>
              <p className="text-xs text-gray-500 mt-1">Ready for content generation</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Basic Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Business Name</div>
                <p className="font-medium">{brandProfile.businessName || 'Not set'}</p>
              </div>
              <div>
                <div className="text-gray-500">Business Type</div>
                <p className="font-medium">{brandProfile.businessType || 'Not set'}</p>
              </div>
              <div>
                <div className="text-gray-500">Location</div>
                <p className="font-medium">{brandProfile.location || 'Not set'}</p>
              </div>
              <div>
                <div className="text-gray-500">Website</div>
                <p className="font-medium">{brandProfile.websiteUrl || 'Not set'}</p>
              </div>
            </div>
          </div>

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
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-red-600 font-medium text-sm">❌ Logo not uploaded</p>
                    <p className="text-gray-500 text-xs">Upload logo above to complete profile</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="lg:col-span-2 flex justify-between items-center pt-6 border-t">
        <Button
          onClick={onPrevious}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Step
        </Button>

        <Button
          onClick={handleSaveProfile}
          disabled={isSaving || !isProfileComplete}
          className={isProfileComplete ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving to Cloud...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isProfileComplete ? 'Save Complete Profile' : 'Complete Profile First'}
            </>
          )}
        </Button>
      </div>

      {/* Success Message */}
      {isProfileComplete && (
        <div className="lg:col-span-2 border-t pt-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              ✅ Your brand profile is complete! Save it to the cloud to start generating content.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
