"use client";

import * as React from "react";
import { useState } from "react";
import {
  Bot,
  CalendarDays,
  LayoutDashboard,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { BrandSetup } from "@/components/dashboard/brand-setup";
import { ContentCalendar } from "@/components/dashboard/content-calendar";
import type { BrandProfile, GeneratedPost } from "@/lib/types";

export default function DashboardPage() {
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);

  const handleProfileSaved = (profile: BrandProfile) => {
    setBrandProfile(profile);
  };

  const handlePostGenerated = (post: GeneratedPost) => {
    setGeneratedPosts((prevPosts) => [post, ...prevPosts]);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="flex items-center gap-2 font-semibold" />
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
          {!brandProfile ? (
            <BrandSetup onProfileSaved={handleProfileSaved} />
          ) : (
            <ContentCalendar
              brandProfile={brandProfile}
              posts={generatedPosts}
              onPostGenerated={handlePostGenerated}
            />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
