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
import { Facebook, Instagram, Linkedin, Twitter, User, CheckCircle, AlertCircle } from "lucide-react";
import { useUnifiedBrand, useBrandStorage, useBrandChangeListener } from "@/contexts/unified-brand-context";
import { UnifiedBrandLayout, BrandContent, BrandSwitchingStatus } from "@/components/layout/unified-brand-layout";
import { STORAGE_FEATURES } from "@/lib/services/brand-scoped-storage";

interface SocialConnection {
  platform: string;
  connected: boolean;
  username?: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error';
}

function SocialConnectPage() {
  const { currentBrand, loading: brandLoading } = useUnifiedBrand();
  // Prefer businessName; fall back safely if older shape includes `name`.
  const brandLabel = currentBrand?.businessName ?? (currentBrand as unknown as { name?: string })?.name ?? 'Unnamed Brand';
  const socialStorage = useBrandStorage(STORAGE_FEATURES.SOCIAL_MEDIA);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default social platforms
  const defaultConnections: SocialConnection[] = [
    { platform: 'Instagram', connected: false, status: 'disconnected' },
    { platform: 'Facebook', connected: false, status: 'disconnected' },
    { platform: 'Twitter', connected: false, status: 'disconnected' },
    { platform: 'LinkedIn', connected: false, status: 'disconnected' },
  ];

  // Load connections when brand changes using unified brand system
  useBrandChangeListener(React.useCallback((brand) => {
    const brandName = brand?.businessName ?? (brand as unknown as { name?: string })?.name ?? 'none';

    if (!brand) {
      setConnections(defaultConnections);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      if (socialStorage) {
        const storedConnections = socialStorage.getItem<SocialConnection[]>() || defaultConnections;
        setConnections(storedConnections);
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
    }
  };

  const toggleConnection = (platform: string) => {
    const updatedConnections = connections.map<SocialConnection>(conn =>
      conn.platform === platform
        ? {
          ...conn,
          connected: !conn.connected,
          // keep literal union types for `status`
          status: !conn.connected ? ('connected' as const) : ('disconnected' as const),
          lastSync: !conn.connected ? new Date().toISOString() : undefined
        }
        : conn
    );

    saveConnections(updatedConnections);
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
    if (connection.connected) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Connected
        </Badge>
      );
    }
  };

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

  // main render: use SidebarInset with fullWidth to match other dashboard pages
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
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(connection)}
                        <Button
                          variant={connection.connected ? "outline" : "default"}
                          onClick={() => toggleConnection(connection.platform)}
                        >
                          {connection.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  ))
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
