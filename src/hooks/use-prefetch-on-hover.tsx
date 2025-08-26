"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Hook: returns handlers to call onMouseEnter/onFocus to prefetch a route
export function usePrefetchOnHover(path: string) {
  const router = useRouter();

  const onEnter = useCallback(() => {
    try {
      // next/navigation router.prefetch improves client navigation speed
      // router.prefetch is safe to call repeatedly.
  // router.prefetch currently types as void in some Next versions.
  // Call it and ignore errors; the try/catch guards against missing API.
  router.prefetch(path);
    } catch (e) {
      // ignore in older Next versions where prefetch may not exist
    }
  }, [path, router]);

  return { onEnter };
}

export default usePrefetchOnHover;
