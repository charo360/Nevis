// src/app/layout.tsx
'use client';

import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AuthWrapper } from '@/components/auth/auth-wrapper';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { BrandProfile } from '@/lib/types';

// Import test function for development
if (typeof window !== 'undefined') {
  import('@/lib/test-database');
}


const BRAND_PROFILE_KEY = "brandProfile";

function BrandThemeLoader({ children }: { children: React.ReactNode }) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const fetchProfileAndSetTheme = () => {
      try {
        const storedProfile = localStorage.getItem(BRAND_PROFILE_KEY);
        if (storedProfile) {
          const profile: BrandProfile = JSON.parse(storedProfile);
          const newStyle: React.CSSProperties = {};
          if (profile.primaryColor) {
            newStyle['--primary-hsl'] = profile.primaryColor;
          }
          if (profile.accentColor) {
            newStyle['--accent-hsl'] = profile.accentColor;
          }
          if (profile.backgroundColor) {
            newStyle['--background-hsl'] = profile.backgroundColor;
          }
          setStyle(newStyle);
        }
      } catch (error) {
        console.error("Failed to apply brand colors from localStorage", error);
      } finally {
        setProfileLoaded(true);
      }
    };

    fetchProfileAndSetTheme();
  }, []);

  if (!profileLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading Brand Profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1" style={style}>
      {children}
    </div>
  )
}

function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPathname(window.location.pathname);
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  // Pages that should NOT show the sidebar (public pages only)
  const pagesWithoutSidebar = ['/', '/auth'];
  const shouldHideSidebar = pagesWithoutSidebar.includes(pathname);

  if (shouldHideSidebar) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <BrandThemeLoader>
        {children}
      </BrandThemeLoader>
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
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthWrapper>
        <Toaster />
      </body>
    </html>
  );
}
