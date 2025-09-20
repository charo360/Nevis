'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import { hexToHsl } from '@/lib/utils';

interface DesignColorContextType {
  designColors: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  updateDesignColors: (colors: Partial<DesignColorContextType['designColors']>) => void;
  resetDesignColors: () => void;
}

const DesignColorContext = createContext<DesignColorContextType | undefined>(undefined);

interface DesignColorProviderProps {
  children: React.ReactNode;
}

export function DesignColorProvider({ children }: DesignColorProviderProps) {
  const { currentBrand } = useUnifiedBrand();
  
  const [designColors, setDesignColors] = useState({
    primaryColor: '#3b82f6',
    accentColor: '#10b981',
    backgroundColor: '#f8fafc'
  });

  // Initialize with brand colors when available
  useEffect(() => {
    if (currentBrand) {
      setDesignColors({
        primaryColor: currentBrand.primaryColor || '#3b82f6',
        accentColor: currentBrand.accentColor || '#10b981',
        backgroundColor: currentBrand.backgroundColor || '#f8fafc'
      });
    }
  }, [currentBrand]);

  const updateDesignColors = (newColors: Partial<DesignColorContextType['designColors']>) => {
    setDesignColors(prev => ({
      ...prev,
      ...newColors
    }));
  };

  const resetDesignColors = () => {
    if (currentBrand) {
      setDesignColors({
        primaryColor: currentBrand.primaryColor || '#3b82f6',
        accentColor: currentBrand.accentColor || '#10b981',
        backgroundColor: currentBrand.backgroundColor || '#f8fafc'
      });
    } else {
      setDesignColors({
        primaryColor: '#3b82f6',
        accentColor: '#10b981',
        backgroundColor: '#f8fafc'
      });
    }
  };

  // Apply design-specific CSS variables that only affect generated designs
  useEffect(() => {
    const root = document.documentElement;
    
    // Convert colors to HSL
    const primaryHsl = hexToHsl(designColors.primaryColor);
    const accentHsl = hexToHsl(designColors.accentColor);
    const backgroundHsl = hexToHsl(designColors.backgroundColor);

    // Set design-specific variables (prefixed with design-)
    if (primaryHsl) {
      root.style.setProperty('--design-primary-hsl', primaryHsl);
      root.style.setProperty('--design-primary', primaryHsl);
    }
    
    if (accentHsl) {
      root.style.setProperty('--design-accent-hsl', accentHsl);
      root.style.setProperty('--design-accent', accentHsl);
    }
    
    if (backgroundHsl) {
      root.style.setProperty('--design-background-hsl', backgroundHsl);
      root.style.setProperty('--design-background', backgroundHsl);
    }

    // Cleanup function
    return () => {
      root.style.removeProperty('--design-primary-hsl');
      root.style.removeProperty('--design-primary');
      root.style.removeProperty('--design-accent-hsl');
      root.style.removeProperty('--design-accent');
      root.style.removeProperty('--design-background-hsl');
      root.style.removeProperty('--design-background');
    };
  }, [designColors]);

  return (
    <DesignColorContext.Provider value={{
      designColors,
      updateDesignColors,
      resetDesignColors
    }}>
      {children}
    </DesignColorContext.Provider>
  );
}

export function useDesignColors() {
  const context = useContext(DesignColorContext);
  if (context === undefined) {
    throw new Error('useDesignColors must be used within a DesignColorProvider');
  }
  return context;
}
