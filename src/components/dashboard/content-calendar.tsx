// src/components/dashboard/content-calendar.tsx
"use client";

import React from "react";
import { Loader2, Facebook, Instagram, Linkedin, Twitter, Settings, Palette, Sparkles, Phone } from "lucide-react";
import { TrendingHashtagsService } from '@/services/trending-hashtags-service';
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/dashboard/post-card";
import { generateContentAction, generateEnhancedDesignAction, generateContentWithArtifactsAction } from "@/app/actions";
import { generateRevo15ContentAction } from "@/app/actions/revo-1.5-actions";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-supabase";
import { useCredits } from "@/hooks/use-credits";
import type { BrandProfile, GeneratedPost, Platform, BrandConsistencyPreferences } from "@/lib/types";
import type { ScheduledService } from "@/services/calendar-service";

import type { RevoModel } from '@/components/ui/revo-model-selector';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArtifactSelector } from "@/components/artifacts/artifact-selector";
import { CreditDisplay, CreditCostDisplay, ModelSelector } from "@/components/ui/credit-display";

type ContentCalendarProps = {
  brandProfile: BrandProfile;
  posts: GeneratedPost[];
  onPostGenerated: (post: GeneratedPost) => void;
  onPostUpdated: (post: GeneratedPost) => Promise<void>;
  // NEW: Scheduled services integration
  scheduledServices?: ScheduledService[];
  todaysServices?: ScheduledService[];
  upcomingServices?: ScheduledService[];
  hasScheduledContent?: boolean;
};

const platforms: { name: Platform; icon: React.ElementType }[] = [
  { name: 'Instagram', icon: Instagram },
  { name: 'Facebook', icon: Facebook },
  { name: 'Twitter', icon: Twitter },
  { name: 'LinkedIn', icon: Linkedin },
];

export function ContentCalendar({
  brandProfile,
  posts,
  onPostGenerated,
  onPostUpdated,
  scheduledServices = [],
  todaysServices = [],
  upcomingServices = [],
  hasScheduledContent = false,
  onRefreshCalendar
}: ContentCalendarProps & { onRefreshCalendar?: () => Promise<void> }) {
  const [isGenerating, setIsGenerating] = React.useState<Platform | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { creditBalance, getCreditBalance, hasEnoughCreditsForModel, useCreditsForModel } = useCredits();

  // Brand consistency preferences - default to consistent if design examples exist
  const [brandConsistency, setBrandConsistency] = React.useState<BrandConsistencyPreferences>({
    strictConsistency: !!(brandProfile.designExamples && brandProfile.designExamples.length > 0), // Auto-check if design examples exist
    followBrandColors: true, // Always follow brand colors
    includeContacts: true, // Default to including contacts
  });

  // Revo model selection
  const [selectedRevoModel, setSelectedRevoModel] = React.useState<RevoModel>('revo-2.0');

  // Artifact selection for content generation
  const [selectedArtifacts, setSelectedArtifacts] = React.useState<string[]>([]);

  // Include people in designs toggle
  const [includePeopleInDesigns, setIncludePeopleInDesigns] = React.useState<boolean>(true);

  // Use local language toggle
  const [useLocalLanguage, setUseLocalLanguage] = React.useState<boolean>(false);

  // Save preferences to localStorage
  React.useEffect(() => {
    const savedPreferences = localStorage.getItem('brandConsistencyPreferences');
    if (savedPreferences) {
      setBrandConsistency(JSON.parse(savedPreferences));
    }

    const savedRevoModel = localStorage.getItem('selectedRevoModel');
    if (savedRevoModel) {
      setSelectedRevoModel(savedRevoModel as RevoModel);
    }

    const savedIncludePeople = localStorage.getItem('includePeopleInDesigns');
    if (savedIncludePeople !== null) {
      setIncludePeopleInDesigns(JSON.parse(savedIncludePeople));
    }

    const savedUseLocalLanguage = localStorage.getItem('useLocalLanguage');
    if (savedUseLocalLanguage !== null) {
      setUseLocalLanguage(JSON.parse(savedUseLocalLanguage));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('brandConsistencyPreferences', JSON.stringify(brandConsistency));
  }, [brandConsistency]);

  React.useEffect(() => {
    localStorage.setItem('selectedRevoModel', selectedRevoModel);
  }, [selectedRevoModel]);

  React.useEffect(() => {
    localStorage.setItem('includePeopleInDesigns', JSON.stringify(includePeopleInDesigns));
  }, [includePeopleInDesigns]);

  React.useEffect(() => {
    localStorage.setItem('useLocalLanguage', JSON.stringify(useLocalLanguage));
  }, [useLocalLanguage]);

  const handleGenerateClick = async (platform: Platform) => {
    // Force refresh calendar data to ensure we have the absolute latest scheduled services
    if (onRefreshCalendar) {
      console.log('🔄 Force refreshing calendar data before content generation...');
      // Clear any cached timestamp to force fresh fetch
      localStorage.setItem('calendarLastChecked', Date.now().toString());
      await onRefreshCalendar();

      // Wait a moment to ensure refresh is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ Calendar refresh complete, proceeding with generation...');
    }

    // Check if user has enough credits for the selected model
    const hasCredits = await hasEnoughCreditsForModel(selectedRevoModel);
    if (!hasCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${selectedRevoModel === 'revo-1.0' ? '3' : selectedRevoModel === 'revo-1.5' ? '4' : '5'} credits to use ${selectedRevoModel}. Please purchase more credits.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(platform);
    try {
      // Deduct credits before generation
      const creditResult = await useCreditsForModel(selectedRevoModel, 'content_generation', 'post');
      if (!creditResult.success) {
        const { getUserFriendlyErrorMessage, extractCreditInfo } = await import('@/lib/error-messages');
        const errorMessage = creditResult.error || "Failed to deduct credits";

        // Extract credit information if available
        const creditInfo = extractCreditInfo(errorMessage);

        // Get user-friendly error message
        const friendlyMessage = getUserFriendlyErrorMessage(errorMessage, {
          feature: 'quick_content',
          modelVersion: selectedRevoModel,
          creditsRequired: creditInfo?.creditsRequired,
          creditsAvailable: creditInfo?.creditsAvailable,
        });

        // Split title and description for toast
        const parts = friendlyMessage.split('\n\n');
        const title = parts[0] || 'Credit Deduction Failed';
        const description = parts.slice(1).join('\n\n') || friendlyMessage;

        toast({
          variant: "destructive",
          title: title.replace(/\n/g, ' '), // Remove line breaks from title
          description: description,
          duration: 8000, // Longer duration for credit errors
        });
        return;
      }

      let newPost;
      let revo20Result: any = null; // Declare in proper scope

      // Debug logging for services

      // Get trending hashtags for this business type or services
      const businessContext = brandProfile.services || brandProfile.businessType || 'business';
      const trendingHashtags = await TrendingHashtagsService.getTrendingHashtags(
        businessContext,
        brandProfile.location as string,
        8 // Get up to 8 trending hashtags
      );

      // Optimize hashtags for the specific platform
      const platformHashtags = TrendingHashtagsService.getplatformOptimizedHashtags(
        trendingHashtags,
        platform
      );

      // Check if artifacts are enabled (simple toggle approach)
      const artifactsEnabled = selectedArtifacts.length > 0;

      const useEnhancedGeneration = artifactsEnabled || String(selectedRevoModel) === 'revo-1.5' || String(selectedRevoModel) === 'revo-2.0';

      // Dynamic model routing based on selected Revo version
      if (selectedRevoModel === 'revo-2.0') {

        // Use server action to avoid client-side imports
        const trendingContext = {
          trendingHashtags: platformHashtags,
          businessType: brandProfile.businessType || 'business'
        };

        const response = await fetch('/api/generate-revo-2.0', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessType: brandProfile.businessType || 'Business',
            platform: platform.toLowerCase(),
            visualStyle: (brandProfile.visualStyle as any) || 'modern',
            imageText: '',
            brandProfile,
            aspectRatio: '1:1',
            includePeopleInDesigns,
            useLocalLanguage,
            includeContacts: brandConsistency.includeContacts,
            trendingContext: trendingContext,
            scheduledServices: scheduledServices // NEW: Pass scheduled services to Revo 2.0
          })
        });

        if (!response.ok) {
          throw new Error(`Revo 2.0 generation failed: ${response.statusText}`);
        }

        revo20Result = await response.json();

        // Log content source for debugging
        const contentSource = revo20Result.contentSource || revo20Result.businessIntelligence?.contentSource || 'unknown';
        console.log(`🤖 [Content Calendar] Revo 2.0 Generation Complete!`);
        console.log(`   📊 Content Source: ${contentSource}`);
        console.log(`   ⏱️  Processing Time: ${revo20Result.processingTime}ms`);
        console.log(`   ⭐ Quality Score: ${revo20Result.qualityScore}`);
        
        if (contentSource === 'assistant') {
          console.log(`   ✅ SUCCESS: OpenAI Assistant generated the content!`);
        } else if (contentSource === 'claude_fallback') {
          console.warn(`   ⚠️  FALLBACK: OpenAI Assistant failed, used Claude instead`);
        } else if (contentSource === 'claude_primary') {
          console.warn(`   ℹ️  INFO: No assistant available, used Claude`);
        }

        // Combine AI-generated hashtags with trending hashtags
        const combinedHashtags = [
          ...(revo20Result.hashtags || ['#NextGen', '#AI', '#Innovation']),
          ...platformHashtags // Add platform-optimized trending hashtags
        ]
          // Remove duplicates and limit based on platform
          .filter((tag, index, arr) => arr.indexOf(tag) === index)
          .slice(0, platform === 'Twitter' ? 5 : platform === 'LinkedIn' ? 8 : 10);

        newPost = {
          id: `revo-2.0-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: revo20Result.caption || `🚀 Generated with Revo 2.0 (Gemini 2.5 Flash Image)`,
          hashtags: combinedHashtags,
          imageUrl: revo20Result.imageUrl,
          platform: platform,
          date: new Date().toISOString(),
          // Store additional structured content for reference
          headline: revo20Result.headline,
          subheadline: revo20Result.subheadline,
          cta: revo20Result.cta,
          captionVariations: revo20Result.captionVariations || [revo20Result.caption],
          businessIntelligence: revo20Result.businessIntelligence,
          analytics: {
            views: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            engagementPrediction: 85,
            brandAlignmentScore: 95,
            qualityScore: revo20Result.qualityScore || 10
          },
          metadata: {
            aiModel: revo20Result.model || 'Revo 2.0',
            generationPrompt: 'Revo 2.0 Native Generation',
            processingTime: revo20Result.processingTime || 0,
            enhancementsApplied: revo20Result.enhancementsApplied || [],
            structuredContent: {
              headline: revo20Result.headline,
              subheadline: revo20Result.subheadline,
              cta: revo20Result.cta,
              businessIntelligence: revo20Result.businessIntelligence
            }
          }
        };
      } else if (selectedRevoModel === 'revo-1.5') {
        // Use Revo 1.5 enhanced generation
        console.log(`🎨 Calling Revo 1.5 Enhanced Generation with scheduled services:`, {
          platform,
          scheduledServicesCount: scheduledServices?.length || 0,
          scheduledServiceNames: scheduledServices?.map(s => s.serviceName) || [],
          todaysServicesCount: scheduledServices?.filter(s => s.isToday).length || 0,
          upcomingServicesCount: scheduledServices?.filter(s => s.isUpcoming).length || 0,
          hasScheduledContent
        });

        newPost = await generateRevo15ContentAction(
          brandProfile,
          platform,
          brandConsistency,
          '',
          {
            aspectRatio: '1:1',
            visualStyle: (brandProfile.visualStyle as any) as 'modern' | 'minimalist' | 'bold' | 'elegant' | 'playful' | 'professional' || 'modern',
            includePeopleInDesigns,
            useLocalLanguage
          },
          scheduledServices // Pass scheduled services
        );
      } else if (selectedRevoModel === 'revo-1.0') {
        // Use Revo 1.0 unified architecture (same pattern as Revo 2.0)
        console.log(`🎨 Calling Revo 1.0 Unified Action:`, {
          platform,
          scheduledServicesCount: scheduledServices?.length || 0,
          scheduledServiceNames: scheduledServices?.map(s => s.serviceName) || [],
          todaysServicesCount: scheduledServices?.filter(s => s.isToday).length || 0,
          upcomingServicesCount: scheduledServices?.filter(s => s.isUpcoming).length || 0,
          hasScheduledContent
        });

        // Import and call the new Revo 1.0 action
        const { generateRevo1ContentAction } = await import('@/app/actions/revo-1-actions');

        newPost = await generateRevo1ContentAction(
          brandProfile,
          platform,
          brandConsistency,
          '',
          {
            aspectRatio: '1:1',
            visualStyle: (brandProfile.visualStyle as any) || 'modern',
            includePeopleInDesigns,
            useLocalLanguage
          },
          scheduledServices
        );

        // Debug the response
        console.log('🔍 [ContentCalendar] Received response from quick-content API:', {
          hasImageUrl: !!newPost.imageUrl,
          imageUrlType: typeof newPost.imageUrl,
          imageUrlStartsWithData: newPost.imageUrl?.startsWith('data:'),
          imageUrlStartsWithHttp: newPost.imageUrl?.startsWith('http'),
          imageUrlLength: newPost.imageUrl?.length || 0,
          imageUrlPreview: newPost.imageUrl?.substring(0, 100) + '...'
        });
      } else if (useEnhancedGeneration) {
        // Use artifact-enhanced generation - will automatically use active artifacts from artifacts page
        newPost = await generateContentWithArtifactsAction(
          brandProfile,
          platform,
          brandConsistency,
          [], // Empty array - let the action use active artifacts from artifacts service
          String(selectedRevoModel) === 'revo-1.5', // Enhanced design for Revo 1.5
          includePeopleInDesigns,
          useLocalLanguage
        );
      } else {
        // Fallback to artifact-enhanced generation
        console.log('🤖 Using artifact-enhanced generation as fallback');

        newPost = await generateContentWithArtifactsAction(
          brandProfile,
          platform,
          brandConsistency,
          [], // Empty array - let the action use active artifacts from artifacts service
          selectedRevoModel === 'revo-1.5', // Enhanced design for Revo 1.5
          includePeopleInDesigns,
          useLocalLanguage
        );
      }

      // Validate newPost before processing
      if (!newPost) {
        console.error('❌ Content generation failed - no post returned');
        toast({
          title: "Generation Failed",
          description: "Failed to generate content. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Ensure the post has a unique ID with additional entropy
      if (!newPost.id) {
        newPost.id = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 5)}`;
      }

      // Let the parent component handle saving
      onPostGenerated(newPost);

      // Refresh credit balance after successful generation
      await getCreditBalance();

      // Dynamic toast message based on generation type and model routing
      let title = "Content Generated!";
      let description = `A new ${platform} post has been saved. ${creditResult.credits_used} credits used. ${creditResult.remaining_credits} credits remaining.`;

      // Model-specific messages
      if (selectedRevoModel === 'revo-2.0') {
        title = "Next-Gen Content Generated! 🚀";
        description = `${platform} post created with Revo 2.0`;

        // Special message for Instagram with multiple captions
        if (platform === 'Instagram' && revo20Result?.captionVariations?.length > 1) {
          title = "Instagram Content with 5 Captions Generated! 📸";
          description = `Generated ${revo20Result.captionVariations.length} caption variations for Instagram engagement optimization.`;
        }
      } else if (selectedRevoModel === 'revo-1.5') {
        title = "Enhanced Content Generated! ✨";
        description = `${platform} post created with Revo 1.5`;
      } else if (selectedRevoModel === 'revo-1.0') {
        title = "Content Generated! 🤖";
        description = `${platform} post created with Revo 1.0`;
      }

      // Add hashtag and artifact context
      if (platformHashtags.length > 0 && selectedArtifacts.length > 0) {
        title = `Trending Content Generated! 🔥📎`;
        description += ` • ${platformHashtags.length} trending hashtags • ${selectedArtifacts.length} reference${selectedArtifacts.length !== 1 ? 's' : ''}`;
      } else if (platformHashtags.length > 0) {
        description += ` • ${platformHashtags.length} trending hashtags`;
      } else if (selectedArtifacts.length > 0) {
        description += ` • ${selectedArtifacts.length} reference${selectedArtifacts.length !== 1 ? 's' : ''}`;
      }

      toast({
        title,
        description
      });
    } catch (error) {
      const { getUserFriendlyErrorMessage, extractCreditInfo } = await import('@/lib/error-messages');
      const errorMessage = (error as Error).message;

      // Extract credit information if available
      const creditInfo = extractCreditInfo(errorMessage);

      // Get user-friendly error message
      const friendlyMessage = getUserFriendlyErrorMessage(errorMessage, {
        feature: 'quick_content',
        modelVersion: selectedRevoModel,
        creditsRequired: creditInfo?.creditsRequired,
        creditsAvailable: creditInfo?.creditsAvailable,
      });

      // Split title and description for toast
      const parts = friendlyMessage.split('\n\n');
      const title = parts[0] || 'Generation Failed';
      const description = parts.slice(1).join('\n\n') || friendlyMessage;

      toast({
        variant: "destructive",
        title: title.replace(/\n/g, ' '), // Remove line breaks from title
        description: description,
        duration: creditInfo ? 8000 : 5000, // Longer duration for credit errors
      });
    } finally {
      setIsGenerating(null);
    }
  };

  // Ensure this component is always full-bleed inside the app shell and does not cause horizontal overflow.
  return (
    <div className="w-full max-w-full box-border  overflow-x-hidden">
      <div className="w-full px-4 py-6 lg:py-8 lg:px-6">
        <div className="w-full max-w-full box-border space-y-6">
          {/* Compact Brand Consistency Controls */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Brand Consistency</span>
            </div>
            <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-4 md:flex-wrap">
                <div className="flex items-center gap-3 min-w-[110px] p-2 rounded hover:bg-gray-100">
                  <Palette className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 select-none">Strict</span>
                  <Switch
                    checked={brandConsistency.strictConsistency}
                    onCheckedChange={(checked) =>
                      setBrandConsistency(prev => ({ ...prev, strictConsistency: checked }))
                    }
                    className="ml-auto"
                  />
                </div>
                <div className="flex items-center gap-3 min-w-[110px] p-2 rounded hover:bg-gray-100">
                  <Sparkles className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 select-none">Colors</span>
                  <Switch
                    checked={brandConsistency.followBrandColors}
                    onCheckedChange={(checked) =>
                      setBrandConsistency(prev => ({ ...prev, followBrandColors: checked }))
                    }
                    className="ml-auto"
                  />
                </div>
                <div className="flex items-center gap-3 min-w-[110px] p-2 rounded hover:bg-gray-100">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 select-none">Contacts</span>
                  <Switch
                    checked={brandConsistency.includeContacts}
                    onCheckedChange={(checked) =>
                      setBrandConsistency(prev => ({ ...prev, includeContacts: checked }))
                    }
                    className="ml-auto"
                  />
                </div>
                <div className="flex items-center gap-3 min-w-[110px] p-2 rounded hover:bg-gray-100">
                  <span className="text-sm text-gray-700 select-none">👥 People</span>
                  <Switch
                    checked={includePeopleInDesigns}
                    onCheckedChange={setIncludePeopleInDesigns}
                    className="ml-auto"
                  />
                </div>
                <div className="flex items-center gap-3 min-w-[110px] p-2 rounded hover:bg-gray-100">
                  <span className="text-sm text-gray-700 select-none">🌍 Local</span>
                  <Switch
                    checked={useLocalLanguage}
                    onCheckedChange={setUseLocalLanguage}
                    className="ml-auto"
                  />
                </div>
                <Separator orientation="vertical" className="hidden sm:block h-4" />
                <div className="flex items-center gap-3 min-w-[180px] cursor-pointer p-1 rounded hover:bg-gray-50">
                  <span className="text-sm text-gray-700 select-none">AI Model:</span>
                  <select
                    value={selectedRevoModel}
                    onChange={(e) => setSelectedRevoModel(e.target.value as RevoModel)}
                    className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors cursor-pointer min-w-[160px]"
                  >
                    <option value="revo-1.0">Revo 1.0 (3 credits)</option>
                    <option value="revo-1.5">Revo 1.5 (4 credits)</option>
                    <option value="revo-2.0">Revo 2.0 (5 credits)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {selectedRevoModel === 'revo-2.0'
                  ? `🚀 Revo 2.0: Next-Gen AI with native image generation, character consistency & intelligent editing`
                  : selectedRevoModel === 'revo-1.5'
                    ? `✨ Revo 1.5: Professional design principles with brand color integration`
                    : selectedRevoModel === 'revo-1.0'
                      ? `🤖 Revo 1.0: Standard content generation with reliable performance`
                      : `🌟 ${selectedRevoModel}: Next-generation AI (coming soon)`
                }
              </p>
              <CreditCostDisplay
                modelVersion={selectedRevoModel}
                feature="Content Generation"
                className="text-xs"
              />
            </div>
          </div>

          {/* Credit Display and Model Selection */}


          {/* Simple Artifacts Toggle */}
          <div className="mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Use Artifacts</Label>
                    <p className="text-xs text-muted-foreground">

                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedArtifacts.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Enable artifacts - this will use active artifacts from the artifacts page
                          setSelectedArtifacts(['active']);
                        } else {
                          // Disable artifacts
                          setSelectedArtifacts([]);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/artifacts', '_blank')}
                      className="text-xs"
                    >
                      Manage
                    </Button>
                  </div>
                </div>
                {selectedArtifacts.length > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-700">
                      ✓ Artifacts enabled - Content will use your reference materials and exact-use items from the Artifacts page
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between w-full">
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight font-headline">Content Calendar</h1>
              <p className="text-muted-foreground">
                Here's your generated content. Click a post to edit or regenerate.
              </p>
            </div>
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={!!isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating for {isGenerating}...
                      </>
                    ) : (
                      "✨ Generate New Post"
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {platforms.map((p) => (
                    <DropdownMenuItem key={p.name} onClick={() => handleGenerateClick(p.name)} disabled={!!isGenerating}>
                      <p.icon className="mr-2 h-4 w-4" />
                      <span>{p.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {posts.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-none">
              {posts.map((post, index) => (
                <PostCard
                  key={`${post.id || 'post'}-${index}-${post.date || Date.now()}`}
                  post={post}
                  brandProfile={brandProfile}
                  onPostUpdated={onPostUpdated}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center w-full">
              <h3 className="text-xl font-semibold">Your calendar is empty</h3>
              <p className="text-muted-foreground mt-2">
                Click the "Generate" button to create your first social media post!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}