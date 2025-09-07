// MongoDB-based quick content page (replaces Firebase version)
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Download,
  Copy,
  Heart,
  MessageCircle,
  Share2,
  User,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/contexts/brand-context-mongo";
import { useAuth } from "@/hooks/use-auth";

interface GeneratedPost {
  id: string;
  platform: string;
  content: {
    text: string;
    hashtags: string[];
    imageUrl?: string;
  };
  createdAt: Date;
}

export default function QuickContentMongo() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentBrand, brands, loading: brandLoading } = useBrand();

  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get optimal aspect ratio for platform
  const getOptimalAspectRatio = (platform: string): '1:1' | '16:9' | '9:16' => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return '1:1'; // Square for feed posts
      case 'facebook':
      case 'twitter':
      case 'linkedin':
        return '16:9'; // Landscape for better engagement
      default:
        return '1:1';
    }
  };

  // Get available aspect ratios for platform
  const getAvailableAspectRatios = (platform: string): Array<{ value: '1:1' | '16:9' | '9:16', label: string, description: string }> => {
    const base = [
      { value: '1:1' as const, label: '1:1 Square', description: '1080×1080' },
      { value: '16:9' as const, label: '16:9 Landscape', description: '1200×675' },
      { value: '9:16' as const, label: '9:16 Portrait', description: '1080×1920' }
    ];

    switch (platform.toLowerCase()) {
      case 'instagram':
        return [
          { value: '1:1' as const, label: '1:1 Square', description: 'Feed Posts (1080×1080)' },
          { value: '9:16' as const, label: '9:16 Portrait', description: 'Stories/Reels (1080×1920)' }
        ];
      case 'facebook':
        return [
          { value: '16:9' as const, label: '16:9 Landscape', description: 'Posts (1200×675)' },
          { value: '1:1' as const, label: '1:1 Square', description: 'Alternative (1080×1080)' },
          { value: '9:16' as const, label: '9:16 Portrait', description: 'Stories (1080×1920)' }
        ];
      case 'twitter':
      case 'linkedin':
        return [
          { value: '16:9' as const, label: '16:9 Landscape', description: 'Posts (1200×675)' },
          { value: '1:1' as const, label: '1:1 Square', description: 'Alternative (1080×1080)' }
        ];
      default:
        return base;
    }
  };

  // Load generated posts
  useEffect(() => {
    if (user?.userId) {
      loadGeneratedPosts();
    }
  }, [user?.userId]);

  const loadGeneratedPosts = async () => {
    try {
      // TODO: Implement MongoDB-based post loading
      // const posts = await generatedPostMongoService.loadGeneratedPosts(user.userId);
      // setGeneratedPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load generated posts",
      });
    }
  };

  const generateContent = async () => {
    if (!currentBrand) {
      toast({
        variant: "destructive",
        title: "No Brand Selected",
        description: "Please select a brand profile first",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/social-media-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nevis_access_token')}`,
        },
        body: JSON.stringify({
          action: 'generate-posts',
          businessProfile: currentBrand,
          platform: selectedPlatform,
          count: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();

      if (data.success && data.data.posts.length > 0) {
        const newPost: GeneratedPost = {
          id: Date.now().toString(),
          platform: selectedPlatform,
          content: {
            text: data.data.posts[0].caption || data.data.posts[0].content,
            hashtags: data.data.posts[0].hashtags || [],
            imageUrl: data.data.posts[0].imageUrl,
          },
          createdAt: new Date(),
        };

        setGeneratedPosts(prev => [newPost, ...prev]);

        toast({
          title: "Content Generated!",
          description: "Your social media post has been created successfully.",
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy content to clipboard",
      });
    }
  };

  const downloadImage = async (imageUrl: string, postId: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nevis-post-${postId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Downloaded!",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to download image",
      });
    }
  };

  if (brandLoading) {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="mr-2"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>

          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold">Quick Content</h1>
            {currentBrand && (
              <Badge variant="secondary">{currentBrand.businessName}</Badge>
            )}
          </div>

          <div className="ml-auto flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/auth')}
            >
              <User className="h-4 w-4 mr-2" />
              {user?.displayName || user?.email || 'Account'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generation Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentBrand ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No brand profile selected
                    </p>
                    <Button
                      onClick={() => router.push('/brand-profile')}
                      variant="outline"
                    >
                      Create Brand Profile
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium">Platform</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['instagram', 'facebook', 'twitter', 'linkedin'].map((platform) => (
                          <Button
                            key={platform}
                            variant={selectedPlatform === platform ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setSelectedPlatform(platform);
                              setSelectedAspectRatio(getOptimalAspectRatio(platform));
                            }}
                            className="capitalize"
                          >
                            {platform}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Image Size</label>
                      <div className="space-y-2 mt-2">
                        {getAvailableAspectRatios(selectedPlatform).map((ratio) => (
                          <Button
                            key={ratio.value}
                            variant={selectedAspectRatio === ratio.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedAspectRatio(ratio.value)}
                            className="w-full justify-between text-left"
                          >
                            <span>{ratio.label}</span>
                            <span className="text-xs text-muted-foreground">{ratio.description}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={generateContent}
                      disabled={isGenerating}
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generated Posts */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Generated Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {generatedPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No posts generated yet. Click "Generate Content" to get started!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {generatedPosts.map((post) => (
                        <Card key={post.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <Badge variant="secondary" className="capitalize">
                                {post.platform}
                              </Badge>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(post.content.text)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                {post.content.imageUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadImage(post.content.imageUrl!, post.id)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {post.content.imageUrl && (
                              <div className="mb-4">
                                <img
                                  src={post.content.imageUrl}
                                  alt="Generated content"
                                  className="w-full max-w-md rounded-lg border"
                                />
                              </div>
                            )}

                            <p className="text-sm mb-3 whitespace-pre-wrap">
                              {post.content.text}
                            </p>

                            {post.content.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {post.content.hashtags.map((hashtag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    #{hashtag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <Separator className="my-3" />

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Generated {post.createdAt.toLocaleString()}</span>
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  0
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  0
                                </span>
                                <span className="flex items-center gap-1">
                                  <Share2 className="h-3 w-3" />
                                  0
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
