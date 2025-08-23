// src/components/dashboard/content-calendar.tsx
"use client";

import React from "react";
import { Loader2, Facebook, Instagram, Linkedin, Twitter, Settings, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/dashboard/post-card";
import { generateContentAction, generateEnhancedDesignAction, generateContentWithArtifactsAction } from "@/app/actions";

import { useToast } from "@/hooks/use-toast";
import { useGeneratedPosts } from "@/hooks/use-generated-posts";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import type { BrandProfile, GeneratedPost, Platform, BrandConsistencyPreferences } from "@/lib/types";

type RevoModel = 'revo-1.0' | 'revo-1.5' | 'revo-2.0';
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
  const { user } = useFirebaseAuth();
  const { savePost, saving } = useGeneratedPosts();

  // Brand consistency preferences - default to consistent if design examples exist
  const [brandConsistency, setBrandConsistency] = React.useState<BrandConsistencyPreferences>({
    strictConsistency: !!(brandProfile.designExamples && brandProfile.designExamples.length > 0), // Auto-check if design examples exist
    followBrandColors: true, // Always follow brand colors
  });

  // Revo model selection
  const [selectedRevoModel, setSelectedRevoModel] = React.useState<RevoModel>('revo-1.5');

  // Artifact selection for content generation
  const [selectedArtifacts, setSelectedArtifacts] = React.useState<string[]>([]);

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
  }, []);

  React.useEffect(() => {
    localStorage.setItem('brandConsistencyPreferences', JSON.stringify(brandConsistency));
  }, [brandConsistency]);

  React.useEffect(() => {
    localStorage.setItem('selectedRevoModel', selectedRevoModel);
  }, [selectedRevoModel]);

  const handleGenerateClick = async (platform: Platform) => {
    setIsGenerating(platform);
    try {
      console.log('🚀 Starting content generation for platform:', platform);
      console.log('👤 User authenticated:', !!user);
      console.log('🏢 Brand profile:', brandProfile?.businessName);

      let newPost;

      // Check if artifacts are enabled (simple toggle approach)
      const artifactsEnabled = selectedArtifacts.length > 0;

      const useEnhancedGeneration = artifactsEnabled || selectedRevoModel === 'revo-1.5';

      if (useEnhancedGeneration) {
        console.log(`✨ Using enhanced generation with ${selectedRevoModel} model`);
        // Use artifact-enhanced generation - will automatically use active artifacts from artifacts page
        newPost = await generateContentWithArtifactsAction(
          brandProfile,
          platform,
          brandConsistency,
          [], // Empty array - let the action use active artifacts from artifacts service
          selectedRevoModel === 'revo-1.5' // Enhanced design for Revo 1.5
        );
      } else {
        console.log(`📝 Using standard content generation with ${selectedRevoModel} model`);
        // Use standard content generation
        newPost = await generateContentAction(brandProfile, platform, brandConsistency);
      }

      console.log('📄 Generated post:', newPost.content.substring(0, 100) + '...');

      // Save to Firestore database first
      try {
        console.log('💾 Saving post to Firestore database...');
        const postId = await savePost(newPost);
        console.log('✅ Post saved to Firestore with ID:', postId);

        // Update the post with the Firestore ID
        const savedPost = { ...newPost, id: postId };
        onPostGenerated(savedPost);
      } catch (saveError) {
        console.error('❌ Failed to save to Firestore, falling back to localStorage:', saveError);
        // Fallback to localStorage if Firestore fails
        onPostGenerated(newPost);
      }

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
          {selectedRevoModel === 'revo-1.5'
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
                  Enable to use your uploaded reference materials and exact-use content
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