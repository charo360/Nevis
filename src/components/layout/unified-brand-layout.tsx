'use client';

import React, { useEffect, useState } from 'react';
import { UnifiedBrandProvider, useUnifiedBrand, useBrandChangeListener } from '@/contexts/unified-brand-context';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';

interface UnifiedBrandLayoutProps {
  children: React.ReactNode;
}

// Inner component that uses the unified brand context
function UnifiedBrandLayoutContent({ children }: UnifiedBrandLayoutProps) {
  const { currentBrand, loading, error } = useUnifiedBrand();
  const [isInitialized, setIsInitialized] = useState(false);

  // Listen for brand changes and log them
  useBrandChangeListener((brand) => {
    console.log('🔄 Brand changed in layout:', brand?.businessName || brand?.name || 'none');
    
    // Mark as initialized once we have a brand or finished loading
    if (!isInitialized && (!loading || brand)) {
      setIsInitialized(true);
    }
  });

  // Show loading state while initializing
  if (!isInitialized && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brand profiles...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading Brands</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="unified-brand-layout">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 right-0 z-50 bg-black bg-opacity-75 text-white text-xs p-2 rounded-bl">
          <div>🔥 Unified Brand System</div>
          <div>Brand: {currentBrand?.businessName || currentBrand?.name || 'None'}</div>
          <div>ID: {currentBrand?.id || 'None'}</div>
        </div>
      )}
      
      {children}
    </div>
  );
}

// Main layout component that provides the unified brand context
export function UnifiedBrandLayout({ children }: UnifiedBrandLayoutProps) {
  return (
    <UnifiedBrandProvider>
      <UnifiedBrandLayoutContent>
        {children}
      </UnifiedBrandLayoutContent>
    </UnifiedBrandProvider>
  );
}

// Hook to make any component brand-aware
export function useBrandAware() {
  const { currentBrand, selectBrand, loading } = useUnifiedBrand();
  
  return {
    currentBrand,
    selectBrand,
    loading,
    isReady: !loading && currentBrand !== null,
    brandId: currentBrand?.id || null,
    brandName: currentBrand?.businessName || currentBrand?.name || null,
  };
}

// Higher-order component to make any component brand-aware
export function withBrandAware<P extends object>(
  Component: React.ComponentType<P & { brand: CompleteBrandProfile | null }>
) {
  return function BrandAwareComponent(props: P) {
    const { currentBrand } = useUnifiedBrand();
    
    return <Component {...props} brand={currentBrand} />;
  };
}

// Component to show brand-specific content
interface BrandContentProps {
  children: (brand: CompleteBrandProfile) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function BrandContent({ children, fallback }: BrandContentProps) {
  const { currentBrand, loading } = useUnifiedBrand();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!currentBrand) {
    return fallback || (
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">🏢</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Brand Selected</h3>
        <p className="text-gray-600">Please select a brand to continue.</p>
      </div>
    );
  }
  
  return <>{children(currentBrand)}</>;
}

// Component to conditionally render content based on brand
interface ConditionalBrandContentProps {
  brandId?: string;
  brandName?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConditionalBrandContent({ 
  brandId, 
  brandName, 
  children, 
  fallback 
}: ConditionalBrandContentProps) {
  const { currentBrand } = useUnifiedBrand();
  
  const shouldRender = 
    (!brandId || currentBrand?.id === brandId) &&
    (!brandName || currentBrand?.businessName === brandName || currentBrand?.name === brandName);
  
  if (shouldRender) {
    return <>{children}</>;
  }
  
  return fallback || null;
}

// Hook to get brand-scoped data with automatic updates
export function useBrandScopedData<T>(
  feature: string,
  defaultValue: T,
  loader?: (brandId: string) => T | Promise<T>
): [T, (data: T) => void, boolean] {
  const { currentBrand, getBrandStorage } = useUnifiedBrand();
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(false);
  
  // Load data when brand changes
  useEffect(() => {
    if (!currentBrand?.id) {
      setData(defaultValue);
      return;
    }
    
    const storage = getBrandStorage(feature);
    if (!storage) {
      setData(defaultValue);
      return;
    }
    
    setLoading(true);
    
    try {
      if (loader) {
        // Use custom loader
        const result = loader(currentBrand.id);
        if (result instanceof Promise) {
          result.then(loadedData => {
            setData(loadedData);
            setLoading(false);
          }).catch(error => {
            console.error(`Failed to load ${feature} data:`, error);
            setData(defaultValue);
            setLoading(false);
          });
        } else {
          setData(result);
          setLoading(false);
        }
      } else {
        // Use storage
        const storedData = storage.getItem<T>();
        setData(storedData || defaultValue);
        setLoading(false);
      }
    } catch (error) {
      console.error(`Failed to load ${feature} data:`, error);
      setData(defaultValue);
      setLoading(false);
    }
  }, [currentBrand?.id, feature, defaultValue, loader, getBrandStorage]);
  
  // Save data function
  const saveData = (newData: T) => {
    setData(newData);
    
    if (currentBrand?.id) {
      const storage = getBrandStorage(feature);
      if (storage) {
        storage.setItem(newData);
      }
    }
  };
  
  return [data, saveData, loading];
}

// Component to display brand switching status
export function BrandSwitchingStatus() {
  const { loading, currentBrand } = useUnifiedBrand();
  const [switching, setSwitching] = useState(false);
  
  useBrandChangeListener((brand) => {
    setSwitching(true);
    const timer = setTimeout(() => setSwitching(false), 1000);
    return () => clearTimeout(timer);
  });
  
  if (!switching && !loading) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span className="text-sm">
          {switching ? `Switching to ${currentBrand?.businessName || currentBrand?.name}...` : 'Loading...'}
        </span>
      </div>
    </div>
  );
}
