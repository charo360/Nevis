'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Image as ImageIcon, ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { useAuth } from '@/hooks/use-auth-supabase';
import type { CompleteBrandProfile } from '../cbrand-wizard';
import { LogoNormalizationService } from '@/lib/services/logo-normalization-service';

interface LogoUploadStepUnifiedProps {
  brandProfile: CompleteBrandProfile;
  updateBrandProfile: (updates: Partial<CompleteBrandProfile>) => void;
  onPrevious: () => void;
  onSaveComplete: (profileId: string) => void;
  mode?: string | null;
}

export function LogoUploadStepUnified({
  brandProfile,
  updateBrandProfile,
  onPrevious,
  onSaveComplete,
  mode
}: LogoUploadStepUnifiedProps) {
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { saveProfile, updateProfile } = useUnifiedBrand();
  const { user } = useAuth();

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, etc.)",
      });
      return;
    }

    // Validate file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please upload an image smaller than 20MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        // Normalize to 200x200 transparent PNG to prevent design dimension influence
        const normalized = await LogoNormalizationService.normalizeLogo(
          dataUrl,
          { standardSize: 200, format: 'png', quality: 0.9 }
        );
        updateBrandProfile({ logoDataUrl: normalized.dataUrl });
        toast({
          title: "Logo Uploaded",
          description: "Your logo was normalized to 200x200 and uploaded successfully",
        });
      } catch (err) {
        console.warn('Logo normalization failed, using original:', err);
        updateBrandProfile({ logoDataUrl: dataUrl });
        toast({
          title: "Logo Uploaded",
          description: "Logo uploaded (normalization failed, used original)",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user?.userId) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to save your profile",
      });
      return;
    }

    // Validate that logo is uploaded (mandatory)
    if (!brandProfile.logoDataUrl) {
      toast({
        variant: "destructive",
        title: "Logo Required",
        description: "Please upload a logo before saving your brand profile.",
      });
      return;
    }

    setIsSaving(true);

    try {
      console.log('🔄 Starting unified save process for:', brandProfile.businessName);

      // Prepare profile for saving
      const profileToSave = {
        ...brandProfile,
        isComplete: true,
        version: '1.0',
      };

      let profileId: string;

      // Debug logging for edit mode
      console.log('🔍 Save mode debug:', {
        mode,
        hasProfileId: !!profileToSave.id,
        profileId: profileToSave.id,
        brandProfileId: brandProfile.id
      });

      if (mode === 'edit') {
        // Edit mode: Always update, never create new
        if (!profileToSave.id) {
          console.error('❌ Edit mode but no profile ID found! This will cause a new brand to be created.');
          console.error('🔍 Profile data:', {
            businessName: profileToSave.businessName,
            hasId: !!profileToSave.id,
            brandProfileHasId: !!brandProfile.id
          });
          // Use brandProfile.id as fallback if profileToSave.id is missing
          profileToSave.id = brandProfile.id;
        }

        console.log('✏️ Edit mode: Updating existing profile with ID:', profileToSave.id);
        console.log('💾 Updating profile via unified context with logo data:', {
          businessName: profileToSave.businessName,
          hasLogo: !!profileToSave.logoUrl,
          logoLength: profileToSave.logoUrl?.length || 0,
          colors: {
            primaryColor: profileToSave.primaryColor,
            accentColor: profileToSave.accentColor,
            backgroundColor: profileToSave.backgroundColor
          }
        });

        await updateProfile(profileToSave.id, profileToSave);
        profileId = profileToSave.id;
        console.log('✅ Profile updated via unified context successfully:', profileId);
      } else if (mode === 'create') {
        // Create mode: Always create new profile, remove any ID that might be present
        if (profileToSave.id) {
          console.log('🧹 Create mode: Removing ID to ensure new profile creation');
          delete profileToSave.id;
        }

        console.log('💾 Creating new profile via unified context with logo data:', {
          businessName: profileToSave.businessName,
          hasLogo: !!profileToSave.logoDataUrl,
          logoLength: profileToSave.logoDataUrl?.length || 0,
          colors: {
            primaryColor: profileToSave.primaryColor,
            accentColor: profileToSave.accentColor,
            backgroundColor: profileToSave.backgroundColor
          }
        });

        profileId = await saveProfile(profileToSave);
        console.log('✅ Profile created via unified context successfully:', profileId);
      } else {
        // Unknown mode - this should never happen, but handle gracefully
        console.error('❌ Unknown mode:', mode, 'Defaulting to create mode');

        // Default to create mode as fallback
        if (profileToSave.id) {
          console.log('🧹 Unknown mode: Removing ID to ensure new profile creation');
          delete profileToSave.id;
        }

        profileId = await saveProfile(profileToSave);
        console.log('✅ Profile created via unified context (fallback mode):', profileId);
      }

      toast({
        title: mode === 'edit' ? "Profile Updated Successfully!" : "Profile Created Successfully!",
        description: mode === 'edit'
          ? "Your brand profile has been updated with the new information and logo."
          : "Your brand profile has been created and saved to the cloud with logo included.",
      });

      // Call completion callback
      if (onSaveComplete) {
        onSaveComplete(profileId);
      }

    } catch (error) {
      console.error('❌ Failed to save profile via unified context:', error);
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
    brandProfile.logoDataUrl; // Logo is required

  return (
    <div className="w-full space-y-4">
      <div className="text-center px-8 py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 3: Logo Upload & Final Review</h2>
        <p className="text-gray-600">Upload your logo and review your complete brand profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-8">
        {/* Logo Upload Section */}
        <Card className="w-full">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            {brandProfile.logoDataUrl ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <img
                    src={brandProfile.logoDataUrl}
                    alt="Brand Logo"
                    className="max-h-32 max-w-full object-contain"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Logo
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Upload Your Logo</p>
                <p className="text-sm text-gray-500 text-center">
                  Click to upload or drag and drop<br />
                  PNG, JPG up to 20MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />

            <p className="text-xs text-gray-500">
              Your logo will be used across all generated content and branding materials.
            </p>
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card className="w-full">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">Business Information</h4>
                <p className="text-sm text-gray-600">{brandProfile.businessName}</p>
                <p className="text-sm text-gray-600">{brandProfile.businessType}</p>
                <p className="text-sm text-gray-600">{brandProfile.location}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-sm text-gray-600">{brandProfile.description}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900">Services</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {brandProfile.services?.map((service, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {typeof service === 'string' ? service : service.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-gray-900">Brand Colors</h4>
                <div className="flex gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: brandProfile.primaryColor }}
                    />
                    <span className="text-xs text-gray-600">Primary: {brandProfile.primaryColor}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: brandProfile.accentColor }}
                    />
                    <span className="text-xs text-gray-600">Accent: {brandProfile.accentColor}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: brandProfile.backgroundColor }}
                    />
                    <span className="text-xs text-gray-600">Background: {brandProfile.backgroundColor}</span>
                  </div>
                </div>
              </div>

              {brandProfile.websiteUrl && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-gray-900">Website</h4>
                    <p className="text-sm text-gray-600">{brandProfile.websiteUrl}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 px-8">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleSave}
          disabled={!isProfileComplete || isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update Profile
            </>
          )}
        </Button>
      </div>

      {!isProfileComplete && (
        <div className="text-center">
          <p className="text-sm text-red-600">
            {!brandProfile.logoDataUrl
              ? "Please upload a logo to complete your brand profile."
              : "Please complete all required fields in the previous steps before saving."
            }
          </p>
        </div>
      )}
    </div>
  );
}
