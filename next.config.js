/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore TypeScript errors during development
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors during development
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'firebasestorage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Additional webpack configuration to handle chunk loading issues and server-side modules
  webpack: (config, { dev, isServer }) => {
    // Exclude server-side modules from client-side bundles
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
        buffer: false,
        events: false,
        path: false,
        os: false,
        zlib: false,
      };

      // More aggressive module exclusion for client bundles
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push(
          // AI and ML libraries
          '@google/generative-ai',
          '@genkit-ai/ai',
          '@genkit-ai/core',
          '@genkit-ai/dotprompt',
          '@genkit-ai/flow',
          '@genkit-ai/googleai',

          // gRPC and networking
          '@grpc/grpc-js',
          '@grpc/proto-loader',

          // OpenTelemetry
          '@opentelemetry/context-async-hooks',
          '@opentelemetry/api',
          '@opentelemetry/core',
          '@opentelemetry/otlp-grpc-exporter-base',

          // Server utilities
          'express',
          'get-port',
          'mime',
          'send',
          'etag',
          'destroy',

          // Node.js built-ins that might be imported
          'async_hooks',
          'fs/promises',
          'http2',
          'dns',
          'net',
          'tls',
          'crypto',
          'stream',
          'util',
          'buffer',
          'events',
          'path',
          'os',
          'zlib'
        );
      }

      // Ignore specific problematic modules
      config.plugins = config.plugins || [];
      config.plugins.push(
        new config.webpack.IgnorePlugin({
          resourceRegExp: /^(async_hooks|fs\/promises|http2|dns|net|tls)$/,
        })
      );
    }

    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            default: false,
            vendors: false,
          },
        },
      };
    }
    return config;
  },
  // Disable experimental features that might cause issues
  experimental: {
    // Remove turbo configuration to avoid Turbopack issues
  },
}

module.exports = nextConfig
