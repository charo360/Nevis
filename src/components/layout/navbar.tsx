'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Menu, 
  X, 
  Home, 
  Layers, 
  DollarSign, 
  Info, 
  LogIn, 
  ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth-supabase';
import { AppRoutesPaths } from '@/lib/routes';

interface NavbarProps {
  currentPage?: 'home' | 'features' | 'pricing' | 'about';
}

export function Navbar({ currentPage }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [sessionActive, setSessionActive] = useState<boolean>(!!user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Update session state when user changes
  React.useEffect(() => {
    setSessionActive(!!user);
  }, [user]);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleSignIn = () => {
    router.push('/auth?mode=signin');
    setIsMenuOpen(false);
  };

  const getLinkClasses = (page: string) => {
    return currentPage === page
      ? "text-blue-600 font-semibold"
      : "text-gray-600 hover:text-gray-900 transition-colors";
  };

  const isActivePath = (path: string) => {
    return pathname === path;
  };

  const menuItems = [
    { label: 'Home', path: AppRoutesPaths.home, icon: Home },
    { label: 'Features', path: AppRoutesPaths.features, icon: Layers },
    { label: 'Pricing', path: AppRoutesPaths.pricing, icon: DollarSign },
    { label: 'About', path: AppRoutesPaths.about, icon: Info },
  ];

  return (
    <>
      <nav className="relative z-50 px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href={AppRoutesPaths.home} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Crevo
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href={AppRoutesPaths.home} className={getLinkClasses('home')}>
              Home
            </Link>
            <Link href={AppRoutesPaths.features} className={getLinkClasses('features')}>
              Features
            </Link>
            <Link href={AppRoutesPaths.pricing} className={getLinkClasses('pricing')}>
              Pricing
            </Link>
            <Link href={AppRoutesPaths.about} className={getLinkClasses('about')}>
              About
            </Link>

            {sessionActive ? (
              <Button
                onClick={() => router.push(AppRoutesPaths.dashboard.root)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSignIn}
                  variant="outline"
                  className="border-gray-300 text-black cursor-pointer z-10 relative"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/auth')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed right-0 top-0 h-full w-[280px] bg-white shadow-2xl transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Crevo
                </span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-900" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="py-4 px-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Sign In Button (Mobile) */}
              {!sessionActive && (
                <button
                  onClick={handleSignIn}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all w-full"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Bottom CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gradient-to-t from-gray-50 to-white">
              {sessionActive ? (
                <Button
                  onClick={() => {
                    router.push(AppRoutesPaths.dashboard.root);
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center justify-center gap-2"
                >
                  Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    router.push('/auth');
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}