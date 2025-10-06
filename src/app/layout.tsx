// src/app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import { ClientLayout } from './client-layout';

export const metadata: Metadata = {
  title: 'Crevo - AI-Powered Content Creation',
  description: 'Transform your ideas into professional social media content with AI. Generate posts, designs, and campaigns that engage your audience and grow your brand.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to frequent image hosts for slightly faster image loads */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://placehold.co" />
      </head>
      <body className="font-body antialiased overflow-x-hidden" suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
