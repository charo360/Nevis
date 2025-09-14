'use client';

import React, { useState } from 'react';
import { useCurrentBrand } from '@/contexts/unified-brand-context';

interface BrandLogoDisplayProps {
  className?: string;
  alt?: string;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  // Override brand props (useful for displaying specific brand logos)
  logoUrl?: string;
  logoDataUrl?: string;
  businessName?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export function BrandLogoDisplay({
  className = '',
  alt,
  fallback,
  size = 'md',
  logoUrl: propLogoUrl,
  logoDataUrl: propLogoDataUrl,
  businessName: propBusinessName,
}: BrandLogoDisplayProps) {
  const currentBrand = useCurrentBrand();
  const [imageError, setImageError] = useState(false);
  const [primaryImageFailed, setPrimaryImageFailed] = useState(false);

  // Use props if provided, otherwise use current brand
  const logoUrl = propLogoUrl || currentBrand?.logoUrl;
  const logoDataUrl = propLogoDataUrl || currentBrand?.logoDataUrl;
  const businessName = propBusinessName || currentBrand?.businessName || currentBrand?.name || 'Brand';

  // Determine which logo to use with proper precedence
  // 1. logoUrl (Supabase storage) - preferred for performance
  // 2. logoDataUrl (base64) - fallback for immediate display
  const primaryLogoSrc = logoUrl && !imageError && !primaryImageFailed ? logoUrl : null;
  const fallbackLogoSrc = logoDataUrl && (imageError || primaryImageFailed || !logoUrl) ? logoDataUrl : null;

  const handlePrimaryImageError = () => {
    console.log('🖼️ Primary logo (logoUrl) failed to load, falling back to logoDataUrl');
    setPrimaryImageFailed(true);
    setImageError(false); // Reset for fallback image
  };

  const handleFallbackImageError = () => {
    console.log('🖼️ Fallback logo (logoDataUrl) failed to load');
    setImageError(true);
  };

  // Default fallback if no fallback prop is provided
  const defaultFallback = (
    <div className={`${sizeClasses[size]} bg-gray-200 rounded-md flex items-center justify-center text-gray-600 font-semibold ${className}`}>
      {businessName.charAt(0).toUpperCase()}
    </div>
  );

  // If we have a primary logo source and it hasn't failed, use it
  if (primaryLogoSrc && !primaryImageFailed) {
    return (
      <img
        src={primaryLogoSrc}
        alt={alt || `${businessName} logo`}
        className={`${sizeClasses[size]} object-contain rounded-md ${className}`}
        onError={handlePrimaryImageError}
        onLoad={() => {
          console.log('✅ Primary logo (logoUrl) loaded successfully');
        }}
      />
    );
  }

  // If primary failed or doesn't exist, try fallback logo
  if (fallbackLogoSrc && !imageError) {
    return (
      <img
        src={fallbackLogoSrc}
        alt={alt || `${businessName} logo`}
        className={`${sizeClasses[size]} object-contain rounded-md ${className}`}
        onError={handleFallbackImageError}
        onLoad={() => {
          console.log('✅ Fallback logo (logoDataUrl) loaded successfully');
        }}
      />
    );
  }

  // If both failed or don't exist, show fallback component
  return fallback || defaultFallback;
}

// Hook to get the current brand logo with proper precedence
export function useBrandLogo() {
  const currentBrand = useCurrentBrand();
  
  const getLogoSrc = (): string | null => {
    // Prefer logoUrl (Supabase storage) over logoDataUrl (base64)
    if (currentBrand?.logoUrl) {
      return currentBrand.logoUrl;
    }
    if (currentBrand?.logoDataUrl) {
      return currentBrand.logoDataUrl;
    }
    return null;
  };

  const hasLogo = !!(currentBrand?.logoUrl || currentBrand?.logoDataUrl);
  
  return {
    logoSrc: getLogoSrc(),
    logoUrl: currentBrand?.logoUrl,
    logoDataUrl: currentBrand?.logoDataUrl,
    hasLogo,
    businessName: currentBrand?.businessName || currentBrand?.name || 'Brand',
  };
}

// Utility function to determine the best logo source
export function getBestLogoSource(logoUrl?: string, logoDataUrl?: string): string | null {
  // Prefer logoUrl (Supabase storage) for better performance and caching
  if (logoUrl && logoUrl.startsWith('http')) {
    return logoUrl;
  }
  // Fallback to base64 data URL
  if (logoDataUrl && logoDataUrl.startsWith('data:')) {
    return logoDataUrl;
  }
  return null;
}