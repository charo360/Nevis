"use client";

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';

// Import centralized routes
import { AppRoutesPaths } from '@/lib/routes';

// Explicit lazy imports for top-level app routes (keeps bundler friendly)
const Dashboard = React.lazy(() => import('../../app/dashboard/page').then(m => ({ default: m.default })));
const Settings = React.lazy(() => import('../../app/settings/page').then(m => ({ default: m.default })));
const Profile = React.lazy(() => import('../../app/profile/page').then(m => ({ default: m.default })));
const BrandProfile = React.lazy(() => import('../../app/brand-profile/page').then(m => ({ default: m.default })));
// Firebase brand profile removed - using MongoDB version
const Brands = React.lazy(() => import('../../app/brands/page').then(m => ({ default: m.default })));
const ContentCalendar = React.lazy(() => import('../../app/content-calendar/page').then(m => ({ default: m.default })));
const CreativeStudio = React.lazy(() => import('../../app/creative-studio/page').then(m => ({ default: m.default })));
const QuickContent = React.lazy(() => import('../../app/quick-content/page').then(m => ({ default: m.default })));
const Showcase = React.lazy(() => import('../../app/showcase/page').then(m => ({ default: m.default })));
const SocialConnect = React.lazy(() => import('../../app/social-connect/page').then(m => ({ default: m.default })));

// Public pages
const Features = React.lazy(() => import('../../app/features/page').then(m => ({ default: m.default })));
const Pricing = React.lazy(() => import('../../app/pricing/page').then(m => ({ default: m.default })));
const About = React.lazy(() => import('../../app/about/page').then(m => ({ default: m.default })));
const Home = React.lazy(() => import('../../app/page').then(m => ({ default: m.default })));

// Other pages
const Success = React.lazy((): Promise<{ default: React.ComponentType<any> }> =>
  Promise.resolve({
    default: function SuccessPlaceholder(): JSX.Element {
      return <div className="p-6">Success page is unavailable.</div>;
    },
  })
);
const TestOpenAI = React.lazy(() => import('../../app/test-openai/page').then(m => ({ default: m.default })));
const DebugDatabase = React.lazy(() => import('../../app/debug-database/page').then(m => ({ default: m.default })));
const CancelPage = React.lazy(() => import('../../app/cancel/page').then(m => ({ default: m.default })));
const CBrand = React.lazy(() => import('../../app/cbrand/page').then(m => ({ default: m.default })));
const Artifacts = React.lazy(() => import('../../app/artifacts/page').then(m => ({ default: m.default })));
const Auth = React.lazy(() => import('../../app/auth/page').then(m => ({ default: m.default })));

const FullWidthSpinner: React.FC = () => (
  <div className="w-full min-h-screen flex items-center justify-center px-6 lg:px-12">
    <div role="status" aria-label="Loading" className="h-12 w-12">
      <svg
        viewBox="0 0 50 50"
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-hidden="true"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          opacity="0.2"
        />
        <path
          d="M45 25a20 20 0 0 1-20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          style={{ transformOrigin: 'center' }}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  </div>
);

const SkeletonPage: React.FC = () => (
  <div className="w-full min-h-screen p-6 lg:p-12">
    <div className="max-w-7xl mx-auto">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-gray-100 rounded" />
          <div className="h-40 bg-gray-100 rounded" />
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  </div>
);

export function AppRoute() {
  const pathname = usePathname?.() || (typeof window !== 'undefined' ? window.location.pathname : '/');

  // Prefetch a small set of likely routes in the background to reduce first-time navigation latency.
  // These imports use webpackPrefetch hint so the browser can fetch them with low priority.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only prefetch a few small routes to avoid increasing initial network usage.
    void import(/* webpackPrefetch: true */ '../../app/dashboard/page').catch(() => {});
    void import(/* webpackPrefetch: true */ '../../app/quick-content/page').catch(() => {});
    void import(/* webpackPrefetch: true */ '../../app/brands/page').catch(() => {});
  }, []);

  // Map path prefixes to lazy components. Add or reorder as needed.
  const routes: { test: (p: string) => boolean; Component: React.LazyExoticComponent<React.ComponentType<any>> }[] = [
    // Public pages - exact matches first
    { test: p => p === AppRoutesPaths.home, Component: Home },
    { test: p => p === AppRoutesPaths.features, Component: Features },
    { test: p => p === AppRoutesPaths.pricing, Component: Pricing },
    { test: p => p === AppRoutesPaths.about, Component: About },

    // Dashboard and nested routes - prefix matches
    { test: p => p.startsWith('/dashboard'), Component: Dashboard },
    { test: p => p.startsWith('/settings'), Component: Settings },
    { test: p => p.startsWith('/profile'), Component: Profile },
    // Firebase brand profile route removed
    { test: p => p.startsWith('/brand-profile'), Component: BrandProfile },
    { test: p => p.startsWith('/brands'), Component: Brands },
    { test: p => p.startsWith('/content-calendar'), Component: ContentCalendar },
    { test: p => p.startsWith('/creative-studio'), Component: CreativeStudio },
    { test: p => p.startsWith('/quick-content'), Component: QuickContent },
    { test: p => p.startsWith('/showcase'), Component: Showcase },
    { test: p => p.startsWith('/social-connect'), Component: SocialConnect },

    // Other app routes
    { test: p => p.startsWith('/success'), Component: Success },
    { test: p => p.startsWith('/test-openai'), Component: TestOpenAI },
    { test: p => p.startsWith('/debug-database'), Component: DebugDatabase },
    { test: p => p.startsWith('/cancel'), Component: CancelPage },
    { test: p => p.startsWith('/cbrand'), Component: CBrand },
    { test: p => p.startsWith('/artifacts'), Component: Artifacts },
    { test: p => p.startsWith('/auth'), Component: Auth },
  ];

  const match = routes.find(r => r.test(pathname));
  const Element = match ? match.Component : null;

  return (
    <Suspense fallback={<SkeletonPage />}>
      {Element ? <Element /> : <div className="p-6">Not Found</div>}
    </Suspense>
  );
}

export default AppRoute;
