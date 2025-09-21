"use client";

import React from "react";
import { LinkIcon } from "lucide-react";
import { UnifiedBrandLayout, BrandContent } from "@/components/layout/unified-brand-layout";

export default function SocialConnectPage() {
  return (
    <UnifiedBrandLayout>
      <BrandContent>
        {(brand) => (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <LinkIcon className="w-12 h-12 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Social Media Connect</h1>
              <p className="text-xl text-gray-600">Coming Soon!</p>
            </div>
            <div className="max-w-md space-y-4">
              <p className="text-gray-500">
                We're working hard to bring you seamless social media integration. 
                Soon you'll be able to connect your Instagram, Facebook, Twitter, and LinkedIn accounts 
                for automated content posting and management.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What's Coming:</h3>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• Connect multiple social media accounts</li>
                  <li>• Schedule posts across platforms</li>
                  <li>• Auto-publish from Quick Content</li>
                  <li>• Analytics and performance tracking</li>
                </ul>
              </div>
              <p className="text-sm text-gray-400">
                Stay tuned for updates! In the meantime, you can still create amazing content 
                with our Quick Content and Creative Studio features.
              </p>
            </div>
          </div>
        )}
      </BrandContent>
    </UnifiedBrandLayout>
  );
}
