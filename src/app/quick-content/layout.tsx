import { Metadata } from 'next';
import { generateMetadata, pageMetadata } from '@/lib/seo/metadata';
import { getBreadcrumbSchema, getHowToSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = generateMetadata({
  ...pageMetadata.quickContent,
  url: '/quick-content',
  noIndex: true // Dashboard pages should not be indexed
});

export default function QuickContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Quick Content', url: '/quick-content' }
  ]);

  const howToSchema = getHowToSchema({
    name: 'How to Create Social Media Content with Quick Content',
    description: 'Generate professional social media posts in seconds using AI',
    totalTime: 'PT2M',
    steps: [
      {
        name: 'Enter Your Business Details',
        text: 'Provide your business name, type, and services to help AI understand your brand'
      },
      {
        name: 'Select Platform',
        text: 'Choose your target social media platform (Instagram, Facebook, LinkedIn, or Twitter)'
      },
      {
        name: 'Generate Content',
        text: 'Click generate and let AI create professional posts with images and captions'
      },
      {
        name: 'Customize and Download',
        text: 'Edit the generated content if needed and download for posting'
      }
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      {children}
    </>
  );
}

