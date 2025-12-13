/**
 * Generation History Storage - Tracks recent ad generations for validation
 * Uses in-memory LRU cache with optional database persistence
 */

import { LRUCache } from 'lru-cache';
import { AdContent } from './validation-agent';

interface GenerationRecord {
  businessId: string;
  content: AdContent;
  timestamp: number;
  characteristics: {
    sellingAngle: string;
    emotionalTone: string;
    openingType: string;
  };
}

// LRU Cache: Stores last 100 generations per business, max 1 hour age
const generationCache = new LRUCache<string, GenerationRecord[]>({
  max: 100, // Max 100 businesses tracked
  ttl: 1000 * 60 * 60, // 1 hour TTL
  updateAgeOnGet: true,
  updateAgeOnHas: false,
});

/**
 * Store a new generation in history
 */
export function storeGeneration(
  businessId: string,
  content: AdContent,
  characteristics: {
    sellingAngle: string;
    emotionalTone: string;
    openingType: string;
  }
): void {
  const cacheKey = `business:${businessId}`;
  
  // Get existing history or create new array
  const history = generationCache.get(cacheKey) || [];
  
  // Add new record
  const record: GenerationRecord = {
    businessId,
    content,
    timestamp: Date.now(),
    characteristics
  };
  
  history.unshift(record); // Add to front
  
  // Keep only last 10 generations per business
  const trimmedHistory = history.slice(0, 10);
  
  generationCache.set(cacheKey, trimmedHistory);
  
  console.log(`💾 [Generation History] Stored generation for business ${businessId}`);
  console.log(`📊 [Generation History] Total history: ${trimmedHistory.length} generations`);
}

/**
 * Get recent generations for a business
 */
export function getRecentGenerations(
  businessId: string,
  limit: number = 10
): AdContent[] {
  const cacheKey = `business:${businessId}`;
  const history = generationCache.get(cacheKey) || [];
  
  console.log(`📚 [Generation History] Retrieved ${history.length} recent generations for business ${businessId}`);
  
  return history
    .slice(0, limit)
    .map(record => record.content);
}

/**
 * Get generation statistics for a business
 */
export function getGenerationStats(businessId: string): {
  totalGenerations: number;
  sellingAngles: Record<string, number>;
  emotionalTones: Record<string, number>;
  openingTypes: Record<string, number>;
  oldestGeneration: number | null;
  newestGeneration: number | null;
} {
  const cacheKey = `business:${businessId}`;
  const history = generationCache.get(cacheKey) || [];
  
  const stats = {
    totalGenerations: history.length,
    sellingAngles: {} as Record<string, number>,
    emotionalTones: {} as Record<string, number>,
    openingTypes: {} as Record<string, number>,
    oldestGeneration: history.length > 0 ? history[history.length - 1].timestamp : null,
    newestGeneration: history.length > 0 ? history[0].timestamp : null
  };
  
  // Count characteristics
  history.forEach(record => {
    const { sellingAngle, emotionalTone, openingType } = record.characteristics;
    
    stats.sellingAngles[sellingAngle] = (stats.sellingAngles[sellingAngle] || 0) + 1;
    stats.emotionalTones[emotionalTone] = (stats.emotionalTones[emotionalTone] || 0) + 1;
    stats.openingTypes[openingType] = (stats.openingTypes[openingType] || 0) + 1;
  });
  
  return stats;
}

/**
 * Clear history for a business (useful for testing)
 */
export function clearHistory(businessId: string): void {
  const cacheKey = `business:${businessId}`;
  generationCache.delete(cacheKey);
  console.log(`🗑️ [Generation History] Cleared history for business ${businessId}`);
}

/**
 * Get all cached business IDs (for debugging)
 */
export function getAllCachedBusinesses(): string[] {
  const businesses: string[] = [];
  
  for (const key of generationCache.keys()) {
    if (key.startsWith('business:')) {
      businesses.push(key.replace('business:', ''));
    }
  }
  
  return businesses;
}

/**
 * Log generation statistics (for monitoring)
 */
export function logGenerationStats(businessId: string): void {
  const stats = getGenerationStats(businessId);
  
  console.log('\n📊 [Generation Statistics]');
  console.log(`Business ID: ${businessId}`);
  console.log(`Total Generations: ${stats.totalGenerations}`);
  
  if (stats.totalGenerations > 0) {
    console.log('\n🎯 Selling Angles:');
    Object.entries(stats.sellingAngles).forEach(([angle, count]) => {
      const percentage = ((count / stats.totalGenerations) * 100).toFixed(1);
      console.log(`  - ${angle}: ${count} (${percentage}%)`);
    });
    
    console.log('\n💫 Emotional Tones:');
    Object.entries(stats.emotionalTones).forEach(([tone, count]) => {
      const percentage = ((count / stats.totalGenerations) * 100).toFixed(1);
      console.log(`  - ${tone}: ${count} (${percentage}%)`);
    });
    
    console.log('\n📝 Opening Types:');
    Object.entries(stats.openingTypes).forEach(([type, count]) => {
      const percentage = ((count / stats.totalGenerations) * 100).toFixed(1);
      console.log(`  - ${type}: ${count} (${percentage}%)`);
    });
    
    if (stats.oldestGeneration && stats.newestGeneration) {
      const ageMinutes = Math.round((stats.newestGeneration - stats.oldestGeneration) / 1000 / 60);
      console.log(`\n⏱️ History Span: ${ageMinutes} minutes`);
    }
  }
  
  console.log(''); // Empty line for readability
}
