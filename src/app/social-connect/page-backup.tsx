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
  const { user } = useAuth();
  const brandLabel = currentBrand?.businessName ?? (currentBrand as unknown as { name?: string })?.name ?? 'Unnamed Brand';

  // when no brand is selected, show a fallback screen
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
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Facebook className="w-6 h-6 text-blue-600" />
                    <span className="font-medium">Facebook</span>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Instagram className="w-6 h-6 text-pink-600" />
                    <span className="font-medium">Instagram</span>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Twitter className="w-6 h-6 text-blue-400" />
                    <span className="font-medium">Twitter</span>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-6 h-6 text-blue-700" />
                    <span className="font-medium">LinkedIn</span>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
              </div>
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
