// src/app/creative-studio/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { BrandProfile } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarInset } from "@/components/ui/sidebar";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { ChatLayout } from "@/components/studio/chat-layout";
import { User, Palette } from "lucide-react";
import { ImageEditor } from "@/components/studio/image-editor";
import { useUnifiedBrand, useBrandStorage, useBrandChangeListener } from "@/contexts/unified-brand-context";
import { BrandContent } from "@/components/layout/unified-brand-layout"; // keep only BrandContent
import { STORAGE_FEATURES } from "@/lib/services/brand-scoped-storage";
import { useCreativeStudioStorage } from "@/hooks/use-feature-storage";

function CreativeStudioPageContent() {
  const { currentBrand } = useUnifiedBrand();
  const [editorImage, setEditorImage] = useState<string | null>(null);

  const creativeStudioStorage = useCreativeStudioStorage();
  const legacyStorage = useBrandStorage(STORAGE_FEATURES.CREATIVE_STUDIO);

  // Load Creative Studio data when brand changes
  useBrandChangeListener((brand) => {
    if (brand) {
      if (creativeStudioStorage) {
        try {
          const studioSettings = creativeStudioStorage.loadSettings();
          const studioProjects = creativeStudioStorage.loadProjects();
          const studioAssets = creativeStudioStorage.loadAssets();

        } catch (error) {
          console.error("❌ Error loading Creative Studio data:", error);
        }
      }
    }
  });

  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);

  useEffect(() => {
    const convertBrandProfile = async () => {
      if (!currentBrand) {
        setBrandProfile(null);
        return;
      }

      let logoDataUrl = currentBrand.logoUrl;

      if (currentBrand.logoUrl && currentBrand.logoUrl.startsWith("http")) {
        try {
          const response = await fetch(currentBrand.logoUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          logoDataUrl = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.warn("⚠️ Failed to convert logo URL:", error);
          logoDataUrl = currentBrand.logoUrl;
        }
      }

      const convertedProfile: BrandProfile = {
        businessName: currentBrand.businessName,
        businessType: currentBrand.businessType,
        location:
          typeof currentBrand.location === "string"
            ? currentBrand.location
            : currentBrand.location
            ? `${currentBrand.location.city || ""}, ${currentBrand.location.country || ""}`
                .replace(/^,\s*/, "")
                .replace(/,\s*$/, "") || "Location"
            : "Location",
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
        logoDataUrl,
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
      };

      setBrandProfile(convertedProfile);
    };

    convertBrandProfile();
  }, [currentBrand]);

  return (
    <SidebarInset fullWidth>
      <MobileSidebarTrigger />
      {/* ✅ Unified Layout Wrapper */}
      <div className="flex min-h-screen flex-col bg-background transition-all duration-200 ease-linear w-full ml-0 flex-1">
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 w-full">
          <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className="space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Creative Studio</h1>
                <p className="text-sm sm:text-base text-gray-600">Chat to create, then refine visuals with the editor</p>
              </div>

              {/* Top Bar - mobile-optimized */}
              <header className="flex h-14 items-center justify-between border-b bg-card px-4 mobile-container-tight lg:h-[60px] lg:px-6">
                <div />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full touch-target">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarImage
                          src="https://placehold.co/40x40.png"
                          alt="User"
                          data-ai-hint="user avatar"
                        />
                        <AvatarFallback>
                          <User />
                        </AvatarFallback>
                      </Avatar>
                      <span className="sr-only">Toggle user menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  </DropdownMenuContent>
                </DropdownMenu>
              </header>

              {/* Main Content - mobile-optimized */}
              <main className="flex-1 overflow-hidden">
                {editorImage ? (
                  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div className="w-full mobile-container-tight py-4 sm:py-8" style={{ maxWidth: "none" }}>
                      <div className="w-full">
                        <ImageEditor
                          imageUrl={editorImage}
                          onClose={() => setEditorImage(null)}
                          brandProfile={brandProfile}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div className="w-full mobile-container-tight py-4 sm:py-8 h-full" style={{ maxWidth: "none" }}>
                      <div className="w-full h-full">
                        <ChatLayout brandProfile={brandProfile} onEditImage={setEditorImage} />
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}

function CreativeStudioPage() {
  return (
    <BrandContent
      fallback={
        <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
          <div className="text-center p-8 w-full max-w-lg">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Brand Selected</h2>
            <p className="text-gray-600">Please select a brand to access the Creative Studio.</p>
          </div>
        </div>
      }
    >
      {() => <CreativeStudioPageContent />}
    </BrandContent>
  );
}

export default CreativeStudioPage;
