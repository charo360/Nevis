import { Metadata } from 'next';
import { generateMetadata, pageMetadata } from '@/lib/seo/metadata';
import { getFAQSchema, getBreadcrumbSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = generateMetadata({
  ...pageMetadata.features,
  url: '/features'
});

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Features', url: '/features' }
  ]);

  const faqSchema = getFAQSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}

