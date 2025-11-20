// src/app/layout.tsx

import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ClientLayout } from './client-layout';
import { generateMetadata as genMeta, siteConfig } from '@/lib/seo/metadata';
import { getOrganizationSchema, getSoftwareApplicationSchema, getWebsiteSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  ...genMeta({
    title: 'AI-Powered Social Media Content Creation Platform',
    description: 'Create stunning social media content in seconds with AI. Generate professional posts, designs, and campaigns for Instagram, Facebook, LinkedIn, and Twitter. Free AI content generator trusted by 10,000+ businesses.',
    keywords: ['AI content generator', 'social media creator', 'free AI tool', 'content marketing', 'social media automation']
  }),
  metadataBase: new URL(siteConfig.url),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/apple-touch-icon.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.name
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate structured data
  const organizationSchema = getOrganizationSchema();
  const softwareSchema = getSoftwareApplicationSchema();
  const websiteSchema = getWebsiteSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to frequent hosts for performance */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://placehold.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Structured Data - JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="font-body antialiased overflow-x-hidden" suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
