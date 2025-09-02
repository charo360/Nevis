'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import {
  Building2,
  Users,
  Phone,
  Palette,
  Hash,
  Share2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';
import { CompleteBrandProfile } from '../cbrand-wizard';

interface BrandDetailsStepProps {
  brandProfile: CompleteBrandProfile;
  updateBrandProfile: (updates: Partial<CompleteBrandProfile>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function BrandDetailsStep({
  brandProfile,
  updateBrandProfile,
  onNext,
  onPrevious
}: BrandDetailsStepProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const { currentBrand, updateProfile, selectBrand } = useUnifiedBrand();

  const handleInputChange = async (field: keyof CompleteBrandProfile, value: string) => {

    // Update local state immediately
    updateBrandProfile({ [field]: value });

    // If this is a color update and we have a current brand with an ID, save to Firebase immediately
    const isColorUpdate = field === 'primaryColor' || field === 'accentColor' || field === 'backgroundColor';
    if (isColorUpdate && currentBrand?.id) {
      try {
          brandId: currentBrand.id,
          field,
          value
        });

        // Save color changes to Firebase immediately
        await updateProfile(currentBrand.id, { [field]: value });

        // Update the current brand in the unified context with new colors
        const updatedBrand = { ...currentBrand, [field]: value };
        selectBrand(updatedBrand);

      } catch (error) {
        // Don't throw error to avoid disrupting user experience
      }
    }
  };

  const addService = () => {
    const newService = { name: '', description: '' };
    updateBrandProfile({
      services: [...brandProfile.services, newService]
    });
  };

  const updateService = (index: number, field: 'name' | 'description', value: string) => {
    const updatedServices = brandProfile.services.map((service, i) =>
      i === index ? { ...service, [field]: value } : service
    );
    updateBrandProfile({ services: updatedServices });
  };

  const removeService = (index: number) => {
    const updatedServices = brandProfile.services.filter((_, i) => i !== index);
    updateBrandProfile({ services: updatedServices });
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: Building2 },
    { id: 'services', label: 'Services', icon: Users },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'identity', label: 'Brand Identity', icon: Palette },
    { id: 'colors', label: 'Colors', icon: Hash },
    { id: 'social', label: 'Social (Optional)', icon: Share2 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Complete Brand Details</CardTitle>
          <p className="text-gray-600">
            Fill in comprehensive information about your brand across 6 key areas
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex flex-col items-center gap-1 p-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{section.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Section 1: Basic Information */}
            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={brandProfile.businessName || ''}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="e.g., ABC Development Company, Metro Properties, The Corner Cafe"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your actual brand/company name, not the business type
                  </p>
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Input
                    id="businessType"
                    value={brandProfile.businessType || ''}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    placeholder="e.g., Real Estate Development, Restaurant, Tech Startup"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the category/industry your business operates in
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={brandProfile.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State/Country"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Business Description *</Label>
                <Textarea
                  id="description"
                  value={brandProfile.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what your business does, your mission, and what makes you unique..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            {/* Section 2: Services & Target Audience */}
            <TabsContent value="services" className="space-y-4 mt-6">
              <div>
                <div className="mb-3">
                  <Label>Services/Products Offered *</Label>
                  <p className="text-xs text-gray-500 mt-1">Add your main services or products (description optional)</p>
                </div>

                {brandProfile.services.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-3">No services added yet</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addService}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Service
                    </Button>
                  </div>
                )}

                {brandProfile.services.length > 0 && (
                  <div className="space-y-3">
                    {/* Column Headers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-3">
                      <Label className="text-xs font-medium text-gray-600">Product/Service Name *</Label>
                      <Label className="text-xs font-medium text-gray-600">Description (Optional)</Label>
                    </div>

                    {brandProfile.services.map((service, index) => (
                      <div key={index} className="border rounded p-3 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              value={service.name || ''}
                              onChange={(e) => updateService(index, 'name', e.target.value)}
                              placeholder="e.g., Web Design, Consulting"
                            />
                            <Input
                              value={service.description || ''}
                              onChange={(e) => updateService(index, 'description', e.target.value)}
                              placeholder="Brief description..."
                            />
                          </div>
                          {brandProfile.services.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addService}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Textarea
                  id="targetAudience"
                  value={brandProfile.targetAudience || ''}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  placeholder="Describe your ideal customers, their demographics, interests, and needs..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="keyFeatures">Key Features</Label>
                <Textarea
                  id="keyFeatures"
                  value={brandProfile.keyFeatures || ''}
                  onChange={(e) => handleInputChange('keyFeatures', e.target.value)}
                  placeholder="What are the standout features of your products/services?"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="competitiveAdvantages">Competitive Advantages</Label>
                <Textarea
                  id="competitiveAdvantages"
                  value={brandProfile.competitiveAdvantages || ''}
                  onChange={(e) => handleInputChange('competitiveAdvantages', e.target.value)}
                  placeholder="What sets you apart from competitors?"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            {/* Section 3: Contact Information */}
            <TabsContent value="contact" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={brandProfile.contactPhone || ''}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email Address</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={brandProfile.contactEmail || ''}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="contact@yourbusiness.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contactAddress">Physical Address</Label>
                <Textarea
                  id="contactAddress"
                  value={brandProfile.contactAddress || ''}
                  onChange={(e) => handleInputChange('contactAddress', e.target.value)}
                  placeholder="Street address, city, state, zip code"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            {/* Section 4: Brand Identity & Voice */}
            <TabsContent value="identity" className="space-y-4 mt-6">
              <div>
                <Label htmlFor="visualStyle">Visual Style</Label>
                <Textarea
                  id="visualStyle"
                  value={brandProfile.visualStyle || ''}
                  onChange={(e) => handleInputChange('visualStyle', e.target.value)}
                  placeholder="Describe your brand's visual style, colors, fonts, imagery preferences..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="writingTone">Writing Tone</Label>
                <Textarea
                  id="writingTone"
                  value={brandProfile.writingTone || ''}
                  onChange={(e) => handleInputChange('writingTone', e.target.value)}
                  placeholder="How does your brand communicate? (e.g., professional, friendly, casual, authoritative)"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contentThemes">Content Themes</Label>
                <Textarea
                  id="contentThemes"
                  value={brandProfile.contentThemes || ''}
                  onChange={(e) => handleInputChange('contentThemes', e.target.value)}
                  placeholder="What topics and themes does your brand focus on in content?"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </TabsContent>

            {/* Section 5: Brand Colors */}
            <TabsContent value="colors" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="primaryColor"
                      value={brandProfile.primaryColor || '#3B82F6'}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <Input
                      value={brandProfile.primaryColor || ''}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="accentColor"
                      value={brandProfile.accentColor || '#10B981'}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <Input
                      value={brandProfile.accentColor || ''}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="backgroundColor"
                      value={brandProfile.backgroundColor || '#F8FAFC'}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <Input
                      value={brandProfile.backgroundColor || ''}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      placeholder="#F8FAFC"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6">
                <Label>Color Preview</Label>
                <div className="mt-2 p-4 rounded-lg border" style={{ backgroundColor: brandProfile.backgroundColor }}>
                  <div
                    className="inline-block px-4 py-2 rounded text-white font-medium mr-2"
                    style={{ backgroundColor: brandProfile.primaryColor }}
                  >
                    Primary Color
                  </div>
                  <div
                    className="inline-block px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: brandProfile.accentColor }}
                  >
                    Accent Color
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Section 6: Social Media */}
            <TabsContent value="social" className="space-y-4 mt-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Add your social media links to help with content distribution and brand consistency.
                  <span className="text-gray-500 italic"> All fields are optional.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebookUrl">Facebook URL (Optional)</Label>
                  <Input
                    id="facebookUrl"
                    type="url"
                    value={brandProfile.facebookUrl || ''}
                    onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                    placeholder="https://facebook.com/yourbusiness"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="instagramUrl">Instagram URL (Optional)</Label>
                  <Input
                    id="instagramUrl"
                    type="url"
                    value={brandProfile.instagramUrl || ''}
                    onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/yourbusiness"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="twitterUrl">Twitter/X URL (Optional)</Label>
                  <Input
                    id="twitterUrl"
                    type="url"
                    value={brandProfile.twitterUrl || ''}
                    onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                    placeholder="https://twitter.com/yourbusiness"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedinUrl">LinkedIn URL (Optional)</Label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    value={brandProfile.linkedinUrl || ''}
                    onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/company/yourbusiness"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 <strong>Tip:</strong> Adding social media links helps the AI generate content that's optimized for each platform and maintains consistent branding across all channels.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous Step
        </Button>

        <Button onClick={onNext}>
          Continue to Logo Upload
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
