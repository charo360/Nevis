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
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { User, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { UnifiedBrandLayout, BrandContent, BrandSwitchingStatus } from "@/components/layout/unified-brand-layout";
import { STORAGE_FEATURES, getStorageUsage, cleanupAllStorage } from "@/lib/services/brand-scoped-storage";
import { processGeneratedPost } from "@/lib/services/generated-post-storage";
import { useAuth } from '@/hooks/use-auth-supabase';
import { useQuickContentStorage } from "@/hooks/use-feature-storage";
// Using Supabase storage for images and content

// No limit on posts - store all generated content
const MAX_POSTS_TO_STORE = 100; // Increased from 5 to 100 posts

// Brand-scoped storage cleanup utility
const cleanupBrandScopedStorage = (brandStorage: any) => {
  try {
    const posts = brandStorage.getItem() || [];

    // Fix invalid dates and ensure unique IDs in existing posts
    const usedIds = new Set<string>();
    const fixedPosts = posts.map((post: GeneratedPost, index: number) => {
      let fixedPost = { ...post };

      // Fix invalid dates
      if (!post.date || isNaN(new Date(post.date).getTime())) {
        fixedPost.date = new Date().toISOString();
      }

      // Ensure unique ID
      if (!post.id || usedIds.has(post.id)) {
        fixedPost.id = `post-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('🔧 Fixed duplicate/missing ID for post:', fixedPost.id);
      } else {
        usedIds.add(post.id);
      }

      return fixedPost;
    });

    // REMOVED THE 5-POST LIMIT - Now stores up to 100 posts
    if (fixedPosts.length > MAX_POSTS_TO_STORE) {
      // Keep only the most recent posts (up to MAX_POSTS_TO_STORE)
      const recentPosts = fixedPosts
        .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
        .slice(0, MAX_POSTS_TO_STORE);
      brandStorage.setItem(recentPosts);
      return recentPosts;
    } else {
      // Save all fixed posts back
      brandStorage.setItem(fixedPosts);
      return fixedPosts;
    }
  } catch (error) {
    console.error('❌ Error in cleanupBrandScopedStorage:', error);
  }
  return null;
};

function QuickContentPage() {
  const { currentBrand, brands, loading: brandsLoading, refreshBrands, selectBrand } = useUnifiedBrand();
  const searchParams = useSearchParams();

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
  const [urlBrandSwitchPending, setUrlBrandSwitchPending] = useState(false);
  const [calendarServices, setCalendarServices] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const { open: sidebarOpen, toggleSidebar } = useSidebar();
  const { user, getAccessToken } = useAuth();

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

    const token = await getAccessToken();
    if (!token) {
      console.error('❌ No auth token found');
      throw new Error('No auth token');
    }

    const response = await fetch('/api/generated-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        post: mongoPost,
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

  // Handle URL parameters for brand switching from calendar - HIGH PRIORITY
  React.useEffect(() => {
    const brandId = searchParams.get('brandId');
    const brandName = searchParams.get('brandName');
    const services = searchParams.get('services');
    const serviceNames = searchParams.get('serviceNames');
    
    console.log('🔍 URL Parameters:', { brandId, brandName, services, serviceNames });
    console.log('🔍 Current Brand:', currentBrand?.id, currentBrand?.businessName);
    console.log('🔍 Available Brands:', brands.map(b => ({ id: b.id, name: b.businessName })));
    console.log('🔍 Full URL:', window.location.href);
    console.log('🔍 Search Params:', Object.fromEntries(searchParams.entries()));
    
    // Extract calendar services from URL parameters
    if (serviceNames) {
      const servicesArray = serviceNames.split(',').filter(s => s.trim());
      setCalendarServices(servicesArray);
      console.log('📋 Calendar services extracted from serviceNames:', servicesArray);
    } else if (services) {
      const servicesArray = services.split(',').filter(s => s.trim());
      setCalendarServices(servicesArray);
      console.log('📋 Calendar services extracted from services:', servicesArray);
    } else {
      setCalendarServices([]);
      console.log('📋 No calendar services found in URL parameters');
    }
    
    if (brandId && brands.length > 0) {
      // Find the brand by ID
      const targetBrand = brands.find(brand => brand.id === brandId);
      console.log('🔍 Target Brand Found:', targetBrand ? { id: targetBrand.id, name: targetBrand.businessName } : 'NOT FOUND');
      
      if (targetBrand) {
        // Always switch if we have a target brand from URL, regardless of current brand
        console.log('🔄 Switching to brand from calendar:', brandName, brandId);
        setUrlBrandSwitchPending(true);
        // Use setTimeout to ensure this happens after other effects
        setTimeout(() => {
          selectBrand(targetBrand);
          setUrlBrandSwitchPending(false);
        }, 100);
      } else {
        console.log('❌ Brand not found in available brands:', brandId);
      }
    }
  }, [searchParams, brands, selectBrand]); // Removed currentBrand?.id to prevent race conditions

  // Clear calendar services when brand changes (unless coming from calendar)
  React.useEffect(() => {
    if (currentBrand && !urlBrandSwitchPending) {
      setCalendarServices([]);
    }
  }, [currentBrand?.id, urlBrandSwitchPending]);

  // Load posts when brand changes
  React.useEffect(() => {
    const brand = currentBrand;
    const brandName = brand?.businessName || brand?.name || 'none';

    // Skip if we have a URL-based brand switch pending
    if (urlBrandSwitchPending) {
      console.log('⏳ Skipping brand change effect - URL switch pending');
      return;
    }

    if (!brand) {
      setGeneratedPosts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Load posts from database first, then fallback to localStorage
    const loadPosts = async () => {
      try {
        // Load from both database AND localStorage, then combine them
        let databasePosts: GeneratedPost[] = [];
        let localStoragePosts: GeneratedPost[] = [];

        // Try to load from database first
        if (user?.userId && brand.id) {
          console.log('🔄 Loading posts from database for brand:', brand.businessName);
          try {
            const token = await getAccessToken();
            if (!token) {
              console.log('⚠️ No auth token found');
              return;
            }

            const response = await fetch(`/api/generated-posts/brand/${brand.id}?limit=50`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (response.ok) {
              databasePosts = await response.json();
              console.log('✅ Loaded', databasePosts.length, 'posts from database');
            } else {
              console.log('⚠️ Database load failed, status:', response.status);
            }
          } catch (dbError) {
            console.log('⚠️ Database load error:', dbError);
          }
        }

        // Also load from localStorage
        if (postsStorage) {
          console.log('🔄 Loading posts from localStorage');
          const storedPosts = postsStorage.getItem() || [];

          // Filter out invalid posts
          const validPosts = storedPosts.filter((post: GeneratedPost) =>
            post.date && !isNaN(new Date(post.date).getTime())
          );

          localStoragePosts = validPosts;
          console.log('✅ Loaded', localStoragePosts.length, 'posts from localStorage');
        }

        // Combine database and localStorage posts, removing duplicates
        const combinedPosts = [...databasePosts];

        // Add localStorage posts that aren't already in database posts
        localStoragePosts.forEach(localPost => {
          const existsInDatabase = databasePosts.some(dbPost =>
            dbPost.id === localPost.id ||
            (dbPost.content?.text === localPost.content?.text &&
              Math.abs(new Date(dbPost.createdAt || dbPost.date).getTime() - new Date(localPost.date).getTime()) < 5000)
          );

          if (!existsInDatabase) {
            combinedPosts.push(localPost);
          }
        });

        // Sort by date (newest first)
        combinedPosts.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date).getTime();
          const dateB = new Date(b.createdAt || b.date).getTime();
          return dateB - dateA;
        });

        console.log(`✅ Combined posts: ${databasePosts.length} from database + ${localStoragePosts.length} from localStorage = ${combinedPosts.length} total`);

        setGeneratedPosts(combinedPosts);
        
        // Persist combined posts locally for resilience across refresh
        try {
          postsStorage?.setItem(combinedPosts);
        } catch (e) {
          console.warn('⚠️ Failed to persist combined posts:', e);
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
  }, [currentBrand, postsStorage, toast, user, urlBrandSwitchPending]);

  // Enhanced brand selection logic with persistence recovery
  useEffect(() => {
    // Only proceed if brands have finished loading
    if (!brandsLoading) {
      // Add a longer delay to ensure brands have time to load properly
      const timer = setTimeout(() => {
        console.log('🔍 Quick Content Brand Check:', {
          brandsLength: brands.length,
          currentBrand: currentBrand?.businessName || 'none',
          brandsLoading
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
  }, [currentBrand, brands.length, brandsLoading, router, selectBrand, forceBrandRestore]);


  // Process generated post with Supabase-only storage (no fallbacks)
  const processPostImages = async (post: GeneratedPost): Promise<GeneratedPost> => {
    try {
      // Check if user is authenticated
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save content and images.",
          variant: "destructive",
        });
        return post; // Return original post with data URLs
      }

      console.log('🔄 Processing post with Supabase-only storage...');

      // Use the API route to handle all image processing and storage
      // This ensures consistency with the working TWITTER branch implementation
      const token = await getAccessToken();
      if (!token) {
        console.error('❌ No auth token found');
        return post;
      }

      const response = await fetch('/api/generated-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          post: post,
          brandProfileId: currentBrand?.id || 'default'
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Post processed successfully via API route');

        // The API route has already uploaded images to Supabase and returned proper URLs
        const processedPost = result.post || post;

        toast({
          title: "Content Saved Successfully",
          description: "Content and images saved to Supabase storage!",
          variant: "default",
        });

        return processedPost;
      } else {
        throw new Error(result.error || 'API processing failed');
      }
    } catch (error) {
      console.error('❌ Post processing failed:', error);

      toast({
        title: "Save Failed",
        description: "Failed to save content. Please try again.",
        variant: "destructive",
      });

      return post; // Return original post on error
    }
  };

  const handlePostGenerated = async (post: GeneratedPost) => {
    console.log('🔄 Processing individual post with Supabase storage:', post.id || 'no-id');

    // Ensure the post has a unique ID
    if (!post.id) {
      post.id = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔧 Generated new ID for post:', post.id);
    }

    // Process images and save everything to Supabase via API route
    let processedPost = await processPostImages(post);

    // Ensure processed post has the same ID
    processedPost = processedPost || post;
    processedPost.id = post.id;

    // Add the processed post to the beginning of the array
    const newPosts = [processedPost, ...generatedPosts];
    setGeneratedPosts(newPosts);
    
    // Persist to brand-scoped Quick Content storage so posts survive refresh
    try {
      postsStorage?.setItem(newPosts);
    } catch (e) {
      console.warn('⚠️ Failed to persist posts to storage:', e);
    }

    // The processPostImages function now handles everything via the API route
    // No need for additional database saves or complex fallback logic
    console.log('✅ Post processing complete - everything handled by MongoDB API route');
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
          <div className="container mx-auto px-4 py-8 max-w-full">
            <div className="max-w-7xl mx-auto w-full">
              <div className="space-y-4 w-full">
                {currentBrand && (
                  <>
                    {calendarServices.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-900">
                              Using Calendar Services
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCalendarServices([])}
                            className="text-xs h-6"
                          >
                            Use Brand Services
                          </Button>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          Content will be generated for: {calendarServices.join(', ')}
                        </p>
                      </div>
                    )}
                    <ContentCalendar
                    brandProfile={{
                      businessName: currentBrand.businessName,
                      businessType: currentBrand.businessType || '',
                      location: typeof currentBrand.location === 'string'
                        ? currentBrand.location
                        : currentBrand.location
                          ? `${currentBrand.location.city || ''}, ${currentBrand.location.country || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
                          : '',
                      logoUrl: currentBrand.logoUrl || '',
                      logoDataUrl: currentBrand.logoDataUrl || '',
                      visualStyle: currentBrand.visualStyle || '',
                      writingTone: currentBrand.writingTone || '',
                      contentThemes: currentBrand.contentThemes || '',
                      websiteUrl: currentBrand.websiteUrl || '',
                      description: currentBrand.description || '',
                      services: (() => {
                        const finalServices = calendarServices.length > 0 
                          ? calendarServices.join('\n')
                          : Array.isArray((currentBrand as any).services)
                            ? (currentBrand as any).services.map((s: any) => s.name).join('\n')
                            : (currentBrand as any).services || '';
                        console.log('🔍 Services being passed to AI:', {
                          calendarServices,
                          calendarServicesLength: calendarServices.length,
                          currentBrandServices: (currentBrand as any).services,
                          finalServices
                        });
                        return finalServices;
                      })(),
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </SidebarInset>
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
