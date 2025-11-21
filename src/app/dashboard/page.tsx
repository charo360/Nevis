'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Zap,
  Calendar,
  Archive,
  Settings,
  User,
  BarChart3,
  Palette,
  Globe,
  ArrowRight,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-supabase';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarInset } from '@/components/ui/sidebar';
import { MobileSidebarTrigger } from '@/components/layout/mobile-sidebar-trigger';
import { DesktopSidebarTrigger } from '@/components/layout/desktop-sidebar-trigger';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { AILearningWidget } from '@/components/ui/ai-learning-display';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, getAccessToken } = useAuth();
  const { toast } = useToast();
  // If auth is loading, show spinner; if user is missing or anonymous, redirect to /auth
  React.useEffect(() => {
    if (!authLoading) {
      if (!user || user.isAnonymous) {
        router.replace('/auth');
      }
    }
  }, [authLoading, user, router]);

  // Use unified brand context
  let currentBrand = null;
  let brands: any[] = [];
  let brandContextError = null;

  try {
    const brandContext = useUnifiedBrand();
    currentBrand = brandContext.currentBrand as any;
    brands = brandContext.brands as any[];
  } catch (error: any) {
    console.warn('Brand context error:', error?.message || error);
    brandContextError = error?.message || String(error);
  }
  const brandLabel = currentBrand?.businessName ?? (currentBrand as unknown as { name?: string })?.name ?? 'Unnamed Brand';
  const hasBrands = brands.length > 0;
  const brandCount = brands.length;
  // Safe stable key for React list/key usage: prefer explicit id if available, otherwise use brandLabel
  const brandKey = (currentBrand as any)?.id ?? brandLabel ?? 'no-brand';

  const features = [
    {
      id: 'brand-profile',
      title: 'Brand Profile',
      description: 'Set up your brand identity with AI-powered website analysis',
      icon: User,
      color: 'bg-blue-500',
      status: currentBrand ? 'complete' : 'setup-needed',
      route: '/brand-profile',
      isCore: true
    },
    {
      id: 'quick-content',
      title: 'Quick Content',
      description: 'Generate social media posts instantly with AI',
      icon: Zap,
      color: 'bg-purple-500',
      status: currentBrand ? 'available' : 'requires-setup',
      route: '/quick-content',
      isCore: true
    },
    {
      id: 'content-calendar',
      title: 'Content Calendar',
      description: 'Plan and schedule your content strategy',
      icon: Calendar,
      color: 'bg-green-500',
      status: currentBrand ? 'available' : 'requires-setup',
      route: '/content-calendar',
      isCore: true
    },
    {
      id: 'smart-calendar',
      title: 'Smart Calendar',
      description: 'AI-powered 30-day content automation',
      icon: Calendar,
      color: 'bg-emerald-500',
      status: currentBrand ? 'available' : 'requires-setup',
      route: '/dashboard/smart-calendar',
      isCore: false
    },
    {
      id: 'enhanced-design',
      title: 'Enhanced Design Studio',
      description: 'Create stunning visuals with advanced AI design tools',
      icon: Palette,
      color: 'bg-pink-500',
      status: currentBrand ? 'available' : 'requires-setup',
      route: '/enhanced-design',
      isCore: false
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Track performance and engagement metrics',
      icon: BarChart3,
      color: 'bg-indigo-500',
      status: 'available',
      route: '/dashboard/competitor-analysis',
      isCore: false
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Customize your account and preferences',
      icon: Settings,
      color: 'bg-gray-500',
      status: 'available',
      route: '/settings',
      isCore: false
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
      case 'setup-needed':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Setup Needed</Badge>;
      case 'available':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Available</Badge>;
      case 'requires-setup':
        return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Requires Brand Setup</Badge>;
      case 'coming-soon':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  const handleFeatureClick = (feature: any) => {
    if (feature.status === 'coming-soon') {
      return;
    }

    if (!currentBrand) {
      // If user has brands but none active, take them to brand manager
      if (brands && brands.length > 0) {
        router.push('/brands');
        return;
      }
      // No brands yet: send to brand profile setup
      router.push('/brand-profile?mode=create');
      return;
    }

    router.push(feature.route);
  };

  const coreFeatures = features.filter(f => f.isCore);
  const additionalFeatures = features.filter(f => !f.isCore);

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

  const createCheckout = async (planId: string) => {
    if (!user || !user.userId) {
      // Ensure authenticated
      router.push('/auth')
      return
    }

    try {
      const token = await getAccessToken().catch(()=>null);
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ planId, quantity: 1, mode: 'payment', customerEmail: user.email, metadata: { userId: user.userId, planId } })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')

      if (data.url) {
        // prefer URL if returned
        window.location.href = data.url
      } else if (data.id) {
        await stripe.redirectToCheckout({ sessionId: data.id })
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Checkout failed', description: String(err.message || err) })
    }
  }

  // Show error message if brand context failed to load
  if (brandContextError) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-orange-600 text-lg font-medium">
                Loading your brand information...
              </div>
              <div className="text-orange-700 text-sm">
                Please wait a moment while we set up your account.
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="mt-4"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <MobileSidebarTrigger />
      <DesktopSidebarTrigger />
      <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8" key={brandKey}>
        <div className="space-y-4 sm:space-y-6">
          {/* Top navbar - visible navigation and user menu */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm border rounded-lg p-2 sm:p-3 shadow-sm">
            <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {currentBrand?.logoDataUrl ? (
                  <img
                    src={currentBrand.logoDataUrl}
                    alt={brandLabel}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover border flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                    {brandLabel.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block min-w-0">
                  <div className="text-xs text-gray-500">Working on</div>
                  <div className="font-semibold text-sm truncate">{brandLabel}</div>
                </div>
              </div>
            </div>

            {/* User icon + dropdown (visible) */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-right hidden sm:block">
                <div className="font-medium">{user?.displayName || user?.email}</div>
                <div className="text-xs text-muted-foreground">{user?.isAnonymous ? 'Demo' : 'Member'}</div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Open user menu" className="flex items-center gap-3 rounded-full px-2 py-1 hover:bg-gray-50">
                    <Avatar>
                      <AvatarImage src={user?.photoURL || 'https://placehold.co/40x40.png'} alt={user?.displayName || 'User'} />
                      <AvatarFallback>{(user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-medium">{user?.displayName || user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push('/settings')}>Settings</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/brand-profile')}>Brand Profile</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push('/credits')}>Credits</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={async () => {
                    try {
                      await signOut();
                      router.replace('/auth');
                    } catch (e) {
                    }
                  }}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Welcome Header */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome to Crevo! 👋
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {user?.displayName ? `Hi ${user.displayName}! ` : 'Hi there! '}
              {currentBrand
                ? `You're working with ${brandLabel}. Choose a feature to get started creating amazing content.`
                : hasBrands
                  ? `You have ${brandCount} brand${brandCount !== 1 ? 's' : ''}. Select one from the sidebar or create a new one to get started.`
                  : "Let's start by creating your first brand profile, then explore all the powerful features available to you."
              }
            </p>
          </div>

          {/* Quick Actions */}
          {!currentBrand && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="w-5 h-5" />
                  Get Started
                </CardTitle>
                <CardDescription className="text-blue-700">
                  {hasBrands
                    ? "Select a brand from the sidebar above or create a new one to start generating content."
                    : "Create your first brand profile to unlock all features and start generating personalized content."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onMouseEnter={() => router.prefetch('/brand-profile?mode=create')}
                    onFocus={() => router.prefetch('/brand-profile?mode=create')}
                    onClick={() => router.push('/brand-profile?mode=create')}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {hasBrands ? 'Create New Brand' : 'Set Up Brand Profile'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  {hasBrands && (
                    <Button
                      variant="outline"
                      onMouseEnter={() => router.prefetch('/brands')}
                      onFocus={() => router.prefetch('/brands')}
                      onClick={() => router.push('/brands')}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
                    >
                      Manage Brands
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Brand Info */}
          {currentBrand && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <CheckCircle className="w-5 h-5" />
                  Active Brand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    {currentBrand.logoDataUrl ? (
                      <img src={currentBrand.logoDataUrl} alt="Logo" className="w-8 h-8 rounded" />
                    ) : (
                      <span className="text-primary font-semibold">
                        {(brandLabel || 'BR').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{brandLabel}</h3>
                    <p className="text-sm text-gray-600">{currentBrand.businessType || 'General Business'}</p>
                    {currentBrand.location && (
                      <p className="text-xs text-gray-500">
                        {typeof currentBrand.location === 'string'
                          ? currentBrand.location
                          : currentBrand.location
                            ? `${currentBrand.location.city || ''}, ${currentBrand.location.country || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
                            : ''
                        }
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={() => router.push('/quick-content')}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start Creating Content
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/brand-profile?mode=edit&id=${(currentBrand as any)?.id}`)}
                      className="border-blue-200 text-blue-700 hover:bg-transparent hover:text-blue-700 flex-1 sm:flex-none"
                    >
                      Edit Brand
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/brands')}
                      className="border-green-200 text-green-700 hover:bg-green-50 flex-1 sm:flex-none"
                    >
                      Switch Brand
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Learning Progress */}
          {currentBrand && (
            <AILearningWidget
              brandId={(currentBrand as any)?.id}
              userId={user?.userId}
            />
          )}

          {/* Core Features */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Core Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {coreFeatures.map((feature) => {
                const Icon = feature.icon;
                const isDisabled = feature.status === 'requires-setup' && !currentBrand;

                return (
                  <Card
                    key={feature.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isDisabled ? 'opacity-60' : 'hover:scale-105'
                      }`}
                    onClick={() => handleFeatureClick(feature)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {getStatusBadge(feature.status)}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        variant={isDisabled ? "secondary" : "default"}
                        size="sm"
                        className="w-full"
                        disabled={feature.status === 'coming-soon'}
                        onClick={(e) => { e.stopPropagation(); handleFeatureClick(feature); }}
                      >
                        {feature.status === 'setup-needed' ? 'Set Up' :
                          feature.status === 'requires-setup' ? 'Requires Setup' :
                            feature.status === 'coming-soon' ? 'Coming Soon' : 'Open'}
                        {feature.status !== 'coming-soon' && <ArrowRight className="w-3 h-3 ml-2" />}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Additional Features */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Additional Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {additionalFeatures.map((feature) => {
                const Icon = feature.icon;
                const isDisabled = feature.status === 'coming-soon';

                return (
                  <Card
                    key={feature.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-102'
                      }`}
                    onClick={() => handleFeatureClick(feature)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg ${feature.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        {getStatusBadge(feature.status)}
                      </div>
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                      <CardDescription className="text-sm">{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Help Section */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
              <CardDescription>
                Check out our guides and documentation to get the most out of Crevo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  View Documentation
                </Button>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
