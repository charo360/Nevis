'use client';

import React, { useEffect, useState } from 'react';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { hexToHsl } from '@/lib/utils';

// FORCE COMPLETE CACHE PURGE - TIMESTAMP: 2025-01-21-15:30:00
const CACHE_BUSTER = `v6-ultimate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface BrandColorProviderProps {
  children: React.ReactNode;
}

// Helper function to get colors from localStorage as fallback
function getColorsFromLocalStorage() {
  try {
    const completeBrandProfile = localStorage.getItem('completeBrandProfile');
    if (completeBrandProfile) {
      const profile = JSON.parse(completeBrandProfile);
      return {
        primaryColor: profile.primaryColor,
        accentColor: profile.accentColor,
        backgroundColor: profile.backgroundColor
      };
    }
  } catch (error) {
  }
  return null;
}

export function BrandColorProvider({ children }: BrandColorProviderProps) {
  const { currentBrand, loading } = useUnifiedBrand();

  // Inline color persistence function
  const getPersistedColors = () => {
    try {
      const savedColors = localStorage.getItem('brandColors');
      if (savedColors) {
        const colors = JSON.parse(savedColors);
        return {
          primaryColor: colors.primaryColor || '#3b82f6',
          accentColor: colors.accentColor || '#10b981',
          backgroundColor: colors.backgroundColor || '#f8fafc'
        };
      }
    } catch (error) {
    }

    return {
      primaryColor: '#3b82f6',
      accentColor: '#10b981',
      backgroundColor: '#f8fafc'
    };
  };

  // Initialize with persisted colors to prevent flash of wrong colors
  const [style, setStyle] = useState<React.CSSProperties>(() => {
    const persistedColors = getPersistedColors();
    return {
      '--primary-color': persistedColors.primaryColor,
      '--accent-color': persistedColors.accentColor,
      '--background-color': persistedColors.backgroundColor,
    } as React.CSSProperties;
  });

  // FORCE COMPLETE MODULE RELOAD - Enhanced BrandColorProvider v6.0 ULTIMATE CACHE PURGE

  // Add unique component identifier to force complete re-render
  const componentId = `brand-color-provider-${CACHE_BUSTER}`;

  // Listen for brand changes to update colors immediately
  useEffect(() => {
    const handleBrandChange = (event: any) => {
      if (event.detail && event.detail.brand) {
        const brand = event.detail.brand;

        // Force immediate color update
        const newStyle = {
          '--primary-color': brand.primaryColor || '#3b82f6',
          '--accent-color': brand.accentColor || '#10b981',
          '--background-color': brand.backgroundColor || '#f8fafc',
        } as React.CSSProperties;

        setStyle(newStyle);
      }
    };

    window.addEventListener('brandChanged', handleBrandChange);
    return () => window.removeEventListener('brandChanged', handleBrandChange);
  }, []);

  useEffect(() => {
    currentBrand: currentBrand ? {
      name: currentBrand.businessName || currentBrand.name,
      id: currentBrand.id,
      primaryColor: currentBrand.primaryColor,
      accentColor: currentBrand.accentColor,
      backgroundColor: currentBrand.backgroundColor,
      allKeys: Object.keys(currentBrand)
    } : null,
      loading
  });

  // Log the full brand object to see what properties it actually has
  if (currentBrand) {
  }

  if (!currentBrand || loading) {
    return;
  }


  // Get colors from brand object
  let primaryColor = currentBrand.primaryColor;
  let accentColor = currentBrand.accentColor;
  let backgroundColor = currentBrand.backgroundColor;


  // Always try localStorage fallback if any colors are missing or empty
  const hasValidPrimary = primaryColor && primaryColor.trim() !== '' && primaryColor !== '#000000';
  const hasValidAccent = accentColor && accentColor.trim() !== '' && accentColor !== '#000000';
  const hasValidBackground = backgroundColor && backgroundColor.trim() !== '' && backgroundColor !== '#000000';

  if (!hasValidPrimary || !hasValidAccent || !hasValidBackground) {

    const localStorageColors = getColorsFromLocalStorage();
    if (localStorageColors) {
      primaryColor = hasValidPrimary ? primaryColor : localStorageColors.primaryColor;
      accentColor = hasValidAccent ? accentColor : localStorageColors.accentColor;
      backgroundColor = hasValidBackground ? backgroundColor : localStorageColors.backgroundColor;
    } else {
    }
  } else {
  }

  const newStyle: React.CSSProperties = {};

  // Apply primary color
  if (primaryColor) {
    const hslPrimary = hexToHsl(primaryColor);
    if (hslPrimary) {
      (newStyle as any)['--primary-hsl'] = hslPrimary;
      (newStyle as any)['--primary'] = hslPrimary;
      (newStyle as any)['--ring'] = hslPrimary;
    }
  } else {
  }

  // Apply accent color
  if (accentColor) {
    const hslAccent = hexToHsl(accentColor);
    if (hslAccent) {
      (newStyle as any)['--accent-hsl'] = hslAccent;
      (newStyle as any)['--accent'] = hslAccent;
    }
  } else {
  }

  // Apply background color
  if (backgroundColor) {
    const hslBackground = hexToHsl(backgroundColor);
    if (hslBackground) {
      (newStyle as any)['--background-hsl'] = hslBackground;
      (newStyle as any)['--background'] = hslBackground;
    }
  } else {
  }

  setStyle(newStyle);
}, [currentBrand, loading]);

if (loading) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p>Loading Brand Colors...</p>
    </div>
  );
}

return (
  <div
    key={componentId}
    data-cache-buster={CACHE_BUSTER}
    data-component="brand-color-provider-v6-ultimate"
    className="flex flex-1"
    style={style}
  >
    {children}
  </div>
);
}
