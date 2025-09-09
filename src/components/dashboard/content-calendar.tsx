// src/components/dashboard/content-calendar.tsx
"use client";

import React from "react";
import { Loader2, Facebook, Instagram, Linkedin, Twitter, Settings, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/dashboard/post-card";
import { generateContentAction, generateEnhancedDesignAction, generateContentWithArtifactsAction } from "@/app/actions";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { BrandProfile, GeneratedPost, Platform, BrandConsistencyPreferences } from "@/lib/types";

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
};

const platforms: { name: Platform; icon: React.ElementType }[] = [
  { name: 'Instagram', icon: Instagram },
  { name: 'Facebook', icon: Facebook },
  { name: 'Twitter', icon: Twitter },
  { name: 'LinkedIn', icon: Linkedin },
];

export function ContentCalendar({ brandProfile, posts, onPostGenerated, onPostUpdated }: ContentCalendarProps) {
  const [isGenerating, setIsGenerating] = React.useState<Platform | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize state with proper defaults
  const [brandConsistency, setBrandConsistency] = React.useState<BrandConsistencyPreferences>(() => {
    // Try to load from localStorage first, fallback to defaults based on brand profile
    const savedPreferences = localStorage.getItem('brandConsistencyPreferences');
    if (savedPreferences) {
      return JSON.parse(savedPreferences);
    }
    return {
      strictConsistency: !!(brandProfile.designExamples && brandProfile.designExamples.length > 0),
      followBrandColors: true,
    };
  });

  const [selectedRevoModel, setSelectedRevoModel] = React.useState<RevoModel>(() => {
    const savedRevoModel = localStorage.getItem('selectedRevoModel');
    return (savedRevoModel as RevoModel) || 'revo-1.5';
  });

  const [selectedArtifacts, setSelectedArtifacts] = React.useState<string[]>([]);

  const [includePeopleInDesigns, setIncludePeopleInDesigns] = React.useState<boolean>(() => {
    const savedIncludePeople = localStorage.getItem('includePeopleInDesigns');
    return savedIncludePeople !== null ? JSON.parse(savedIncludePeople) : true;
  });

  const [useLocalLanguage, setUseLocalLanguage] = React.useState<boolean>(() => {
    const savedUseLocalLanguage = localStorage.getItem('useLocalLanguage');
    return savedUseLocalLanguage !== null ? JSON.parse(savedUseLocalLanguage) : false;
  });

  // Save preferences to localStorage when they change
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

      // Check if artifacts are enabled (simple toggle approach)
      const artifactsEnabled = selectedArtifacts.length > 0;

      const useEnhancedGeneration = artifactsEnabled || selectedRevoModel === 'revo-1.5' || selectedRevoModel === 'revo-2.0';

      // Debug log removed: generation path details

      if (selectedRevoModel === 'revo-2.0') {

        // Use server action to avoid client-side imports
        const response = await fetch('/api/generate-revo-2.0', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessType: brandProfile.businessType || 'Business',
            platform: platform.toLowerCase(),
            visualStyle: brandProfile.visualStyle || 'modern',
            imageText: `${brandProfile.businessName || brandProfile.businessType} - Premium Content`,
            brandProfile,
            aspectRatio: '1:1',
            includePeopleInDesigns,
            useLocalLanguage
          })
        });

        if (!response.ok) {
          throw new Error(`Revo 2.0 generation failed: ${response.statusText}`);
        }

        const revo20Result = await response.json();

        newPost = {
          id: `revo-2.0-${Date.now()}`,
          content: revo20Result.caption || `🚀 Generated with Revo 2.0 (Gemini 2.5 Flash Image)\n\n${brandProfile.businessName || brandProfile.businessType} - Premium Content`,
          hashtags: revo20Result.hashtags || ['#NextGen', '#AI', '#Innovation'],
          imageUrl: revo20Result.imageUrl,
          platform: platform,
          date: new Date().toISOString(),
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
            enhancementsApplied: revo20Result.enhancementsApplied || []
          }
        };
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
        // Use standard content generation
        newPost = await generateContentAction(brandProfile, platform, brandConsistency);
      }


      // Let the parent component handle saving
      onPostGenerated(newPost);

      // Dynamic toast message based on generation type
      let title = "Content Generated!";
      let description = `A new ${platform} post has been saved to your database.`;

      if (selectedArtifacts.length > 0) {
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
    <div className="w-full max-w-[100vw] box-border overflow-x-hidden">
      <div className="w-full px-6 py-10 lg:py-16 lg:px-12">
        <div className="w-full box-border space-y-6">
          {/* Compact Brand Consistency Controls */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Brand Consistency</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">Strict</span>
                  <input
                    type="checkbox"
                    checked={brandConsistency.strictConsistency}
                    onChange={(e) =>
                      setBrandConsistency(prev => ({ ...prev, strictConsistency: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">Colors</span>
                  <input
                    type="checkbox"
                    checked={brandConsistency.followBrandColors}
                    onChange={(e) =>
                      setBrandConsistency(prev => ({ ...prev, followBrandColors: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">👥 People</span>
                  <input
                    type="checkbox"
                    checked={includePeopleInDesigns}
                    onChange={(e) => setIncludePeopleInDesigns(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">🌍 Local</span>
                  <input
                    type="checkbox"
                    checked={useLocalLanguage}
                    onChange={(e) => setUseLocalLanguage(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">AI Model:</span>
                  <select
                    value={selectedRevoModel}
                    onChange={(e) => setSelectedRevoModel(e.target.value as RevoModel)}
                    className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Simple Artifacts Toggle - TEMPORARILY DISABLED TO FIX INFINITE LOOP */}
          <div className="mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Use Artifacts (Temporarily Disabled)</Label>
                    <p className="text-xs text-muted-foreground">
                      Artifacts feature temporarily disabled while fixing UI issue
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
              </CardContent>
            </Card>
          </div>



          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">Content Calendar</h1>
              <p className="text-muted-foreground">
                Here's your generated content. Click a post to edit or regenerate.
              </p>
            </div>
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
              <DropdownMenuContent>
                {platforms.map((p) => (
                  <DropdownMenuItem key={p.name} onClick={() => handleGenerateClick(p.name)} disabled={!!isGenerating}>
                    <p.icon className="mr-2 h-4 w-4" />
                    <span>{p.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {posts.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-none">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
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