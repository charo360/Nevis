// src/components/dashboard/content-calendar.tsx
"use client";

import React from "react";
import { Loader2, Facebook, Instagram, Linkedin, Twitter, Settings, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/dashboard/post-card";
import { generateContentAction, generateEnhancedDesignAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { BrandProfile, GeneratedPost, Platform, BrandConsistencyPreferences } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

type ContentCalendarProps = {
  brandProfile: BrandProfile;
  posts: GeneratedPost[];
  onPostGenerated: (post: GeneratedPost) => void;
  onPostUpdated: (post: GeneratedPost) => void;
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

  // Brand consistency preferences - default to consistent if design examples exist
  const [brandConsistency, setBrandConsistency] = React.useState<BrandConsistencyPreferences>({
    strictConsistency: brandProfile.designExamples && brandProfile.designExamples.length > 0, // Auto-check if design examples exist
    followBrandColors: true, // Always follow brand colors
  });

  // Enhanced design preference
  const [useEnhancedDesign, setUseEnhancedDesign] = React.useState(true);

  // Save preferences to localStorage
  React.useEffect(() => {
    const savedPreferences = localStorage.getItem('brandConsistencyPreferences');
    if (savedPreferences) {
      setBrandConsistency(JSON.parse(savedPreferences));
    }

    const savedEnhancedDesign = localStorage.getItem('useEnhancedDesign');
    if (savedEnhancedDesign !== null) {
      setUseEnhancedDesign(JSON.parse(savedEnhancedDesign));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('brandConsistencyPreferences', JSON.stringify(brandConsistency));
  }, [brandConsistency]);

  React.useEffect(() => {
    localStorage.setItem('useEnhancedDesign', JSON.stringify(useEnhancedDesign));
  }, [useEnhancedDesign]);

  const handleGenerateClick = async (platform: Platform) => {
    setIsGenerating(platform);
    try {
      let newPost;

      if (useEnhancedDesign) {
        // First generate proper content using the standard flow
        const standardPost = await generateContentAction(brandProfile, platform, brandConsistency);

        // Then enhance the visual design with brand consistency settings
        const enhancedResult = await generateEnhancedDesignAction(
          brandProfile.businessType || 'business',
          platform.toLowerCase(),
          brandProfile.visualStyle || 'modern',
          standardPost.imageText || 'Engaging Content',
          brandProfile,
          true,
          brandConsistency
        );

        // Combine standard content with enhanced visuals
        newPost = {
          ...standardPost,
          id: Date.now().toString(),
          variants: [{
            platform: platform,
            imageUrl: enhancedResult.imageUrl
          }],
          // Add enhancement metadata to content
          content: `${standardPost.content}\n\n✨ Enhanced with AI+ (Quality: ${enhancedResult.qualityScore}/10)`,
          date: new Date().toISOString()
        };
      } else {
        // Use standard content generation
        newPost = await generateContentAction(brandProfile, platform, brandConsistency);
      }

      onPostGenerated(newPost);
      toast({
        title: useEnhancedDesign ? "Enhanced Content Generated! ✨" : "Content Generated!",
        description: useEnhancedDesign
          ? `A new enhanced ${platform} post with professional design principles has been added.`
          : `A new ${platform} post has been added to your calendar.`,
      });
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

  return (
    <div className="space-y-6">
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
              <Switch
                checked={brandConsistency.strictConsistency}
                onCheckedChange={(checked) =>
                  setBrandConsistency(prev => ({ ...prev, strictConsistency: checked }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-600">Colors</span>
              <Switch
                checked={brandConsistency.followBrandColors}
                onCheckedChange={(checked) =>
                  setBrandConsistency(prev => ({ ...prev, followBrandColors: checked }))
                }
              />
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
              <span className="text-xs text-gray-600">Enhanced</span>
              <Switch
                checked={useEnhancedDesign}
                onCheckedChange={setUseEnhancedDesign}
              />
              {useEnhancedDesign && (
                <span className="text-xs text-purple-600 font-medium">✨ AI+</span>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {useEnhancedDesign
            ? `✨ Enhanced AI: Professional design principles + ${brandConsistency.strictConsistency ? "strict consistency" : "brand colors"}`
            : brandConsistency.strictConsistency
              ? "🎯 Consistent content matching your design examples"
              : "✨ Varied content using your brand colors"
          }
        </p>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center">
          <h3 className="text-xl font-semibold">Your calendar is empty</h3>
          <p className="text-muted-foreground mt-2">
            Click the "Generate" button to create your first social media post!
          </p>
        </div>
      )}
    </div>
  );
}
