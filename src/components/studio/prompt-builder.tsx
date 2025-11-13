'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Copy,
  Wand2,
  Mail,
  Phone,
  Globe,
  Type,
  MessageSquare,
  MousePointer,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { BrandProfile } from '@/lib/types';
import { aiFillService, type EnhancedPromptData } from '@/services/ai-fill-service';

interface PromptBuilderProps {
  brandProfile?: BrandProfile | null;
  onPromptGenerated?: (prompt: string) => void;
}

interface PromptData {
  headline: string;
  subheadline: string;
  cta: string;
  description: string;
  productsServices: string;
  includeProductsServices: boolean;
  email: string;
  phone: string;
  website: string;
  includeImage: boolean;
}

export function PromptBuilder({ brandProfile, onPromptGenerated }: PromptBuilderProps) {
  const [promptData, setPromptData] = useState<PromptData>({
    headline: '',
    subheadline: '',
    cta: '',
    description: '',
    productsServices: '',
    includeProductsServices: false,
    email: '',
    phone: '',
    website: '',
    includeImage: false
  });

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [editablePrompt, setEditablePrompt] = useState('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [isNewPrompt, setIsNewPrompt] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<PromptData[]>([]);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [isAiFilling, setIsAiFilling] = useState(false);
  const { toast } = useToast();

  // Template data
  const templates = [
    {
      id: 'event',
      name: 'Event',
      data: {
        headline: 'Grand Opening',
        subheadline: 'Join us for our special launch event',
        cta: 'RSVP Now',
        description: 'Be the first to experience our new location.',
        productsServices: '• Grand Opening Specials\n• New Menu Items\n• Live Entertainment',
        includeProductsServices: true,
        email: '', phone: '', website: '', includeImage: false
      }
    },
    {
      id: 'sale',
      name: 'Flash Sale',
      data: {
        headline: 'Flash Sale',
        subheadline: '24 hours only - up to 70% off',
        cta: 'Shop Now',
        description: 'Limited quantities available.',
        productsServices: '• Product A - 70% off\n• Product B - 50% off\n• Product C - 30% off',
        includeProductsServices: true,
        email: '', phone: '', website: '', includeImage: false
      }
    },
    {
      id: 'hiring',
      name: 'Hiring',
      data: {
        headline: 'We\'re Hiring',
        subheadline: 'Join our growing team',
        cta: 'Apply Today',
        description: 'Competitive salary and great benefits.',
        productsServices: '• Marketing Manager\n• Sales Representative\n• Customer Service',
        includeProductsServices: true,
        email: 'careers@company.com', phone: '', website: '', includeImage: false
      }
    },
    {
      id: 'service',
      name: 'Service',
      data: {
        headline: 'Free Consultation',
        subheadline: 'Expert advice at no cost',
        cta: 'Book Now',
        description: 'Get personalized recommendations.',
        productsServices: '• Business Analysis\n• Strategy Planning\n• Implementation Support',
        includeProductsServices: true,
        email: '', phone: '+1 (555) 123-4567', website: '', includeImage: false
      }
    },
    {
      id: 'product-launch',
      name: 'Product Launch',
      data: {
        headline: 'Introducing Our New Product',
        subheadline: 'Revolutionary features that change everything',
        cta: 'Pre-Order Now',
        description: 'Be among the first to experience the future.',
        productsServices: '• Advanced Technology\n• Premium Materials\n• Lifetime Warranty\n• Free Shipping',
        includeProductsServices: true,
        email: '', phone: '', website: '', includeImage: false
      }
    },
    {
      id: 'seasonal',
      name: 'Seasonal',
      data: {
        headline: 'Holiday Special',
        subheadline: 'Spread joy with our festive collection',
        cta: 'Shop Holiday Collection',
        description: 'Perfect gifts for your loved ones this season.',
        productsServices: '• Holiday Gift Sets\n• Limited Edition Items\n• Custom Wrapping\n• Express Delivery',
        includeProductsServices: true,
        email: '', phone: '', website: '', includeImage: false
      }
    },
    {
      id: 'crisis',
      name: 'Crisis Communication',
      data: {
        headline: 'Important Update',
        subheadline: 'Keeping you informed during challenging times',
        cta: 'Learn More',
        description: 'We\'re committed to transparency and your safety.',
        productsServices: '• Safety Protocols\n• Updated Policies\n• Support Resources\n• Contact Information',
        includeProductsServices: true,
        email: 'support@company.com', phone: '+1 (555) HELP-NOW', website: '', includeImage: false
      }
    },
    {
      id: 'partnership',
      name: 'Partnership',
      data: {
        headline: 'Exciting Partnership',
        subheadline: 'Two great brands, one amazing experience',
        cta: 'Discover More',
        description: 'Together, we\'re bringing you something special.',
        productsServices: '• Exclusive Collaborations\n• Limited Edition Products\n• Special Offers\n• Joint Services',
        includeProductsServices: true,
        email: '', phone: '', website: '', includeImage: false
      }
    },
    {
      id: 'testimonial',
      name: 'Testimonial',
      data: {
        headline: 'What Our Customers Say',
        subheadline: 'Real stories from real people',
        cta: 'Read Reviews',
        description: 'Don\'t just take our word for it - hear from our satisfied customers.',
        productsServices: '• Customer Success Stories\n• Video Testimonials\n• Case Studies\n• Reviews & Ratings',
        includeProductsServices: true,
        email: '', phone: '', website: '', includeImage: false
      }
    },
    {
      id: 'educational',
      name: 'Educational',
      data: {
        headline: 'Learn Something New',
        subheadline: 'Expert knowledge at your fingertips',
        cta: 'Start Learning',
        description: 'Expand your skills with our comprehensive educational content.',
        productsServices: '• Online Courses\n• Webinars\n• Tutorials\n• Certification Programs',
        includeProductsServices: true,
        email: 'education@company.com', phone: '', website: '', includeImage: false
      }
    },
    {
      id: 'community',
      name: 'Community',
      data: {
        headline: 'Join Our Community',
        subheadline: 'Connect with like-minded individuals',
        cta: 'Join Now',
        description: 'Be part of something bigger than yourself.',
        productsServices: '• Networking Events\n• Online Forums\n• Member Benefits\n• Exclusive Content',
        includeProductsServices: true,
        email: 'community@company.com', phone: '', website: '', includeImage: false
      }
    },
    {
      id: 'anniversary',
      name: 'Anniversary',
      data: {
        headline: 'Celebrating Our Anniversary',
        subheadline: 'Years of excellence and growth',
        cta: 'Celebrate With Us',
        description: 'Thank you for being part of our journey.',
        productsServices: '• Anniversary Specials\n• Limited Edition Items\n• Thank You Gifts\n• Special Events',
        includeProductsServices: true,
        email: '', phone: '', website: '', includeImage: false
      }
    }
  ];

  // Load saved templates and prompt history from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('promptBuilderTemplates');
    if (saved) {
      try {
        setSavedTemplates(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved templates:', error);
      }
    }

    const history = localStorage.getItem('promptBuilderHistory');
    if (history) {
      try {
        setPromptHistory(JSON.parse(history));
      } catch (error) {
        console.error('Failed to load prompt history:', error);
      }
    }
  }, []);

  const updateField = (field: keyof PromptData, value: string | boolean) => {
    setPromptData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsNewPrompt(true); // Mark as new prompt when user makes changes
  };

  const generatePrompt = () => {
    let prompt = "Create a professional marketing design with the following elements:\n\n";

    // Main content
    if (promptData.headline) {
      prompt += `HEADLINE: "${promptData.headline}"\n`;
    }

    if (promptData.subheadline) {
      prompt += `SUBHEADLINE: "${promptData.subheadline}"\n`;
    }

    if (promptData.cta) {
      prompt += `CALL TO ACTION: "${promptData.cta}"\n`;
    }

    if (promptData.description) {
      prompt += `DESCRIPTION: "${promptData.description}"\n`;
    }

    if (promptData.includeProductsServices && promptData.productsServices) {
      prompt += `PRODUCTS/SERVICES: "${promptData.productsServices}"\n`;
    }

    // Contact information
    const hasContact = promptData.email || promptData.phone || promptData.website;
    if (hasContact) {
      prompt += "\nCONTACT INFORMATION:\n";
      if (promptData.email) prompt += `- Email: ${promptData.email}\n`;
      if (promptData.phone) prompt += `- Phone: ${promptData.phone}\n`;
      if (promptData.website) prompt += `- Website: ${promptData.website}\n`;
    }

    // Enhanced Design Requirements
    prompt += "\nDESIGN REQUIREMENTS:\n";
    
    // Typography & Hierarchy
    prompt += "\nTYPOGRAPHY & HIERARCHY:\n";
    prompt += "- HEADLINE: Must be 2.5x larger than other text, bold, most prominent element\n";
    prompt += "- SUBHEADLINE: 50% smaller than headline, supports main message\n";
    prompt += "- CTA BUTTON: Large, prominent button with clear action text\n";
    prompt += "- Ensure perfect readability with high contrast (minimum 4.5:1 ratio)\n";
    prompt += "- Use maximum 2 font families for consistency\n";
    
    // Layout & Composition
    prompt += "\nLAYOUT & COMPOSITION:\n";
    prompt += "- Maintain 60% white space minimum for clean, uncluttered design\n";
    prompt += "- Use grid-based layout for professional appearance\n";
    prompt += "- Create single focal point that's immediately obvious\n";
    prompt += "- Ensure balanced composition - not cramped or cluttered\n";
    prompt += "- Apply consistent margins and padding throughout\n";
    
    // Content Density Controls
    prompt += "\nCONTENT DENSITY:\n";
    prompt += "- HEADLINE: Maximum 6 words - punchy and memorable\n";
    prompt += "- SUBHEADLINE: Maximum 12 words - supports headline\n";
    prompt += "- Avoid information overload - one clear message per design\n";
    prompt += "- Every element must serve a purpose - eliminate fluff\n";
    
    // Visual Elements
    if (promptData.includeImage) {
      prompt += "\nIMAGE INTEGRATION:\n";
      prompt += "- Incorporate uploaded image as hero element or supporting visual\n";
      prompt += "- Blend image naturally with text - avoid covering important content\n";
      prompt += "- Ensure image complements and enhances the message\n";
      prompt += "- Maintain proper image-text balance and hierarchy\n";
    } else {
      prompt += "\nVISUAL DESIGN:\n";
      prompt += "- Create engaging background that supports content without distraction\n";
      prompt += "- Use colors strategically to guide attention and create hierarchy\n";
      prompt += "- Include relevant visual elements that enhance the message\n";
      prompt += "- Avoid generic stock photo aesthetics - be authentic and purposeful\n";
    }
    
    // Color & Branding
    prompt += "\nCOLOR & BRANDING:\n";
    if (brandProfile) {
      prompt += `- Use brand colors and visual identity for ${brandProfile.businessName}\n`;
      prompt += "- Primary color: 60%, Secondary: 30%, Accent: 10% distribution\n";
      if (brandProfile.businessType) {
        prompt += `- Design must reflect ${brandProfile.businessType} industry standards and expectations\n`;
      }
      if (brandProfile.targetAudience) {
        prompt += `- Tailor visual style for target audience: ${brandProfile.targetAudience}\n`;
      }
    } else {
      prompt += "- Use cohesive color palette (3-4 colors maximum)\n";
      prompt += "- Ensure brand consistency if multiple designs are created\n";
    }
    
    // Quality Standards
    prompt += "\nQUALITY STANDARDS:\n";
    prompt += "- Professional, premium quality suitable for business use\n";
    prompt += "- Mobile-responsive design principles (readable on all devices)\n";
    prompt += "- Avoid design mistakes: competing focal points, cramped layouts, tiny text\n";
    prompt += "- Create designs that stand out in social media feeds\n";
    prompt += "- Ensure accessibility with proper contrast and readable fonts\n";
    
    return prompt;
  };

  // Update generated prompt when form data changes
  useEffect(() => {
    const prompt = generatePrompt();
    setGeneratedPrompt(prompt);
    // Update editable prompt only if not currently editing
    if (!isEditingPrompt) {
      setEditablePrompt(prompt);
    }
  }, [promptData, brandProfile, isEditingPrompt]);

  const copyPrompt = async () => {
    const promptToCopy = isEditingPrompt ? editablePrompt : generatedPrompt;
    try {
      await navigator.clipboard.writeText(promptToCopy);
      
      // Add to prompt history
      if (isNewPrompt && promptToCopy) {
        const newHistory = [promptToCopy, ...promptHistory.slice(0, 9)]; // Keep last 10 prompts
        setPromptHistory(newHistory);
        localStorage.setItem('promptBuilderHistory', JSON.stringify(newHistory));
        setIsNewPrompt(false);
      }
      
      toast({
        title: 'Prompt Copied!',
        description: 'The generated prompt has been copied to your clipboard. Paste it in the chat to generate your design.',
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Failed to copy prompt to clipboard. Please select and copy manually.',
        duration: 4000,
      });
    }
  };

  const clearForm = () => {
    setPromptData({
      headline: '',
      subheadline: '',
      cta: '',
      description: '',
      productsServices: '',
      includeProductsServices: false,
      email: '',
      phone: '',
      website: '',
      includeImage: false
    });
    setIsNewPrompt(true);
    toast({
      title: 'Form Cleared',
      description: 'Ready to create a new design brief from scratch.',
      duration: 2000,
    });
  };


  const saveAsTemplate = () => {
    if (!promptData.headline.trim()) {
      toast({
        variant: 'destructive',
        title: 'Cannot Save Template',
        description: 'Please add a headline before saving as template.',
        duration: 4000,
      });
      return;
    }

    const newTemplate = { ...promptData };
    const updatedTemplates = [...savedTemplates, newTemplate];
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('promptBuilderTemplates', JSON.stringify(updatedTemplates));

    toast({
      title: 'Template Saved',
      description: 'Your design brief has been saved as a reusable template.',
      duration: 3000,
    });
  };

  const loadTemplate = (template: PromptData) => {
    setPromptData(template);
    toast({
      title: 'Template Loaded',
      description: 'Template has been loaded into the form.',
      duration: 2000,
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setPromptData(template.data);
      setIsNewPrompt(true);
      toast({
        title: 'Template Loaded',
        description: `${template.name} template has been loaded into the form.`,
        duration: 2000,
      });
    }
  };

  // Legacy function kept for fallback
  const generateBasicAiSuggestions = (brandProfile: BrandProfile): PromptData => {
    const businessName = brandProfile.businessName;
    const businessType = brandProfile.businessType;
    const location = brandProfile.location;
    const contactInfo = brandProfile.contactInfo || {};

    return {
      headline: `${businessName} - Your ${businessType} Solution`,
      subheadline: `Professional ${businessType} services in ${location}`,
      cta: 'Get Started Today',
      description: `Experience the difference with ${businessName}. We provide exceptional ${businessType.toLowerCase()} services tailored to your needs.`,
      productsServices: '• Consultation Services\n• Custom Solutions\n• Support & Maintenance',
      includeProductsServices: false,
      email: contactInfo.email || '',
      phone: contactInfo.phone || '',
      website: brandProfile.websiteUrl || '',
      includeImage: false
    };
  };

  const aiFillForm = async () => {
    if (!brandProfile) {
      toast({
        variant: 'destructive',
        title: 'No Business Profile',
        description: 'Please set up your business profile first to use AI suggestions.',
        duration: 4000,
      });
      return;
    }

    setIsAiFilling(true);
    
    try {
      // Show initial loading message
      toast({
        title: 'AI is analyzing...',
        description: 'Fetching trending data, local events, and market insights for contextual suggestions.',
        duration: 3000,
      });

      // Fetch contextual data from all sources
      const contextualData = await aiFillService.fetchContextualData(brandProfile);
      
      // Generate enhanced suggestions
      const enhancedSuggestions = await aiFillService.generateEnhancedSuggestions(
        brandProfile,
        contextualData
      );

      // Convert enhanced suggestions to basic format for the form
      const basicSuggestions: PromptData = {
        headline: enhancedSuggestions.headline,
        subheadline: enhancedSuggestions.subheadline,
        cta: enhancedSuggestions.cta,
        description: enhancedSuggestions.description,
        productsServices: enhancedSuggestions.productsServices,
        includeProductsServices: enhancedSuggestions.includeProductsServices,
        email: enhancedSuggestions.email,
        phone: enhancedSuggestions.phone,
        website: enhancedSuggestions.website,
        includeImage: enhancedSuggestions.includeImage
      };

      setPromptData(basicSuggestions);
      setIsNewPrompt(true);
      
      // Show success message with contextual info
      const contextualInfo = [
        `📈 ${contextualData.trendingKeywords.length} trending keywords`,
        `🌍 ${contextualData.localEvents.length} local events`,
        `📰 ${contextualData.news.length} news articles`,
        `🌤️ ${contextualData.weather ? 'Weather data' : 'No weather data'}`
      ].join(' • ');

      toast({
        title: 'AI Suggestions Generated!',
        description: `Form filled with contextual content. ${contextualInfo}. Edit any field to customize.`,
        duration: 4000,
      });
    } catch (error) {
      console.error('AI Fill error:', error);
      
      // Fallback to basic suggestions
      try {
        const fallbackSuggestions = generateBasicAiSuggestions(brandProfile);
        setPromptData(fallbackSuggestions);
        setIsNewPrompt(true);
        
        toast({
          title: 'AI Suggestions Generated (Basic)',
          description: 'Form filled with basic AI suggestions. Some data sources were unavailable.',
          duration: 4000,
        });
      } catch (fallbackError) {
        toast({
          variant: 'destructive',
          title: 'AI Fill Failed',
          description: 'Failed to generate AI suggestions. Please try again or fill the form manually.',
          duration: 5000,
        });
      }
    } finally {
      setIsAiFilling(false);
    }
  };

  const deleteTemplate = (index: number) => {
    const updatedTemplates = savedTemplates.filter((_, i) => i !== index);
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('promptBuilderTemplates', JSON.stringify(updatedTemplates));

    toast({
      title: 'Template Deleted',
      description: 'Template has been removed.',
      duration: 2000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Design Brief Builder
            {isNewPrompt && promptData.headline && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Modified
              </span>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Fill in your content details to generate a structured prompt. After using in chat, you can reopen this to create variations by modifying any field. The form stays populated so you can easily create multiple designs!
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Fill Button */}
          {brandProfile ? (
            <div className="text-center mb-6">
              <Button
                onClick={aiFillForm}
                disabled={isAiFilling}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                {isAiFilling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing trends & events...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Fill with Real Data
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <Sparkles className="h-4 w-4 inline mr-1" />
                Set up your business profile to unlock AI-powered suggestions with trending data, local events, and real-time insights!
              </p>
            </div>
          )}

          {/* Template Selector */}
          <div className="flex justify-center mb-6">
            <div className="w-full max-w-xs">
              <Label htmlFor="template-select" className="text-sm font-medium mb-2 block">
                Use Templates
              </Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headline" className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Headline *
                </div>
                <span className="text-xs text-muted-foreground">
                  {promptData.headline.length}/50 chars
                </span>
              </Label>
              <Input
                id="headline"
                placeholder="Your main headline"
                value={promptData.headline}
                onChange={(e) => updateField('headline', e.target.value)}
                className="font-medium"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subheadline" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Subheadline
              </Label>
              <Input
                id="subheadline"
                placeholder="Supporting text (optional)"
                value={promptData.subheadline}
                onChange={(e) => updateField('subheadline', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta" className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Call to Action
              </Label>
              <Input
                id="cta"
                placeholder="e.g., 'Call Now', 'Visit Website'"
                value={promptData.cta}
                onChange={(e) => updateField('cta', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Description</Label>
              <Textarea
                id="description"
                placeholder="Any additional text or details"
                value={promptData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeProductsServices"
                  checked={promptData.includeProductsServices}
                  onCheckedChange={(checked) => updateField('includeProductsServices', !!checked)}
                />
                <Label htmlFor="includeProductsServices" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Include Products/Services List
                </Label>
              </div>
              {promptData.includeProductsServices && (
                <>
                  <Textarea
                    id="productsServices"
                    placeholder="List your products or services (one per line or use bullet points)"
                    value={promptData.productsServices}
                    onChange={(e) => updateField('productsServices', e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Example: "• Web Design • Mobile Apps • SEO • Digital Marketing" or list one per line
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Enhanced Contact Information Editor */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information Editor
              </h4>
              {brandProfile && (
                <Button
                  onClick={() => {
                    // Enhanced auto-fill with multiple fallback paths (works for ANY business)
                    const email = brandProfile.contactInfo?.email || 
                                  (brandProfile as any).contactEmail || 
                                  (brandProfile as any).email || '';
                    
                    const phone = brandProfile.contactInfo?.phone || 
                                  (brandProfile as any).contactPhone || 
                                  (brandProfile as any).phone || '';
                    
                    const website = brandProfile.websiteUrl || 
                                   (brandProfile as any).website || 
                                   (brandProfile as any).websiteUrl || '';

                    // Debug log to see what's available
                    console.log('🔍 [Contact Editor] Business Profile Debug:', {
                      businessName: brandProfile.businessName,
                      contactInfo: brandProfile.contactInfo,
                      websiteUrl: brandProfile.websiteUrl,
                      extractedEmail: email,
                      extractedPhone: phone,
                      extractedWebsite: website,
                      fullProfile: brandProfile
                    });

                    updateField('email', email);
                    updateField('phone', phone);
                    updateField('website', website);

                    const loadedCount = [email, phone, website].filter(Boolean).length;
                    
                    toast({
                      title: loadedCount > 0 ? 'Contact Info Loaded' : 'No Contact Info Found',
                      description: loadedCount > 0 
                        ? `Loaded ${loadedCount} contact detail(s) from your business profile.`
                        : 'No contact information found in business profile. Please enter manually.',
                      duration: 3000,
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Load from Profile
                </Button>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Contact Editor:</strong> Edit contact information here to ensure it appears correctly in your designs. 
                These details will be displayed exactly as entered in the footer of generated images.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                  {promptData.email && <span className="text-xs text-green-600">✓</span>}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="support@yourcompany.com"
                  value={promptData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={promptData.email ? 'border-green-300' : ''}
                />
                {promptData.email && (
                  <p className="text-xs text-muted-foreground">
                    Will appear as: 📧 {promptData.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                  {promptData.phone && <span className="text-xs text-green-600">✓</span>}
                </Label>
                <Input
                  id="phone"
                  placeholder="+254 700 000 000"
                  value={promptData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={promptData.phone ? 'border-green-300' : ''}
                />
                {promptData.phone && (
                  <p className="text-xs text-muted-foreground">
                    Will appear as: 📞 {promptData.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website URL
                  {promptData.website && <span className="text-xs text-green-600">✓</span>}
                </Label>
                <Input
                  id="website"
                  placeholder="https://yourcompany.com"
                  value={promptData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className={promptData.website ? 'border-green-300' : ''}
                />
                {promptData.website && (
                  <p className="text-xs text-muted-foreground">
                    Will appear as: 🌐 {promptData.website}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Preview */}
            {(promptData.email || promptData.phone || promptData.website) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium mb-2">Footer Preview:</p>
                <div className="text-sm text-gray-700 font-mono bg-white p-2 rounded border">
                  {[
                    promptData.phone && `📞 ${promptData.phone}`,
                    promptData.email && `📧 ${promptData.email}`,
                    promptData.website && `🌐 ${promptData.website}`
                  ].filter(Boolean).join(' | ')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This is exactly how your contact info will appear in the design footer.
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => {
                  updateField('email', '');
                  updateField('phone', '');
                  updateField('website', '');
                  toast({
                    title: 'Contact Info Cleared',
                    description: 'All contact information has been cleared.',
                    duration: 2000,
                  });
                }}
                variant="outline"
                size="sm"
              >
                Clear All
              </Button>
              {!promptData.email && !promptData.phone && !promptData.website && (
                <Button
                  onClick={() => {
                    updateField('email', 'info@company.com');
                    updateField('phone', '+1 (555) 123-4567');
                    updateField('website', 'https://company.com');
                    toast({
                      title: 'Sample Contact Added',
                      description: 'Sample contact information added. Please edit with your real details.',
                      duration: 3000,
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Add Sample Contact
                </Button>
              )}
            </div>
          </div>

          {/* Image Option */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeImage"
                checked={promptData.includeImage}
                onCheckedChange={(checked) => updateField('includeImage', !!checked)}
              />
              <Label htmlFor="includeImage" className="text-sm font-medium">
                I will upload an image to incorporate into the design
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Check this if you plan to upload an image that should be integrated into your design
            </p>
          </div>


          {/* Prompt History */}
          {promptHistory.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Recent Prompts</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {promptHistory.map((prompt, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 border rounded bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Prompt #{index + 1}</p>
                      <p className="text-sm line-clamp-2">{prompt.substring(0, 100)}...</p>
                    </div>
                    <Button
                      onClick={() => {
                        if (onPromptGenerated) {
                          onPromptGenerated(prompt);
                        }
                        toast({
                          title: 'Prompt Loaded',
                          description: 'Previous prompt loaded into chat input.',
                          duration: 2000,
                        });
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Templates */}
          {savedTemplates.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Your Saved Templates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {savedTemplates.map((template, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{template.headline}</p>
                      {template.subheadline && (
                        <p className="text-xs text-muted-foreground truncate">{template.subheadline}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => loadTemplate(template)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Wand2 className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => deleteTemplate(index)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Variations */}
          {promptData.headline && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Quick Variations</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  onClick={() => updateField('includeImage', !promptData.includeImage)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {promptData.includeImage ? 'Remove Image' : 'Add Image'}
                </Button>
                <Button
                  onClick={() => updateField('cta', promptData.cta ? '' : 'Call Now')}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {promptData.cta ? 'Remove CTA' : 'Add CTA'}
                </Button>
                <Button
                  onClick={() => {
                    const hasContact = promptData.email || promptData.phone || promptData.website;
                    if (hasContact) {
                      updateField('email', '');
                      updateField('phone', '');
                      updateField('website', '');
                    } else {
                      updateField('email', 'info@company.com');
                      updateField('phone', '+1 (555) 123-4567');
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {(promptData.email || promptData.phone || promptData.website) ? 'Remove Contact' : 'Add Contact'}
                </Button>
                <Button
                  onClick={() => updateField('subheadline', promptData.subheadline ? '' : 'Supporting message here')}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {promptData.subheadline ? 'Remove Sub' : 'Add Sub'}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={saveAsTemplate} variant="outline" size="sm">
              Save Template
            </Button>
            <Button onClick={clearForm} variant="outline" size="sm">
              Clear Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Prompt Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Prompt
            {isEditingPrompt && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Editing
              </span>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isEditingPrompt 
              ? 'Edit the prompt below to customize it further. Click Save to apply changes.'
              : 'Copy this prompt and paste it into the chat, or click "Edit" to customize it further.'
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isEditingPrompt ? (
              <div className="space-y-3">
                <Textarea
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  placeholder="Edit your prompt here..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setIsEditingPrompt(false);
                      toast({
                        title: 'Changes Saved',
                        description: 'Your prompt edits have been saved.',
                        duration: 2000,
                      });
                    }}
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditablePrompt(generatedPrompt);
                      setIsEditingPrompt(false);
                      toast({
                        title: 'Changes Discarded',
                        description: 'Prompt has been reset to the generated version.',
                        duration: 2000,
                      });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {generatedPrompt || 'Fill in the form above to generate your prompt...'}
                </pre>
              </div>
            )}

            {generatedPrompt && (
              <div className="flex gap-2">
                {!isEditingPrompt && (
                  <Button 
                    onClick={() => {
                      setEditablePrompt(generatedPrompt);
                      setIsEditingPrompt(true);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Edit Prompt
                  </Button>
                )}
                <Button onClick={copyPrompt} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
                {onPromptGenerated && (
                  <Button
                    onClick={() => onPromptGenerated(isEditingPrompt ? editablePrompt : generatedPrompt)}
                    variant="outline"
                    className="flex-1"
                  >
                    Use in Chat
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
