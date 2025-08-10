// src/app/layout.tsx
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import React, { useEffect, useState } from 'react';
import type { BrandProfile } from '@/lib/types';
import { getBrandProfileAction } from '@/app/actions';
import { AuthProvider, useAuth } from '@/context/auth-context';

function BrandThemeLoader({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const fetchProfileAndSetTheme = async () => {
      if (!user) {
        // Reset styles if user logs out
        setStyle({});
        setProfileLoaded(true);
        return;
      };

      try {
        const profile = await getBrandProfileAction(user.uid);
        if (profile) {
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
        console.error("Failed to apply brand colors from Firestore", error);
      } finally {
        setProfileLoaded(true);
      }
    };
    
    fetchProfileAndSetTheme();
  }, [user]);

  return (
      <body className="font-body antialiased" style={style} suppressHydrationWarning>
        <SidebarProvider>
          <AppSidebar />
           {profileLoaded ? children : <div className="flex-1 flex items-center justify-center"><p>Loading Brand Profile...</p></div>}
        </SidebarProvider>
        <Toaster />
      </body>
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
        <title>LocalBuzz</title>
        <meta name="description" content="Hyper-local, relevant social media content generation for local businesses" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
      </head>
       <AuthProvider>
        <BrandThemeLoader>
          {children}
        </BrandThemeLoader>
      </AuthProvider>
    </html>
  );
}
