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
  platform: 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter';
  content: string;
  imageUrl: string;
  hashtags: string;
  status: 'generated' | 'edited' | 'posted';
};

export type BrandAnalysisResult = {
  visualStyle: string;
  writingTone: string;
  contentThemes: string;
};
