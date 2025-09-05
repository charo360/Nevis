/**
 * React hooks for feature-specific storage
 * Provides easy-to-use hooks for Quick Content and Creative Studio storage
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useBrand } from '@/contexts/brand-context-mongo';
import { 
  FeatureStorageService, 
  createQuickContentStorage, 
  createCreativeStudioStorage,
  STORAGE_CATEGORIES,
  migrateToFeatureStorage
} from '@/lib/services/feature-storage-service';

/**
 * Hook for Quick Content storage
 * Provides isolated storage that never conflicts with Creative Studio
 */
export function useQuickContentStorage(subFeature?: string) {
  const { currentBrand } = useBrand();
  
  const storage = useMemo(() => {
    const brandId = currentBrand?.id || 'default';
    return createQuickContentStorage(brandId, subFeature);
  }, [currentBrand?.id, subFeature]);

  // Auto-migrate existing data when brand changes
  useEffect(() => {
    if (currentBrand?.id) {
      const migrationResults = migrateToFeatureStorage(currentBrand.id);
      if (migrationResults.quickContentMigrated) {
        console.log('✅ Quick Content data migrated to new storage system');
      }
    }
  }, [currentBrand?.id]);

  const savePosts = useCallback((posts: any[]) => {
    return storage.setItem(STORAGE_CATEGORIES.QUICK_CONTENT.POSTS, posts);
  }, [storage]);

  const loadPosts = useCallback(() => {
    return storage.getItem(STORAGE_CATEGORIES.QUICK_CONTENT.POSTS) || [];
  }, [storage]);

  const saveSettings = useCallback((settings: any) => {
    return storage.setItem(STORAGE_CATEGORIES.QUICK_CONTENT.SETTINGS, settings);
  }, [storage]);

  const loadSettings = useCallback(() => {
    return storage.getItem(STORAGE_CATEGORIES.QUICK_CONTENT.SETTINGS);
  }, [storage]);

  const saveDrafts = useCallback((drafts: any[]) => {
    return storage.setItem(STORAGE_CATEGORIES.QUICK_CONTENT.DRAFTS, drafts);
  }, [storage]);

  const loadDrafts = useCallback(() => {
    return storage.getItem(STORAGE_CATEGORIES.QUICK_CONTENT.DRAFTS) || [];
  }, [storage]);

  const saveTemplates = useCallback((templates: any[]) => {
    return storage.setItem(STORAGE_CATEGORIES.QUICK_CONTENT.TEMPLATES, templates);
  }, [storage]);

  const loadTemplates = useCallback(() => {
    return storage.getItem(STORAGE_CATEGORIES.QUICK_CONTENT.TEMPLATES) || [];
  }, [storage]);

  const clearAll = useCallback(() => {
    return storage.clearAll();
  }, [storage]);

  const getStats = useCallback(() => {
    return storage.getStorageStats();
  }, [storage]);

  return {
    // Post management
    savePosts,
    loadPosts,
    
    // Settings management
    saveSettings,
    loadSettings,
    
    // Draft management
    saveDrafts,
    loadDrafts,
    
    // Template management
    saveTemplates,
    loadTemplates,
    
    // Utility functions
    clearAll,
    getStats,
    
    // Direct storage access (for advanced usage)
    storage,
  };
}

/**
 * Hook for Creative Studio storage
 * Provides isolated storage that never conflicts with Quick Content
 */
export function useCreativeStudioStorage(subFeature?: string) {
  const { currentBrand } = useBrand();
  
  const storage = useMemo(() => {
    const brandId = currentBrand?.id || 'default';
    return createCreativeStudioStorage(brandId, subFeature);
  }, [currentBrand?.id, subFeature]);

  // Auto-migrate existing data when brand changes
  useEffect(() => {
    if (currentBrand?.id) {
      const migrationResults = migrateToFeatureStorage(currentBrand.id);
      if (migrationResults.creativeStudioMigrated) {
        console.log('✅ Creative Studio data migrated to new storage system');
      }
    }
  }, [currentBrand?.id]);

  const saveProjects = useCallback((projects: any[]) => {
    return storage.setItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.PROJECTS, projects);
  }, [storage]);

  const loadProjects = useCallback(() => {
    return storage.getItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.PROJECTS) || [];
  }, [storage]);

  const saveAssets = useCallback((assets: any[]) => {
    return storage.setItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.ASSETS, assets);
  }, [storage]);

  const loadAssets = useCallback(() => {
    return storage.getItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.ASSETS) || [];
  }, [storage]);

  const saveDesigns = useCallback((designs: any[]) => {
    return storage.setItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.DESIGNS, designs);
  }, [storage]);

  const loadDesigns = useCallback(() => {
    return storage.getItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.DESIGNS) || [];
  }, [storage]);

  const saveIterations = useCallback((iterations: any[]) => {
    return storage.setItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.ITERATIONS, iterations);
  }, [storage]);

  const loadIterations = useCallback(() => {
    return storage.getItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.ITERATIONS) || [];
  }, [storage]);

  const saveSettings = useCallback((settings: any) => {
    return storage.setItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.SETTINGS, settings);
  }, [storage]);

  const loadSettings = useCallback(() => {
    return storage.getItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.SETTINGS);
  }, [storage]);

  const saveChatHistory = useCallback((chatHistory: any[]) => {
    return storage.setItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.CHAT_HISTORY, chatHistory);
  }, [storage]);

  const loadChatHistory = useCallback(() => {
    return storage.getItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.CHAT_HISTORY) || [];
  }, [storage]);

  const clearAll = useCallback(() => {
    return storage.clearAll();
  }, [storage]);

  const getStats = useCallback(() => {
    return storage.getStorageStats();
  }, [storage]);

  return {
    // Project management
    saveProjects,
    loadProjects,
    
    // Asset management
    saveAssets,
    loadAssets,
    
    // Design management
    saveDesigns,
    loadDesigns,
    
    // Iteration management
    saveIterations,
    loadIterations,
    
    // Settings management
    saveSettings,
    loadSettings,
    
    // Chat history management
    saveChatHistory,
    loadChatHistory,
    
    // Utility functions
    clearAll,
    getStats,
    
    // Direct storage access (for advanced usage)
    storage,
  };
}

/**
 * Hook for monitoring storage usage across both features
 */
export function useStorageMonitor() {
  const { currentBrand } = useBrand();
  const [storageStats, setStorageStats] = useState<{
    quickContent: ReturnType<FeatureStorageService['getStorageStats']>;
    creativeStudio: ReturnType<FeatureStorageService['getStorageStats']>;
    total: { keys: number; size: number };
  } | null>(null);

  const refreshStats = useCallback(() => {
    if (!currentBrand?.id) return;

    const qcStorage = createQuickContentStorage(currentBrand.id);
    const csStorage = createCreativeStudioStorage(currentBrand.id);

    const qcStats = qcStorage.getStorageStats();
    const csStats = csStorage.getStorageStats();

    setStorageStats({
      quickContent: qcStats,
      creativeStudio: csStats,
      total: {
        keys: qcStats.totalKeys + csStats.totalKeys,
        size: qcStats.estimatedSize + csStats.estimatedSize,
      },
    });
  }, [currentBrand?.id]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const clearQuickContent = useCallback(() => {
    if (!currentBrand?.id) return false;
    const qcStorage = createQuickContentStorage(currentBrand.id);
    const result = qcStorage.clearAll();
    if (result) refreshStats();
    return result;
  }, [currentBrand?.id, refreshStats]);

  const clearCreativeStudio = useCallback(() => {
    if (!currentBrand?.id) return false;
    const csStorage = createCreativeStudioStorage(currentBrand.id);
    const result = csStorage.clearAll();
    if (result) refreshStats();
    return result;
  }, [currentBrand?.id, refreshStats]);

  const clearAll = useCallback(() => {
    const qcResult = clearQuickContent();
    const csResult = clearCreativeStudio();
    return qcResult && csResult;
  }, [clearQuickContent, clearCreativeStudio]);

  return {
    storageStats,
    refreshStats,
    clearQuickContent,
    clearCreativeStudio,
    clearAll,
  };
}
