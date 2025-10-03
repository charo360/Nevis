// src/app/layout.tsx

"use client";

import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AuthWrapper } from '@/components/auth/auth-wrapper-supabase';
// MongoDB BrandProvider removed - using UnifiedBrandProvider below
// Old providers removed - using UnifiedBrandProvider only
import { UnifiedBrandProvider } from '@/contexts/unified-brand-context';
import { BrandColorProvider } from '@/components/layout/brand-color-provider';
import { DesignColorProvider } from '@/contexts/design-color-context';
import React, { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Enable the client-side AppRoute overlay for faster perceived routing.
// The AppRoute client component is lazy-loaded and will render client pages inside the layout.
const AppRouteClient = React.lazy(() => import('@/components/app-route/AppRoute').then(m => ({ default: m.default })));

// MongoDB test import removed - use API routes instead




function ConditionalLayout({ children, useAppRoute }: { children: React.ReactNode; useAppRoute?: boolean }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  // Pages that should NOT show the sidebar (public pages only)
  // Hide the sidebar for any route under /auth or /billing so auth and billing pages render standalone
  const shouldHideSidebar = pathname === '/' || (pathname ?? '').startsWith('/auth') || (pathname ?? '').startsWith('/billing') || pathname === '/cancel';


  if (shouldHideSidebar) {
    // For public/auth pages we keep the plain children rendering.
    return <div className="w-full">{children}</div>;
  }


  // Render the client AppRoute (lazy) instead of server-rendered children to make
  // route transitions feel instantaneous. This mounts a client overlay that lazy-loads
  // page components without a full server navigation.
  return (
    <SidebarProvider>
      <AppSidebar />
      <BrandColorProvider>
        <DesignColorProvider>
          <Suspense fallback={<div className="p-6">Loading...</div>}>
            <AppRouteClient />
          </Suspense>
        </DesignColorProvider>
      </BrandColorProvider>
    </SidebarProvider>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Crevo - AI-Powered Content Creation</title>
        <meta name="description" content="Transform your ideas into professional social media content with AI. Generate posts, designs, and campaigns that engage your audience and grow your brand." />
        {/* Preconnect to frequent image hosts for slightly faster image loads */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://placehold.co" />
      </head>
      <body className="font-body antialiased overflow-x-hidden" suppressHydrationWarning>
        <AuthWrapper>
          <UnifiedBrandProvider>
            <ConditionalLayout useAppRoute={true}>
              {children}
            </ConditionalLayout>
          </UnifiedBrandProvider>
        </AuthWrapper>
        <Toaster />
      </body>
    </html>
  );
}
