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
import { getBrandProfileAction, getGeneratedPostsAction, updateGeneratedPostAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import withAuth from "@/context/with-auth";

function ContentCalendarPage() {
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const profile = await getBrandProfileAction(user.uid);
        if (profile) {
          setBrandProfile(profile);
          const posts = await getGeneratedPostsAction(user.uid);
          setGeneratedPosts(posts);
        } else {
          // If no profile, redirect to setup
          router.push('/brand-profile');
        }
      } catch (error) {
         toast({
          variant: "destructive",
          title: "Failed to load data",
          description: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [router, toast, user]);


  const handlePostGenerated = (post: GeneratedPost) => {
    setGeneratedPosts((prevPosts) => [post, ...prevPosts]);
  };
  
  const handlePostUpdated = async (updatedPost: GeneratedPost) => {
    if (!user) return;
    try {
      await updateGeneratedPostAction(user.uid, updatedPost);
      setGeneratedPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === updatedPost.id ? updatedPost : post
        )
      );
    } catch(error) {
        toast({
          variant: "destructive",
          title: "Failed to update post",
          description: (error as Error).message,
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
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
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

export default withAuth(ContentCalendarPage);
