/**
 * SEO Metadata Configuration
 * Centralized SEO metadata for all pages
 */

import { Metadata } from 'next';

export const siteConfig = {
  name: 'Crevo',
  title: 'Crevo - AI-Powered Social Media Content Creation Platform',
  description: 'Transform your ideas into professional social media content with AI. Generate stunning posts, designs, and campaigns that engage your audience and grow your brand. Free AI content generator for Instagram, Facebook, LinkedIn, and Twitter.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://crevo.app',
  ogImage: 'https://i.imgur.com/ExFP5l5.png', // Using Crevo logo from Imgur
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
    'AI social media manager',
    'automated content creation',
    'AI post scheduler',
    'social media AI assistant',
    'content generation platform'
  ],
  author: 'Crevo Team',
  creator: 'Crevo',
  publisher: 'Crevo',
  category: 'Technology',
  classification: 'Business Software',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  googlebot: 'index, follow',
  language: 'en-US',
  geo: {
    region: 'US',
    placename: 'United States'
  },
  twitter: {
    card: 'summary_large_image',
    site: '@crevo_ai',
    creator: '@crevo_ai'
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION
  }
};

export function generateMetadata({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords,
  noIndex = false,
  publishedTime,
  modifiedTime,
  author,
  section
}: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string[];
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
}): Metadata {
  const metaTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  const metaDescription = description || siteConfig.description;
  const metaImage = image || siteConfig.ogImage;
  const metaUrl = url ? `${siteConfig.url}${url}` : siteConfig.url;
  const metaKeywords = keywords ? [...siteConfig.keywords, ...keywords] : siteConfig.keywords;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords.join(', '),
    authors: [{ name: author || siteConfig.author }],
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    category: siteConfig.category,
    classification: siteConfig.classification,
    robots: noIndex ? 'noindex, nofollow' : siteConfig.robots,
    alternates: {
      canonical: metaUrl
    },
    openGraph: {
      type,
      title: metaTitle,
      description: metaDescription,
      url: metaUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle
        }
      ],
      locale: 'en_US',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section })
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
      site: siteConfig.twitter.site,
      creator: siteConfig.twitter.creator
    },
    verification: siteConfig.verification,
    other: {
      'geo.region': siteConfig.geo.region,
      'geo.placename': siteConfig.geo.placename,
      'language': siteConfig.language
    }
  };
}

// Page-specific metadata configurations
export const pageMetadata = {
  home: {
    title: 'AI-Powered Social Media Content Creation Platform',
    description: 'Create stunning social media content in seconds with AI. Generate professional posts, designs, and campaigns for Instagram, Facebook, LinkedIn, and Twitter. Free AI content generator trusted by 10,000+ businesses.',
    keywords: ['AI content generator', 'social media creator', 'free AI tool', 'content marketing', 'social media automation']
  },
  features: {
    title: 'Features - AI Content Creation Tools',
    description: 'Discover powerful AI features: instant content generation, multi-platform support, brand customization, smart scheduling, analytics, and more. Everything you need to dominate social media.',
    keywords: ['AI features', 'content creation tools', 'social media features', 'AI capabilities', 'marketing automation']
  },
  pricing: {
    title: 'Pricing Plans - Affordable AI Content Creation',
    description: 'Choose the perfect plan for your business. Start free, upgrade as you grow. Flexible pricing for individuals, teams, and enterprises. No credit card required to start.',
    keywords: ['pricing', 'plans', 'subscription', 'free trial', 'affordable AI', 'content creation pricing']
  },
  quickContent: {
    title: 'Quick Content Generator - Create Posts in Seconds',
    description: 'Generate professional social media posts instantly with AI. Perfect for busy marketers and business owners. Create engaging content for all platforms in one click.',
    keywords: ['quick content', 'instant posts', 'fast content creation', 'AI post generator', 'social media automation']
  },
  creativeStudio: {
    title: 'Creative Studio - Advanced AI Design & Content Creation',
    description: 'Professional-grade AI design studio for creating stunning visual content. Advanced editing, brand customization, and multi-platform optimization. Perfect for agencies and brands.',
    keywords: ['creative studio', 'AI design', 'visual content', 'graphic design AI', 'professional content creator']
  },
  dashboard: {
    title: 'Dashboard - Manage Your AI Content',
    description: 'Centralized dashboard to manage all your AI-generated content. Track performance, schedule posts, analyze engagement, and optimize your social media strategy.',
    keywords: ['dashboard', 'content management', 'analytics', 'social media dashboard', 'performance tracking']
  },
  about: {
    title: 'About Us - Revolutionizing Content Creation with AI',
    description: 'Learn about Crevo\'s mission to democratize professional content creation. Discover how we\'re helping businesses worldwide create better social media content with AI.',
    keywords: ['about us', 'company', 'mission', 'AI innovation', 'content creation revolution']
  },
  brandProfile: {
    title: 'Brand Profile - Customize Your AI Content',
    description: 'Create your brand profile to generate personalized AI content. Add your logo, colors, voice, and preferences for perfectly branded social media posts every time.',
    keywords: ['brand profile', 'brand customization', 'personalized AI', 'brand voice', 'custom content']
  },
  contentCalendar: {
    title: 'Content Calendar - AI-Powered Social Media Planning',
    description: 'Smart content calendar with AI-powered scheduling. Plan, organize, and automate your social media strategy. Never miss a post with intelligent scheduling.',
    keywords: ['content calendar', 'social media planner', 'AI scheduling', 'content planning', 'post scheduler']
  }
};

