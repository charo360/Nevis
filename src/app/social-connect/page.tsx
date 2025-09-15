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
import { useAuth } from "@/hooks/use-auth-supabase";

interface SocialConnection {
  platform: string;
  connected: boolean;
  username?: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  oauthUrl?: string;
  pageId?: string;
  pageName?: string;
  accountType?: 'personal' | 'business';
}

function SocialConnectPage() {
  const { currentBrand, loading: brandLoading } = useUnifiedBrand();
  const { user, getAccessToken } = useAuth();
  const brandLabel = currentBrand?.businessName ?? (currentBrand as unknown as { name?: string })?.name ?? 'Unnamed Brand';
  const socialStorage = useBrandStorage(STORAGE_FEATURES.SOCIAL_MEDIA);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [instagramAccounts, setInstagramAccounts] = useState<any[]>([]);
  const [selectedInstagramAccount, setSelectedInstagramAccount] = useState<string>('');

  // Default social platforms with OAuth URLs
  const defaultConnections: SocialConnection[] = [
    {
      platform: 'Instagram',
      connected: false,
      status: 'disconnected',
      oauthUrl: '/api/social/oauth/instagram',
      accountType: 'business' // Default to business account
    },
    {
      platform: 'Facebook',
      connected: false,
      status: 'disconnected',
      oauthUrl: '/api/social/oauth/facebook'
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

  // Load connections when brand changes using unified brand system
  useBrandChangeListener(React.useCallback(async (brand) => {
    const brandName = brand?.businessName ?? (brand as unknown as { name?: string })?.name ?? 'none';

    if (!brand || !user?.userId) {
      setConnections(defaultConnections);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Load connections from API
      const token = await getAccessToken();
      if (!token) {
        setConnections(defaultConnections);
        setIsLoading(false);
        return;
      }
      const response = await fetch('/api/social/connections', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const apiConnections = data.connections || [];

        // Map API connections to our interface
        const mappedConnections = defaultConnections.map(defaultConn => {
          const apiConn = apiConnections.find((c: any) => c.platform.toLowerCase() === defaultConn.platform.toLowerCase());
          if (apiConn) {
            return {
              platform: defaultConn.platform,
              connected: true,
              status: 'connected' as const,
              username: apiConn.profile?.screen_name || apiConn.profile?.username,
              lastSync: new Date().toISOString(),
              profile: apiConn.profile,
              accountType: apiConn.profile?.accountType || defaultConn.accountType,
              pageId: apiConn.profile?.pageId,
              pageName: apiConn.profile?.pageName
            };
          }
          return defaultConn;
        });

        setConnections(mappedConnections);

        // Check if we need to load Facebook pages for a connected account
        const facebookConnection = mappedConnections.find(c => c.platform === 'Facebook' && c.connected);
        if (facebookConnection) {
          loadFacebookPages();
        }

        // Check if we need to load Instagram accounts
        const instagramConnection = mappedConnections.find(c => c.platform === 'Instagram' && c.connected);
        if (instagramConnection) {
          loadInstagramAccounts();
        }
      } else {
        setConnections(defaultConnections);
      }
    } catch (error) {
      setConnections(defaultConnections);
    } finally {
      setIsLoading(false);
    }
  }, [socialStorage]));

  const saveConnections = (newConnections: SocialConnection[]) => {
    if (!socialStorage) {
      return;
    }

    try {
      socialStorage.setItem(newConnections);
      setConnections(newConnections);
    } catch (error) {
      console.error("Failed to save connections:", error);
    }
  };

  const loadFacebookPages = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch('/api/social/facebook/pages', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const pages = await response.json();
        setFacebookPages(pages);
      }
    } catch (error) {
      console.error("Failed to load Facebook pages:", error);
    }
  };

  const loadInstagramAccounts = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch('/api/social/instagram/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const accounts = await response.json();
        setInstagramAccounts(accounts);
      }
    } catch (error) {
      console.error("Failed to load Instagram accounts:", error);
    }
  };

  const initiateOAuth = async (platform: string) => {
    // For Facebook/Instagram, check if we need to select a page/account first
    if (platform === 'Facebook' && facebookPages.length > 0 && !selectedPage) {
      // We'll let the user select a page from the UI
      return;
    }

    if (platform === 'Instagram') {
      // For Instagram Business accounts, we need a connected Facebook page
      const instagramConnection = connections.find(c => c.platform === 'Instagram');
      if (instagramConnection?.accountType === 'business' && !selectedPage) {
        // Check if we have Facebook pages available
        if (facebookPages.length > 0) {
          // Need to select a Facebook page first
          return;
        }

        // If no Facebook connection, we need to connect Facebook first
        const facebookConnection = connections.find(c => c.platform === 'Facebook');
        if (!facebookConnection?.connected) {
          alert('To connect an Instagram Business account, you need to connect Facebook first.');
          return;
        }
      }
    }

    // Update connection status to connecting
    const updatedConnections = connections.map<SocialConnection>(conn =>
      conn.platform === platform
        ? { ...conn, status: 'connecting' as const }
        : conn
    );
    saveConnections(updatedConnections);

    try {
      // Find the OAuth URL for the platform
      const platformConnection = updatedConnections.find(c => c.platform === platform);
      if (!platformConnection?.oauthUrl) {
        throw new Error(`No OAuth URL configured for ${platform}`);
      }

      // Prepare request body
      const body: any = {
        brandId: currentBrand?.id,
        callbackUrl: window.location.origin + '/api/social/oauth/callback'
      };

      // Add page ID for Facebook/Instagram if selected
      if ((platform === 'Facebook' || platform === 'Instagram') && selectedPage) {
        body.pageId = selectedPage;
      }

      // Add account type for Instagram
      if (platform === 'Instagram') {
        body.accountType = platformConnection.accountType;
      }

      // Call the backend to get the OAuth URL
      const response = await fetch(platformConnection.oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
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
      const resetConnections = connections.map<SocialConnection>(conn =>
        conn.platform === platform
          ? { ...conn, status: 'disconnected' as const }
          : conn
      );
      saveConnections(resetConnections);
    }
  };

  const disconnectPlatform = async (platform: string) => {
    try {
      // Call backend to revoke access
      await fetch('/api/social/oauth/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          brandId: currentBrand?.id
        })
      });
    } catch (error) {
      console.error(`Failed to revoke ${platform} access:`, error);
    }

    // Update UI regardless of backend success
    const updatedConnections = connections.map<SocialConnection>(conn =>
      conn.platform === platform
        ? {
          ...conn,
          connected: false,
          status: 'disconnected' as const,
          username: undefined,
          pageId: undefined,
          pageName: undefined,
          lastSync: undefined
        }
        : conn
    );

    saveConnections(updatedConnections);

    // Clear data if disconnecting Facebook/Instagram
    if (platform === 'Facebook') {
      setFacebookPages([]);
      setSelectedPage('');
    } else if (platform === 'Instagram') {
      setInstagramAccounts([]);
      setSelectedInstagramAccount('');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram': return <Instagram className="h-6 w-6" />;
      case 'Facebook': return <Facebook className="h-6 w-6" />;
      case 'Twitter': return <Twitter className="h-6 w-6" />;
      case 'LinkedIn': return <Linkedin className="h-6 w-6" />;
      default: return <User className="h-6 w-6" />;
    }
  };

  const getStatusBadge = (connection: SocialConnection) => {
    switch (connection.status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected {connection.username && `as @${connection.username}`}
            {connection.pageName && ` (${connection.pageName})`}
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
          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Connected
          </Badge>
        );
    }
  };

  // Check if we're returning from an OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const platform = urlParams.get('platform');
    const username = urlParams.get('username');
    const pageName = urlParams.get('page_name');
    const pageId = urlParams.get('page_id');
    const error = urlParams.get('error');

    if (platform) {
      const updatedConnections = connections.map<SocialConnection>(conn => {
        if (conn.platform.toLowerCase() === platform.toLowerCase()) {
          if (oauthSuccess === 'true') {
            return {
              ...conn,
              connected: true,
              status: 'connected' as const,
              username: username || undefined,
              pageName: pageName || undefined,
              pageId: pageId || undefined,
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
        saveConnections(updatedConnections);

        // For Facebook, load pages after successful connection
        if (platform === 'Facebook' && oauthSuccess === 'true') {
          loadFacebookPages();
        }

        // For Instagram, load accounts after successful connection
        if (platform === 'Instagram' && oauthSuccess === 'true') {
          loadInstagramAccounts();
        }

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [connections]);

  // when no brand is selected, show a fallback screen with SidebarInset for consistency
  if (!currentBrand) {
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

  const facebookConnection = connections.find(c => c.platform === 'Facebook');
  const instagramConnection = connections.find(c => c.platform === 'Instagram');

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
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <h1 className="text-3xl font-bold font-headline">
                    Connect Your Social Media
                  </h1>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    🔥 Brand-Scoped
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Connect social media accounts for <strong>{brandLabel}</strong> to allow the AI to learn your brand's unique
                  voice and visual style from your past posts.
                </p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Platform Connections</CardTitle>
                  <CardDescription>
                    Manage your connected social media accounts for {brandLabel}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading connections...</p>
                    </div>
                  ) : (
                    connections.map((connection) => (
                      <div key={connection.platform} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                          {getPlatformIcon(connection.platform)}
                          <div>
                            <span className="font-medium">{connection.platform}</span>
                            {connection.lastSync && (
                              <p className="text-sm text-gray-500">
                                Last sync: {new Date(connection.lastSync).toLocaleDateString()}
                              </p>
                            )}
                            {connection.platform === 'Instagram' && (
                              <p className="text-xs text-blue-600">
                                {connection.accountType === 'business' ? 'Business Account' : 'Personal Account'}
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
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Instagram Configuration Card */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Instagram Configuration</CardTitle>
                  <CardDescription>
                    Important: Make sure your Facebook app is properly configured for Instagram API access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium mb-1">Instagram API Setup</h4>
                        <p className="text-sm text-muted-foreground">
                          Instagram now uses the Facebook Graph API. You need to configure your Facebook app to support Instagram.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-100 rounded-md">
                    <h4 className="font-medium mb-2">Required Facebook App Settings:</h4>
                    <ul className="text-sm space-y-1 list-disc pl-5">
                      <li>Add Instagram Basic Display product to your Facebook app</li>
                      <li>Add <code className="bg-gray-200 px-1 rounded">https://crevo.app/api/social/oauth/instagram/callback</code> to "Valid OAuth Redirect URIs"</li>
                      <li>Add Instagram Graph API product to your Facebook app</li>
                      <li>Add your app domain to "Allowed Domains for the JavaScript SDK"</li>
                      <li>Submit for review with required permissions: <code>instagram_basic</code>, <code>pages_show_list</code>, <code>instagram_content_publish</code></li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                    <h4 className="font-medium mb-2 flex items-center">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Quick Access to Facebook Developer Settings
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      You need to configure these settings in your Facebook Developer portal.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                    >
                      Open Facebook Developer Portal
                    </Button>
                  </div>

                  {instagramConnection && !instagramConnection.connected && (
                    <div className="p-3 bg-amber-50 rounded-md border border-amber-200">
                      <h4 className="font-medium mb-2">Instagram Account Type</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Select the type of Instagram account you want to connect:
                      </p>
                      <div className="flex gap-2 mb-3">
                        <Button
                          variant={instagramConnection.accountType === 'business' ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updatedConnections = connections.map<SocialConnection>(conn =>
                              conn.platform === 'Instagram'
                                ? { ...conn, accountType: 'business' }
                                : conn
                            );
                            saveConnections(updatedConnections);
                          }}
                        >
                          Business Account
                        </Button>
                        <Button
                          variant={instagramConnection.accountType === 'personal' ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updatedConnections = connections.map<SocialConnection>(conn =>
                              conn.platform === 'Instagram'
                                ? { ...conn, accountType: 'personal' }
                                : conn
                            );
                            saveConnections(updatedConnections);
                          }}
                        >
                          Personal Account
                        </Button>
                      </div>
                      {instagramConnection.accountType === 'business' && (
                        <p className="text-xs text-amber-700">
                          Note: Business accounts require a connected Facebook Page and additional permissions.
                        </p>
                      )}
                    </div>
                  )}

                  {instagramConnection?.accountType === 'business' && facebookPages.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-md border border-green-200">
                      <h4 className="font-medium mb-2">Select Facebook Page</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Choose which Facebook page is connected to your Instagram Business account:
                      </p>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={selectedPage}
                        onChange={(e) => setSelectedPage(e.target.value)}
                      >
                        <option value="">Select a page</option>
                        {facebookPages.map((page: any) => (
                          <option key={page.id} value={page.id}>
                            {page.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        className="mt-2"
                        onClick={() => initiateOAuth('Instagram')}
                        disabled={!selectedPage}
                      >
                        Connect Instagram Account
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
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