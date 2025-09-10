// src/app/social-connect/page.tsx
"use client";

import React, { useState, useEffect } from "react";
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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Facebook, Instagram, Linkedin, Twitter, User, CheckCircle, AlertCircle, Loader2, ExternalLink, Info } from "lucide-react";
import { useUnifiedBrand, useBrandStorage, useBrandChangeListener } from "@/contexts/unified-brand-context";
import { UnifiedBrandLayout, BrandContent, BrandSwitchingStatus } from "@/components/layout/unified-brand-layout";
import { STORAGE_FEATURES } from "@/lib/services/brand-scoped-storage";
import { useAuth } from "@/hooks/use-auth";

interface SocialConnection {
  platform: string;
  connected: boolean;
  username?: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  oauthUrl?: string;
  profile?: any;
  pageId?: string;
  pageName?: string;
  accountType?: 'personal' | 'business';
}

function SocialConnectPage() {
  const { currentBrand, loading: brandLoading } = useUnifiedBrand();
  const { user, loading } = useAuth();
  const socialStorage = useBrandStorage(STORAGE_FEATURES.SOCIAL_MEDIA);

  // State management
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create a demo brand for development if no brand is selected
  const demoUser = { userId: 'demo' };
  const demoBrand = {
    id: 'demo-brand',
    businessName: 'Demo Social Media Company',
    businessType: 'Digital Marketing Agency'
  };

  // Use demo data in development mode when no real user/brand exists
  const effectiveUser = user || demoUser;
  const effectiveBrand = currentBrand || demoBrand;
  const brandLabel = effectiveBrand?.businessName ?? (effectiveBrand as unknown as { name?: string })?.name ?? 'Demo Brand';

  // Default connections
  const defaultConnections: SocialConnection[] = [
    {
      platform: 'Facebook',
      connected: false,
      status: 'disconnected',
      oauthUrl: '/api/social/oauth/facebook'
    },
    {
      platform: 'Instagram',
      connected: false,
      status: 'disconnected',
      oauthUrl: '/api/social/oauth/instagram',
      accountType: 'business'
    },
    {
      platform: 'Twitter',
      connected: false,
      status: 'disconnected',
      oauthUrl: '/api/social/oauth/twitter'
    },
    {
      platform: 'LinkedIn',
      connected: false,
      status: 'disconnected',
      oauthUrl: '/api/social/oauth/linkedin'
    },
  ];

  // Load connections from API
  const loadConnections = async () => {
    console.log('🔄 loadConnections called');
    console.log('🔍 User object:', user);
    console.log('🔍 User userId:', user?.userId);
    console.log('🔍 Auth loading state:', loading);

    // Wait for auth to finish loading
    if (loading) {
      console.log('⏳ Auth still loading, skipping connection load');
      return;
    }

    // In development mode, use demo user if no real user
    const userId = user?.userId || 'demo';
    console.log('👤 Using userId:', userId);

    if (!userId) {
      console.log('❌ No userId, using default connections');
      setConnections(defaultConnections);
      setIsLoading(false);
      return;
    }

    console.log('🚀 Making API call to /api/social/connections');
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};

      // For real authenticated users, get the Supabase session token
      if (user?.userId && user.userId !== 'demo') {
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            console.log('🔑 Using Supabase session token for authenticated user');
          }
        } catch (error) {
          console.error('❌ Failed to get Supabase session:', error);
        }
      } else {
        // For demo mode, use the demo user header
        headers['x-demo-user'] = userId;
        console.log('🎭 Using demo mode for user:', userId);
      }

      console.log('📤 Request headers:', Object.keys(headers));

      const response = await fetch('/api/social/connections', { headers });

      console.log('📡 API response status:', response.status, response.ok);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 API response data:', data);
        const apiConnections = data.connections || [];
        console.log('🔗 API connections:', apiConnections);

        // Map API connections to our interface
        const mappedConnections = defaultConnections.map(defaultConn => {
          const apiConn = apiConnections.find((c: any) =>
            c.platform.toLowerCase() === defaultConn.platform.toLowerCase()
          );

          if (apiConn) {
            return {
              ...defaultConn,
              connected: true,
              status: 'connected' as const,
              username: apiConn.profile?.username || apiConn.profile?.screen_name,
              lastSync: apiConn.updatedAt || new Date().toISOString(),
              profile: apiConn.profile,
            };
          }
          return defaultConn;
        });

        console.log('✅ Setting mapped connections:', mappedConnections);
        setConnections(mappedConnections);
      } else {
        console.log('❌ API response not ok, using default connections');
        setConnections(defaultConnections);
      }
    } catch (error) {
      console.error('❌ Failed to load connections:', error);
      setConnections(defaultConnections);
    } finally {
      console.log('🏁 loadConnections finished');
      setIsLoading(false);
    }
  };

  // Load connections on mount and when user changes
  useEffect(() => {
    loadConnections();
  }, [user, loading]); // Depend on user and loading state

  // Initiate OAuth flow for a platform
  const initiateOAuth = async (platform: string) => {
    const userId = effectiveUser?.userId;
    if (!userId) {
      alert('Please log in to connect social media accounts.');
      return;
    }

    // Update connection status to connecting
    const updatedConnections = connections.map(conn =>
      conn.platform === platform
        ? { ...conn, status: 'connecting' as const }
        : conn
    );
    setConnections(updatedConnections);

    try {
      const platformConnection = updatedConnections.find(c => c.platform === platform);
      if (!platformConnection?.oauthUrl) {
        throw new Error(`No OAuth URL configured for ${platform}`);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // For real authenticated users, get the Supabase session token
      if (effectiveUser?.userId && effectiveUser.userId !== 'demo') {
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            console.log('🔑 Using Supabase session token for OAuth');
          }
        } catch (error) {
          console.error('❌ Failed to get Supabase session for OAuth:', error);
        }
      } else {
        // For demo mode, use the demo user header
        headers['x-demo-user'] = userId;
        console.log('🎭 Using demo mode for OAuth:', userId);
      }

      console.log('🔗 Connect headers:', Object.keys(headers));

      // Call the backend to get the OAuth URL
      const response = await fetch(platformConnection.oauthUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: effectiveBrand?.id,
          callbackUrl: window.location.origin + '/api/social/oauth/callback'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get OAuth URL for ${platform}`);
      }

      const { url } = await response.json();

      // Redirect to the OAuth URL
      window.location.href = url;
    } catch (error) {
      console.error(`OAuth initiation failed for ${platform}:`, error);

      // Reset connection status on error
      const resetConnections = connections.map(conn =>
        conn.platform === platform
          ? { ...conn, status: 'disconnected' as const }
          : conn
      );
      setConnections(resetConnections);

      alert(`Failed to connect to ${platform}. Please try again.`);
    }
  };

  // Disconnect a platform
  const disconnectPlatform = async (platform: string) => {
    const userId = effectiveUser?.userId;
    if (!userId) return;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // For real authenticated users, get the Supabase session token
      if (effectiveUser?.userId && effectiveUser.userId !== 'demo') {
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
            console.log('🔑 Using Supabase session token for disconnect');
          }
        } catch (error) {
          console.error('❌ Failed to get Supabase session for disconnect:', error);
        }
      } else {
        // For demo mode, use the demo user header
        headers['x-demo-user'] = userId;
        console.log('🎭 Using demo mode for disconnect:', userId);
      }

      console.log('🗑️ Disconnect headers:', Object.keys(headers));

      // Call backend to revoke access
      await fetch(`/api/social/connections?platform=${platform.toLowerCase()}`, {
        method: 'DELETE',
        headers,
      });
    } catch (error) {
      console.error(`Failed to revoke ${platform} access:`, error);
    }

    // Update UI regardless of backend success
    const updatedConnections = connections.map(conn =>
      conn.platform === platform
        ? {
          ...conn,
          connected: false,
          status: 'disconnected' as const,
          username: undefined,
          lastSync: undefined,
          profile: undefined,
        }
        : conn
    );
    setConnections(updatedConnections);
  };

  // Handle OAuth callback results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const platform = urlParams.get('platform');
    const username = urlParams.get('username');
    const error = urlParams.get('error');

    if (platform) {
      const updatedConnections = connections.map(conn => {
        if (conn.platform.toLowerCase() === platform.toLowerCase()) {
          if (oauthSuccess === 'true') {
            return {
              ...conn,
              connected: true,
              status: 'connected' as const,
              username: username || undefined,
              lastSync: new Date().toISOString()
            };
          } else if (error) {
            return {
              ...conn,
              connected: false,
              status: 'error' as const
            };
          }
        }
        return conn;
      });

      if (oauthSuccess || error) {
        setConnections(updatedConnections);

        // Refresh connections from server to get the latest data
        setTimeout(() => {
          loadConnections();
        }, 1000);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [connections]);

  // Helper functions
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook':
        return <Facebook className="w-6 h-6 text-blue-600" />;
      case 'Instagram':
        return <Instagram className="w-6 h-6 text-pink-600" />;
      case 'Twitter':
        return <Twitter className="w-6 h-6 text-blue-400" />;
      case 'LinkedIn':
        return <Linkedin className="w-6 h-6 text-blue-700" />;
      default:
        return <User className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusBadge = (connection: SocialConnection) => {
    switch (connection.status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected {connection.username && `as @${connection.username}`}
          </Badge>
        );
      case 'connecting':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Connecting...
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Connected
          </Badge>
        );
    }
  };

  // In development mode, always show the interface with demo data
  // In production, show fallback screen when no brand is selected
  const showFallback = !currentBrand && process.env.NODE_ENV === 'production';

  if (showFallback) {
    return (
      <SidebarInset fullWidth>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Brand Selected</h2>
            <p className="text-gray-600">Please select a brand to manage social media connections.</p>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset fullWidth>
      <header className="flex h-14 items-center justify-end gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
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
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Social Connect</h1>
          <p>Manage your social media connections for {brandLabel}.</p>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Platform Connections</CardTitle>
              <CardDescription>
                Connect your social media accounts to enable content publishing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading connections...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection) => (
                    <div key={connection.platform} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getPlatformIcon(connection.platform)}
                        <div>
                          <span className="font-medium">{connection.platform}</span>
                          {connection.username && (
                            <p className="text-sm text-gray-500">@{connection.username}</p>
                          )}
                          {connection.lastSync && (
                            <p className="text-xs text-gray-400">
                              Last sync: {new Date(connection.lastSync).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(connection)}
                        {connection.connected ? (
                          <Button
                            variant="outline"
                            onClick={() => disconnectPlatform(connection.platform)}
                            disabled={connection.status === 'connecting'}
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            onClick={() => initiateOAuth(connection.platform)}
                            disabled={connection.status === 'connecting'}
                          >
                            {connection.status === 'connecting' ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connecting
                              </>
                            ) : (
                              'Connect'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </SidebarInset>
  );
}

function SocialConnectPageWithUnifiedBrand() {
  return (
    <UnifiedBrandLayout>
      <SocialConnectPage />
      <BrandSwitchingStatus />
    </UnifiedBrandLayout>
  );
}

export default SocialConnectPageWithUnifiedBrand;
