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
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus, // Still needed for Services section
  Trash2, // Needed for removing services
  // Upload, // Not needed anymore
  // Brain, // COMMENTED OUT - Products functionality not working yet
  // Loader2 // COMMENTED OUT - Products functionality not working yet
} from 'lucide-react';
import { CompleteBrandProfile } from '../cbrand-wizard';
import { DocumentUploadZone } from '@/components/documents/document-upload-zone';
import type { BrandDocument } from '@/types/documents';
// import { ProductImageAnalysisService } from '@/lib/services/product-image-analysis-service'; // COMMENTED OUT - Products functionality not working yet

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
  // COMMENTED OUT - Products functionality not working yet
  // const [isDragging, setIsDragging] = useState(false);
  // const [isTraining, setIsTraining] = useState(false);
  // const [trainedDescriptions, setTrainedDescriptions] = useState<{[key: string]: string}>({});
  const { currentBrand, updateProfile, selectBrand } = useUnifiedBrand();

  // Helper function to check if a required field is empty
  const isRequiredFieldEmpty = (fieldValue: string | undefined | null): boolean => {
    return !fieldValue || fieldValue.trim() === '';
  };

  // Helper function to get input styling based on validation
  const getInputClassName = (fieldValue: string | undefined | null, isRequired: boolean = false): string => {
    const baseClasses = "mt-1";
    if (isRequired && isRequiredFieldEmpty(fieldValue)) {
      return `${baseClasses} border-red-500 focus:border-red-500 focus:ring-red-500`;
    }
    return baseClasses;
  };

  // Helper function to get label styling based on validation
  const getLabelClassName = (fieldValue: string | undefined | null, isRequired: boolean = false): string => {
    if (isRequired && isRequiredFieldEmpty(fieldValue)) {
      return "text-red-600 font-medium";
    }
    return "";
  };

  // Helper function to check if a section has missing required fields
  const sectionHasMissingFields = (sectionId: string): boolean => {
    switch (sectionId) {
      case 'basic':
        return isRequiredFieldEmpty(brandProfile.businessName) ||
          isRequiredFieldEmpty(brandProfile.businessType) ||
          isRequiredFieldEmpty(brandProfile.location) ||
          isRequiredFieldEmpty(brandProfile.description);
      case 'services':
        return brandProfile.services.length === 0 ||
          brandProfile.services.some(service => isRequiredFieldEmpty(service.name));
      default:
        return false;
    }
  };

  // Check if all required fields are completed
  const canProceedToNextStep = (): boolean => {
    return !isRequiredFieldEmpty(brandProfile.businessName) &&
      !isRequiredFieldEmpty(brandProfile.businessType) &&
      !isRequiredFieldEmpty(brandProfile.location) &&
      !isRequiredFieldEmpty(brandProfile.description) &&
      brandProfile.services.length > 0 &&
      !brandProfile.services.some(service => isRequiredFieldEmpty(service.name));
  };

  const handleInputChange = async (field: keyof CompleteBrandProfile, value: string) => {
    // Update local state immediately - this will handle color updates automatically
    // The updateBrandProfile function in cbrand-wizard-unified.tsx already handles
    // color updates, database saves, and context updates properly
    updateBrandProfile({ [field]: value });

    // Note: Removed duplicate color update logic that was causing navigation issues
    // The updateBrandProfile function already handles:
    // 1. Immediate local state update
    // 2. Database save for color updates in edit mode
    // 3. Context update via selectBrand (without causing navigation conflicts)
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

  // Product image handlers
  // COMMENTED OUT - Products functionality not working yet
  /*
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newProducts: Array<{
      id: string;
      name: string;
      file: File;
      preview: string;
    }> = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const id = Math.random().toString(36).substr(2, 9);
        const product = {
          id,
          file,
          preview: URL.createObjectURL(file),
          name: file.name.replace(/\.[^/.]+$/, '') // Remove extension
        };
        newProducts.push(product);
      }
    });

    if (newProducts.length > 0) {
      const updatedProducts = [...(brandProfile.productImages || []), ...newProducts];
      updateBrandProfile({ productImages: updatedProducts });
    }
  };
  */

  /*
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const openFileDialog = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files);
    input.click();
  };

  const removeProduct = (index: number) => {
    const updatedProducts = brandProfile.productImages?.filter((_, i) => i !== index) || [];
    updateBrandProfile({ productImages: updatedProducts });
  };

  const trainProductImages = async () => {
    if (!brandProfile.productImages || brandProfile.productImages.length === 0) {
      alert('📸 Please upload some product images first before I can train the AI.\n\nJust drag and drop your product photos above, then I\'ll teach the AI all about them! 🍪✨');
      return;
    }

    setIsTraining(true);

    try {
      // Use the ProductImageAnalysisService to analyze all products
      const descriptions = await ProductImageAnalysisService.analyzeMultipleProducts(
        brandProfile.productImages.map(p => ({
          id: p.id,
          name: p.name,
          preview: p.preview
        }))
      );

      // Validate that we got descriptions back
      if (!descriptions || Object.keys(descriptions).length === 0) {
        throw new Error('No descriptions were generated');
      }

      setTrainedDescriptions(descriptions);
      
      // Update the brand profile with the trained descriptions
      updateBrandProfile({ 
        productImageDescriptions: descriptions 
      });

      // Show success message
      alert(`🎉 Awesome! I've successfully trained the AI on ${Object.keys(descriptions).length} product image${Object.keys(descriptions).length !== 1 ? 's' : ''}!\n\n✨ The AI now understands the shapes, colors, and visual characteristics of your products and will use this information when generating content for Quick Content.\n\n🍪 Your products will now be perfectly matched in designs - no more round images for square products!`);
    } catch (error) {
      console.error('Error training product images:', error);
      alert(`😅 Oops! Something went wrong while training the AI.\n\n${error.message || 'Please try again in a moment.'}\n\nIf the problem persists, try refreshing the page.`);
    } finally {
      setIsTraining(false);
    }
  };
  */

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: Building2 },
    { id: 'services', label: 'Services', icon: Users },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'identity', label: 'Brand Identity', icon: Palette },
    { id: 'colors', label: 'Colors', icon: Hash },
    { id: 'documents', label: 'Documents (Optional)', icon: FileText },
    { id: 'social', label: 'Social (Optional)', icon: Share2 },
  ];

  return (
    <div className="w-full space-y-4">
      <Card className="w-full max-w-none">
        <CardHeader className="px-6 py-6">
          <CardTitle>Complete Brand Details</CardTitle>
          <p className="text-gray-600">
            Fill in comprehensive information about your brand across 7 key areas
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-8 w-full max-w-none">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {sections.map((section) => {
                const Icon = section.icon;
                const hasMissingFields = sectionHasMissingFields(section.id);
                return (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className={`flex flex-col items-center gap-1 p-2 relative ${hasMissingFields ? 'text-red-600 border-red-300' : ''
                      }`}
                  >
                    <Icon className={`h-4 w-4 ${hasMissingFields ? 'text-red-600' : ''}`} />
                    <span className={`text-xs ${hasMissingFields ? 'text-red-600 font-medium' : ''}`}>
                      {section.label}
                    </span>
                    {hasMissingFields && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Section 1: Basic Information */}
            <TabsContent value="basic" className="w-full space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="businessName"
                    className={getLabelClassName(brandProfile.businessName, true)}
                  >
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    value={brandProfile.businessName || ''}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="e.g., ABC Development Company, Metro Properties, The Corner Cafe"
                    className={getInputClassName(brandProfile.businessName, true)}
                  />
                  {isRequiredFieldEmpty(brandProfile.businessName) ? (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      ⚠️ Business name is required
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your actual brand/company name, not the business type
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="businessType"
                    className={getLabelClassName(brandProfile.businessType, true)}
                  >
                    Business Type *
                  </Label>
                  <Input
                    id="businessType"
                    value={brandProfile.businessType || ''}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    placeholder="e.g., Real Estate Development, Restaurant, Tech Startup"
                    className={getInputClassName(brandProfile.businessType, true)}
                  />
                  {isRequiredFieldEmpty(brandProfile.businessType) ? (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      ⚠️ Business type is required
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the category/industry your business operates in
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="location"
                  className={getLabelClassName(brandProfile.location, true)}
                >
                  Location *
                </Label>
                <Input
                  id="location"
                  value={brandProfile.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State/Country"
                  className={getInputClassName(brandProfile.location, true)}
                />
                {isRequiredFieldEmpty(brandProfile.location) && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    ⚠️ Location is required
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className={getLabelClassName(brandProfile.description, true)}
                >
                  Business Description *
                </Label>
                <Textarea
                  id="description"
                  value={brandProfile.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what your business does, your mission, and what makes you unique..."
                  rows={4}
                  className={getInputClassName(brandProfile.description, true)}
                />
                {isRequiredFieldEmpty(brandProfile.description) && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    ⚠️ Business description is required
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Section 2: Services & Target Audience */}
            <TabsContent value="services" className="w-full space-y-4 mt-6">
              <div>
                <div className="mb-3">
                  <Label className={brandProfile.services.length === 0 ? "text-red-600 font-medium" : ""}>
                    Services/Products Offered *
                  </Label>
                  {brandProfile.services.length === 0 ? (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      ⚠️ At least one service/product is required
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Add your main services or products (description optional)</p>
                  )}
                </div>

                {brandProfile.services.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
                    <p className="text-red-600 mb-3 font-medium">⚠️ No services added yet - This is required</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addService}
                      className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-100"
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
                      <div key={index} className={`border rounded p-3 ${isRequiredFieldEmpty(service.name) ? 'bg-red-50 border-red-300' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Input
                                value={service.name || ''}
                                onChange={(e) => updateService(index, 'name', e.target.value)}
                                placeholder="e.g., Web Design, Consulting"
                                className={getInputClassName(service.name, true)}
                              />
                              {isRequiredFieldEmpty(service.name) && (
                                <p className="text-xs text-red-600 mt-1 font-medium">
                                  ⚠️ Service name is required
                                </p>
                              )}
                            </div>
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
            <TabsContent value="contact" className="w-full space-y-4 mt-6">
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
            <TabsContent value="identity" className="w-full space-y-4 mt-6">
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
            <TabsContent value="colors" className="w-full space-y-4 mt-6">
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

            {/* Section 6: Products - COMMENTED OUT - Not working properly yet */}
            {/* 
            <TabsContent value="products" className="w-full space-y-4 mt-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Upload images of your products so AI can understand their shapes, colors, and visual characteristics for accurate design generation. You can upload multiple products from different categories.
                  <span className="text-gray-500 italic"> Optional - Skip if you don't have product images.</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  💡 <strong>Pro tip:</strong> Name your products descriptively (e.g., "Square Chocolate Cookies", "Round Sugar Cookies", "Blue Cotton T-Shirt", "Wireless Headphones") to help AI understand the product type and shape better.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  🎯 <strong>Supported categories:</strong> Food & Beverages, Fashion & Clothing, Electronics & Tech, Home & Decor, Beauty & Personal Care, and more!
                </p>
              </div>

              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                  isDragging 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
              >
                <div className="space-y-3">
                  <div className="mx-auto w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-gray-900">
                      {isDragging ? 'Drop your product images here' : 'Upload Product Images'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Drag and drop images or click to browse
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JPG, PNG, WebP (max 10MB each)
                    </p>
                  </div>
                  <Button variant="outline" size="sm" type="button" className="text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Choose Images
                  </Button>
                </div>
              </div>

              {brandProfile.productImages && brandProfile.productImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Your Products ({brandProfile.productImages.length})</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        type="button" 
                        onClick={openFileDialog}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add More
                      </Button>
                      <Button 
                        onClick={trainProductImages}
                        disabled={isTraining}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isTraining ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Training...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Train AI
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {brandProfile.productImages.map((product, index) => (
                      <div key={index} className="group relative overflow-hidden border rounded-lg">
                        <div className="aspect-square relative">
                          <img
                            src={product.preview}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeProduct(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {(product.file.size / 1024 / 1024).toFixed(1)}MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {Object.keys(trainedDescriptions).length > 0 && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        AI Training Complete
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(trainedDescriptions).map(([productId, description]) => {
                          const product = brandProfile.productImages?.find(p => p.id === productId);
                          return (
                            <div key={productId} className="text-sm p-3 bg-white rounded border">
                              <div className="font-medium text-green-700 mb-1">{product?.name}</div>
                              <div className="text-green-600 text-xs leading-relaxed">{description}</div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        The AI will now use these descriptions when generating content for Quick Content.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            */}

            {/* Section 6: Documents (Optional) */}
            <TabsContent value="documents" className="w-full space-y-4 mt-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Upload business documents to help AI understand your brand better and generate more accurate content.
                  <span className="text-gray-500 italic"> All documents are optional.</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  💡 <strong>Supported documents:</strong> Pitch decks, pricing sheets, product catalogs, service brochures, brand guidelines, marketing materials, business plans, case studies
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  📄 <strong>Supported formats:</strong> PDF, PPT, PPTX, Excel, CSV, Images
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  🔒 <strong>Privacy:</strong> Your documents are private and only used to improve your content generation
                </p>
              </div>

              <DocumentUploadZone
                brandProfileId={brandProfile.id || 'temp-id'}
                businessType={brandProfile.businessType as any}
                existingDocuments={brandProfile.documents || []}
                onDocumentsChange={(documents: BrandDocument[]) => {
                  handleInputChange('documents', documents);
                }}
                maxFiles={10}
                maxFileSize={50 * 1024 * 1024}
              />
            </TabsContent>

            {/* Section 7: Social Media */}
            <TabsContent value="social" className="w-full space-y-4 mt-6">
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
      <div className="pt-4 px-8">
        {!canProceedToNextStep() && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 font-medium mb-2">
              ⚠️ Please complete the following required fields to continue:
            </p>
            <ul className="text-xs text-amber-700 space-y-1">
              {isRequiredFieldEmpty(brandProfile.businessName) && <li>• Business Name (Basic Info tab)</li>}
              {isRequiredFieldEmpty(brandProfile.businessType) && <li>• Business Type (Basic Info tab)</li>}
              {isRequiredFieldEmpty(brandProfile.location) && <li>• Location (Basic Info tab)</li>}
              {isRequiredFieldEmpty(brandProfile.description) && <li>• Business Description (Basic Info tab)</li>}
              {brandProfile.services.length === 0 && <li>• At least one service/product (Services tab)</li>}
              {brandProfile.services.some(service => isRequiredFieldEmpty(service.name)) && <li>• Complete all service names (Services tab)</li>}
            </ul>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous Step
          </Button>

          <Button
            onClick={onNext}
            disabled={!canProceedToNextStep()}
            className={!canProceedToNextStep() ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Continue to Logo Upload
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
