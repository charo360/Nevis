/**
 * Structured Data (Schema.org JSON-LD)
 * SEO-optimized structured data for better Google rankings
 */

import { siteConfig } from './metadata';

// Organization Schema
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    legalName: 'Crevo Inc.',
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    foundingDate: '2024',
    founders: [
      {
        '@type': 'Person',
        name: 'Crevo Team'
      }
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
      addressRegion: 'CA'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@crevo.ai',
      availableLanguage: ['English']
    },
    sameAs: [
      'https://twitter.com/crevo_ai',
      'https://facebook.com/crevo',
      'https://linkedin.com/company/crevo',
      'https://instagram.com/crevo_ai'
    ]
  };
}

// Software Application Schema
export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Content Creation Software',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      priceValidUntil: '2025-12-31',
      availability: 'https://schema.org/InStock',
      description: 'Free plan available with premium upgrades'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1'
    },
    description: siteConfig.description,
    screenshot: `${siteConfig.url}/screenshots/dashboard.png`,
    featureList: [
      'AI-powered content generation',
      'Multi-platform support (Instagram, Facebook, LinkedIn, Twitter)',
      'Brand customization',
      'Content calendar',
      'Analytics and insights',
      'Image generation and editing',
      'Hashtag suggestions',
      'Post scheduling'
    ],
    softwareVersion: '2.0',
    releaseNotes: 'Enhanced AI models, improved design tools, and faster generation',
    author: {
      '@type': 'Organization',
      name: siteConfig.name
    }
  };
}

// Website Schema
export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`
      }
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

// FAQ Schema
export function getFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Crevo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Crevo is an AI-powered social media content creation platform that helps businesses and creators generate professional posts, designs, and campaigns in seconds. It supports Instagram, Facebook, LinkedIn, and Twitter.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is Crevo free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Crevo offers a free plan with basic features. You can upgrade to premium plans for advanced features, unlimited generations, and priority support.'
        }
      },
      {
        '@type': 'Question',
        name: 'What platforms does Crevo support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Crevo supports all major social media platforms including Instagram, Facebook, LinkedIn, and Twitter. Each platform has optimized content formats and dimensions.'
        }
      },
      {
        '@type': 'Question',
        name: 'How does AI content generation work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Crevo uses advanced AI models (GPT-4, Claude, Gemini) to analyze your brand, understand your audience, and generate engaging content. Simply provide your business details, and our AI creates professional posts tailored to your brand voice.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I customize the generated content?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely! All generated content is fully editable. You can customize text, images, colors, fonts, and layouts. Our Creative Studio offers advanced editing tools for professional customization.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does Crevo help with scheduling posts?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Crevo includes a smart content calendar with AI-powered scheduling. Plan your content strategy, schedule posts, and automate your social media presence.'
        }
      },
      {
        '@type': 'Question',
        name: 'What makes Crevo different from other tools?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Crevo combines multiple AI models for superior quality, offers true brand customization, supports all major platforms, includes advanced design tools, and provides intelligent content suggestions based on your business type and audience.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need design skills to use Crevo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No design skills required! Crevo\'s AI handles all the design work. Just provide your business information, and get professional-quality content instantly. Advanced users can use our Creative Studio for custom designs.'
        }
      }
    ]
  };
}

// Breadcrumb Schema
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.url}`
    }))
  };
}

// Product Schema (for pricing pages)
export function getProductSchema(plan: {
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${siteConfig.name} ${plan.name} Plan`,
    description: plan.description,
    brand: {
      '@type': 'Brand',
      name: siteConfig.name
    },
    offers: {
      '@type': 'Offer',
      price: plan.price,
      priceCurrency: plan.currency,
      availability: 'https://schema.org/InStock',
      url: `${siteConfig.url}/pricing`,
      priceValidUntil: '2025-12-31'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1250'
    },
    additionalProperty: plan.features.map(feature => ({
      '@type': 'PropertyValue',
      name: 'Feature',
      value: feature
    }))
  };
}

// Article Schema (for blog posts)
export function getArticleSchema(article: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      '@type': 'Person',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url
    }
  };
}

// How-To Schema
export function getHowToSchema(howTo: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
  totalTime?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime || 'PT5M',
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text
    }))
  };
}

