export type Platform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter';

export type BrandProfile = {
  businessName: string;
  businessType: string;
  location: string;
  logoDataUrl: string;
  visualStyle: string;
  writingTone: string;
  contentThemes: string;
};

export type GeneratedPost = {
  id: string;
  date: string;
  platform: Platform;
  content: string;
  imageUrl: string;
  imageText: string; // Added to be used for video generation
  hashtags: string;
  status: 'generated' | 'edited' | 'posted';
  videoUrl?: string; // Added to store generated video
};

export type BrandAnalysisResult = {
  visualStyle: string;
  writingTone: string;
  contentThemes: string;
};

export type GenerateDailyPostOutput = {
  content: string;
  imageText: string;
  hashtags: string;
};
