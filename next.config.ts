import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

// Dynamically allow the Supabase host from environment for Next/Image
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_HOST = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : undefined;

// Base remote patterns
const baseRemotePatterns: RemotePattern[] = [
  {
    protocol: 'https',
    hostname: 'placehold.co',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'picsum.photos',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'oaidalleapiprodscus.blob.core.windows.net',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'nrfceylvtiwpqsoxurrv.supabase.co',
    port: '',
    pathname: '/**',
  },
];

const remotePatterns: RemotePattern[] = [...baseRemotePatterns];
if (SUPABASE_HOST && !remotePatterns.some((p) => p.hostname === SUPABASE_HOST)) {
  remotePatterns.push({ protocol: 'https', hostname: SUPABASE_HOST, port: '', pathname: '/**' });
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Try to use a different build directory to bypass locked .next/trace
  // Allow overriding via NEXT_DIST_DIR env var so developers can place build output
  // on a local fast disk or RAM disk when working on network-mounted repos.
  distDir: process.env.NEXT_DIST_DIR || '.next-alt',
  images: {
    remotePatterns,
    // Also allow direct domains list for safety
    domains: SUPABASE_HOST ? [SUPABASE_HOST] : [],
    // Add timeout configurations for image optimization
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
