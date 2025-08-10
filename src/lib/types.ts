export type Platform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter';

export type BrandProfile = {
  businessName: string;
  businessType: string;
  location: string;
  logoDataUrl: string;
  visualStyle: string;
  writingTone: string;
  contentThemes: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
};

export type GeneratedPost = {
  id: string;
  date: string;
  content: string;
  hashtags: string;
  status: 'generated' | 'edited' | 'posted';
  variants: {
    platform: Platform;
    imageUrl: string;
  }[];
  imageText: string;
  videoUrl?: string;
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
