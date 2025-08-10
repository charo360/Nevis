// src/app/brand-profile/page.tsx
"use client";

import * as React from "react";
import { BrandSetup } from "@/components/dashboard/brand-setup";
import type { BrandProfile } from "@/lib/types";
import { SidebarInset } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Bot, User } from "lucide-react";


const BRAND_PROFILE_KEY = "brandProfile";
const GENERATED_POSTS_KEY = "generatedPosts";

function BrandProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [brandProfile, setBrandProfile] = React.useState<BrandProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    try {
      const storedProfile = localStorage.getItem(BRAND_PROFILE_KEY);
      if (storedProfile) {
        setBrandProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error("Failed to parse brand profile from localStorage", error);
      toast({
        variant: "destructive",
        title: "Failed to load profile",
        description: "Could not read your profile from local storage. It might be corrupted.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleProfileSaved = async (profile: BrandProfile) => {
    try {
        localStorage.setItem(BRAND_PROFILE_KEY, JSON.stringify(profile));
        setBrandProfile(profile);
        toast({
            title: "Profile Saved!",
            description: "Your brand profile has been updated successfully.",
        });
        
        // Force a reload to apply theme colors globally from layout
        window.location.reload();

         if(!brandProfile) { // If it was the first time saving
            router.push('/content-calendar');
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Failed to save profile",
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
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
            {isLoading ? (
                <div className="flex h-full items-center justify-center">
                    <p>Loading Profile from Local Storage...</p>
                </div>
            ) : (
                <BrandSetup 
                    initialProfile={brandProfile} 
                    onProfileSaved={handleProfileSaved} 
                />
            )}
        </main>
      </SidebarInset>
  );
}

export default BrandProfilePage;
