// src/app/brand-hub/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import type { BrandProfile, GeneratedPost } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContentCalendar } from "@/components/dashboard/content-calendar";
import { Calendar, User } from "lucide-react";
import { useUnifiedBrand } from "@/contexts/unified-brand-context";
import { useQuickContentStorage } from "@/hooks/use-feature-storage";
import { STORAGE_FEATURES, cleanupAllStorage } from "@/lib/services/brand-scoped-storage";
import { useAuth } from "@/hooks/use-auth-supabase";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/components/ui/sidebar";
import { CalendarService, type ScheduledService } from "@/services/calendar-service";
import { BrandContent } from "@/components/layout/unified-brand-layout";

const MAX_POSTS_TO_STORE = 100;

function ContentCalendarPageContent() {
  const { currentBrand } = useUnifiedBrand();
  const { toast } = useToast();
  const { open: sidebarOpen, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const quickContentStorage = useQuickContentStorage();

  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [calendarServices, setCalendarServices] = useState<string[]>([]);
  const [scheduledServices, setScheduledServices] = useState<ScheduledService[]>([]);
  const [todaysServices, setTodaysServices] = useState<ScheduledService[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<ScheduledService[]>([]);
  const [hasScheduledContent, setHasScheduledContent] = useState(false);

  // --- Load posts on brand change ---
  useEffect(() => {
    if (!currentBrand) return;
    const posts = quickContentStorage.loadPosts();
    if (posts) setGeneratedPosts(posts);
  }, [currentBrand, quickContentStorage]);

  // --- Load scheduled services for the calendar ---
  useEffect(() => {
    if (!currentBrand) return;

    (async () => {
      try {
        const services = await CalendarService.loadScheduledServices(currentBrand.id);
        const today = CalendarService.getTodayServices(services);
        const upcoming = CalendarService.getUpcomingServices(services);
        setScheduledServices(services);
        setTodaysServices(today);
        setUpcomingServices(upcoming);
        setHasScheduledContent(services.length > 0);
      } catch (err) {
        console.error("Error loading calendar services:", err);
      }
    })();
  }, [currentBrand]);

  // --- Handle post generation and updates ---
  const handlePostGenerated = async (post: GeneratedPost) => {
    const newPosts = [post, ...generatedPosts].slice(0, MAX_POSTS_TO_STORE);
    setGeneratedPosts(newPosts);
    quickContentStorage.savePosts(newPosts);
  };

  const handlePostUpdated = async (updated: GeneratedPost) => {
    const updatedPosts = generatedPosts.map((p) =>
      p.id === updated.id ? updated : p
    );
    setGeneratedPosts(updatedPosts);
    quickContentStorage.savePosts(updatedPosts);
  };

  if (!currentBrand) return null;

  return (
    <SidebarInset fullWidth key={currentBrand.id}>
      <div className="flex min-h-screen flex-col bg-background transition-all duration-200 ease-linear w-full ml-0 flex-1">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
          <div className="flex flex-col h-full">
            {/* Page Header */}
            <div className="flex items-center justify-between border-b bg-card px-6 py-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
                <p className="text-muted-foreground">
                  Plan, manage, and track all your brand’s content.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8 w-8"
                  title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                >
                  {sidebarOpen ? (
                    <Calendar className="h-4 w-4" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                      <Avatar>
                        <AvatarImage
                          src="https://placehold.co/40x40.png"
                          alt="User"
                        />
                        <AvatarFallback><User /></AvatarFallback>
                      </Avatar>
                      <span className="sr-only">Toggle user menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto px-6 py-8">
              <div className="w-full">
                {calendarServices.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
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
                      Content will be generated for: {calendarServices.join(", ")}
                    </p>
                  </div>
                )}

                <ContentCalendar
                  brandProfile={{
                    businessName: currentBrand.businessName,
                    businessType: currentBrand.businessType || "",
                    location:
                      typeof currentBrand.location === "string"
                        ? currentBrand.location
                        : currentBrand.location
                          ? `${currentBrand.location.city || ""}, ${currentBrand.location.country || ""}`
                              .replace(/^,\s*/, "")
                              .replace(/,\s*$/, "")
                          : "",
                    logoUrl: currentBrand.logoUrl || "",
                    visualStyle: currentBrand.visualStyle || "",
                    writingTone: currentBrand.writingTone || "",
                    contentThemes: currentBrand.contentThemes || "",
                    websiteUrl: currentBrand.websiteUrl || "",
                    description: currentBrand.description || "",
                    services:
                      calendarServices.length > 0
                        ? calendarServices.join("\n")
                        : Array.isArray((currentBrand as any).services)
                        ? (currentBrand as any).services.map((s: any) => s.name).join("\n")
                        : (currentBrand as any).services || "",
                    targetAudience: currentBrand.targetAudience || "",
                    keyFeatures: currentBrand.keyFeatures || "",
                    competitiveAdvantages: currentBrand.competitiveAdvantages || "",
                  }}
                  posts={generatedPosts}
                  onPostGenerated={handlePostGenerated}
                  onPostUpdated={handlePostUpdated}
                  scheduledServices={scheduledServices}
                  todaysServices={todaysServices}
                  upcomingServices={upcomingServices}
                  hasScheduledContent={hasScheduledContent}
                />
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}

function ContentCalendarPage() {
  return (
    <BrandContent
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Brand Selected
            </h2>
            <p className="text-gray-600">
              Please select a brand to view and manage your content calendar.
            </p>
          </div>
        </div>
      }
    >
      {() => <ContentCalendarPageContent />}
    </BrandContent>
  );
}

export default ContentCalendarPage;
