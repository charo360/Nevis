// src/app/creative-studio/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { BrandProfile } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatLayout } from "@/components/studio/chat-layout";
import { User, Palette } from "lucide-react";
import { ImageEditor } from "@/components/studio/image-editor";
import { useUnifiedBrand, useBrandStorage, useBrandChangeListener } from "@/contexts/unified-brand-context";
import { UnifiedBrandLayout, BrandContent, BrandSwitchingStatus } from "@/components/layout/unified-brand-layout";
import { STORAGE_FEATURES } from "@/lib/services/brand-scoped-storage";
import { useCreativeStudioStorage } from "@/hooks/use-feature-storage";

function CreativeStudioPageContent() {
  const { currentBrand } = useUnifiedBrand();
  const [editorImage, setEditorImage] = useState<string | null>(null);

  // ✅ Creative Studio uses completely isolated storage
  // This will never conflict with Quick Content data
  const creativeStudioStorage = useCreativeStudioStorage();
  const legacyStorage = useBrandStorage(STORAGE_FEATURES.CREATIVE_STUDIO);

  // Load Creative Studio data when brand changes
  useBrandChangeListener((brand) => {
    if (brand) {
      // Load any Creative Studio specific data for this brand
      if (creativeStudioStorage) {
        const studioData = creativeStudioStorage.getItem();
        if (studioData) {
          // Apply any saved studio settings here
        }
      }
    } else {
    }
  });

  // Convert CompleteBrandProfile to BrandProfile for compatibility
  const brandProfile: BrandProfile | null = currentBrand ? {
    businessName: currentBrand.businessName,
    businessType: currentBrand.businessType,
    location: currentBrand.location,
    description: currentBrand.description,
    targetAudience: currentBrand.targetAudience,
    keyFeatures: currentBrand.keyFeatures,
    competitiveAdvantages: currentBrand.competitiveAdvantages,
    visualStyle: currentBrand.visualStyle,
    writingTone: currentBrand.writingTone,
    contentThemes: currentBrand.contentThemes,
    primaryColor: currentBrand.primaryColor,
    accentColor: currentBrand.accentColor,
    backgroundColor: currentBrand.backgroundColor,
    logoDataUrl: currentBrand.logoDataUrl,
    websiteUrl: currentBrand.websiteUrl,
    socialMedia: {
      facebook: currentBrand.facebookUrl,
      instagram: currentBrand.instagramUrl,
      twitter: currentBrand.twitterUrl,
      linkedin: currentBrand.linkedinUrl,
    },
    contactInfo: {
      phone: currentBrand.contactPhone,
      email: currentBrand.contactEmail,
      address: currentBrand.contactAddress,
    },
  } : null;

  return (
    <SidebarInset fullWidth>
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:h-[60px] lg:px-6">
        <div />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage
                  src="https://placehold.co/40x40.png"
                  alt="User"
                  data-ai-hint="user avatar"
                />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              {editorImage ? (
                <ImageEditor
                  imageUrl={editorImage}
                  onClose={() => setEditorImage(null)}
                  brandProfile={brandProfile}
                />
              ) : (
                <ChatLayout
                  brandProfile={brandProfile}
                  onEditImage={setEditorImage}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </SidebarInset>
  );
}

function CreativeStudioPage() {
  return (
    <BrandContent fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Brand Selected</h2>
          <p className="text-gray-600">Please select a brand to access the Creative Studio.</p>
        </div>
      </div>
    }>
      {() => <CreativeStudioPageContent />}
    </BrandContent>
  );
}

function CreativeStudioPageWithUnifiedBrand() {
  return (
    <UnifiedBrandLayout>
      <CreativeStudioPage />
      <BrandSwitchingStatus />
    </UnifiedBrandLayout>
  );
}

export default CreativeStudioPageWithUnifiedBrand;
