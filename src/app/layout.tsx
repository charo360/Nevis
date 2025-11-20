// src/app/layout.tsx

import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ClientLayout } from './client-layout';
import { generateMetadata as genMeta, siteConfig } from '@/lib/seo/metadata';
import { getOrganizationSchema, getSoftwareApplicationSchema, getWebsiteSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  ...genMeta({
    title: 'Crevo - AI Social Media Content Creator | 10 Industry-Specific Designers',
    description: `Crevo creates professional social media content in 30 seconds with AI.

WHAT WE OFFER:
• 10 Specialized AI Designers: Fintech, E-commerce, Restaurants, SaaS, Real Estate, Fitness, Education, Healthcare, B2B, Non-Profit
• Industry-Specific Training: Each AI trained on thousands of professional designs from their specific industry
• Instant Content Generation: Create on-brand social media posts, designs, and campaigns in under 30 seconds
• Multi-Platform Support: Instagram, Facebook, LinkedIn, Twitter, and more
• Brand Customization: AI learns your brand voice, colors, and style
• No Templates Required: Every design is uniquely generated for your business

KEY FEATURES:
AI-powered content generation tailored to your industry | Professional design quality without designers | Brand consistency across all platforms | Content calendar and scheduling | Analytics and performance insights | Image generation and editing | Industry-specific training | Multi-language support | Team collaboration tools | No templates - unique designs every time

PERFECT FOR:
Small businesses and startups | Marketing teams and agencies | Content creators and influencers | E-commerce brands | Fintech companies | Restaurants and food businesses | SaaS products | Real estate agencies | Fitness and wellness brands | Educational institutions

PRICING:
Free Plan: Start creating content immediately, no credit card required | Pro Plans: Advanced features and unlimited generation | Enterprise: Custom solutions for large teams

Trusted by 10,000+ businesses worldwide. Rated 4.9/5 on G2. Get started free today - no credit card required.`,
    keywords: [
      'AI content generator',
      'social media content creator',
      'AI social media posts',
      'content creation tool',
      'Instagram post generator',
      'Facebook content creator',
      'LinkedIn post generator',
      'Twitter content AI',
      'AI marketing tool',
      'social media automation',
      'content marketing AI',
      'AI copywriting',
      'social media design',
      'AI graphics generator',
      'business content creator',
      'fintech marketing',
      'ecommerce content',
      'restaurant social media',
      'SaaS marketing',
      'industry-specific AI',
      'brand content automation',
      'free AI tool',
      'AI designer',
      'automated content creation',
      'social media AI assistant'
    ]
  }),
  metadataBase: new URL(siteConfig.url),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: 'https://i.imgur.com/ExFP5l5.png' // Using Crevo logo from Imgur
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
