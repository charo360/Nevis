"use client";

import React, { useState, useEffect } from "react";
import { 
  LinkIcon, 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Unlink,
  RefreshCw,
  Shield,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";
import { DesktopSidebarTrigger } from "@/components/layout/desktop-sidebar-trigger";
import { useAuth } from "@/hooks/use-auth-supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface SocialConnection {
  platform: string;
  socialId: string;
  profile: {
    username?: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
}

interface Provider {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverBg: string;
  description: string;
  enabled: boolean;
}

export default function SocialConnectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState({
    twitter: false,
    facebook: false,
    instagram: false,
    linkedin: false
  });

  const providers: Provider[] = [
    {
      id: "twitter",
      name: "Twitter / X",
      icon: <Twitter className="w-6 h-6" />,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
      hoverBg: "hover:bg-blue-200",
      description: "Post tweets and engage with your Twitter audience",
      enabled: availableProviders.twitter
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="w-6 h-6" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      hoverBg: "hover:bg-blue-200",
      description: "Share content to your Facebook pages and profile",
      enabled: availableProviders.facebook
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="w-6 h-6" />,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
      hoverBg: "hover:bg-pink-200",
      description: "Post photos and stories to your Instagram account",
      enabled: availableProviders.instagram
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <Linkedin className="w-6 h-6" />,
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      hoverBg: "hover:bg-blue-200",
      description: "Share professional content with your LinkedIn network",
      enabled: availableProviders.linkedin
    }
  ];

  // Check for OAuth success/error in URL params
  useEffect(() => {
    if (!searchParams) return;
    
    const oauthSuccess = searchParams.get('oauth_success');
    const platform = searchParams.get('platform');
    const username = searchParams.get('username');
    const error = searchParams.get('error');

    if (oauthSuccess === 'true' && platform) {
      toast({
        title: "Connection Successful!",
        description: `Successfully connected your ${platform} account${username ? ` (@${username})` : ''}.`,
      });
      // Clean up URL params
      router.replace('/social-connect');
      // Refresh connections
      fetchConnections();
    } else if (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect: ${error.replace(/_/g, ' ')}`,
        variant: "destructive",
      });
      // Clean up URL params
      router.replace('/social-connect');
    }
  }, [searchParams]);

  // Fetch available providers
  useEffect(() => {
    async function fetchProviders() {
      try {
        const response = await fetch('/api/social/providers');
        if (response.ok) {
          const data = await response.json();
          setAvailableProviders(data.providers);
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      }
    }
    fetchProviders();
  }, []);

  // Fetch user's connections
  const fetchConnections = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Get Supabase session token
      const { createClient } = await import('@/lib/supabase-client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch('/api/social/connections', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      toast({
        title: "Error",
        description: "Failed to load your connections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [user]);

  const handleConnect = async (providerId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your social media accounts.",
        variant: "destructive",
      });
      return;
    }

    if (!user.userId) {
      toast({
        title: "Authentication Error",
        description: "User ID not found. Please log out and log back in.",
        variant: "destructive",
      });
      return;
    }

    setConnectingProvider(providerId);

    try {
      console.log('Starting OAuth for provider:', providerId, 'User ID:', user.userId);
      // Redirect to OAuth start endpoint
      window.location.href = `/api/social/oauth/${providerId}/start?userId=${user.userId}`;
    } catch (error) {
      console.error(`Failed to initiate ${providerId} connection:`, error);
      toast({
        title: "Connection Failed",
        description: `Failed to start ${providerId} connection. Please try again.`,
        variant: "destructive",
      });
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!user) return;

    setDisconnectingProvider(providerId);

    try {
      // Get Supabase session token
      const { createClient } = await import('@/lib/supabase-client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch(`/api/social/connections?platform=${providerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (response.ok) {
        toast({
          title: "Disconnected",
          description: `Successfully disconnected your ${providerId} account.`,
        });
        fetchConnections();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error(`Failed to disconnect ${providerId}:`, error);
      toast({
        title: "Error",
        description: `Failed to disconnect ${providerId}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setDisconnectingProvider(null);
    }
  };

  const isConnected = (providerId: string) => {
    return connections.some(conn => conn.platform === providerId);
  };

  const getConnection = (providerId: string) => {
    return connections.find(conn => conn.platform === providerId);
  };

  if (loading) {
    return (
      <SidebarInset fullWidth>
        <MobileSidebarTrigger />
        <DesktopSidebarTrigger />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
          <div className="w-full h-full">
            <div className="flex-1 space-y-6 p-6 w-full px-4">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                <div className="h-4 w-96 bg-muted rounded animate-pulse" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  const connectedCount = connections.length;
  const enabledCount = Object.values(availableProviders).filter(Boolean).length;

  return (
    <SidebarInset fullWidth>
      <MobileSidebarTrigger />
      <DesktopSidebarTrigger />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
        <div className="w-full h-full">
          <div className="flex-1 space-y-6 p-6 w-full px-4">
            
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Social Media Connect</h1>
                <p className="text-gray-600">Connect your social media accounts to enable automated posting</p>
              </div>
            </div>

            <Separator />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{connectedCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {connectedCount === 0 ? 'No accounts connected yet' : `${connectedCount} platform${connectedCount !== 1 ? 's' : ''} active`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Platforms</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{enabledCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Ready to connect
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Security</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">OAuth 2.0</div>
                  <p className="text-xs text-muted-foreground">
                    Secure authentication
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-blue-900 font-medium">
                      Why connect your accounts?
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Publish content directly from Quick Content and Creative Studio</li>
                      <li>• Schedule posts in advance with our Content Calendar</li>
                      <li>• Manage multiple accounts from one dashboard</li>
                      <li>• Save time with automated cross-platform posting</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Providers */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Platforms</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {providers.map((provider) => {
                  const connected = isConnected(provider.id);
                  const connection = getConnection(provider.id);
                  const isConnecting = connectingProvider === provider.id;
                  const isDisconnecting = disconnectingProvider === provider.id;

                  return (
                    <Card 
                      key={provider.id}
                      className={`transition-all duration-200 ${
                        connected ? 'border-green-300 bg-green-50' : ''
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-lg ${provider.bgColor} transition-colors ${provider.hoverBg}`}>
                              <span className={provider.color}>
                                {provider.icon}
                              </span>
                            </div>
                            <div>
                              <CardTitle className="text-lg">{provider.name}</CardTitle>
                              <CardDescription className="text-sm mt-1">
                                {provider.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {connected && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Connected
                              </Badge>
                            )}
                            {!provider.enabled && !connected && (
                              <Badge variant="secondary">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {connected && connection ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm bg-white rounded-lg p-3 border">
                              <span className="font-medium text-gray-700">Account:</span>
                              <span className="text-gray-900">
                                {connection.profile.username ? `@${connection.profile.username}` : connection.profile.name}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConnect(provider.id)}
                                disabled={isConnecting}
                                className="flex-1 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                              >
                                {isConnecting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Reconnecting...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reconnect
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDisconnect(provider.id)}
                                disabled={isDisconnecting}
                                className="flex-1"
                              >
                                {isDisconnecting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Disconnecting...
                                  </>
                                ) : (
                                  <>
                                    <Unlink className="w-4 h-4 mr-2" />
                                    Disconnect
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => handleConnect(provider.id)}
                            disabled={!provider.enabled || isConnecting}
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Connect {provider.name}
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Security Notice */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Your access tokens are encrypted and securely stored</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>We only post content that you explicitly create or schedule</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>You can disconnect any account at any time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>We never access your private messages or sensitive data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>All connections use secure OAuth 2.0 authentication</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
