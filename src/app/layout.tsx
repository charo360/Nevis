// src/app/layout.tsx
'use client';

import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import { UnifiedBrandProvider } from '@/contexts/unified-brand-context';
import { BrandColorProvider } from '@/components/layout/brand-color-provider';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Import test function for development
if (typeof window !== 'undefined') {
  import('@/lib/test-database');
}




function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  // Pages that should NOT show the sidebar (public pages only)
  const pagesWithoutSidebar = ['/', '/auth'];
  const shouldHideSidebar = pagesWithoutSidebar.includes(pathname);

  console.log('🔍 ConditionalLayout - pathname:', pathname, 'shouldHideSidebar:', shouldHideSidebar);

  if (shouldHideSidebar) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <BrandColorProvider>
        {children}
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
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthWrapper requireAuth={false}>
          <UnifiedBrandProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </UnifiedBrandProvider>
        </AuthWrapper>
        <Toaster />
      </body>
    </html>
  );
}
