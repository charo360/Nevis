import { Metadata } from 'next';
import { generateMetadata, pageMetadata } from '@/lib/seo/metadata';
import { getBreadcrumbSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = generateMetadata({
  ...pageMetadata.creativeStudio,
  url: '/creative-studio',
  noIndex: true // Dashboard pages should not be indexed
});

export default function CreativeStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Creative Studio', url: '/creative-studio' }
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}

