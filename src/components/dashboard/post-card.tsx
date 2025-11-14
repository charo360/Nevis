// src/components/dashboard/post-card.tsx
"use client";

import * as React from 'react';
import Image from "next/image";
import { Facebook, Instagram, Linkedin, MoreVertical, Pen, RefreshCw, Twitter, CalendarIcon, Download, Loader2, Video, ChevronLeft, ChevronRight, ImageOff, Copy, Eye, Send, Clock, Share2, CheckCircle, XCircle, Palette } from "lucide-react";
import { toPng } from 'html-to-image';
import { PerformanceBadgeCompact } from '@/components/ui/performance-badge';
import { PerformancePredictionService } from '@/services/performance-prediction-service';
import type { PerformancePrediction } from '@/services/performance-prediction-service';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BrandProfile, GeneratedPost, Platform, PostVariant } from "@/lib/types";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-supabase";
import { useCredits } from "@/hooks/use-credits";
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { generateContentAction, generateVideoContentAction } from '@/app/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { createClient } from '@supabase/supabase-js';
import { ImageEditor } from '@/components/studio/image-editor';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to validate URLs
const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Handle compression placeholders
  if (url === '[COMPRESSED_IMAGE]' || url === '[TRUNCATED]' || url.includes('[') && url.includes(']')) {
    return false;
  }

  try {
    // Check for data URLs (base64 images)
    if (url.startsWith('data:')) {
      return url.includes('base64,') || url.includes('charset=');
    }

    // Check for relative API paths (MongoDB GridFS)
    if (url.startsWith('/api/images/') || url.startsWith('/api/files/')) {
      return true;
    }

    // Check for HTTP/HTTPS URLs
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    // Check if it's a relative path that might be valid
    if (url.startsWith('/') && !url.includes('[') && !url.includes(']')) {
      return true;
    }

    // Don't log compression placeholders as errors
    if (!url.includes('[') || !url.includes(']')) {
    }
    return false;
  }
};

/**
 * Utility function to detect image format from data URL
 */
function getImageFormatFromDataUrl(dataUrl: string): { format: string; extension: string } {
  if (dataUrl.startsWith('data:image/svg+xml')) {
    return { format: 'svg', extension: 'svg' };
  } else if (dataUrl.startsWith('data:image/png;base64,')) {
    return { format: 'png', extension: 'png' };
  } else if (dataUrl.startsWith('data:image/jpeg;base64,') || dataUrl.startsWith('data:image/jpg;base64,')) {
    return { format: 'jpeg', extension: 'jpg' };
  } else if (dataUrl.startsWith('data:image/webp;base64,')) {
    return { format: 'webp', extension: 'webp' };
  }
  return { format: 'png', extension: 'png' }; // default fallback
}

const platformIcons: { [key in Platform]: React.ReactElement } = {
  Facebook: <Facebook className="h-4 w-4" />,
  Instagram: <Instagram className="h-4 w-4" />,
  LinkedIn: <Linkedin className="h-4 w-4" />,
  Twitter: <Twitter className="h-4 w-4" />,
};

type PostCardProps = {
  post: GeneratedPost;
  brandProfile: BrandProfile;
  onPostUpdated: (post: GeneratedPost) => Promise<void>;
};

export function PostCard({ post, brandProfile, onPostUpdated }: PostCardProps) {
  const { user, getAccessToken } = useAuth();
  const { useCreditsForModel, useCreditsForImageEdit } = useCredits();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(post.content);
  const [editedHashtags, setEditedHashtags] = React.useState(post.hashtags);
  const [videoUrl, setVideoUrl] = React.useState<string | undefined>(post.videoUrl);
  const [showVideoDialog, setShowVideoDialog] = React.useState(false);
  const [showImagePreview, setShowImagePreview] = React.useState(false);
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string>('');
  const [showImageEditor, setShowImageEditor] = React.useState(false);
  
  // Posting state
  const [isPosting, setIsPosting] = React.useState(false);
  const [postingStatus, setPostingStatus] = React.useState<Record<string, 'idle' | 'posting' | 'success' | 'error'>>({});
  const [showPostingDialog, setShowPostingDialog] = React.useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = React.useState<string>('');
  const [postingMode, setPostingMode] = React.useState<'manual' | 'schedule'>('manual');
  
  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Performance prediction state
  const [performancePrediction, setPerformancePrediction] = React.useState<PerformancePrediction | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = React.useState(true);
  // Ensure variants array exists and has at least one item
  const safeVariants = post.variants && post.variants.length > 0 ? post.variants : [{
    platform: (post.platform || 'instagram') as Platform,
    imageUrl: post.imageUrl || ''
  }];

  const [activeTab, setActiveTab] = React.useState<Platform>(safeVariants[0]?.platform || 'instagram');
  const downloadRefs = React.useRef<Record<Platform, HTMLDivElement | null>>({} as Record<Platform, HTMLDivElement | null>);

  // Check if this is a Revo 2.0 post (single platform)
  const isRevo2Post = post.id?.startsWith('revo2-') || safeVariants.length === 1;

  const formattedDate = React.useMemo(() => {
    try {
      const date = new Date(post.date);
      if (isNaN(date.getTime())) {
        // If date is invalid, use current date
        return format(new Date(), 'MMM d, yyyy');
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      // Fallback to current date if any error occurs
      return format(new Date(), 'MMM d, yyyy');
    }
  }, [post.date]);
  const { toast } = useToast();

  // Load performance prediction only once on mount (static analysis)
  React.useEffect(() => {
    let mounted = true;

    // Only run if we don't already have a prediction and we're not currently loading
    if (performancePrediction !== null) {
      return;
    }

    const loadPrediction = async () => {
      try {
        setIsPredictionLoading(true);
        const prediction = await PerformancePredictionService.predictPerformance(post, brandProfile);
        if (mounted) {
          setPerformancePrediction(prediction);
        }
      } catch (error) {
        console.warn('Performance prediction failed:', error);
        if (mounted) {
          setPerformancePrediction(null);
        }
      } finally {
        if (mounted) {
          setIsPredictionLoading(false);
        }
      }
    };

    // Only load if we haven't loaded yet
    if (isPredictionLoading && performancePrediction === null) {
      loadPrediction();
    }

    return () => {
      mounted = false;
    };
  }, [post.id]); // Only depend on post.id, run once per unique post

  // Platform-specific dimensions - ALL PLATFORMS USE 992x1056px FOR HIGHEST QUALITY
  const getPlatformDimensions = React.useCallback((platform: Platform) => {
    // ALL PLATFORMS USE 992x1056px FOR MAXIMUM QUALITY
    // No cropping = No quality loss from Gemini's native generation
    return { width: 992, height: 1056, aspectClass: 'aspect-[992/1056]' };
  }, []);

  // Copy functionality
  const handleCopyCaption = React.useCallback(async () => {
    try {
      // Handle both string and object content formats
      const contentText = typeof post.content === 'string'
        ? post.content
        : (post.content as any)?.text || 'No content available';

      await navigator.clipboard.writeText(contentText);
      toast({
        title: "Caption Copied!",
        description: "The caption has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy the caption. Please try again.",
      });
    }
  }, [post.content, toast]);

  const handleCopyHashtags = React.useCallback(async () => {
    try {
      // Handle hashtags from different sources
      let hashtags = post.hashtags;

      // If no direct hashtags, check content.hashtags (database format)
      if (!hashtags && typeof post.content === 'object' && (post.content as any)?.hashtags) {
        hashtags = (post.content as any).hashtags;
      }

      const hashtagsText = typeof hashtags === 'string'
        ? hashtags
        : Array.isArray(hashtags)
          ? hashtags.join(' ')
          : '';

      await navigator.clipboard.writeText(hashtagsText);
      toast({
        title: "Hashtags Copied!",
        description: "The hashtags have been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy the hashtags. Please try again.",
      });
    }
  }, [post.hashtags, toast]);

  // Image preview functionality
  const handleImagePreview = React.useCallback((imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setShowImagePreview(true);
  }, []);

  // Posting functionality
  const handlePostToSocial = React.useCallback(async (platform: string, mode: 'manual' | 'schedule' = 'manual', scheduledTime?: string) => {
    setIsPosting(true);
    setPostingStatus(prev => ({ ...prev, [platform]: 'posting' }));

    try {
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        throw new Error('Please log in to post to social media');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };

      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          platform,
          content: editedContent,
          hashtags: editedHashtags,
          imageUrl: post.imageUrl,
          mode,
          scheduledTime: mode === 'schedule' ? scheduledTime : undefined,
          postId: post.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        setPostingStatus(prev => ({ ...prev, [platform]: 'success' }));
        
        toast({
          title: "Posted Successfully!",
          description: result.tweetUrl 
            ? `Your post has been ${mode === 'manual' ? 'published' : 'scheduled'} to ${platform}. View tweet: ${result.tweetUrl}`
            : `Your post has been ${mode === 'manual' ? 'published' : 'scheduled'} to ${platform}.`,
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to post`);
      }
    } catch (error) {
      console.error('Posting error:', error);
      setPostingStatus(prev => ({ ...prev, [platform]: 'error' }));
      toast({
        title: "Posting Failed",
        description: `Failed to post to ${platform}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  }, [editedContent, editedHashtags, post.imageUrl, post.id, getAccessToken, toast]);

  const handleOpenPostingDialog = React.useCallback(() => {
    setShowPostingDialog(true);
    setSelectedPlatforms([post.platform.toLowerCase()]);
  }, [post.platform]);

  const handlePostToMultiple = React.useCallback(async () => {
    if (selectedPlatforms.length === 0) return;

    setIsPosting(true);
    
    for (const platform of selectedPlatforms) {
      await handlePostToSocial(platform, postingMode, scheduledTime);
    }
    
    setShowPostingDialog(false);
  }, [selectedPlatforms, postingMode, scheduledTime, handlePostToSocial]);

  const handleDownload = React.useCallback(async () => {
    const activeVariant = safeVariants.find(v => v.platform === activeTab);

    // First try to download the original HD image directly if URL is valid
    if (activeVariant?.imageUrl && isValidUrl(activeVariant.imageUrl)) {
      try {
        // Check if it's a data URL (base64 encoded image)
        if (activeVariant.imageUrl.startsWith('data:')) {
          const { format, extension } = getImageFormatFromDataUrl(activeVariant.imageUrl);

          // For social media posts, we need raster images (PNG/JPEG), not SVG
          if (format === 'svg') {
            // Fall through to the canvas conversion method below
            // This will convert the SVG to a high-quality PNG
          } else {
            // Handle other data URL formats (PNG, JPEG, etc.) directly
            const link = document.createElement('a');
            link.href = activeVariant.imageUrl;
            link.download = `crevo-social-${post.id}-${activeTab}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
              title: "Social Media Image Ready",
              description: `High-definition ${format.toUpperCase()} image downloaded successfully.`,
            });
            return;
          }
        } else {
          // Handle regular HTTP/HTTPS URLs (not data URLs)
          try {
            const response = await fetch(activeVariant.imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Determine file extension based on content type
            const contentType = response.headers.get('content-type') || blob.type;
            let extension = 'png'; // default
            if (contentType.includes('jpeg') || contentType.includes('jpg')) {
              extension = 'jpg';
            } else if (contentType.includes('webp')) {
              extension = 'webp';
            }

            const link = document.createElement('a');
            link.href = url;
            link.download = `crevo-social-${post.id}-${activeTab}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
              title: "Social Media Image Ready",
              description: "High-definition image downloaded successfully.",
            });
            return;
          } catch (error) {
            // Fall through to canvas conversion
          }
        }
      } catch (error) {
      }
    }

    // Fallback: Capture the displayed image with maximum quality settings
    const nodeToCapture = downloadRefs.current[activeTab];
    if (!nodeToCapture) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not find the image element to download.",
      });
      return;
    }

    try {
      // Check if we're converting an SVG enhanced design
      const activeVariant = safeVariants.find(v => v.platform === activeTab);
      const isSvgDataUrl = activeVariant?.imageUrl?.startsWith('data:image/svg+xml');
      const platformDimensions = getPlatformDimensions(activeTab);

      // Platform-specific optimized settings for social media posts
      const socialMediaSettings = {
        cacheBust: true,
        canvasWidth: platformDimensions.width,
        canvasHeight: platformDimensions.height,
        pixelRatio: 3, // High DPI for crisp images
        quality: 1.0, // Maximum quality
        backgroundColor: '#ffffff', // White background for transparency
        style: {
          borderRadius: '0',
          border: 'none',
        }
      };

      // Enhanced settings for SVG conversion
      if (isSvgDataUrl) {
        socialMediaSettings.canvasWidth = platformDimensions.width;
        socialMediaSettings.canvasHeight = platformDimensions.height;
        socialMediaSettings.pixelRatio = 4; // Extra high DPI for SVG conversion
      }

      const dataUrl = await toPng(nodeToCapture, socialMediaSettings);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `crevo-social-${post.id}-${activeTab}.png`;
      link.click();

      // Provide specific feedback based on content type
      const successMessage = isSvgDataUrl
        ? "Enhanced design converted to PNG for social media use."
        : "High-definition image ready for social media posting.";

      toast({
        title: "Social Media Image Ready",
        description: successMessage,
      });

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: `Could not download the image. Please try again. Error: ${(err as Error).message}`,
      });
    }
  }, [post.id, activeTab, toast]);


  const handleSaveChanges = async () => {
    const updatedPost = {
      ...post,
      content: editedContent,
      hashtags: editedHashtags,
      status: 'edited' as const,
    };
    await onPostUpdated(updatedPost);
    setIsEditing(false);
    toast({
      title: "Post Updated",
      description: "Your changes have been saved.",
    });
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      // Determine which model was used for this post (default to revo-1.0 if not specified)
      const modelUsed = (post.aiModel?.includes('revo-2.0') || post.id?.includes('revo-2.0'))
        ? 'revo-2.0'
        : (post.aiModel?.includes('revo-1.5') || post.id?.includes('revo-1.5'))
        ? 'revo-1.5'
        : 'revo-1.0';

      // Deduct credits before regeneration
      const creditResult = await useCreditsForModel(modelUsed, 'image_generation', 'regeneration');
      if (!creditResult.success) {
        toast({
          variant: "destructive",
          title: "Insufficient Credits",
          description: creditResult.error || `You need ${modelUsed === 'revo-1.0' ? '3' : modelUsed === 'revo-1.5' ? '4' : '5'} credits to regenerate with ${modelUsed}. Please purchase more credits.`,
          duration: 6000,
        });
        return;
      }

      const platform = safeVariants[0].platform;
      // TODO: Pass useLocalLanguage parameter from parent component
      // Currently defaults to false - regenerated posts will be in English only
      const newPost = await generateContentAction(brandProfile, platform);
      onPostUpdated({ ...newPost, id: post.id }); // Keep old id for replacement
      toast({
        title: "Post Regenerated!",
        description: "A new version of your post has been generated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Regeneration Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!post.catchyWords) {
      toast({
        variant: "destructive",
        title: "Cannot Generate Video",
        description: "The post is missing the required catchy words.",
      });
      return;
    }
    setIsGeneratingVideo(true);
    try {
      const result = await generateVideoContentAction(brandProfile, post.catchyWords, post.content);
      const newVideoUrl = result.videoUrl;
      setVideoUrl(newVideoUrl);
      await onPostUpdated({ ...post, videoUrl: newVideoUrl });
      setShowVideoDialog(true);
      toast({
        title: "Video Generated!",
        description: "Your video is ready to be viewed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Video Generation Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const activeVariant = safeVariants.find(v => v.platform === activeTab) || safeVariants[0];

  return (
    <>
      <Card className="flex flex-col w-full relative">
        <CardHeader className="flex-row items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            {/* Performance Prediction Badge */}
            <PerformanceBadgeCompact
              prediction={performancePrediction}
              loading={isPredictionLoading}
            />
          </div>
          <div className="relative" ref={dropdownRef}>
            <button 
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {dropdownOpen && (
              <div 
                className="absolute right-0 top-8 z-50 min-w-[200px] rounded-md border bg-white p-1 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100"
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsEditing(true);
                  }}
                >
                  <Pen className="h-4 w-4" />
                  Edit Text
                </button>
                <button 
                  className="flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100"
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowImageEditor(true);
                  }}
                >
                  <Palette className="h-4 w-4" />
                  Edit Image
                </button>
                <button 
                  className={`flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 ${isRegenerating ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => {
                    if (!isRegenerating) {
                      setDropdownOpen(false);
                      handleRegenerate();
                    }
                  }}
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Regenerate Image
                </button>
                <div className="flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm opacity-50 pointer-events-none">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  Generate Video (Coming Soon)
                </div>
                <button 
                  className="flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100"
                  onClick={() => {
                    setDropdownOpen(false);
                    handleDownload();
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download Image
                </button>
                {/* <button 
                  className="flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100"
                  onClick={() => {
                    setDropdownOpen(false);
                    handleOpenPostingDialog();
                  }}
                >
                  <Send className="h-4 w-4" />
                  Post to Social Media
                </button> */}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 p-4 pt-0">
          {isRevo2Post ? (
            // Revo 2.0 single-platform layout with platform icon at top left
            <div className="space-y-4">
              {/* Platform Icon Header - Left aligned */}
              <div className="flex items-center justify-start p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  {platformIcons[safeVariants[0]?.platform || 'instagram']}
                </div>
              </div>

              {/* Single Image Display - Platform-specific dimensions */}
              {(() => {
                const variant = safeVariants[0];
                const dimensions = getPlatformDimensions(variant?.platform || 'instagram');

                return (
                  <div className={`relative ${dimensions.aspectClass} w-full overflow-hidden`}>
                    {(isRegenerating || isGeneratingVideo) && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="sr-only">{isRegenerating ? 'Regenerating image...' : 'Generating video...'}</span>
                      </div>
                    )}
                    <div ref={el => { downloadRefs.current[variant?.platform || 'instagram'] = el; }} className={`relative ${dimensions.aspectClass} w-full overflow-hidden rounded-md border group`}>
                      {variant?.imageUrl && isValidUrl(variant.imageUrl) ? (
                        <div
                          className="relative h-full w-full cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImagePreview(variant.imageUrl);
                          }}
                        >
                          <Image
                            alt={`Generated post image for ${variant.platform}`}
                            className={cn('h-full w-full object-cover transition-opacity', (isRegenerating || isGeneratingVideo) ? 'opacity-50' : 'opacity-100')}
                            height={dimensions.height}
                            src={variant.imageUrl}
                            data-ai-hint="social media post"
                            width={dimensions.width}
                            crossOrigin="anonymous"
                            unoptimized={variant.imageUrl.startsWith('data:')} // Don't optimize data URLs
                          />
                          {/* Preview overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-white/90 rounded-full p-2">
                              <Eye className="h-5 w-5 text-gray-700" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted flex-col gap-2">
                          <ImageOff className="h-12 w-12 text-muted-foreground" />
                          {variant?.imageUrl && !isValidUrl(variant.imageUrl) && (
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="text-xs text-red-500 bg-white/90 p-2 rounded">
                                {(typeof variant.imageUrl === 'string' && variant.imageUrl.includes('[') && variant.imageUrl.includes(']')) ? (
                                  <div>
                                    <p className="font-medium">Image temporarily unavailable</p>
                                    <p className="text-gray-600 mt-1">
                                      {(typeof variant.imageUrl === 'string' && variant.imageUrl.includes('Large image data removed'))
                                        ? 'Image was too large for storage. Try regenerating.'
                                        : 'Image data was optimized for storage.'
                                      }
                                    </p>
                                  </div>
                                ) : (
                                  <p>Invalid image URL</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            // Multi-platform tab layout for Revo 1.0/1.5
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Platform)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {safeVariants.map(variant => (
                  <TabsTrigger key={variant.platform} value={variant.platform}>
                    {platformIcons[variant.platform]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {safeVariants.map(variant => {
                const dimensions = getPlatformDimensions(variant.platform);
                return (
                  <TabsContent key={variant.platform} value={variant.platform}>
                    <div className={`relative ${dimensions.aspectClass} w-full overflow-hidden`}>
                      {(isRegenerating || isGeneratingVideo) && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="sr-only">{isRegenerating ? 'Regenerating image...' : 'Generating video...'}</span>
                        </div>
                      )}
                      <div ref={el => { downloadRefs.current[variant.platform] = el; }} className={`relative ${dimensions.aspectClass} w-full overflow-hidden rounded-md border group`}>
                        {variant.imageUrl && isValidUrl(variant.imageUrl) ? (
                          <div
                            className="relative h-full w-full cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImagePreview(variant.imageUrl);
                            }}
                          >
                            <Image
                              alt={`Generated post image for ${variant.platform}`}
                              className={cn('h-full w-full object-cover transition-opacity', (isRegenerating || isGeneratingVideo) ? 'opacity-50' : 'opacity-100')}
                              height={dimensions.height}
                              src={variant.imageUrl}
                              data-ai-hint="social media post"
                              width={dimensions.width}
                              crossOrigin="anonymous"
                              unoptimized={variant.imageUrl.startsWith('data:')} // Don't optimize data URLs
                            />
                            {/* Preview overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="bg-white/90 rounded-full p-2">
                                <Eye className="h-5 w-5 text-gray-700" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <ImageOff className="h-12 w-12 text-muted-foreground" />
                            {variant.imageUrl && !isValidUrl(variant.imageUrl) && (
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-xs text-red-500 bg-white/90 p-1 rounded">
                                  Invalid image URL
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-foreground line-clamp-4 flex-1">
                {typeof post.content === 'string'
                  ? post.content
                  : (post.content as any)?.text || 'No content available'
                }
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCaption}
                className="h-8 w-8 p-0 flex-shrink-0"
                title="Copy caption"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1 flex-1">
              {(() => {
                // Handle hashtags from different sources and formats
                let hashtags = post.hashtags;

                // If no direct hashtags, check content.hashtags (database format)
                if (!hashtags && typeof post.content === 'object' && (post.content as any)?.hashtags) {
                  hashtags = (post.content as any).hashtags;
                }

                if (hashtags) {
                  // Handle both string and array formats for hashtags
                  const hashtagsArray = typeof hashtags === 'string'
                    ? hashtags.split(" ")
                    : Array.isArray(hashtags)
                      ? hashtags
                      : [];

                  return hashtagsArray.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="font-normal">
                      {tag}
                    </Badge>
                  ));
                }

                return null;
              })()}
              {(() => {
                // Check if we have any hashtags to display
                const hasHashtags = post.hashtags ||
                  (typeof post.content === 'object' && (post.content as any)?.hashtags);

                if (!hasHashtags) {
                  return (
                    <Badge variant="secondary" className="font-normal">
                      #enhanced #ai #design
                    </Badge>
                  );
                }

                return null;
              })()}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyHashtags}
              className="h-8 w-8 p-0 flex-shrink-0"
              title="Copy hashtags"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Edit Post Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post content and hashtags below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="h-32"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <Input
                id="hashtags"
                value={editedHashtags}
                onChange={(e) => setEditedHashtags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Editor Dialog */}
      <Dialog open={showImageEditor} onOpenChange={setShowImageEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogDescription>
              Use AI to edit and enhance your image with text prompts
            </DialogDescription>
          </DialogHeader>
          {showImageEditor && activeVariant?.imageUrl && (
            <ImageEditor
              imageUrl={activeVariant.imageUrl}
              onClose={() => setShowImageEditor(false)}
              brandProfile={brandProfile}
              onImageUpdated={(newImageUrl) => {
                // Update the post with the new image URL
                const updatedPost = {
                  ...post,
                  imageUrl: newImageUrl,
                  status: 'edited' as const
                };
                
                // If it's a multi-variant post, update the active variant
                if (post.variants && post.variants.length > 0) {
                  updatedPost.variants = post.variants.map(variant => 
                    variant.platform === activeTab 
                      ? { ...variant, imageUrl: newImageUrl }
                      : variant
                  );
                }
                
                onPostUpdated(updatedPost);
                setShowImageEditor(false);
                
                toast({
                  title: "Image Updated!",
                  description: "Your image has been successfully edited.",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generated Video</DialogTitle>
            <DialogDescription>
              Here is the video generated for your post. You can download it from here.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            {videoUrl ? (
              <video controls autoPlay src={videoUrl} className="w-full rounded-md" />
            ) : (
              <p>No video available.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVideoDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-2">
          <DialogHeader className="pb-2">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>
              Click and drag to pan, scroll to zoom
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[70vh] overflow-hidden">
            {previewImageUrl && (
              <img
                src={previewImageUrl}
                alt="Post image preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImagePreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Posting Dialog */}
      <Dialog open={showPostingDialog} onOpenChange={setShowPostingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post to Social Media</DialogTitle>
            <DialogDescription>
              Choose platforms and posting mode for your content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Select Platforms</Label>
              <div className="grid grid-cols-2 gap-2">
                {['twitter', 'facebook', 'instagram', 'linkedin'].map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={platform}
                      checked={selectedPlatforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, platform]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={platform} className="capitalize flex items-center gap-2">
                      {platformIcons[platform as Platform]}
                      {platform}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Posting Mode */}
            <div className="space-y-2">
              <Label>Posting Mode</Label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="manual"
                    name="mode"
                    checked={postingMode === 'manual'}
                    onChange={() => setPostingMode('manual')}
                  />
                  <Label htmlFor="manual" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Post Now
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="schedule"
                    name="mode"
                    checked={postingMode === 'schedule'}
                    onChange={() => setPostingMode('schedule')}
                  />
                  <Label htmlFor="schedule" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Schedule
                  </Label>
                </div>
              </div>
            </div>

            {/* Schedule Time */}
            {postingMode === 'schedule' && (
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Schedule Time</Label>
                <Input
                  id="scheduledTime"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}

            {/* Posting Status */}
            {Object.keys(postingStatus).length > 0 && (
              <div className="space-y-2">
                <Label>Posting Status</Label>
                <div className="space-y-1">
                  {Object.entries(postingStatus).map(([platform, status]) => (
                    <div key={platform} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{platform}</span>
                      <div className="flex items-center gap-1">
                        {status === 'posting' && <Loader2 className="h-3 w-3 animate-spin" />}
                        {status === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                        {status === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
                        <span className="capitalize text-muted-foreground">{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostingDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePostToMultiple} 
              disabled={isPosting || selectedPlatforms.length === 0}
            >
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  {postingMode === 'manual' ? 'Post Now' : 'Schedule Post'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}