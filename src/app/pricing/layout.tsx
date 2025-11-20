import { Metadata } from 'next';
import { generateMetadata, pageMetadata } from '@/lib/seo/metadata';
import { getBreadcrumbSchema, getProductSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = generateMetadata({
  ...pageMetadata.pricing,
  url: '/pricing'
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Pricing', url: '/pricing' }
  ]);

  // Product schemas for pricing plans
  const starterPlanSchema = getProductSchema({
    name: 'Starter',
    description: 'Perfect for individuals and small businesses getting started with AI content creation',
    price: 0,
    currency: 'USD',
    features: [
      '50 AI-generated posts per month',
      'Basic templates',
      'Single platform support',
      'Community support'
    ]
  });

  const proPlanSchema = getProductSchema({
    name: 'Pro',
    description: 'For growing businesses and professional content creators',
    price: 29,
    currency: 'USD',
    features: [
      'Unlimited AI-generated posts',
      'All premium templates',
      'Multi-platform support',
      'Priority support',
      'Advanced analytics',
      'Brand customization'
    ]
  });

  const enterprisePlanSchema = getProductSchema({
    name: 'Enterprise',
    description: 'For agencies and large teams with custom needs',
    price: 99,
    currency: 'USD',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom AI training',
      'API access',
      'White-label options',
      'SLA guarantee'
    ]
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(starterPlanSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(proPlanSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(enterprisePlanSchema) }}
      />
      {children}
    </>
  );
}

