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
    console.warn('🎨 Failed to get colors from localStorage:', error);
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
      console.error('Failed to get persisted colors:', error);
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
    console.log('🎨 Initializing BrandColorProvider with persisted colors:', persistedColors);
    return {
      '--primary-color': persistedColors.primaryColor,
      '--accent-color': persistedColors.accentColor,
      '--background-color': persistedColors.backgroundColor,
    } as React.CSSProperties;
  });

  // FORCE COMPLETE MODULE RELOAD - Enhanced BrandColorProvider v6.0 ULTIMATE CACHE PURGE
  console.log('🚀🚀🚀 ENHANCED BRAND COLOR PROVIDER v6.0 ULTIMATE CACHE PURGE LOADED 🚀🚀🚀');
  console.log('🔥🔥🔥 AGGRESSIVE CACHE BUSTER: Forcing complete component reload');
  console.log('🔥 CACHE_BUSTER:', CACHE_BUSTER);

  // Add unique component identifier to force complete re-render
  const componentId = `brand-color-provider-${CACHE_BUSTER}`;

  // Listen for brand changes to update colors immediately
  useEffect(() => {
    const handleBrandChange = (event: any) => {
      console.log('🎨 BrandColorProvider received brand change event:', event.detail);
      if (event.detail && event.detail.brand) {
        const brand = event.detail.brand;
        console.log('🎨 Updating colors from brand change event:', {
          primaryColor: brand.primaryColor,
          accentColor: brand.accentColor,
          backgroundColor: brand.backgroundColor
        });

        // Force immediate color update
        const newStyle = {
          '--primary-color': brand.primaryColor || '#3b82f6',
          '--accent-color': brand.accentColor || '#10b981',
          '--background-color': brand.backgroundColor || '#f8fafc',
        } as React.CSSProperties;

        setStyle(newStyle);
        console.log('🎨 Applied immediate color update from brand change event');
      }
    };

    window.addEventListener('brandChanged', handleBrandChange);
    return () => window.removeEventListener('brandChanged', handleBrandChange);
  }, []);

  useEffect(() => {
    console.log('🎨🎨🎨 ENHANCED v6.0 ULTIMATE CACHE PURGE BrandColorProvider useEffect triggered:', {
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
      console.log('🎨 Full currentBrand object:', currentBrand);
    }

    if (!currentBrand || loading) {
      console.log('🎨 ENHANCED BrandColorProvider: Skipping color application - no brand or loading');
      return;
    }

    console.log('🎨 ENHANCED BRAND COLOR PROVIDER - Applying brand colors for:', currentBrand.businessName || currentBrand.name);

    // Get colors from brand object
    let primaryColor = currentBrand.primaryColor;
    let accentColor = currentBrand.accentColor;
    let backgroundColor = currentBrand.backgroundColor;

    console.log('🎨 Brand object colors:', { primaryColor, accentColor, backgroundColor });

    // Always try localStorage fallback if any colors are missing or empty
    const hasValidPrimary = primaryColor && primaryColor.trim() !== '' && primaryColor !== '#000000';
    const hasValidAccent = accentColor && accentColor.trim() !== '' && accentColor !== '#000000';
    const hasValidBackground = backgroundColor && backgroundColor.trim() !== '' && backgroundColor !== '#000000';

    if (!hasValidPrimary || !hasValidAccent || !hasValidBackground) {
      console.log('🎨 Colors missing or invalid in brand object, checking localStorage fallback...');
      console.log('🎨 Validity check:', { hasValidPrimary, hasValidAccent, hasValidBackground });

      const localStorageColors = getColorsFromLocalStorage();
      if (localStorageColors) {
        console.log('🎨 Found localStorage colors:', localStorageColors);
        primaryColor = hasValidPrimary ? primaryColor : localStorageColors.primaryColor;
        accentColor = hasValidAccent ? accentColor : localStorageColors.accentColor;
        backgroundColor = hasValidBackground ? backgroundColor : localStorageColors.backgroundColor;
        console.log('🎨 Using localStorage colors as fallback:', { primaryColor, accentColor, backgroundColor });
      } else {
        console.log('🎨 No localStorage colors found');
      }
    } else {
      console.log('🎨 All brand colors are valid, using brand object colors');
    }

    const newStyle: React.CSSProperties = {};

    // Apply primary color
    if (primaryColor) {
      const hslPrimary = hexToHsl(primaryColor);
      if (hslPrimary) {
        newStyle['--primary-hsl'] = hslPrimary;
        newStyle['--primary'] = hslPrimary;
        newStyle['--ring'] = hslPrimary;
        console.log('🎨 Primary color applied:', primaryColor, '→', hslPrimary);
      }
    } else {
      console.log('🎨 No primary color found in brand or localStorage');
    }

    // Apply accent color
    if (accentColor) {
      const hslAccent = hexToHsl(accentColor);
      if (hslAccent) {
        newStyle['--accent-hsl'] = hslAccent;
        newStyle['--accent'] = hslAccent;
        console.log('🎨 Accent color applied:', accentColor, '→', hslAccent);
      }
    } else {
      console.log('🎨 No accent color found in brand or localStorage');
    }

    // Apply background color
    if (backgroundColor) {
      const hslBackground = hexToHsl(backgroundColor);
      if (hslBackground) {
        newStyle['--background-hsl'] = hslBackground;
        newStyle['--background'] = hslBackground;
        console.log('🎨 Background color applied:', backgroundColor, '→', hslBackground);
      }
    } else {
      console.log('🎨 No background color found in brand or localStorage');
    }

    console.log('🎨 Setting style:', newStyle);
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
