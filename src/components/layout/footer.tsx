'use client';

import Link from 'next/link';
import { Sparkles, Users, Globe, TrendingUp } from 'lucide-react';
import { AppRoutesPaths } from '@/lib/routes';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Crevo</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              AI-powered content creation platform that helps businesses and creators generate stunning social media content in seconds.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href={AppRoutesPaths.features} className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href={AppRoutesPaths.pricing} className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href={AppRoutesPaths.about} className="hover:text-white transition-colors">About</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">© 2025 Crevo. All rights reserved.</p>
          {/* <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a href="#" onClick={(e)=>e.preventDefault()} className="text-gray-400 hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </a>
            <a href="#" onClick={(e)=>e.preventDefault()} className="text-gray-400 hover:text-white transition-colors">
              <Globe className="w-5 h-5" />
            </a>
            <a href="#" onClick={(e)=>e.preventDefault()} className="text-gray-400 hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </a>
          </div> */}
        </div>
      </div>
    </footer>
  );
}