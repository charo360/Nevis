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
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { SidebarInset } from '@/components/ui/sidebar';
import { useBrandContext } from '@/contexts/brand-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useFirebaseAuth();
  const { currentBrand, brands, hasBrands, brandCount } = useBrandContext();

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
      id: 'artifacts',
      title: 'Artifacts',
      description: 'Manage your brand assets and design elements',
      icon: Archive,
      color: 'bg-orange-500',
      status: 'available',
      route: '/artifacts',
      isCore: false
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Track performance and engagement metrics',
      icon: BarChart3,
      color: 'bg-indigo-500',
      status: 'coming-soon',
      route: '#',
      isCore: false
    },
    {
      id: 'social-connect',
      title: 'Social Connect',
      description: 'Connect and manage your social media accounts',
      icon: Globe,
      color: 'bg-teal-500',
      status: 'available',
      route: '/social-connect',
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

    if (feature.status === 'requires-setup' && !currentBrand) {
      // Redirect to brand profile setup first
      router.push('/brand-profile');
      return;
    }

    router.push(feature.route);
  };

  const coreFeatures = features.filter(f => f.isCore);
  const additionalFeatures = features.filter(f => !f.isCore);

  return (
    <SidebarInset>
      <div className="flex-1 space-y-6 p-6">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Crevo! 👋
          </h1>
          <p className="text-gray-600">
            {user?.displayName ? `Hi ${user.displayName}! ` : 'Hi there! '}
            {currentBrand
              ? `You're working with ${currentBrand.businessName}. Choose a feature to get started creating amazing content.`
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
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push('/brand-profile?mode=create')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {hasBrands ? 'Create New Brand' : 'Set Up Brand Profile'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                {hasBrands && (
                  <Button
                    variant="outline"
                    onClick={() => router.push('/brands')}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
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
                      {currentBrand.businessName?.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentBrand.businessName}</h3>
                  <p className="text-sm text-gray-600">{currentBrand.businessType}</p>
                  {currentBrand.location && (
                    <p className="text-xs text-gray-500">{currentBrand.location}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push('/quick-content')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Creating Content
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/brands')}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  Switch Brand
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Core Features */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Additional Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </SidebarInset>
  );
}
