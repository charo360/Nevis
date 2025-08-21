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
import { useUnifiedBrand, useBrandStorage, useBrandChangeListener } from "@/contexts/unified-brand-context";
import { UnifiedBrandLayout, BrandContent, BrandSwitchingStatus } from "@/components/layout/unified-brand-layout";
import { STORAGE_FEATURES, getStorageUsage, cleanupAllStorage } from "@/lib/services/brand-scoped-storage";

const MAX_POSTS_TO_STORE = 5; // Reduced to prevent storage issues

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
    console.warn('Brand-scoped storage cleanup failed:', error);
  }
  return null;
};

function QuickContentPage() {
  const { currentBrand, brands, loading: brandLoading, selectBrand } = useUnifiedBrand();
  const postsStorage = useBrandStorage(STORAGE_FEATURES.QUICK_CONTENT);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { open: sidebarOpen, toggleSidebar } = useSidebar();

  // Inline brand restoration function
  const forceBrandRestore = React.useCallback(() => {
    try {
      // Try to restore from full brand data first
      const savedBrandData = localStorage.getItem('currentBrandData');
      if (savedBrandData) {
        const parsedData = JSON.parse(savedBrandData);
        console.log('🔄 Attempting to restore brand from full data:', parsedData.businessName || parsedData.name);

        // Find matching brand in current brands list
        const matchingBrand = brands.find(b => b.id === parsedData.id);
        if (matchingBrand) {
          console.log('✅ Found matching brand in brands list, using fresh data');
          selectBrand(matchingBrand);
          return true;
        }
      }

      // Fallback to brand ID restoration
      const savedBrandId = localStorage.getItem('selectedBrandId');
      if (savedBrandId && brands.length > 0) {
        const savedBrand = brands.find(b => b.id === savedBrandId);
        if (savedBrand) {
          console.log('🔄 Restored brand from ID:', savedBrand.businessName || savedBrand.name);
          selectBrand(savedBrand);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to restore brand from storage:', error);
      return false;
    }
  }, [brands, selectBrand]);

  // Load posts when brand changes using unified brand system
  useBrandChangeListener(React.useCallback((brand) => {
    const brandName = brand?.businessName || brand?.name || 'none';
    console.log('🔄 Quick Content: brand changed to:', brandName);

    if (!brand) {
      setGeneratedPosts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      if (postsStorage) {
        const posts = postsStorage.getItem<GeneratedPost[]>() || [];

        // Check if any posts have invalid dates
        const hasInvalidDates = posts.some((post: GeneratedPost) =>
          !post.date || isNaN(new Date(post.date).getTime())
        );

        if (hasInvalidDates) {
          console.warn('Found posts with invalid dates, clearing brand storage...');
          postsStorage.removeItem();
          setGeneratedPosts([]);
        } else {
          setGeneratedPosts(posts);
        }

        console.log(`✅ Loaded ${posts.length} posts for brand ${brandName}`);
      } else {
        setGeneratedPosts([]);
      }
    } catch (error) {
      console.error('Failed to load posts for brand:', brandName, error);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: "Could not read your posts data. It might be corrupted.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [postsStorage, toast]));

  // Enhanced brand selection logic with persistence recovery
  useEffect(() => {
    console.log('🔍 Enhanced brand selection check:', {
      brandLoading,
      brandsCount: brands.length,
      currentBrand: currentBrand?.businessName || currentBrand?.name || 'null',
      postsStorageAvailable: !!postsStorage
    });

    if (!brandLoading) {
      // Add a small delay to ensure brands have time to load
      const timer = setTimeout(() => {
        if (brands.length === 0) {
          // No brands exist, redirect to brand setup
          console.log('🔄 Quick Content: No brands found, redirecting to brand setup');
          router.push('/brand-profile');
        } else if (brands.length > 0 && !currentBrand) {
          // Try to restore from persistence first
          console.log('🔧 Attempting brand restoration from persistence...');
          const restored = forceBrandRestore();

          if (!restored) {
            // If restoration failed, auto-select the first brand
            console.log('🎯 Auto-selecting first available brand:', brands[0].businessName || brands[0].name);
            selectBrand(brands[0]);
          }
        }
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [currentBrand, brands.length, brandLoading, router, selectBrand, forceBrandRestore]);


  // Inline image persistence function
  const persistImageUrl = async (url: string): Promise<string> => {
    try {
      // If it's already a data URL and not too large, keep it
      if (url.startsWith('data:')) {
        const sizeInBytes = Math.round((url.length * 3) / 4);
        if (sizeInBytes <= 500 * 1024) { // 500KB limit
          console.log('📸 Keeping small data URL as-is');
          return url;
        }
      }

      // If it's a blob URL or HTTP URL, try to fetch and convert
      if (url.startsWith('blob:') || url.startsWith('http')) {
        console.log('🔄 Converting URL to persistent data URL:', url.substring(0, 50) + '...');

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();

        // If blob is too large, skip persistence
        if (blob.size > 1024 * 1024) { // 1MB limit
          console.warn('⚠️ Image too large, keeping original URL');
          return url;
        }

        // Convert to data URL
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read blob'));
          reader.readAsDataURL(blob);
        });
      }

      // Return original URL if we can't process it
      return url;
    } catch (error) {
      console.warn('⚠️ Failed to persist image URL:', error);
      return url; // Return original URL on failure
    }
  };

  const handlePostGenerated = async (post: GeneratedPost) => {
    console.log('📝 Processing generated post...');

    // Simple approach: try to persist images but don't block if it fails
    let processedPost = { ...post };

    try {
      // Persist main image URL if exists
      if (post.imageUrl) {
        const persistedUrl = await persistImageUrl(post.imageUrl);
        processedPost.imageUrl = persistedUrl;
      }

      // Persist variant image URLs
      if (post.variants && post.variants.length > 0) {
        const persistedVariants = await Promise.all(
          post.variants.map(async (variant) => {
            if (variant.imageUrl) {
              const persistedUrl = await persistImageUrl(variant.imageUrl);
              return { ...variant, imageUrl: persistedUrl };
            }
            return variant;
          })
        );
        processedPost.variants = persistedVariants;
      }

      console.log('✅ Image persistence completed');
    } catch (error) {
      console.warn('⚠️ Image persistence failed, using original post:', error);
      processedPost = post; // Use original post if persistence fails
    }

    // Add the processed post and slice the array to only keep the most recent ones
    const newPosts = [processedPost, ...generatedPosts].slice(0, MAX_POSTS_TO_STORE);
    setGeneratedPosts(newPosts);

    if (!postsStorage) {
      console.warn('No posts storage available for current brand - keeping in memory only');
      toast({
        title: "Storage Unavailable",
        description: "Post generated but couldn't be saved. Please select a brand.",
        variant: "destructive",
      });
      return;
    }

    try {
      // The BrandScopedStorage now handles quota management automatically
      postsStorage.setItem(newPosts);
      console.log(`💾 Saved ${newPosts.length} posts for brand ${currentBrand?.businessName || currentBrand?.name}`);
    } catch (error) {
      console.error('Storage error in handlePostGenerated:', error);

      // Show user-friendly error message
      toast({
        title: "Storage Issue",
        description: "Post generated successfully but couldn't be saved. Storage may be full.",
        variant: "destructive",
      });

      // Keep the post in memory even if storage fails
      console.log('Post kept in memory despite storage failure');
    }
  };

  // Debug function to clear all posts for current brand
  const clearAllPosts = () => {
    if (!postsStorage) {
      console.warn('No posts storage available for current brand');
      return;
    }

    try {
      postsStorage.removeItem();
      setGeneratedPosts([]);
      toast({
        title: "Posts Cleared",
        description: `All stored posts have been cleared for ${currentBrand?.businessName || currentBrand?.name}.`,
      });
      console.log(`🗑️ Cleared all posts for brand ${currentBrand?.businessName || currentBrand?.name}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Clear Failed",
        description: "Could not clear stored posts.",
      });
    }
  };

  const handlePostUpdated = async (updatedPost: GeneratedPost) => {
    if (!postsStorage) {
      console.warn('No posts storage available for current brand');
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

      console.log(`💾 Updated post for brand ${currentBrand?.businessName || currentBrand?.name}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update post",
        description: "Unable to save post updates. Your browser storage may be full.",
      });
    }
  };

  return (
    <SidebarInset key={currentBrand?.id || 'no-brand'}>
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
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        {isLoading || brandLoading ? (
          <div className="flex h-full items-center justify-center">
            <p>Loading Content Calendar...</p>
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
              <Button onClick={() => router.push('/brand-profile')}>
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
                console.log('Artifact deactivated, content generation will use updated active artifacts');
              }}
              onManageArtifacts={() => {
                // Navigate to artifacts page
                window.open('/artifacts', '_blank');
              }}
            /> */}

            {/* Content Calendar */}
            <ContentCalendar
              brandProfile={currentBrand}
              posts={generatedPosts}
              onPostGenerated={handlePostGenerated}
              onPostUpdated={handlePostUpdated}
            />
          </div>
        )}
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
