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
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";
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


  // Load posts from both localStorage AND Supabase database
  useEffect(() => {
    const loadAllPosts = async () => {
      if (!currentBrand?.id || !user?.userId) {
        setGeneratedPosts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load from localStorage first (instant)
        const localPosts = postsStorage?.getItem ? postsStorage.getItem() : [];
        const localArray = Array.isArray(localPosts) ? localPosts : [];

        // Load from Supabase database (persistent across devices)
        try {
          const token = await getAccessToken();

          // Skip database load if no valid token
          if (!token) {
            setGeneratedPosts(localArray);
            return;
          }

          const response = await fetch(`/api/generated-posts/brand/${currentBrand.id}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const dbPosts = await response.json();
            const dbArray = Array.isArray(dbPosts) ? dbPosts : [];

            // Merge: prefer database posts over localStorage, deduplicate by id
            const merged = new Map();

            // First add database posts (they have real IDs and are the source of truth)
            dbArray.forEach(post => {
              merged.set(post.id, post);
            });

            // Then add local posts only if they don't exist in database
            // Skip posts with temporary IDs (starting with 'post_') if we have database posts
            localArray.forEach(post => {
              // Only add if not already in database
              if (!merged.has(post.id)) {
                // If it's a temporary ID and we have database posts, skip it (likely duplicate)
                const isTemporaryId = post.id && post.id.startsWith('post_');
                if (!isTemporaryId || dbArray.length === 0) {
                  merged.set(post.id, post);
                }
              }
            });

            const allPosts = Array.from(merged.values())
              .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

            setGeneratedPosts(allPosts);

            // Cleanup: If we removed duplicates, update localStorage to match database
            if (allPosts.length < localArray.length && postsStorage?.setItem) {
              try {
                postsStorage.setItem(allPosts.slice(0, MAX_POSTS_TO_STORE));
              } catch (err) {
                console.warn('⚠️ Failed to cleanup localStorage:', err);
              }
            }
          } else {
            if (response.status === 401) {
            } else {
            }
            setGeneratedPosts(localArray);
          }
        } catch (dbError) {
          console.warn('⚠️ Could not load from database, using localStorage:', dbError);
          setGeneratedPosts(localArray);
        }
      } catch (error) {
        console.error('❌ Error loading posts:', error);
        setGeneratedPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllPosts();
  }, [currentBrand?.id, user?.userId, postsStorage, getAccessToken]);

  // Function to refresh calendar services
  const refreshCalendarServices = async () => {
    if (!currentBrand?.id) {
      setScheduledServices([]);
      setTodaysServices([]);
      setUpcomingServices([]);
      setHasScheduledContent(false);
      return;
    }

    try {
      console.log('🔄 Refreshing calendar services for brand:', currentBrand.id);
      
      // Force fresh fetch from database
      const [todaysServices, upcomingServices] = await Promise.all([
        CalendarService.getTodaysScheduledServices(currentBrand.id),
        CalendarService.getUpcomingScheduledServices(currentBrand.id)
      ]);
      
      console.log('✅ Fresh calendar data loaded:', {
        todaysCount: todaysServices.length,
        upcomingCount: upcomingServices.length,
        todaysServices: todaysServices.map(s => s.serviceName),
        upcomingServices: upcomingServices.map(s => s.serviceName)
      });
      
      setScheduledServices([...todaysServices, ...upcomingServices]);
      setTodaysServices(todaysServices);
      setUpcomingServices(upcomingServices);
      setHasScheduledContent(todaysServices.length > 0 || upcomingServices.length > 0);
    } catch (error) {
      console.error('❌ Error loading calendar services:', error);
      setScheduledServices([]);
      setTodaysServices([]);
      setUpcomingServices([]);
      setHasScheduledContent(false);
    }
  };

  // Load calendar services when brand changes
  useEffect(() => {
    refreshCalendarServices();
  }, [currentBrand?.id]);

  // Check for calendar updates from other pages
  useEffect(() => {
    const checkForCalendarUpdates = () => {
      const lastUpdated = localStorage.getItem('calendarLastUpdated');
      const lastChecked = localStorage.getItem('calendarLastChecked') || '0';
      
      if (lastUpdated && parseInt(lastUpdated) > parseInt(lastChecked)) {
        console.log('🔄 Calendar was updated in another page, refreshing...');
        refreshCalendarServices();
        localStorage.setItem('calendarLastChecked', Date.now().toString());
      }
    };

    // Check immediately
    checkForCalendarUpdates();

    // Check every 2 seconds for updates
    const interval = setInterval(checkForCalendarUpdates, 2000);

    return () => clearInterval(interval);
  }, [currentBrand?.id]);

  const handlePostGenerated = async (post: GeneratedPost) => {
    // Ensure the post has a stable unique id with additional entropy
    const postId = post.id || `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${Math.random().toString(36).slice(2, 5)}`;
    const newPost: GeneratedPost = {
      ...post,
      id: postId,
      date: post.date || new Date().toISOString(),
    };

    // Update UI immediately - prevent duplicates by checking if post already exists
    setGeneratedPosts(prev => {
      // Check if this exact post already exists
      const existingIndex = prev.findIndex(p => p.id === postId);

      if (existingIndex !== -1) {
        // Update existing post (merge new data)
        const copy = prev.slice();
        copy[existingIndex] = { ...copy[existingIndex], ...newPost };

        // Persist updated list
        if (currentBrand?.id && postsStorage?.setItem) {
          const toSave = copy.slice(0, MAX_POSTS_TO_STORE);
          try {
            postsStorage.setItem(toSave);
          } catch (err) {
            console.warn('⚠️ Failed to persist to localStorage:', err);
          }
        }

        return copy;
      } else {
        // Add new post
        const updatedPosts = [newPost, ...prev];

        // Persist to localStorage immediately
        if (currentBrand?.id && postsStorage?.setItem) {
          const toSave = updatedPosts.slice(0, MAX_POSTS_TO_STORE);
          try {
            postsStorage.setItem(toSave);
          } catch (err) {
            console.warn('⚠️ Failed to persist to localStorage:', err);
          }
        }

        return updatedPosts;
      }
    });

    // Also save to Supabase database for cross-device persistence (only once)
    if (user?.userId && currentBrand?.id) {
      try {
        const token = await getAccessToken();
        const response = await fetch('/api/generated-posts', {
          method: 'POST',
          headers: token ? {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          } : { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post: newPost,
            userId: user.userId,
            brandProfileId: currentBrand.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          const dbId = result.id;

          // Update the post in state and localStorage with the database-generated ID
          // This prevents duplicates on page reload
          if (dbId && dbId !== newPost.id) {
            setGeneratedPosts(prev => {
              const updated = prev.map(p => p.id === newPost.id ? { ...p, id: dbId } : p);

              // Update localStorage with the correct database ID
              if (postsStorage?.setItem) {
                try {
                  postsStorage.setItem(updated.slice(0, MAX_POSTS_TO_STORE));
                } catch (err) {
                  console.warn('⚠️ Failed to update localStorage with database ID:', err);
                }
              }

              return updated;
            });
          }
        } else {
          console.warn('⚠️ Database save failed, post only in localStorage');
        }
      } catch (dbError) {
        console.warn('⚠️ Could not save to database:', dbError);
      }
    }
  };

  const handlePostUpdated = async (updatedPost: GeneratedPost) => {
    // Update local state immediately (optimistic update)
    setGeneratedPosts(prev => {
      const updated = prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p);

      // Persist to localStorage immediately
      if (currentBrand?.id && postsStorage?.setItem) {
        try {
          postsStorage.setItem(updated);
        } catch (err) {
          console.warn('⚠️ Failed to persist updated post to localStorage:', err);
        }
      }

      return updated;
    });

    // Save to database in background
    try {
      const token = await getAccessToken();

      // Skip database update if no valid token
      if (!token) {
        console.warn('⚠️ No auth token, post updated only in localStorage');
        return;
      }

      console.log('💾 Saving edited post to database:', updatedPost.id);

      const response = await fetch(`/api/generated-posts/${updatedPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPost)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Post updated in database successfully');

        // Update local state with database response (in case URLs changed)
        if (result.post) {
          setGeneratedPosts(prev =>
            prev.map(p => p.id === updatedPost.id ? { ...p, ...result.post } : p)
          );
        }
      } else {
        const errorData = await response.json();
        console.warn('⚠️ Database update failed:', errorData.error);
        console.warn('⚠️ Post updated only in localStorage');
      }
    } catch (error) {
      console.warn('⚠️ Could not update database:', error);
      console.warn('⚠️ Post updated only in localStorage');
    }
  };

  return (
    <SidebarInset fullWidth key={currentBrand?.id || 'no-brand'}>
      <MobileSidebarTrigger />
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
                <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 mb-2">
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
                    <div className="w-full px-4 py-2" style={{ maxWidth: 'none' }}>
                      <div className="w-full space-y-4">
                        {currentBrand && (
                          <>
                            {(hasScheduledContent || calendarServices.length > 0) && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-blue-900">
                                      Calendar Services ({todaysServices.length} today, {upcomingServices.length} upcoming)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={refreshCalendarServices}
                                      className="text-xs h-6"
                                    >
                                      🔄 Refresh
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCalendarServices([])}
                                      className="text-xs h-6"
                                    >
                                      Use Brand Services
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-blue-700 mt-1">
                                  Content will be generated for: {scheduledServices.map(s => s.serviceName).join(", ") || "No services scheduled"}
                                </p>
                              </div>
                            )}

                            <ContentCalendar
                              brandProfile={{
                                id: currentBrand.id, // 🔧 CRITICAL FIX: Include brand ID for database lookups
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
                                logoUrl: (currentBrand as any).logoUrl || currentBrand.logoDataUrl || "",
                                logoDataUrl: currentBrand.logoDataUrl || "",
                                visualStyle: currentBrand.visualStyle || "",
                                writingTone: currentBrand.writingTone || "",
                                contentThemes: currentBrand.contentThemes || "",
                                websiteUrl: currentBrand.websiteUrl || "",
                                // 🎨 CRITICAL FIX: Include brand colors for content generation
                                primaryColor: currentBrand.primaryColor || "",
                                accentColor: currentBrand.accentColor || "",
                                backgroundColor: currentBrand.backgroundColor || "",
                                description: currentBrand.description || "",
                                services: calendarServices.length > 0
                                  ? calendarServices.join("\n")
                                  : Array.isArray((currentBrand as any).services)
                                    ? (currentBrand as any).services.map((s: any) => s.name).join("\n")
                                    : (currentBrand as any).services || "",
                                targetAudience: currentBrand.targetAudience || "",
                                keyFeatures: currentBrand.keyFeatures || "",
                                competitiveAdvantages: currentBrand.competitiveAdvantages || "",
                                // Include contact information for contacts toggle
                                contactInfo: {
                                  phone: (currentBrand as any).contactPhone || (currentBrand as any).contact?.phone || "",
                                  email: (currentBrand as any).contactEmail || (currentBrand as any).contact?.email || "",
                                  address: (currentBrand as any).contactAddress || (currentBrand as any).contact?.address || ""
                                }
                              }}
                              posts={generatedPosts}
                              onPostGenerated={handlePostGenerated}
                              onPostUpdated={handlePostUpdated}
                              scheduledServices={scheduledServices}
                              todaysServices={todaysServices}
                              upcomingServices={upcomingServices}
                              hasScheduledContent={hasScheduledContent}
                              onRefreshCalendar={refreshCalendarServices}
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
