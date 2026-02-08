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
  {
    protocol: 'https',
    hostname: 'v3b.fal.media',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'firebasestorage.googleapis.com',
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
  // Use standard .next directory to avoid confusion
  // distDir: '.next',

  // Image optimization for better performance and SEO
  images: {
    remotePatterns,
    // Also allow direct domains list for safety
    domains: SUPABASE_HOST ? [SUPABASE_HOST] : [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Webpack configuration for polyfills and client-side safety
  webpack: (config, { dev, isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        http2: false,
        async_hooks: false,
        'fs/promises': false,
        crypto: false,
        stream: false,
        util: false,
        buffer: require.resolve('buffer'),
        events: false,
        path: false,
        os: false,
        zlib: false,
        process: require.resolve('process/browser'),
      };

      // Aggressive externals for client-side stability
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push(
          '@google/generative-ai',
          '@genkit-ai/ai',
          '@genkit-ai/core',
          '@genkit-ai/dotprompt',
          '@genkit-ai/flow',
          '@genkit-ai/googleai',
          '@grpc/grpc-js',
          '@grpc/proto-loader',
          'async_hooks',
          'fs/promises',
          'http2',
          'dns',
          'net',
          'tls'
        );
      }

      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(async_hooks|fs\/promises|http2|dns|net|tls)$/,
        }),
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }
    return config;
  },

  // Compression for better performance
  compress: true,

  // Power optimizations
  poweredByHeader: false,

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // CRITICAL: Increase server action body size limit to handle image uploads
    // Default is 1MB which is too small for base64-encoded images
    // Even a compressed 8MB image becomes ~10.7MB as base64
    // This prevents 413 Payload Too Large errors in Creative Studio
    serverActions: {
      bodySizeLimit: '50mb',
    },
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
          // Security headers for better SEO ranking
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
      // Cache static assets
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
