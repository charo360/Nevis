// src/app/brand-profile/page.tsx
"use client";

import * as React from "react";
import { BrandSetup } from "@/components/dashboard/brand-setup";
import type { BrandProfile } from "@/lib/types";
import { SidebarInset } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getBrandProfileAction, saveBrandProfileAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import withAuth from "@/context/with-auth";

function BrandProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [brandProfile, setBrandProfile] = React.useState<BrandProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profile = await getBrandProfileAction(user.uid);
        setBrandProfile(profile);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load profile",
          description: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user, toast]);

  const handleProfileSaved = async (profile: BrandProfile) => {
    if (!user) return;
    try {
        await saveBrandProfileAction(user.uid, profile);
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
            {isLoading ? (
                <div className="flex h-full items-center justify-center">
                    <p>Loading Profile from Database...</p>
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

export default withAuth(BrandProfilePage);
