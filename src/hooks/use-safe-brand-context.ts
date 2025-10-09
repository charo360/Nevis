import { useUnifiedBrand } from '@/contexts/unified-brand-context';

// Safe wrapper for useUnifiedBrand that won't crash the component
export function useSafeUnifiedBrand() {
  try {
    return {
      data: useUnifiedBrand(),
      error: null,
      loading: false
    };
  } catch (error: any) {
    console.warn('Brand context error (handled safely):', error.message);
    return {
      data: {
        brands: [],
        currentBrand: null,
        loading: true,
        error: error.message
      },
      error: error.message,
      loading: true
    };
  }
}