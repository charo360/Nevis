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
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContentCalendar } from "@/components/dashboard/content-calendar";
import type { BrandProfile, GeneratedPost } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";


const BRAND_PROFILE_KEY = "brandProfile";
const GENERATED_POSTS_KEY = "generatedPosts";
const MAX_POSTS_TO_STORE = 10;

// Storage cleanup utility
const cleanupStorage = () => {
  try {
    // Clear old posts if storage is getting full
    const storedPosts = localStorage.getItem(GENERATED_POSTS_KEY);
    if (storedPosts) {
      const posts = JSON.parse(storedPosts);

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
        localStorage.setItem(GENERATED_POSTS_KEY, JSON.stringify(recentPosts));
        return recentPosts;
      } else {
        // Save the fixed posts back
        localStorage.setItem(GENERATED_POSTS_KEY, JSON.stringify(fixedPosts));
        return fixedPosts;
      }
    }
  } catch (error) {
    console.warn('Storage cleanup failed:', error);
  }
  return null;
};

function QuickContentPage() {
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedProfile = localStorage.getItem(BRAND_PROFILE_KEY);
      if (storedProfile) {
        setBrandProfile(JSON.parse(storedProfile));

        // Temporary: Clear all posts to avoid date issues during development
        // Remove this in production once date issues are resolved
        try {
          const storedPosts = localStorage.getItem(GENERATED_POSTS_KEY);
          if (storedPosts) {
            const posts = JSON.parse(storedPosts);
            // Check if any posts have invalid dates
            const hasInvalidDates = posts.some((post: GeneratedPost) =>
              !post.date || isNaN(new Date(post.date).getTime())
            );

            if (hasInvalidDates) {
              console.warn('Found posts with invalid dates, clearing storage...');
              localStorage.removeItem(GENERATED_POSTS_KEY);
              setGeneratedPosts([]);
            } else {
              setGeneratedPosts(posts);
            }
          } else {
            setGeneratedPosts([]);
          }
        } catch (parseError) {
          console.warn('Failed to parse stored posts, clearing storage:', parseError);
          localStorage.removeItem(GENERATED_POSTS_KEY);
          setGeneratedPosts([]);
        }
      } else {
        // If no profile, redirect to setup
        router.push('/brand-profile');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: "Could not read your data from local storage. It might be corrupted.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);


  const handlePostGenerated = (post: GeneratedPost) => {
    // Add the new post and slice the array to only keep the most recent ones
    const newPosts = [post, ...generatedPosts].slice(0, MAX_POSTS_TO_STORE);
    setGeneratedPosts(newPosts);

    try {
      // Check storage size before saving
      const postsData = JSON.stringify(newPosts);
      const maxSize = 5 * 1024 * 1024; // 5MB limit

      if (postsData.length > maxSize) {
        // If too large, keep fewer posts
        const reducedPosts = newPosts.slice(0, Math.max(1, Math.floor(MAX_POSTS_TO_STORE / 2)));
        localStorage.setItem(GENERATED_POSTS_KEY, JSON.stringify(reducedPosts));
        setGeneratedPosts(reducedPosts);

        toast({
          title: "Storage Optimized",
          description: "Reduced stored posts to prevent storage overflow. Older posts were removed.",
        });
      } else {
        localStorage.setItem(GENERATED_POSTS_KEY, postsData);
      }
    } catch (error) {
      // If storage fails, try with just the current post
      try {
        const singlePost = [post];
        localStorage.setItem(GENERATED_POSTS_KEY, JSON.stringify(singlePost));
        setGeneratedPosts(singlePost);

        toast({
          title: "Storage Limited",
          description: "Only the latest post was saved due to storage limitations.",
        });
      } catch (fallbackError) {
        toast({
          variant: "destructive",
          title: "Storage Failed",
          description: "Unable to save posts. Your browser storage may be full.",
        });
      }
    }
  };

  // Debug function to clear all posts if needed
  const clearAllPosts = () => {
    try {
      localStorage.removeItem(GENERATED_POSTS_KEY);
      setGeneratedPosts([]);
      toast({
        title: "Posts Cleared",
        description: "All stored posts have been cleared.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Clear Failed",
        description: "Could not clear stored posts.",
      });
    }
  };

  const handlePostUpdated = async (updatedPost: GeneratedPost) => {
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
        localStorage.setItem(GENERATED_POSTS_KEY, JSON.stringify(reducedPosts));
        setGeneratedPosts(reducedPosts);

        toast({
          title: "Storage Optimized",
          description: "Reduced stored posts to prevent storage overflow. Some older posts were removed.",
        });
      } else {
        localStorage.setItem(GENERATED_POSTS_KEY, postsData);
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
    <SidebarInset>
      <header className="flex h-14 items-center justify-end gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
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
                const cleaned = cleanupStorage();
                if (cleaned) {
                  setGeneratedPosts(cleaned);
                  toast({
                    title: "Storage Cleaned",
                    description: "Removed older posts to free up storage space.",
                  });
                } else {
                  toast({
                    title: "Storage Clean",
                    description: "Storage is already optimized.",
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
        {isLoading || !brandProfile ? (
          <div className="flex h-full items-center justify-center">
            <p>Loading Content Calendar...</p>
          </div>
        ) : (
          <ContentCalendar
            brandProfile={brandProfile}
            posts={generatedPosts}
            onPostGenerated={handlePostGenerated}
            onPostUpdated={handlePostUpdated}
          />
        )}
      </main>
    </SidebarInset>
  );
}

export default QuickContentPage;
