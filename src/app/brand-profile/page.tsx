"use client";

import * as React from "react";
import { BrandSetup } from "@/components/dashboard/brand-setup";
import type { BrandProfile } from "@/lib/types";
import { SidebarInset } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export default function BrandProfilePage() {
  const router = useRouter();
  const [brandProfile, setBrandProfile] = React.useState<BrandProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);


  React.useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('brandProfile');
      if (storedProfile) {
        setBrandProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
        console.error("Failed to parse brand profile from localStorage", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleProfileSaved = (profile: BrandProfile) => {
    localStorage.setItem('brandProfile', JSON.stringify(profile));
    setBrandProfile(profile);
    // Optionally, navigate away or show a success message.
    // For now, we'll stay on the page to allow further edits.
    // router.push('/content-calendar');
  };

  return (
      <SidebarInset>
        <header className="flex h-14 items-center justify-end gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
            {isLoading ? (
                <div className="flex h-full items-center justify-center">
                    <p>Loading Profile...</p>
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
