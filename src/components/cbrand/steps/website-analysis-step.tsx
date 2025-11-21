'use client';
// Force recompile - color preservation fix
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Globe, Sparkles, Upload, X, CheckCircle, Shield, AlertTriangle, ShoppingCart } from 'lucide-react';
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
  const [existingDesignExamples, setExistingDesignExamples] = useState<string[]>(brandProfile.designExamples || []);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  
  // E-commerce scraper state
  const [storeAssets, setStoreAssets] = useState<any>(null);
  // Website assets state (for regular websites)
  const [websiteAssets, setWebsiteAssets] = useState<any>(null);
  // Track if e-commerce colors have been set (to prevent overwriting)
  const [ecommerceColorsSet, setEcommerceColorsSet] = useState(false);

  // Dialog states for friendly error handling
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'blocked' | 'timeout' | 'error'>('error');
  const [dialogMessage, setDialogMessage] = useState('');
  
  // Debug: Log when brand colors change
  useEffect(() => {
    console.log('🎨 [UI] Brand profile colors updated:', {
      primaryColor: brandProfile.primaryColor,
      accentColor: brandProfile.accentColor,
      backgroundColor: brandProfile.backgroundColor
    });
  }, [brandProfile.primaryColor, brandProfile.accentColor, brandProfile.backgroundColor]);

  // Update website URL when brand profile changes (for edit mode)
  useEffect(() => {
    console.log('🔄 WebsiteAnalysisStep: brandProfile.websiteUrl changed:', brandProfile.websiteUrl);
    console.log('🔄 WebsiteAnalysisStep: current websiteUrl state:', websiteUrl);
    console.log('🔄 WebsiteAnalysisStep: brandProfile object:', brandProfile);
    
    // Simply use the brandProfile.websiteUrl if available
    if (brandProfile.websiteUrl && brandProfile.websiteUrl !== websiteUrl) {
      console.log('✅ WebsiteAnalysisStep: Updating websiteUrl from brandProfile:', brandProfile.websiteUrl);
      setWebsiteUrl(brandProfile.websiteUrl);
    }
  }, [brandProfile.websiteUrl, websiteUrl]);

  // Update existing design examples when brand profile changes (for edit mode)
  useEffect(() => {
    if (brandProfile.designExamples && brandProfile.designExamples.length > 0) {
      setExistingDesignExamples(brandProfile.designExamples);
    }
  }, [brandProfile.designExamples]);

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

    // Limit to 5 total design examples (existing + new) to prevent storage overflow
    const totalExistingCount = existingDesignExamples.length;
    const currentNewCount = designImages.length;
    const availableSlots = Math.max(0, 5 - totalExistingCount - currentNewCount);
    const filesToAdd = imageFiles.slice(0, availableSlots);

    setDesignImages(prev => [...prev, ...filesToAdd]);

    if (filesToAdd.length > 0) {
      toast({
        title: "Design Examples Added",
        description: `${filesToAdd.length} design example(s) uploaded successfully.`,
      });
    } else if (imageFiles.length > filesToAdd.length) {
      toast({
        variant: "destructive",
        title: "Upload Limit Reached",
        description: `Maximum 5 design examples allowed. ${imageFiles.length - filesToAdd.length} file(s) were not added.`,
      });
    }
  };

  const removeImage = (index: number) => {
    setDesignImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingDesignExample = (index: number) => {
    setExistingDesignExamples(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Update the brand profile immediately to persist the change
      updateBrandProfile({ designExamples: updated });
      return updated;
    });
  };


  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to analyze.",
        variant: "destructive"
      });
      return;
    }

    // Prevent duplicate analysis if already analyzing
    if (isAnalyzing) {
      console.warn('⚠️ Analysis already in progress, ignoring duplicate request');
      return;
    }

    console.log('🚀 [handleAnalyze] Starting new analysis for:', websiteUrl.trim());
    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisProgress('Starting analysis...');
    setAnalysisComplete(false);
    setEcommerceColorsSet(false); // Reset color lock for new analysis
    setStoreAssets(null);
    setWebsiteAssets(null);

    try {
      // Step 1: Quick e-commerce detection
      const isEcommerce = await detectEcommerceStore(websiteUrl.trim());
      
      if (isEcommerce) {
        setAnalysisProgress('🛒 E-commerce store detected! Extracting store assets...');
        
        // Step 1: Run e-commerce extraction first
        let storeData = null;
        try {
          const storeResult = await runEcommerceExtraction(websiteUrl.trim());
          if (storeResult.success) {
            setStoreAssets(storeResult);
            storeData = storeResult;
            
            // Apply brand colors if extracted
            if (storeResult.brandColors && storeResult.brandColors.length > 0) {
              console.log('🎨 [E-commerce] Setting initial brand colors:', {
                primaryColor: storeResult.brandColors[0],
                accentColor: storeResult.brandColors[1] || storeResult.brandColors[0],
                allColors: storeResult.brandColors
              });
              
              updateBrandProfile({
                primaryColor: storeResult.brandColors[0],
                accentColor: storeResult.brandColors[1] || storeResult.brandColors[0],
                backgroundColor: storeResult.brandColors[2] || '#F8FAFC'
              });
              
              // Mark that e-commerce colors have been set
              setEcommerceColorsSet(true);
              console.log('🔒 [E-commerce] Colors locked - will not be overwritten by AI analysis');
            }
            
            const productCount = storeData?.totalProducts || 0;
            const imageCount = storeData?.totalImages || 0;
            setAnalysisProgress(`🛒 Store assets extracted! Found ${productCount} products, ${imageCount} images. Now running AI analysis...`);
          }
        } catch (error) {
          console.warn('⚠️ E-commerce extraction failed:', error);
          setAnalysisProgress('🤖 E-commerce extraction failed, running AI analysis only...');
        }

        // Step 2: Run AI analysis with e-commerce data (using proven Claude endpoint)
        let aiAnalysisSuccess = false;
        try {
          setAnalysisProgress('🤖 Analyzing extracted products and store data with AI...');
          await runEcommerceAIAnalysis(websiteUrl.trim(), storeData);
          aiAnalysisSuccess = true;
          setAnalysisComplete(true);
          console.log('✅ E-commerce AI analysis completed successfully');
        } catch (error) {
          console.error('❌ E-commerce AI analysis failed:', error);

          // Don't fallback to regular AI analysis for e-commerce sites
          // The e-commerce analysis should have already populated the data
          // If it failed, we should show a proper error instead of trying regular analysis
          // which will just get blocked by robots.txt

          // Check if we at least have store data from extraction
          if (storeData && storeData.totalProducts > 0) {
            console.log('✅ Using e-commerce extraction data even though AI analysis failed');
            aiAnalysisSuccess = true;
            setAnalysisComplete(true);
          } else {
            // Only if we have no data at all, throw the error
            throw error;
          }
        }

        // Final results
        const productCount = storeData?.totalProducts || 0;
        const imageCount = storeData?.totalImages || 0;

        if (aiAnalysisSuccess && storeData) {
          setAnalysisProgress(`✅ Complete! Found ${productCount} products, ${imageCount} images + AI brand analysis`);
          
          toast({
            title: "Comprehensive Analysis Complete! 🚀",
            description: `E-commerce: ${productCount} products, ${imageCount} images. AI brand analysis: business info, services, colors extracted.`,
          });
        } else if (storeData) {
          setAnalysisProgress(`✅ E-commerce analysis complete! Found ${productCount} products, ${imageCount} images`);
          
          toast({
            title: "E-commerce Analysis Complete! 🛒",
            description: `Found ${productCount} products, ${imageCount} images. AI analysis failed but e-commerce data extracted.`,
            variant: "destructive"
          });
        } else if (aiAnalysisSuccess) {
          setAnalysisProgress(`✅ AI analysis complete! E-commerce extraction failed but got brand info.`);
          
          toast({
            title: "AI Analysis Complete! 🤖",
            description: "E-commerce extraction failed but AI successfully analyzed the website for brand information.",
          });
        } else {
          throw new Error("Both e-commerce extraction and AI analysis failed");
        }

      } else {
        // Regular website - run AI analysis + color extraction
        setAnalysisProgress('🤖 Running AI website analysis...');
        
        // Run AI analysis and color extraction in parallel
        const [aiResult, colorResult] = await Promise.allSettled([
          runAIAnalysis(websiteUrl.trim()),
          extractColorsFromWebsite(websiteUrl.trim())
        ]);

        // Handle asset extraction results
        if (colorResult.status === 'fulfilled') {
          const assets = colorResult.value;
          setWebsiteAssets(assets);
          
          // Apply brand colors if found
          if (assets.brandColors?.length > 0) {
            updateBrandProfile({
              primaryColor: assets.brandColors[0],
              accentColor: assets.brandColors[1] || assets.brandColors[0]
            });
          }
          
          const colorCount = assets.brandColors?.length || 0;
          const imageCount = assets.images?.length || 0;
          const hasLogo = !!assets.logo;
          
          let assetsFound = [];
          if (colorCount > 0) assetsFound.push(`${colorCount} colors`);
          if (hasLogo) assetsFound.push('logo');
          if (imageCount > 0) assetsFound.push(`${imageCount} images`);
          
          if (assetsFound.length > 0) {
            setAnalysisProgress(`✅ AI analysis complete! Found ${assetsFound.join(', ')}`);
            
            toast({
              title: "Website Analysis Complete! 🎨",
              description: `AI analysis completed + extracted ${assetsFound.join(', ')}.`,
            });
          } else {
            setAnalysisProgress('✅ AI analysis complete!');
            
            toast({
              title: "Website Analysis Complete! 🤖",
              description: "AI has analyzed your website and extracted brand information.",
            });
          }
        } else {
          setAnalysisProgress('✅ AI analysis complete!');
          
          toast({
            title: "Website Analysis Complete! 🤖",
            description: "AI has analyzed your website and extracted brand information.",
          });
        }
      }

    } catch (error) {
      console.error('❌ Unified analysis failed:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
      
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze website. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to detect if website is an e-commerce store
  const detectEcommerceStore = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/ecommerce-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeUrl: url, detectOnly: true })
      });
      
      const result = await response.json();
      return result.success && result.platform !== 'generic';
    } catch {
      return false;
    }
  };

  // Helper function to run e-commerce extraction
  const runEcommerceExtraction = async (url: string) => {
    const response = await fetch('/api/ecommerce-scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeUrl: url })
    });
    
    return await response.json();
  };

  // Helper function to extract colors from any website
  const extractColorsFromWebsite = async (url: string) => {
    try {
      const { extractBrandAssets } = await import('@/lib/services/ecommerce-scraper');
      return await extractBrandAssets(url);
    } catch (error) {
      console.warn('⚠️ Color extraction failed:', error);
      return { brandColors: [] };
    }
  };

  // Helper function to run AI analysis specifically for e-commerce using extracted data
  const runEcommerceAIAnalysis = async (url: string, storeData: any) => {
    // URL Validation and Normalization
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl); // Throws if invalid
    } catch {
      throw new Error("Invalid URL format");
    }

    // Convert images to data URLs
    const designImageUris: string[] = [];
    for (let i = 0; i < designImages.length; i++) {
      const file = designImages[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      designImageUris.push(dataUrl);
    }

    // Create e-commerce specific analysis prompt with extracted data
    const ecommerceContext = storeData ? {
      platform: storeData.platform,
      totalProducts: storeData.totalProducts,
      totalImages: storeData.totalImages,
      products: storeData.products?.slice(0, 10) || [], // Send first 10 products
      brandColors: storeData.brandColors || [],
      logo: storeData.logo,
      storeUrl: normalizedUrl
    } : null;

    // Use specialized e-commerce analysis action
    const { analyzeEcommerceBrandAction } = await import('@/app/actions');
    const analysisResult = await analyzeEcommerceBrandAction(normalizedUrl, designImageUris, ecommerceContext);

    // Check if analysis failed
    if (!analysisResult.success) {
      throw new Error(analysisResult.error || 'E-commerce AI analysis failed');
    }

    const result = analysisResult.data;

    // Process business name
    let businessName = result.businessName?.trim();
    let businessType = result.businessType?.trim();

    if (!businessName || businessName.length < 2) {
      try {
        const urlObj = new URL(normalizedUrl);
        const domain = urlObj.hostname.replace(/^www\./, '');
        const domainParts = domain.split('.');
        businessName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      } catch {
        businessName = 'New Business';
      }
    }

    // Parse services (for e-commerce, these might be product categories)
    const servicesArray = result.services
      ? result.services.split('\n').filter(service => service.trim()).map(service => {
          const colonIndex = service.indexOf(':');
          if (colonIndex > 0) {
            return {
              name: service.substring(0, colonIndex).trim(),
              description: service.substring(colonIndex + 1).trim()
            };
          } else {
            const dashIndex = service.indexOf(' - ');
            if (dashIndex > 0) {
              return {
                name: service.substring(0, dashIndex).trim(),
                description: service.substring(dashIndex + 3).trim()
              };
            } else {
              return {
                name: service.trim(),
                description: ''
              };
            }
          }
        })
      : [];

    // ALWAYS use e-commerce extracted colors (they are more accurate than AI detection)
    // If e-commerce colors were already set, preserve them from brandProfile
    const primaryColor = storeData?.brandColors?.[0] || brandProfile.primaryColor || '#3B82F6';
    const accentColor = storeData?.brandColors?.[1] || brandProfile.accentColor || '#10B981';
    const backgroundColor = storeData?.brandColors?.[2] || brandProfile.backgroundColor || '#F8FAFC';
    
    console.log('🎨 Using brand colors:', {
      source: storeData?.brandColors ? 'E-commerce Extraction' : (brandProfile.primaryColor !== '#3B82F6' ? 'Existing Profile' : 'AI Fallback'),
      primaryColor,
      accentColor,
      backgroundColor,
      extractedColors: storeData?.brandColors,
      existingColors: {
        primary: brandProfile.primaryColor,
        accent: brandProfile.accentColor,
        background: brandProfile.backgroundColor
      }
    });

    // Update the brand profile with e-commerce AI analysis results
    const profileUpdate = {
      businessName: businessName,
      websiteUrl: normalizedUrl,
      description: result.description,
      businessType: businessType || 'E-commerce Store',
      location: result.location || '',
      services: servicesArray,
      keyFeatures: result.keyFeatures || '',
      competitiveAdvantages: result.competitiveAdvantages || '',
      targetAudience: result.targetAudience || 'Online shoppers',
      visualStyle: result.visualStyle,
      writingTone: result.writingTone,
      contentThemes: result.contentThemes,
      primaryColor,
      accentColor,
      backgroundColor,
      contactPhone: result.contactInfo?.phone || '',
      contactEmail: result.contactInfo?.email || '',
      contactAddress: result.contactInfo?.address || '',
      facebookUrl: result.socialMedia?.facebook || '',
      instagramUrl: result.socialMedia?.instagram || '',
      twitterUrl: result.socialMedia?.twitter || '',
      linkedinUrl: result.socialMedia?.linkedin || '',
      designExamples: [...existingDesignExamples, ...designImageUris],
    };
    
    console.log('🎨 [AI Analysis] Updating brand profile with colors:', {
      primaryColor: profileUpdate.primaryColor,
      accentColor: profileUpdate.accentColor,
      backgroundColor: profileUpdate.backgroundColor
    });
    
    updateBrandProfile(profileUpdate);

    return result;
  };

  // Helper function to run AI analysis for e-commerce (without state conflicts) - DEPRECATED
  const runAIAnalysisForEcommerce = async (url: string) => {
    // URL Validation and Normalization
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl); // Throws if invalid
    } catch {
      throw new Error("Invalid URL format");
    }

    // Convert images to data URLs
    const designImageUris: string[] = [];
    for (let i = 0; i < designImages.length; i++) {
      const file = designImages[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      designImageUris.push(dataUrl);
    }

    // Start AI analysis
    const { analyzeBrandAction } = await import('@/app/actions');
    const analysisResult = await analyzeBrandAction(normalizedUrl, designImageUris);

    // Check if analysis failed
    if (!analysisResult.success) {
      throw new Error(analysisResult.error || 'AI analysis failed');
    }

    const result = analysisResult.data;

    // Process business name
    let businessName = result.businessName?.trim();
    let businessType = result.businessType?.trim();

    if (!businessName || businessName.length < 2) {
      try {
        const urlObj = new URL(normalizedUrl);
        const domain = urlObj.hostname.replace(/^www\./, '');
        const domainParts = domain.split('.');
        businessName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
      } catch {
        businessName = 'New Business';
      }
    }

    // Parse services
    const servicesArray = result.services
      ? result.services.split('\n').filter(service => service.trim()).map(service => {
          const colonIndex = service.indexOf(':');
          if (colonIndex > 0) {
            return {
              name: service.substring(0, colonIndex).trim(),
              description: service.substring(colonIndex + 1).trim()
            };
          } else {
            const dashIndex = service.indexOf(' - ');
            if (dashIndex > 0) {
              return {
                name: service.substring(0, dashIndex).trim(),
                description: service.substring(dashIndex + 3).trim()
              };
            } else {
              return {
                name: service.trim(),
                description: ''
              };
            }
          }
        })
      : [];

    // Extract colors from AI - but preserve e-commerce colors if they were already set
    const primaryColor = ecommerceColorsSet ? brandProfile.primaryColor : (result.colorPalette?.primary || brandProfile.primaryColor || '#3B82F6');
    const accentColor = ecommerceColorsSet ? brandProfile.accentColor : (result.colorPalette?.secondary || result.colorPalette?.accent || brandProfile.accentColor || '#10B981');
    const backgroundColor = ecommerceColorsSet ? brandProfile.backgroundColor : (brandProfile.backgroundColor || '#F8FAFC');
    
    console.log('🎨 [Regular AI] Color decision:', {
      ecommerceColorsLocked: ecommerceColorsSet,
      usingColors: ecommerceColorsSet ? 'E-commerce (preserved)' : 'AI Detection',
      primaryColor,
      accentColor,
      backgroundColor
    });

    // Update the brand profile with AI analysis results
    updateBrandProfile({
      businessName: businessName,
      websiteUrl: normalizedUrl,
      description: result.description,
      businessType: businessType || '',
      location: result.location || '',
      services: servicesArray,
      keyFeatures: result.keyFeatures || '',
      competitiveAdvantages: result.competitiveAdvantages || '',
      targetAudience: result.targetAudience || 'Target audience not specified on website',
      visualStyle: result.visualStyle,
      writingTone: result.writingTone,
      contentThemes: result.contentThemes,
      primaryColor,
      accentColor,
      backgroundColor,
      contactPhone: result.contactInfo?.phone || '',
      contactEmail: result.contactInfo?.email || '',
      contactAddress: result.contactInfo?.address || '',
      facebookUrl: result.socialMedia?.facebook || '',
      instagramUrl: result.socialMedia?.instagram || '',
      twitterUrl: result.socialMedia?.twitter || '',
      linkedinUrl: result.socialMedia?.linkedin || '',
      designExamples: [...existingDesignExamples, ...designImageUris],
    });

    return result;
  };

  // Helper function to run AI analysis (existing logic)
  const runAIAnalysis = async (url: string) => {
    // URL Validation and Normalization
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl); // Throws if invalid
    } catch {
      throw new Error("Invalid URL format");
    }

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
      const analysisResult = await analyzeBrandAction(normalizedUrl, designImageUris);

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

      console.log('🎉 Analysis result received:', result);
      console.log('🔍 Debug - Full result structure:', JSON.stringify(result, null, 2));

      console.log('📋 Debug - Extracted fields:');
      console.log('   Business Name:', result.businessName);
      console.log('   Description:', result.description);
      console.log('   Business Type:', result.businessType);
      console.log('   Services:', result.services);
      console.log('   Visual Style:', result.visualStyle);

      // Ensure we have a proper business name - fallback to extracting from URL if needed
      let businessName = result.businessName?.trim();
      let businessType = result.businessType?.trim();

      // Check if AI mixed up business name and business type
      const businessNameWords = businessName?.toLowerCase().split(' ') || [];
      const businessTypeWords = businessType?.toLowerCase().split(' ') || [];

      // If business name contains generic business type words, it might be swapped
      const genericBusinessWords = ['software', 'technology', 'company', 'corporation', 'inc', 'llc', 'development', 'solutions', 'services', 'consulting', 'agency', 'firm', 'group', 'enterprises', 'systems', 'platform', 'application', 'financial', 'lending', 'mixed-use'];

      const businessNameHasGenericWords = businessNameWords.some(word => genericBusinessWords.includes(word));
      const businessTypeHasSpecificWords = businessTypeWords.length > 0 && !businessTypeWords.some(word => genericBusinessWords.includes(word));

      // If business name seems generic and business type seems specific, they might be swapped
      if (businessNameHasGenericWords && businessTypeHasSpecificWords && businessType && businessType.length > 2) {
        const temp = businessName;
        businessName = businessType;
        businessType = temp;
      }

      if (!businessName || businessName.length < 2) {
        // Try to extract business name from URL as fallback
        try {
          const urlObj = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
          const domain = urlObj.hostname.replace(/^www\./, '');
          const domainParts = domain.split('.');
          businessName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
        } catch {
          businessName = 'New Business';
        }
      }

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

      // Debug: Log what we're actually saving

      // Update the brand profile with comprehensive analysis results
      updateBrandProfile({
        // Basic Information
        businessName: businessName,
        websiteUrl,
        description: result.description,
        businessType: businessType || '',
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

        // Store design examples for future AI reference (combine existing + new)
        designExamples: [...existingDesignExamples, ...designImageUris],
        
        // Store enhanced data if available
        enhancedData: result.enhancedData || undefined,
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

      if (extractedCount < 3) {
        toast({
          variant: 'warning',
          title: 'Analysis produced limited results',
          description: 'The AI was unable to extract much information from the provided website. You can try a different URL, upload more design examples, or continue and fill in details manually.',
        });

        setDialogType('error');
        setDialogMessage('The AI could not extract enough detailed information from the website. This can happen when sites block scrapers or the site has minimal content. You can try another URL or continue to complete your profile manually.');
        setShowAnalysisDialog(true);
      } else {
        // Check if we have enhanced data
        const enhancedData = result.enhancedData;
        const hasEnhancedData = enhancedData && (
          enhancedData.products?.length > 0 ||
          enhancedData.uniqueSellingPropositions?.length > 0 ||
          enhancedData.totalImagesFound > 0
        );

        if (hasEnhancedData) {
          toast({
            title: "🚀 COMPREHENSIVE Analysis Complete!",
            description: `Found ${enhancedData.products?.length || 0} products, ${enhancedData.totalImagesFound || 0} images, ${enhancedData.uniqueSellingPropositions?.length || 0} USPs, and ${enhancedData.marketGaps?.length || 0} opportunities!`,
          });
          
          // Log enhanced data for debugging
          console.log('🎉 Enhanced Analysis Results:', {
            products: enhancedData.products?.length || 0,
            images: enhancedData.totalImagesFound || 0,
            usps: enhancedData.uniqueSellingPropositions?.length || 0,
            painPoints: enhancedData.customerPainPoints?.length || 0,
            opportunities: enhancedData.marketGaps?.length || 0,
            campaignAngles: enhancedData.adCampaignAngles?.length || 0
          });
        } else {
          toast({
            title: "🎉 Enhanced Analysis Complete!",
            description: `AI extracted ${extractedCount} pieces of detailed brand information including target audience, comprehensive services, and color analysis from your designs.`,
          });
        }
      }

    } catch (error) {
      // This catch is now for unexpected errors only
      setAnalysisProgress('');
      setDialogType('error');
      setDialogMessage('An unexpected error occurred during analysis.');
      setShowAnalysisDialog(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSkipAnalysis = async () => {
    // Convert new design images to data URLs if any were uploaded
    const newDesignImageUris: string[] = [];
    for (const file of designImages) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      newDesignImageUris.push(dataUrl);
    }

    updateBrandProfile({
      websiteUrl,
      // Combine existing design examples with any new uploads
      designExamples: [...existingDesignExamples, ...newDesignImageUris]
    });
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
    <div className="w-full space-y-4">
      {/* Website URL Input */}
      <Card className="w-full">
        <CardHeader className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            AI Website Analysis
          </CardTitle>
          <p className="text-sm sm:text-base text-gray-600">
            Our AI will analyze your specific website and extract detailed, company-specific information
          </p>
          <div className="mt-3 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>🎯 Company-Specific Analysis:</strong> The AI will extract your exact service descriptions,
              your specific target audience, your unique competitive advantages, and your actual brand voice -
              not generic industry information.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 space-y-4">
          <div>
            <Label htmlFor="website-url">Website URL</Label>
            <Input
              id="website-url"
              type="url"
              placeholder="https://your-website.com"
              value={websiteUrl}
              onChange={(e) => {
                setWebsiteUrl(e.target.value);
                updateBrandProfile({ websiteUrl: e.target.value });
              }}
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

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 hover:border-blue-400 transition-colors touch-manipulation">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="design-upload"
                disabled={existingDesignExamples.length + designImages.length >= 5}
              />
              <label
                htmlFor="design-upload"
                className={`flex flex-col items-center justify-center cursor-pointer min-h-[80px] sm:min-h-[100px] ${existingDesignExamples.length + designImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2" />
                <span className="text-xs sm:text-sm text-gray-600 text-center px-2">
                  {existingDesignExamples.length + designImages.length >= 5
                    ? 'Maximum 5 images reached'
                    : 'Upload social posts, marketing materials, ads (PNG, JPG, SVG)'
                  }
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {existingDesignExamples.length + designImages.length}/5 uploaded
                </span>
              </label>
            </div>

            {/* Design Examples Preview */}
            {(existingDesignExamples.length > 0 || designImages.length > 0) && (
              <div className="mt-3 sm:mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Design Examples ({existingDesignExamples.length + designImages.length}/5)
                  </span>
                  {existingDesignExamples.length + designImages.length >= 3 && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Great! This should help AI understand your style
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                  {/* Existing Design Examples */}
                  {existingDesignExamples.map((dataUrl, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <img
                        src={dataUrl}
                        alt={`Existing Design ${index + 1}`}
                        className="w-full h-20 sm:h-24 object-cover rounded-md sm:rounded-lg border-2 border-green-200 group-hover:border-green-300 transition-colors"
                      />
                      <button
                        onClick={() => removeExistingDesignExample(index)}
                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm touch-manipulation"
                        title="Remove existing design example"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 bg-green-600 bg-opacity-75 text-white text-[10px] sm:text-xs px-1 rounded">
                        Saved
                      </div>
                    </div>
                  ))}
                  {/* New Design Images */}
                  {designImages.map((file, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New Design ${index + 1}`}
                        className="w-full h-20 sm:h-24 object-cover rounded-md sm:rounded-lg border-2 border-blue-200 group-hover:border-blue-300 transition-colors"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm touch-manipulation"
                        title="Remove new design example"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 bg-blue-600 bg-opacity-75 text-white text-[10px] sm:text-xs px-1 rounded">
                        New
                      </div>
                    </div>
                  ))}
                </div>

                {existingDesignExamples.length + designImages.length < 3 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] sm:text-xs text-amber-700">
                    💡 <strong>Tip:</strong> Upload at least 3 examples for better AI understanding of your brand style
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !websiteUrl.trim()}
            className="w-full text-sm sm:text-base h-10 sm:h-11"
            data-testid="analyze-button"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                <span className="truncate">{analysisProgress || 'Analyzing Website...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Smart Website Analysis
              </>
            )}
          </Button>

          {/* E-commerce Results Display */}
          {storeAssets && storeAssets.success && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-800">E-commerce Assets Extracted!</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white rounded p-2 text-center">
                  <div className="font-bold text-green-600">{storeAssets.totalProducts || 0}</div>
                  <div className="text-green-700">Products</div>
                </div>
                <div className="bg-white rounded p-2 text-center">
                  <div className="font-bold text-green-600">{storeAssets.totalImages || 0}</div>
                  <div className="text-green-700">Images</div>
                </div>
                <div className="bg-white rounded p-2 text-center">
                  <div className="font-bold text-green-600">{storeAssets.platform || 'Store'}</div>
                  <div className="text-green-700">Platform</div>
                </div>
                <div className="bg-white rounded p-2 text-center">
                  <div className="font-bold text-green-600">{storeAssets.brandColors?.length || 0}</div>
                  <div className="text-green-700">Colors</div>
                </div>
              </div>
              {storeAssets.brandColors && storeAssets.brandColors.length > 0 && (
                <div className="mt-2 flex gap-1">
                  <span className="text-xs text-green-700">Brand Colors:</span>
                  {storeAssets.brandColors.slice(0, 5).map((color: string, index: number) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Website Assets Display (for regular websites) */}
          {websiteAssets && (websiteAssets.brandColors?.length > 0 || websiteAssets.logo || websiteAssets.images?.length > 0) && (
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">Website Assets Extracted!</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {websiteAssets.brandColors?.length > 0 && (
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-bold text-blue-600">{websiteAssets.brandColors.length}</div>
                    <div className="text-blue-700">Colors</div>
                  </div>
                )}
                {websiteAssets.logo && (
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-bold text-blue-600">✓</div>
                    <div className="text-blue-700">Logo</div>
                  </div>
                )}
                {websiteAssets.images?.length > 0 && (
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-bold text-blue-600">{websiteAssets.images.length}</div>
                    <div className="text-blue-700">Images</div>
                  </div>
                )}
                {websiteAssets.favicon && (
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-bold text-blue-600">✓</div>
                    <div className="text-blue-700">Favicon</div>
                  </div>
                )}
              </div>
              {websiteAssets.brandColors && websiteAssets.brandColors.length > 0 && (
                <div className="mt-2 flex gap-1">
                  <span className="text-xs text-blue-700">Brand Colors:</span>
                  {websiteAssets.brandColors.slice(0, 5).map((color: string, index: number) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
              {websiteAssets.logo && (
                <div className="mt-2">
                  <span className="text-xs text-blue-700">Logo: </span>
                  <img 
                    src={websiteAssets.logo} 
                    alt="Website Logo" 
                    className="inline-block h-6 max-w-24 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          )}

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
        <Card className="w-full">
          <CardHeader className="px-8 py-6">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              AI Analysis Results
            </CardTitle>
            <p className="text-sm text-gray-600">
              Review and edit the extracted information. All fields are editable and will be used to populate your brand profile.
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
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

            {/* Enhanced Data Display */}
            {(() => {
              // Check if we have enhanced data to display
              const enhancedData = brandProfile.enhancedData;
              const hasEnhancedData = enhancedData && (
                enhancedData.products?.length > 0 ||
                enhancedData.uniqueSellingPropositions?.length > 0 ||
                enhancedData.totalImagesFound > 0 ||
                enhancedData.marketGaps?.length > 0
              );

              if (!hasEnhancedData) return null;

              return (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        🚀 Comprehensive Analysis Results
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Advanced AI analysis found detailed business intelligence beyond basic brand info.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {enhancedData.products?.length > 0 && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-lg font-bold text-blue-600">{enhancedData.products.length}</div>
                        <div className="text-xs text-blue-700">Products Found</div>
                      </div>
                    )}
                    {enhancedData.totalImagesFound > 0 && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-lg font-bold text-green-600">{enhancedData.totalImagesFound}</div>
                        <div className="text-xs text-green-700">Images Analyzed</div>
                      </div>
                    )}
                    {enhancedData.uniqueSellingPropositions?.length > 0 && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-lg font-bold text-purple-600">{enhancedData.uniqueSellingPropositions.length}</div>
                        <div className="text-xs text-purple-700">Unique Advantages</div>
                      </div>
                    )}
                    {enhancedData.marketGaps?.length > 0 && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-lg font-bold text-orange-600">{enhancedData.marketGaps.length}</div>
                        <div className="text-xs text-orange-700">Opportunities</div>
                      </div>
                    )}
                  </div>

                  {/* Sample Enhanced Data */}
                  <div className="space-y-3">
                    {enhancedData.products?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-blue-800 mb-1">Sample Products:</p>
                        <div className="text-xs text-blue-700 space-y-1">
                          {enhancedData.products.slice(0, 3).map((product, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{product.name}</span>
                              <span className="font-medium">{product.price || 'Price not found'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {enhancedData.uniqueSellingPropositions?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-blue-800 mb-1">Key Advantages:</p>
                        <div className="text-xs text-blue-700">
                          {enhancedData.uniqueSellingPropositions.slice(0, 3).map((usp, index) => (
                            <div key={index} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{usp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {enhancedData.customerPainPoints?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-blue-800 mb-1">Customer Pain Points:</p>
                        <div className="text-xs text-blue-700">
                          {enhancedData.customerPainPoints.slice(0, 3).map((pain, index) => (
                            <div key={index} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{pain}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-800 mb-1">
                      💡 This enhanced data will power superior content generation:
                    </p>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>• Real product names and prices in ads</div>
                      <div>• Specific customer pain point targeting</div>
                      <div>• Authentic competitive advantages</div>
                      <div>• Business opportunity-based campaigns</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between px-8">
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
            <AlertDialogDescription>
              {dialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 px-6">
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
          </div>
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
