// MongoDB-based app layout (replaces Firebase layout)
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { BrandProvider } from '@/contexts/brand-context-mongo';
import { AuthWrapper } from '@/components/auth/auth-wrapper-mongo';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nevis AI - Social Media Content Generator',
  description: 'AI-powered social media content generation platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthWrapper>
          <BrandProvider>
            {children}
            <Toaster />
          </BrandProvider>
        </AuthWrapper>
      </body>
    </html>
  );
}
