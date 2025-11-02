import type { BrandProfile } from '@/lib/types';

export type TextGenerationParams = {
  temperature: number;
  maxTokens: number;
};

export type TextGenerationHandler = {
  label: string;
  generate: (
    prompt: string,
    params: TextGenerationParams
  ) => Promise<{
    text: string;
    model?: string;
    tokensUsed?: number;
    processingTime?: number;
  }>;
};

export const normalizeStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item : String(item ?? '')))
      .map(item => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const normalizeServiceList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(service => {
        if (typeof service === 'string') return service;
        if (service && typeof service === 'object' && 'name' in service) {
          return String((service as { name?: string }).name ?? '');
        }
        return '';
      })
      .map(item => item.trim())
      .filter(Boolean);
  }

  return normalizeStringList(value);
};

export type RecentOutput = { headlines: string[]; captions: string[]; concepts: string[] };

export const getBrandKey = (brandProfile: BrandProfile, platform: string | undefined) => {
  const businessName = brandProfile.businessName || 'unknown-business';
  const location = brandProfile.location || 'unknown-location';
  const platformKey = platform || 'unknown-platform';
  return `${businessName}-${location}-${platformKey}`.toLowerCase();
};
