// src/app/content-calendar/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContentCalendar } from "@/components/dashboard/content-calendar";
// TODO: Re-enable once ActiveArtifactsIndicator is properly set up
// import { ActiveArtifactsIndicator } from "@/components/artifacts/active-artifacts-indicator";
import type { BrandProfile, GeneratedPost } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { User, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useBrand } from "@/contexts/brand-context-mongo";
import { UnifiedBrandLayout, BrandContent, BrandSwitchingStatus } from "@/components/layout/unified-brand-layout";
import { STORAGE_FEATURES, getStorageUsage, cleanupAllStorage } from "@/lib/services/brand-scoped-storage";
import { processGeneratedPost } from "@/lib/services/generated-post-storage";
import { useAuth } from "@/hooks/use-auth";
import { useGeneratedPosts } from "@/hooks/use-generated-posts";
import { useQuickContentStorage } from "@/hooks/use-feature-storage";
// Firebase Storage utilities removed - using MongoDB GridFS

// No limit on posts - store all generated content

// Brand-scoped storage cleanup utility
const cleanupBrandScopedStorage = (brandStorage: any) => {
  try {
    const posts = brandStorage.getItem() || [];

    // Fix invalid dates in existing posts
    const fixedPosts = posts.map((post: GeneratedPost) => {
      if (!post.date || isNaN(new Date(post.date).getTime())) {
        return {
          ...post,
          date: new Date().toISOString()
        };
      }
      return post;
    });

    if (fixedPosts.length > 5) {
      // Keep only the 5 most recent posts
      const recentPosts = fixedPosts.slice(0, 5);
      brandStorage.setItem(recentPosts);
      return recentPosts;
    } else {
      // Save the fixed posts back
      brandStorage.setItem(fixedPosts);
      return fixedPosts;
    }
  } catch (error) {
  }
  return null;
};

function QuickContentPage() {
  const { currentBrand, brands, loading: brandLoading, selectBrand } = useBrand();

  // Use isolated Quick Content storage (completely separate from Creative Studio)
  const quickContentStorage = useQuickContentStorage();

  // Legacy storage wrapper for backward compatibility - using direct functions to avoid dependency issues
  const postsStorage = React.useMemo(() => {
    return {
      getItem: quickContentStorage.loadPosts,
      setItem: quickContentStorage.savePosts,
    };
  }, [quickContentStorage.loadPosts, quickContentStorage.savePosts]);

  // ✅ Quick Content now uses completely isolated storage
  // This will never conflict with Creative Studio data
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { open: sidebarOpen, toggleSidebar } = useSidebar();
  const { user } = useAuth();

  // Custom save function that uses the current brand from MongoDB context
  const savePostToDatabase = async (post: GeneratedPost) => {
    if (!user?.userId || !currentBrand?.id) {
      throw new Error('User must be authenticated and have a brand selected to save posts');
    }

    // Convert the post format to match MongoDB service expectations
    const mongoPost = {
      // Don't include id field - let MongoDB generate it
      userId: user.userId,
      brandProfileId: currentBrand.id,
      platform: post.platform || 'instagram',
      postType: post.postType || 'post',
      content: {
        text: post.content || '',
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [post.hashtags].filter(Boolean),
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
      },
      // Include variants for platform-specific images
      variants: post.variants || [],
      // Include other post fields
      imageUrl: post.imageUrl,
      catchyWords: post.catchyWords,
      subheadline: post.subheadline,
      callToAction: post.callToAction,
      metadata: {
        businessType: currentBrand.businessType,
        visualStyle: currentBrand.brandColors?.primary,
        targetAudience: currentBrand.targetAudience,
        generationPrompt: `Generated for ${currentBrand.businessName}`,
        aiModel: 'revo-2.0',
      },
      status: post.status || 'generated',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const response = await fetch('/api/generated-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post: mongoPost,
        userId: user.userId,
        brandProfileId: currentBrand.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to save post`);
    }

    const result = await response.json();
    return result.id;
  };

  // Inline brand restoration function
  const forceBrandRestore = React.useCallback(() => {
    try {
      // Try to restore from full brand data first
      const savedBrandData = localStorage.getItem('currentBrandData');
      if (savedBrandData) {
        const parsedData = JSON.parse(savedBrandData);

        // Find matching brand in current brands list
        const matchingBrand = brands.find(b => b.id === parsedData.id);
        if (matchingBrand) {
          selectBrand(matchingBrand);
          return true;
        }
      }

      // Fallback to brand ID restoration
      const savedBrandId = localStorage.getItem('selectedBrandId');
      if (savedBrandId && brands.length > 0) {
        const savedBrand = brands.find(b => b.id === savedBrandId);
        if (savedBrand) {
          selectBrand(savedBrand);
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }, [brands, selectBrand]);

  // Load posts when brand changes
  React.useEffect(() => {
    const brand = currentBrand;
    const brandName = brand?.businessName || brand?.name || 'none';

    if (!brand) {
      setGeneratedPosts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Load posts from database first, then fallback to localStorage
    const loadPosts = async () => {
      try {
        // Try to load from database first
        if (user?.userId && brand.id) {
          console.log('🔄 Loading posts from database for brand:', brand.businessName);
          const response = await fetch(`/api/generated-posts/brand/${brand.id}?userId=${user.userId}&limit=50`);

          if (response.ok) {
            const databasePosts = await response.json();
            console.log('✅ Loaded', databasePosts.length, 'posts from database');

            if (databasePosts.length > 0) {
              setGeneratedPosts(databasePosts);
              setIsLoading(false);
              return;
            }
          } else {
            console.log('⚠️ Database load failed, trying localStorage fallback');
          }
        }

        // Fallback to localStorage if database fails or no posts found
        if (postsStorage) {
          console.log('🔄 Loading posts from localStorage fallback');
          const posts = postsStorage.getItem() || [];

          // Check if any posts have invalid dates
          const hasInvalidDates = posts.some((post: GeneratedPost) =>
            !post.date || isNaN(new Date(post.date).getTime())
          );

          if (hasInvalidDates) {
            // Clear invalid posts
            postsStorage.setItem([]);
            setGeneratedPosts([]);
          } else {
            // Limit posts to prevent future storage issues
            const limitedPosts = posts.slice(0, 5);
            if (limitedPosts.length < posts.length) {
              postsStorage.setItem(limitedPosts);
            }
            setGeneratedPosts(limitedPosts);
          }

        } else {
          setGeneratedPosts([]);
        }
      } catch (error) {
        console.error('❌ Failed to load posts:', error);
        // If loading fails due to storage issues, clear and start fresh
        if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
          try {
            localStorage.clear();
            setGeneratedPosts([]);
            toast({
              title: "Storage Reset",
              description: "Storage was full and has been cleared. You can now generate new content.",
              variant: "default",
            });
          } catch (clearError) {
            console.error('Failed to clear storage:', clearError);
          }
        } else {
          toast({
            variant: "destructive",
            title: "Failed to load data",
            description: "Could not load your posts. Please try refreshing the page.",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Call the async function
    loadPosts();
  }, [currentBrand, postsStorage, toast, user]);

  // Enhanced brand selection logic with persistence recovery
  useEffect(() => {
    // Only proceed if brands have finished loading
    if (!brandLoading) {
      // Add a longer delay to ensure brands have time to load properly
      const timer = setTimeout(() => {
        console.log('🔍 Quick Content Brand Check:', {
          brandsLength: brands.length,
          currentBrand: currentBrand?.businessName || 'none',
          brandLoading
        });

        if (brands.length === 0) {
          // Double-check that we're really done loading before redirecting
          console.log('⚠️ No brands found, redirecting to brand profile setup');
          try { router.prefetch('/brand-profile'); } catch { }
          router.push('/brand-profile');
        } else if (brands.length > 0 && !currentBrand) {
          console.log('🔄 Brands exist but no current brand selected, attempting restore');
          // Try to restore from persistence first
          const restored = forceBrandRestore();

          if (!restored) {
            console.log('✅ Auto-selecting first brand:', brands[0].businessName);
            // If restoration failed, auto-select the first brand
            selectBrand(brands[0]);
          }
        } else if (currentBrand) {
          console.log('✅ Current brand already selected:', currentBrand.businessName);
        }
      }, 2000); // Increased to 2 seconds to allow more time for loading

      return () => clearTimeout(timer);
    }
  }, [currentBrand, brands.length, brandLoading, router, selectBrand, forceBrandRestore]);


  // Process generated post with Firebase Storage upload and database fallback
  const processPostImages = async (post: GeneratedPost): Promise<GeneratedPost> => {
    try {
      // Check if user is authenticated for Firebase Storage
      if (!user) {
        toast({
          title: "Content Saved",
          description: "Content saved to database. Sign in to save images permanently in the cloud.",
          variant: "default",
        });
        return post; // Return original post with data URLs
      }


      // TEMPORARY: Skip Firebase Storage upload until rules are deployed

      // Save to database with data URLs (temporary solution)
      toast({
        title: "Content Saved to Database",
        description: "Content saved successfully. Deploy Firebase Storage rules for permanent image URLs.",
        variant: "default",
      });

      return post; // Return original post with data URLs

      /* UNCOMMENT THIS AFTER DEPLOYING FIREBASE STORAGE RULES:
      try {
        // Try Firebase Storage first
        const processedPost = await processGeneratedPost(post, user.uid);
  
  
        // Show success message
        toast({
          title: "Images Saved to Cloud",
          description: "Images have been permanently saved to Firebase Storage.",
          variant: "default",
        });
  
        return processedPost;
      } catch (storageError) {
  
        // Fallback: Save to database with data URLs (temporary)
        toast({
          title: "Content Saved to Database",
          description: "Images stored temporarily. Please update Firebase Storage rules for permanent cloud storage.",
          variant: "default",
        });
  
        return post; // Return original post with data URLs
      }
      */
    } catch (error) {
      toast({
        title: "Content Saved Locally",
        description: "Content generated successfully but stored locally only.",
        variant: "default",
      });
      return post; // Return original post if all processing fails
    }
  };

  const handlePostGenerated = async (post: GeneratedPost) => {

    // Process images with Firebase Storage upload
    let processedPost = await processPostImages(post);

    // Add the processed post to the beginning of the array (no limit)
    const newPosts = [processedPost, ...generatedPosts];
    setGeneratedPosts(newPosts);

    if (!postsStorage) {
      toast({
        title: "Storage Unavailable",
        description: "Post generated but couldn't be saved. Please select a brand.",
        variant: "destructive",
      });
      return;
    }

    let databaseSaveSuccess = false;
    let databasePostId = processedPost.id; // Use existing ID if post was already saved

    // Check if post already has an ID (meaning it was already saved to database)
    const postAlreadySaved = !!(processedPost.id && processedPost.id !== 'temp-id');

    if (postAlreadySaved) {
      console.log('✅ Post already saved to database with ID:', processedPost.id);
      databaseSaveSuccess = true;
      databasePostId = processedPost.id;
    } else {
      // Only save to database if post doesn't have an ID yet
      if (user && currentBrand) {
        try {
          console.log('🔄 Saving post to database...', {
            userId: user.userId,
            brandId: currentBrand.id,
            brandName: currentBrand.businessName,
            postContent: (() => {
              if (!processedPost.content) return 'No content';
              if (typeof processedPost.content === 'string') {
                return processedPost.content.substring(0, 50) + '...';
              }
              // Handle object content (database format)
              const contentText = (processedPost.content as any)?.text || '';
              return typeof contentText === 'string' ? contentText.substring(0, 50) + '...' : 'No content';
            })()
          });

          databasePostId = await savePostToDatabase(processedPost);
          console.log('✅ Post saved to database with ID:', databasePostId);
          databaseSaveSuccess = true;

          // Update the post with the database ID
          const savedPost = { ...processedPost, id: databasePostId };
          const updatedPosts = [savedPost, ...generatedPosts];
          setGeneratedPosts(updatedPosts);

        } catch (databaseError) {
          console.error('❌ Database save error:', databaseError);
          databaseSaveSuccess = false;
        }
      }
    }

    // Try to save to localStorage (secondary)
    let localStorageSuccess = false;
    try {
      const postsToSave = databasePostId
        ? [{ ...processedPost, id: databasePostId }, ...generatedPosts]
        : newPosts;
      postsStorage.setItem(postsToSave);
      localStorageSuccess = true;
    } catch (storageError) {
      console.log('⚠️ localStorage save failed:', storageError.message);
      localStorageSuccess = false;
    }

    // Show appropriate success/error message based on what succeeded
    if (databaseSaveSuccess && localStorageSuccess) {
      toast({
        title: "Content Saved Successfully",
        description: `Your content has been saved to both database and local storage. Post ID: ${databasePostId}`,
        variant: "default",
      });
    } else if (databaseSaveSuccess && !localStorageSuccess) {
      toast({
        title: "Content Saved to Database",
        description: `Your content has been saved to the database permanently. Post ID: ${databasePostId}. Local storage is full.`,
        variant: "default",
      });
    } else if (!databaseSaveSuccess && localStorageSuccess) {
      toast({
        title: "Content Saved Locally",
        description: !user ? "Sign in to save to database permanently." : "Database save failed, but content is saved locally.",
        variant: "default",
      });
    } else {
      // Both failed
      toast({
        title: "Save Failed",
        description: "Could not save to database or local storage. Content is only in memory.",
        variant: "destructive",
      });
    }
  };

  // Debug function to clear all posts for current brand
  const clearAllPosts = () => {
    if (!postsStorage) {
      return;
    }

    try {
      postsStorage.removeItem();
      setGeneratedPosts([]);
      toast({
        title: "Posts Cleared",
        description: `All stored posts have been cleared for ${currentBrand?.businessName || currentBrand?.name}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Clear Failed",
        description: "Could not clear stored posts.",
      });
    }
  };

  // Comprehensive storage cleanup function
  const clearAllStorage = () => {
    try {
      // Clear all localStorage
      localStorage.clear();

      // Reset posts state
      setGeneratedPosts([]);

      toast({
        title: "Storage Cleared",
        description: "All browser storage has been cleared. You can now generate new content without storage issues.",
        variant: "default",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Clear Failed",
        description: "Could not clear storage completely.",
      });
    }
  };

  const handlePostUpdated = async (updatedPost: GeneratedPost) => {
    if (!postsStorage) {
      return;
    }

    try {
      const updatedPosts = generatedPosts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
      );
      setGeneratedPosts(updatedPosts);

      // Check storage size before saving
      const postsData = JSON.stringify(updatedPosts);
      const maxSize = 5 * 1024 * 1024; // 5MB limit

      if (postsData.length > maxSize) {
        // If too large, keep fewer posts
        const reducedPosts = updatedPosts.slice(0, Math.max(1, Math.floor(MAX_POSTS_TO_STORE / 2)));
        postsStorage.setItem(reducedPosts);
        setGeneratedPosts(reducedPosts);

        toast({
          title: "Storage Optimized",
          description: "Reduced stored posts to prevent storage overflow. Some older posts were removed.",
        });
      } else {
        postsStorage.setItem(updatedPosts);
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update post",
        description: "Unable to save post updates. Your browser storage may be full.",
      });
    }
  };

  return (
    <SidebarInset key={currentBrand?.id || 'no-brand'} fullWidth>
      <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
            title={sidebarOpen ? "Hide sidebar for full-screen mode" : "Show sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            {sidebarOpen ? "Sidebar visible" : "Full-screen mode"}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (postsStorage) {
                  const cleaned = cleanupBrandScopedStorage(postsStorage);
                  if (cleaned) {
                    setGeneratedPosts(cleaned);
                    toast({
                      title: "Storage Cleaned",
                      description: `Removed older posts for ${currentBrand?.businessName || currentBrand?.name}.`,
                    });
                  } else {
                    toast({
                      title: "Storage Clean",
                      description: "Storage is already optimized.",
                    });
                  }
                } else {
                  toast({
                    variant: "destructive",
                    title: "No Brand Selected",
                    description: "Please select a brand first.",
                  });
                }
              }}
            >
              Clear Old Posts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              {isLoading || brandLoading ? (
                <div className="flex w-full min-h-[300px] items-center justify-center">
                  <div className="w-full max-w-3xl text-center">
                    <p>Loading Quick Content...</p>
                  </div>
                </div>
              ) : !currentBrand ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                  <h2 className="text-xl font-semibold">Select a Brand</h2>
                  <p className="text-muted-foreground text-center">
                    Please select a brand to start generating content.
                  </p>
                  {brands.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {brands.map((brand) => (
                        <Button
                          key={brand.id}
                          onClick={() => selectBrand(brand)}
                          variant="outline"
                        >
                          {brand.businessName || brand.name}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Button onMouseEnter={() => router.prefetch('/brand-profile')} onFocus={() => router.prefetch('/brand-profile')} onClick={() => router.push('/brand-profile')}>
                      Create Brand Profile
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* TODO: Re-enable Active Artifacts Indicator once component is set up */}
                  {/* <ActiveArtifactsIndicator
              onArtifactDeactivate={() => {
                // Refresh content when artifacts are deactivated
              }}
              onManageArtifacts={() => {
                // Navigate to artifacts page
                window.open('/artifacts', '_blank');
              }}
            /> */}

                  {/* Content Calendar */}
                  {/* Map unified CompleteBrandProfile to the simplified BrandProfile expected by ContentCalendar */}
                  {currentBrand && (
                    <ContentCalendar
                      brandProfile={{
                        businessName: currentBrand.businessName,
                        businessType: currentBrand.businessType || '',
                        location: typeof currentBrand.location === 'string'
                          ? currentBrand.location
                          : currentBrand.location
                            ? `${currentBrand.location.city || ''}, ${currentBrand.location.country || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
                            : '',
                        logoDataUrl: currentBrand.logoUrl || currentBrand.logoDataUrl || '',
                        visualStyle: currentBrand.visualStyle || '',
                        writingTone: currentBrand.writingTone || '',
                        contentThemes: currentBrand.contentThemes || '',
                        websiteUrl: currentBrand.websiteUrl || '',
                        description: currentBrand.description || '',
                        // Convert services array to newline-separated string to match BrandProfile.services
                        services: Array.isArray((currentBrand as any).services)
                          ? (currentBrand as any).services.map((s: any) => s.name).join('\n')
                          : (currentBrand as any).services || '',
                        targetAudience: currentBrand.targetAudience || '',
                        keyFeatures: currentBrand.keyFeatures || '',
                        competitiveAdvantages: currentBrand.competitiveAdvantages || '',
                        contactInfo: {
                          phone: currentBrand.contactPhone || '',
                          email: currentBrand.contactEmail || '',
                          address: currentBrand.contactAddress || '',
                        },
                        socialMedia: {
                          facebook: currentBrand.facebookUrl || '',
                          instagram: currentBrand.instagramUrl || '',
                          twitter: currentBrand.twitterUrl || '',
                          linkedin: currentBrand.linkedinUrl || '',
                        },
                        primaryColor: currentBrand.primaryColor || undefined,
                        accentColor: currentBrand.accentColor || undefined,
                        backgroundColor: currentBrand.backgroundColor || undefined,
                        designExamples: currentBrand.designExamples || [],
                      }}
                      posts={generatedPosts}
                      onPostGenerated={handlePostGenerated}
                      onPostUpdated={handlePostUpdated}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </SidebarInset >
  );
}

function QuickContentPageWithUnifiedBrand() {
  return (
    <UnifiedBrandLayout>
      <QuickContentPage />
      <BrandSwitchingStatus />
    </UnifiedBrandLayout>
  );
}

export default QuickContentPageWithUnifiedBrand;
