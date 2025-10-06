'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth-supabase';
import { AppRoutesPaths } from '@/lib/routes';

interface NavbarProps {
  currentPage?: 'home' | 'features' | 'pricing' | 'about';
}

export function Navbar({ currentPage }: NavbarProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sessionActive, setSessionActive] = useState<boolean>(!!user);

  // Update session state when user changes
  React.useEffect(() => {
    setSessionActive(!!user);
  }, [user]);

  const handleSignIn = () => {
    router.push('/auth?mode=signin');
  };

  const getLinkClasses = (page: string) => {
    return currentPage === page
      ? "text-blue-600 font-semibold"
      : "text-gray-600 hover:text-gray-900 transition-colors";
  };

  return (
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
      </div>
    </nav>
  );
}