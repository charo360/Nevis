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
import type { BrandProfile, GeneratedPost, Platform, BrandConsistencyPreferences } from "@/lib/types";
import type { ScheduledService } from "@/services/calendar-service";

type RevoModel = 'revo-1.0' | 'revo-1.5';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArtifactSelector } from "@/components/artifacts/artifact-selector";

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
  hasScheduledContent = false
}: ContentCalendarProps) {
  const [isGenerating, setIsGenerating] = React.useState<Platform | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Brand consistency preferences - default to consistent if design examples exist
  const [brandConsistency, setBrandConsistency] = React.useState<BrandConsistencyPreferences>({
    strictConsistency: !!(brandProfile.designExamples && brandProfile.designExamples.length > 0), // Auto-check if design examples exist
    followBrandColors: true, // Always follow brand colors
    includeContacts: false, // Default to not including contacts
  });

  // Revo model selection
  const [selectedRevoModel, setSelectedRevoModel] = React.useState<RevoModel>('revo-1.5');

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
    setIsGenerating(platform);
    try {

      let newPost;
      let revo20Result: any = null; // Declare in proper scope

      // Debug logging for services
      console.log('🔍 ContentCalendar Services Debug:', {
        brandProfileServices: brandProfile.services,
        businessType: brandProfile.businessType,
        businessName: brandProfile.businessName
      });

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

      const useEnhancedGeneration = artifactsEnabled || selectedRevoModel === 'revo-1.5' || selectedRevoModel === 'revo-2.0';

      if (selectedRevoModel === 'revo-2.0') {

        // Use server action to avoid client-side imports
        const trendingContext = {
          trendingHashtags: platformHashtags,
          businessType: brandProfile.businessType || 'business'
        };

        console.log('🎨 Calling Revo 2.0 API with scheduled services:', {
          platform,
          scheduledServicesCount: scheduledServices?.length || 0,
          scheduledServiceNames: scheduledServices?.map(s => s.serviceName) || [],
          todaysServicesCount: scheduledServices?.filter(s => s.isToday).length || 0,
          upcomingServicesCount: scheduledServices?.filter(s => s.isUpcoming).length || 0,
          hasScheduledContent
        });

        const response = await fetch('/api/generate-revo-2.0', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessType: brandProfile.businessType || 'Business',
            platform: platform.toLowerCase(),
            visualStyle: brandProfile.visualStyle || 'modern',
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

        // Combine AI-generated hashtags with trending hashtags
        const combinedHashtags = [
          ...(revo20Result.hashtags || ['#NextGen', '#AI', '#Innovation']),
          ...platformHashtags // Add platform-optimized trending hashtags
        ]
          // Remove duplicates and limit based on platform
          .filter((tag, index, arr) => arr.indexOf(tag) === index)
          .slice(0, platform === 'Twitter' ? 5 : platform === 'LinkedIn' ? 8 : 10);

        newPost = {
          id: `revo-2.0-${Date.now()}`,
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
        // Use Revo 1.5 directly with logo support
        console.log('🎨 Calling generateRevo15ContentAction with scheduled services:', {
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
            visualStyle: brandProfile.visualStyle || 'modern',
            includePeopleInDesigns,
            useLocalLanguage
          },
          scheduledServices // NEW: Pass scheduled services to Revo 1.5
        );
      } else if (useEnhancedGeneration) {
        // Use artifact-enhanced generation - will automatically use active artifacts from artifacts page
        newPost = await generateContentWithArtifactsAction(
          brandProfile,
          platform,
          brandConsistency,
          [], // Empty array - let the action use active artifacts from artifacts service
          selectedRevoModel === 'revo-1.5', // Enhanced design for Revo 1.5
          includePeopleInDesigns,
          useLocalLanguage
        );
      } else {
        // Use standard content generation with scheduled services
        console.log('🤖 Calling generateContentAction with scheduled services:', {
          platform,
          scheduledServicesCount: scheduledServices?.length || 0,
          scheduledServiceNames: scheduledServices?.map(s => s.serviceName) || [],
          hasScheduledContent
        });

        console.log('🔍 [ContentCalendar] People Toggle Debug:', {
          includePeopleInDesigns,
          includePeopleInDesignsType: typeof includePeopleInDesigns,
          businessName: brandProfile.businessName
        });

        newPost = await generateContentAction(
          brandProfile,
          platform,
          brandConsistency,
          useLocalLanguage,
          scheduledServices, // NEW: Pass scheduled services to AI generation
          includePeopleInDesigns // NEW: Pass people toggle to Revo 1.0
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

      // Ensure the post has a unique ID
      if (!newPost.id) {
        newPost.id = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('🔧 Generated new ID for post:', newPost.id);
      }

      console.log('✅ Content generation successful, processing post:', {
        id: newPost.id,
        platform: newPost.platform,
        hasContent: !!newPost.content,
        hasImageUrl: !!newPost.imageUrl
      });

      // Let the parent component handle saving
      onPostGenerated(newPost);

      // Dynamic toast message based on generation type
      let title = "Content Generated!";
      let description = `A new ${platform} post has been saved to your database.`;

      // Special message for Instagram with multiple captions
      if (platform === 'Instagram' && selectedRevoModel === 'revo-2.0' && revo20Result?.captionVariations?.length > 1) {
        title = "Instagram Content with 5 Captions Generated! 📸";
        description = `Generated ${revo20Result.captionVariations.length} caption variations for Instagram engagement optimization.`;
      }

      if (platformHashtags.length > 0 && selectedArtifacts.length > 0) {
        title = "Trending Content Generated! 🔥📎";
        description = `A new ${platform} post with ${platformHashtags.length} trending hashtags and ${selectedArtifacts.length} reference${selectedArtifacts.length !== 1 ? 's' : ''} has been saved.`;
      } else if (platformHashtags.length > 0) {
        title = "Trending Content Generated! 🔥";
        description = `A new ${platform} post with ${platformHashtags.length} trending hashtags has been saved.`;
      } else if (selectedArtifacts.length > 0) {
        title = "Content Generated with References! 📎";
        description = `A new ${platform} post using ${selectedArtifacts.length} reference${selectedArtifacts.length !== 1 ? 's' : ''} has been saved.`;
      } else if (selectedRevoModel === 'revo-1.5') {
        title = "Enhanced Content Generated! ✨";
        description = `A new enhanced ${platform} post with ${selectedRevoModel} has been saved.`;
      } else {
        title = "Content Generated! 🚀";
        description = `A new ${platform} post with ${selectedRevoModel} has been saved.`;
      }



      toast({ title, description });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsGenerating(null);
    }
  };

  // Ensure this component is always full-bleed inside the app shell and does not cause horizontal overflow.
  return (
    <div className="w-full max-w-full box-border overflow-x-hidden">
      <div className="w-full px-4 py-6 lg:py-8 lg:px-6">
        <div className="w-full max-w-full box-border space-y-6">
          {/* Compact Brand Consistency Controls */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Brand Consistency</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 min-w-[96px]">
                  <Palette className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">Strict</span>
                  <Switch
                    checked={brandConsistency.strictConsistency}
                    onCheckedChange={(checked) =>
                      setBrandConsistency(prev => ({ ...prev, strictConsistency: checked }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2 min-w-[96px]">
                  <Sparkles className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">Colors</span>
                  <Switch
                    checked={brandConsistency.followBrandColors}
                    onCheckedChange={(checked) =>
                      setBrandConsistency(prev => ({ ...prev, followBrandColors: checked }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2 min-w-[96px]">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">Contacts</span>
                  <Switch
                    checked={brandConsistency.includeContacts}
                    onCheckedChange={(checked) =>
                      setBrandConsistency(prev => ({ ...prev, includeContacts: checked }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2 min-w-[96px]">
                  <span className="text-xs text-gray-600">👥 People</span>
                  <Switch
                    checked={includePeopleInDesigns}
                    onCheckedChange={setIncludePeopleInDesigns}
                  />
                </div>
                <div className="flex items-center gap-2 min-w-[96px]">
                  <span className="text-xs text-gray-600">🌍 Local</span>
                  <Switch
                    checked={useLocalLanguage}
                    onCheckedChange={setUseLocalLanguage}
                  />
                </div>
                <Separator orientation="vertical" className="hidden sm:block h-4" />
                <div className="flex items-center gap-2 min-w-[160px]">
                  <span className="text-xs text-gray-600">AI Model:</span>
                  <select
                    value={selectedRevoModel}
                    onChange={(e) => setSelectedRevoModel(e.target.value as RevoModel)}
                    className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                  >
                    <option value="revo-1.0">Revo 1.0</option>
                    <option value="revo-1.5">Revo 1.5</option>
                    <option value="revo-2.0">Revo 2.0</option>
                  </select>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedRevoModel === 'revo-2.0'
                ? `🚀 ${selectedRevoModel}: Next-Gen AI with native image generation, character consistency & intelligent editing`
                : selectedRevoModel === 'revo-1.5'
                  ? `✨ ${selectedRevoModel}: Enhanced AI with professional design principles + ${brandConsistency.strictConsistency ? "strict consistency" : "brand colors"}`
                  : selectedRevoModel === 'revo-1.0'
                    ? `🚀 ${selectedRevoModel}: Standard reliable AI + ${brandConsistency.strictConsistency ? "strict consistency" : "brand colors"}`
                    : `🌟 ${selectedRevoModel}: Next-generation AI (coming soon)`
              }
            </p>
          </div>

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
                  key={post.id || `post-${index}-${Date.now()}`}
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