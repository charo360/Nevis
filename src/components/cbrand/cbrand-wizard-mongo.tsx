// MongoDB-based brand wizard (replaces Firebase version)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Building2,
  MapPin,
  Palette,
  Upload,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBrand } from '@/contexts/brand-context-mongo';
import { useAuth } from '@/hooks/use-auth';
import type { CompleteBrandProfile } from '@/lib/mongodb/services/brand-profile-service';

interface CbrandWizardMongoProps {
  mode?: string | null;
  brandId?: string | null;
}

export function CbrandWizardMongo({ mode, brandId }: CbrandWizardMongoProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { saveProfile, updateProfile, brands, loading } = useBrand();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<CompleteBrandProfile>>({
    businessName: '',
    businessType: '',
    description: '',
    location: {
      country: '',
      city: '',
    },
    contact: {
      email: '',
      phone: '',
      website: '',
    },
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: '',
      linkedin: '',
    },
    brandColors: {
      primary: '#000000',
      secondary: '',
      accent: '',
    },
    targetAudience: '',
    brandVoice: '',
    services: [],
    isActive: true,
  });

  const isEditMode = mode === 'edit' && brandId;

  // Load existing profile for editing
  useEffect(() => {
    if (isEditMode && brands.length > 0) {
      const existingProfile = brands.find(b => b.id === brandId);
      if (existingProfile) {
        setProfile(existingProfile);
      }
    }
  }, [isEditMode, brandId, brands]);

  const updateProfileField = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    if (!user?.userId) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to save your brand profile",
      });
      return;
    }

    if (!profile.businessName || !profile.businessType) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in at least the business name and type",
      });
      return;
    }

    setSaving(true);
    try {
      const completeProfile: CompleteBrandProfile = {
        id: isEditMode ? brandId! : '',
        userId: user.userId,
        businessName: profile.businessName!,
        businessType: profile.businessType!,
        description: profile.description,
        location: profile.location,
        contact: profile.contact,
        socialMedia: profile.socialMedia,
        brandColors: profile.brandColors,
        logoUrl: profile.logoUrl,
        designExamples: profile.designExamples || [],
        targetAudience: profile.targetAudience,
        brandVoice: profile.brandVoice,
        services: profile.services || [],
        isActive: profile.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (isEditMode) {
        await updateProfile(brandId!, completeProfile);
        toast({
          title: "Profile Updated!",
          description: "Your brand profile has been updated successfully",
        });
      } else {
        await saveProfile(completeProfile);
        toast({
          title: "Profile Saved!",
          description: "Your brand profile has been created successfully",
        });
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save brand profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Basic Information</h2>
              <p className="text-muted-foreground">Tell us about your business</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={profile.businessName || ''}
                  onChange={(e) => updateProfileField('businessName', e.target.value)}
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Input
                  id="businessType"
                  value={profile.businessType || ''}
                  onChange={(e) => updateProfileField('businessType', e.target.value)}
                  placeholder="e.g., Restaurant, Retail Store, Consulting"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={profile.description || ''}
                  onChange={(e) => updateProfileField('description', e.target.value)}
                  placeholder="Describe your business..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Location & Contact</h2>
              <p className="text-muted-foreground">Where can customers find you?</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profile.location?.country || ''}
                    onChange={(e) => updateNestedField('location', 'country', e.target.value)}
                    placeholder="Country"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.location?.city || ''}
                    onChange={(e) => updateNestedField('location', 'city', e.target.value)}
                    placeholder="City"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.contact?.email || ''}
                  onChange={(e) => updateNestedField('contact', 'email', e.target.value)}
                  placeholder="business@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.contact?.phone || ''}
                  onChange={(e) => updateNestedField('contact', 'phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile.contact?.website || ''}
                  onChange={(e) => updateNestedField('contact', 'website', e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Palette className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Brand Identity</h2>
              <p className="text-muted-foreground">Define your brand's visual identity</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="primaryColor">Primary Brand Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={profile.brandColors?.primary || '#000000'}
                    onChange={(e) => updateNestedField('brandColors', 'primary', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={profile.brandColors?.primary || '#000000'}
                    onChange={(e) => updateNestedField('brandColors', 'primary', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Textarea
                  id="targetAudience"
                  value={profile.targetAudience || ''}
                  onChange={(e) => updateProfileField('targetAudience', e.target.value)}
                  placeholder="Describe your ideal customers..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="brandVoice">Brand Voice</Label>
                <Textarea
                  id="brandVoice"
                  value={profile.brandVoice || ''}
                  onChange={(e) => updateProfileField('brandVoice', e.target.value)}
                  placeholder="How does your brand communicate? (e.g., friendly, professional, casual)"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Review & Save</h2>
              <p className="text-muted-foreground">Review your brand profile before saving</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{profile.businessName}</CardTitle>
                <Badge variant="secondary">{profile.businessType}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.description && (
                  <p className="text-sm text-muted-foreground">{profile.description}</p>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Location:</strong> {
                      profile.location
                        ? typeof profile.location === 'string'
                          ? profile.location
                          : `${profile.location.city || ''}, ${profile.location.country || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
                        : 'Not specified'
                    }
                  </div>
                  <div>
                    <strong>Email:</strong> {profile.contact?.email || 'Not specified'}
                  </div>
                </div>

                {profile.brandColors?.primary && (
                  <div className="flex items-center space-x-2">
                    <strong className="text-sm">Brand Color:</strong>
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: profile.brandColors.primary }}
                    />
                    <span className="text-sm">{profile.brandColors.primary}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-2">
            {currentStep < 4 ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Profile' : 'Save Profile'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
