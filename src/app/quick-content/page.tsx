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
import type { BrandProfile, GeneratedPost } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { User, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { STORAGE_FEATURES, getStorageUsage, cleanupAllStorage } from "@/lib/services/brand-scoped-storage";
import { useAuth } from '@/hooks/use-auth-supabase';
import { useQuickContentStorage } from "@/hooks/use-feature-storage";
import { CalendarService, type ScheduledService } from "@/services/calendar-service";

const MAX_POSTS_TO_STORE = 100;

function QuickContentPage() {
  const { currentBrand, brands, loading: brandsLoading, refreshBrands, selectBrand } = useUnifiedBrand();
  const searchParams = useSearchParams();
  const quickContentStorage = useQuickContentStorage();
  const postsStorage = React.useMemo(() => {
    return {
      getItem: quickContentStorage.loadPosts,
      setItem: quickContentStorage.savePosts,
    };
  }, [quickContentStorage.loadPosts, quickContentStorage.savePosts]);

  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarServices, setCalendarServices] = useState<string[]>([]);
  const [scheduledServices, setScheduledServices] = useState<ScheduledService[]>([]);
  const [todaysServices, setTodaysServices] = useState<ScheduledService[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<ScheduledService[]>([]);
  const [hasScheduledContent, setHasScheduledContent] = useState(false);
  const [urlBrandSwitchPending, setUrlBrandSwitchPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { open: sidebarOpen, toggleSidebar } = useSidebar();
  const { user, getAccessToken } = useAuth();

  // Load posts from storage when brand changes
  useEffect(() => {
    const loadStoredPosts = async () => {
      if (!currentBrand?.id) {
        setGeneratedPosts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const stored = postsStorage?.getItem ? postsStorage.getItem() : [];
        const postsArray = Array.isArray(stored) ? stored : [];
        console.log('📂 Loaded posts from storage:', postsArray.length);
        setGeneratedPosts(postsArray);
      } catch (error) {
        console.error('❌ Error loading posts:', error);
        setGeneratedPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredPosts();
  }, [currentBrand?.id, postsStorage]);

  // Load calendar services when brand changes
  useEffect(() => {
    const loadCalendarServices = async () => {
      if (!currentBrand?.id) {
        setScheduledServices([]);
        setTodaysServices([]);
        setUpcomingServices([]);
        setHasScheduledContent(false);
        return;
      }

      try {
        const services = await CalendarService.getTodaysScheduledServices(currentBrand.id);
        setScheduledServices(services);
        setTodaysServices(services);
        setUpcomingServices([]);
        setHasScheduledContent(services.length > 0);
      } catch (error) {
        console.error('❌ Error loading calendar services:', error);
        setScheduledServices([]);
        setTodaysServices([]);
        setUpcomingServices([]);
      }
    };

    loadCalendarServices();
  }, [currentBrand?.id]);

  const handlePostGenerated = async (post: GeneratedPost) => {
    // Ensure the post has a stable unique id
    const newPost: GeneratedPost = {
      ...post,
      id: post.id || `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      date: post.date || new Date().toISOString(),
    };

    // Update UI immediately and persist
    setGeneratedPosts(prev => {
      const existingIndex = prev.findIndex(p => p.id === newPost.id);
      let updatedPosts;
      
      if (existingIndex !== -1) {
        const copy = prev.slice();
        copy[existingIndex] = { ...copy[existingIndex], ...newPost };
        updatedPosts = copy;
      } else {
        updatedPosts = [newPost, ...prev];
      }

      // Persist to storage immediately with updated list
      if (currentBrand?.id && postsStorage?.setItem) {
        const toSave = updatedPosts.slice(0, MAX_POSTS_TO_STORE);
        try {
          postsStorage.setItem(toSave);
        } catch (err) {
          console.warn('⚠️ Failed to persist generated post to storage:', err);
        }
      }

      return updatedPosts;
    });
  };

  const handlePostUpdated = async (updatedPost: GeneratedPost) => {
    setGeneratedPosts(prev => {
      const updated = prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p);
      
      // Persist immediately
      if (currentBrand?.id && postsStorage?.setItem) {
        try {
          postsStorage.setItem(updated);
        } catch (err) {
          console.warn('⚠️ Failed to persist updated post to storage:', err);
        }
      }
      
      return updated;
    });
  };

  return (
    <SidebarInset fullWidth key={currentBrand?.id || 'no-brand'}>
      {/* ✅ Enclosed inside unified main layout div */}
      <div className="flex min-h-screen flex-col bg-background transition-all duration-200 ease-linear w-full ml-0 flex-1">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
          <div className="w-full h-full">
            <div className="w-full h-full">
              <div className="flex-1 space-y-6 p-6 w-full px-4">
                {/* Full-width header */}
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Quick Content</h1>
                      <p className="text-muted-foreground">
                        Generate on-brand posts and assets fast
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Bar */}
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
                          <AvatarImage
                            src="https://placehold.co/40x40.png"
                            alt="User"
                            data-ai-hint="user avatar"
                          />
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
                            toast({
                              title: "Storage Cleaned",
                              description: "Removed older posts for this brand.",
                            });
                          }
                        }}
                      >
                        Clear Old Posts
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                  <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div className="w-full px-4 py-8" style={{ maxWidth: 'none' }}>
                      <div className="w-full space-y-4">
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
                                  Content will be generated for: {calendarServices.join(", ")}
                                </p>
                              </div>
                            )}

                            <ContentCalendar
                              brandProfile={{
                                businessName: currentBrand.businessName,
                                businessType: currentBrand.businessType || "",
                                location: ((): string => {
                                  const loc: any = currentBrand.location as any;
                                  if (typeof loc === 'string') return loc;
                                  if (loc && (loc.city || loc.country)) {
                                    return `${loc.city || ''}, ${loc.country || ''}`
                                      .replace(/^,\s*/, '')
                                      .replace(/,\s*$/, '');
                                  }
                                  return '';
                                })(),
                                logoUrl: (currentBrand as any).logoUrl || "",
                                visualStyle: currentBrand.visualStyle || "",
                                writingTone: currentBrand.writingTone || "",
                                contentThemes: currentBrand.contentThemes || "",
                                websiteUrl: currentBrand.websiteUrl || "",
                                description: currentBrand.description || "",
                                services: calendarServices.length > 0
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
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}

export default QuickContentPage;
