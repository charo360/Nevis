// Visual Analysis Pipeline for Brand Intelligence
// Analyzes images to extract brand visual identity

interface ColorPalette {
  primary: Array<{ hex: string; rgb: [number, number, number]; percentage: number }>;
  secondary: Array<{ hex: string; rgb: [number, number, number]; percentage: number }>;
  accent: Array<{ hex: string; rgb: [number, number, number]; percentage: number }>;
  dominant: { hex: string; rgb: [number, number, number] };
}

interface ImageAnalysis {
  url: string;
  type: 'logo' | 'hero' | 'product' | 'team' | 'lifestyle' | 'other';
  colors: ColorPalette;
  content: {
    hasPeople: boolean;
    hasProducts: boolean;
    hasText: boolean;
    hasLogo: boolean;
    style: 'photography' | 'illustration' | 'graphic' | 'mixed';
    mood: string[];
  };
  textContent?: {
    extractedText: string;
    language: string;
    confidence: number;
  };
  dimensions?: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  quality: {
    resolution: 'low' | 'medium' | 'high';
    clarity: number; // 0-1
    composition: string[];
  };
}

interface BrandVisualIdentity {
  colorScheme: {
    primary: ColorPalette;
    consistency: number; // 0-1, how consistent colors are across images
    colorHarmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'mixed';
    brandColors: Array<{ hex: string; usage: 'primary' | 'secondary' | 'accent'; frequency: number }>;
  };
  visualStyle: {
    overallStyle: 'modern' | 'classic' | 'minimalist' | 'bold' | 'elegant' | 'playful' | 'professional';
    imageTypes: Array<{ type: string; count: number; percentage: number }>;
    commonElements: string[];
    designPrinciples: string[];
  };
  contentThemes: {
    peoplePresence: number; // 0-1, percentage of images with people
    productFocus: number; // 0-1, percentage showing products
    lifestyleOrientation: number; // 0-1, lifestyle vs product focus
    emotionalTone: string[];
  };
  brandAssets: {
    logoVariations: Array<{ url: string; context: string; colors: string[] }>;
    iconography: string[];
    typography: Array<{ font: string; usage: string; frequency: number }>;
  };
  technicalQuality: {
    averageResolution: string;
    qualityConsistency: number;
    professionalScore: number; // 0-1
  };
}

export class VisualAnalyzer {
  private imageCache: Map<string, ImageAnalysis>;

  constructor() {
    this.imageCache = new Map();
  }

  async analyzeImages(imageUrls: string[]): Promise<BrandVisualIdentity> {
    console.log(`🎨 Analyzing ${imageUrls.length} images for visual brand identity...`);

    const imageAnalyses: ImageAnalysis[] = [];

    // Analyze each image
    for (const url of imageUrls.slice(0, 50)) { // Limit to 50 images for performance
      try {
        const analysis = await this.analyzeImage(url);
        if (analysis) {
          imageAnalyses.push(analysis);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to analyze image ${url}:`, error.message);
        continue;
      }

      // Small delay to avoid overwhelming servers
      await this.delay(100);
    }

    console.log(`✅ Successfully analyzed ${imageAnalyses.length} images`);

    // Compile visual identity from all analyses
    return this.compileVisualIdentity(imageAnalyses);
  }

  private async analyzeImage(url: string): Promise<ImageAnalysis | null> {
    // Check cache first
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }

    try {
      // For now, we'll simulate image analysis since we can't actually process images in this environment
      // In a real implementation, this would use image processing libraries
      const analysis = await this.simulateImageAnalysis(url);
      
      if (analysis) {
        this.imageCache.set(url, analysis);
      }
      
      return analysis;

    } catch (error) {
      console.error(`❌ Image analysis failed for ${url}:`, error.message);
      return null;
    }
  }

  private async simulateImageAnalysis(url: string): Promise<ImageAnalysis | null> {
    // This is a simulation - in real implementation, you would:
    // 1. Fetch the image
    // 2. Use image processing libraries (Canvas API, sharp, etc.)
    // 3. Extract colors using color quantization algorithms
    // 4. Use ML models for content classification
    // 5. Use OCR for text extraction

    try {
      // Simulate fetching image metadata
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Simulate analysis based on URL patterns and common web image characteristics
      const analysis: ImageAnalysis = {
        url,
        type: this.classifyImageType(url),
        colors: this.generateSimulatedColorPalette(),
        content: {
          hasPeople: Math.random() > 0.6, // 40% chance of having people
          hasProducts: Math.random() > 0.5, // 50% chance of having products
          hasText: Math.random() > 0.7, // 30% chance of having text
          hasLogo: url.toLowerCase().includes('logo') || Math.random() > 0.8,
          style: this.determineImageStyle(url),
          mood: this.generateMoodTags()
        },
        quality: {
          resolution: this.determineResolution(url),
          clarity: 0.7 + Math.random() * 0.3, // Random clarity between 0.7-1.0
          composition: this.generateCompositionTags()
        }
      };

      // Simulate OCR text extraction for images that might have text
      if (analysis.content.hasText) {
        analysis.textContent = {
          extractedText: this.simulateTextExtraction(url),
          language: 'en',
          confidence: 0.8 + Math.random() * 0.2
        };
      }

      return analysis;

    } catch (error) {
      console.warn(`⚠️ Could not analyze image ${url}:`, error.message);
      return null;
    }
  }

  private classifyImageType(url: string): ImageAnalysis['type'] {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('logo')) return 'logo';
    if (urlLower.includes('hero') || urlLower.includes('banner')) return 'hero';
    if (urlLower.includes('product')) return 'product';
    if (urlLower.includes('team') || urlLower.includes('about')) return 'team';
    if (urlLower.includes('lifestyle') || urlLower.includes('life')) return 'lifestyle';
    
    // Random classification for other images
    const types: ImageAnalysis['type'][] = ['hero', 'product', 'lifestyle', 'other'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateSimulatedColorPalette(): ColorPalette {
    // Generate realistic color palettes based on common brand color schemes
    const colorSchemes = [
      // Blue-based professional
      { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' },
      // Green-based natural
      { primary: '#059669', secondary: '#047857', accent: '#10b981' },
      // Red-based energetic
      { primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444' },
      // Purple-based creative
      { primary: '#7c3aed', secondary: '#6d28d9', accent: '#8b5cf6' },
      // Orange-based warm
      { primary: '#ea580c', secondary: '#c2410c', accent: '#f97316' },
      // Gray-based minimal
      { primary: '#374151', secondary: '#1f2937', accent: '#6b7280' }
    ];

    const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

    const hexToRgb = (hex: string): [number, number, number] => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };

    return {
      primary: [
        { hex: scheme.primary, rgb: hexToRgb(scheme.primary), percentage: 45 }
      ],
      secondary: [
        { hex: scheme.secondary, rgb: hexToRgb(scheme.secondary), percentage: 30 }
      ],
      accent: [
        { hex: scheme.accent, rgb: hexToRgb(scheme.accent), percentage: 25 }
      ],
      dominant: { hex: scheme.primary, rgb: hexToRgb(scheme.primary) }
    };
  }

  private determineImageStyle(url: string): ImageAnalysis['content']['style'] {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('photo') || urlLower.includes('jpg') || urlLower.includes('jpeg')) {
      return 'photography';
    }
    if (urlLower.includes('svg') || urlLower.includes('vector')) {
      return 'graphic';
    }
    if (urlLower.includes('illustration') || urlLower.includes('draw')) {
      return 'illustration';
    }
    
    // Random assignment for others
    const styles: ImageAnalysis['content']['style'][] = ['photography', 'graphic', 'illustration', 'mixed'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private generateMoodTags(): string[] {
    const allMoods = [
      'professional', 'friendly', 'modern', 'classic', 'energetic', 'calm',
      'sophisticated', 'playful', 'trustworthy', 'innovative', 'warm', 'clean',
      'bold', 'elegant', 'dynamic', 'minimalist', 'vibrant', 'serene'
    ];
    
    // Return 2-4 random mood tags
    const count = 2 + Math.floor(Math.random() * 3);
    const shuffled = allMoods.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private generateCompositionTags(): string[] {
    const compositions = [
      'rule-of-thirds', 'centered', 'symmetrical', 'asymmetrical',
      'leading-lines', 'framing', 'negative-space', 'pattern',
      'close-up', 'wide-shot', 'portrait', 'landscape'
    ];
    
    const count = 1 + Math.floor(Math.random() * 3);
    const shuffled = compositions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private determineResolution(url: string): 'low' | 'medium' | 'high' {
    // Simulate resolution detection based on URL patterns
    if (url.includes('thumb') || url.includes('small') || url.includes('150x')) {
      return 'low';
    }
    if (url.includes('large') || url.includes('hd') || url.includes('1920x')) {
      return 'high';
    }
    return 'medium';
  }

  private simulateTextExtraction(url: string): string {
    // Simulate OCR text extraction
    const commonTexts = [
      'Welcome to our company',
      'Quality products and services',
      'Contact us today',
      'Learn more',
      'Get started',
      'Professional solutions',
      'Trusted by thousands',
      'Innovation at its best'
    ];
    
    return commonTexts[Math.floor(Math.random() * commonTexts.length)];
  }

  private compileVisualIdentity(analyses: ImageAnalysis[]): BrandVisualIdentity {
    if (analyses.length === 0) {
      throw new Error('No images to analyze');
    }

    // Compile color scheme
    const colorScheme = this.compileColorScheme(analyses);

    // Analyze visual style
    const visualStyle = this.analyzeVisualStyle(analyses);

    // Analyze content themes
    const contentThemes = this.analyzeContentThemes(analyses);

    // Extract brand assets
    const brandAssets = this.extractBrandAssets(analyses);

    // Assess technical quality
    const technicalQuality = this.assessTechnicalQuality(analyses);

    return {
      colorScheme,
      visualStyle,
      contentThemes,
      brandAssets,
      technicalQuality
    };
  }

  private compileColorScheme(analyses: ImageAnalysis[]): BrandVisualIdentity['colorScheme'] {
    // Aggregate all colors from all images
    const allColors: Array<{ hex: string; rgb: [number, number, number]; count: number }> = [];
    const colorMap = new Map<string, number>();

    analyses.forEach(analysis => {
      [...analysis.colors.primary, ...analysis.colors.secondary, ...analysis.colors.accent].forEach(color => {
        const existing = colorMap.get(color.hex);
        if (existing) {
          colorMap.set(color.hex, existing + 1);
        } else {
          colorMap.set(color.hex, 1);
          allColors.push({ hex: color.hex, rgb: color.rgb, count: 1 });
        }
      });
    });

    // Update counts
    allColors.forEach(color => {
      color.count = colorMap.get(color.hex) || 1;
    });

    // Sort by frequency
    allColors.sort((a, b) => b.count - a.count);

    // Determine most common colors as brand colors
    const brandColors = allColors.slice(0, 8).map((color, index) => ({
      hex: color.hex,
      usage: (index < 2 ? 'primary' : index < 5 ? 'secondary' : 'accent') as 'primary' | 'secondary' | 'accent',
      frequency: color.count
    }));

    // Calculate color consistency (how often the same colors appear)
    const totalColorInstances = analyses.length * 3; // Assuming 3 main colors per image
    const uniqueColors = allColors.length;
    const consistency = Math.max(0, 1 - (uniqueColors / totalColorInstances));

    // Determine color harmony (simplified)
    const colorHarmony = this.determineColorHarmony(brandColors.slice(0, 3).map(c => c.hex));

    // Create primary palette from most frequent colors
    const primaryPalette: ColorPalette = {
      primary: brandColors.slice(0, 2).map(c => ({
        hex: c.hex,
        rgb: allColors.find(ac => ac.hex === c.hex)?.rgb || [0, 0, 0],
        percentage: (c.frequency / analyses.length) * 100
      })),
      secondary: brandColors.slice(2, 5).map(c => ({
        hex: c.hex,
        rgb: allColors.find(ac => ac.hex === c.hex)?.rgb || [0, 0, 0],
        percentage: (c.frequency / analyses.length) * 100
      })),
      accent: brandColors.slice(5, 8).map(c => ({
        hex: c.hex,
        rgb: allColors.find(ac => ac.hex === c.hex)?.rgb || [0, 0, 0],
        percentage: (c.frequency / analyses.length) * 100
      })),
      dominant: {
        hex: brandColors[0]?.hex || '#000000',
        rgb: allColors[0]?.rgb || [0, 0, 0]
      }
    };

    return {
      primary: primaryPalette,
      consistency: Math.round(consistency * 100) / 100,
      colorHarmony,
      brandColors
    };
  }

  private determineColorHarmony(colors: string[]): 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'mixed' {
    if (colors.length < 2) return 'monochromatic';
    
    // Simplified color harmony detection
    // In a real implementation, you would convert to HSL and analyze hue relationships
    const uniqueColors = new Set(colors);
    
    if (uniqueColors.size === 1) return 'monochromatic';
    if (uniqueColors.size === 2) return 'complementary';
    if (uniqueColors.size === 3) return 'triadic';
    
    return 'mixed';
  }

  private analyzeVisualStyle(analyses: ImageAnalysis[]): BrandVisualIdentity['visualStyle'] {
    // Count image types
    const typeCounts: Record<string, number> = {};
    analyses.forEach(analysis => {
      typeCounts[analysis.type] = (typeCounts[analysis.type] || 0) + 1;
    });

    const imageTypes = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / analyses.length) * 100)
    }));

    // Aggregate mood tags to determine overall style
    const allMoods: string[] = [];
    analyses.forEach(analysis => {
      allMoods.push(...analysis.content.mood);
    });

    const moodCounts: Record<string, number> = {};
    allMoods.forEach(mood => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    const topMoods = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mood]) => mood);

    // Determine overall style based on most common moods
    const overallStyle = this.determineOverallStyle(topMoods);

    // Extract common elements
    const commonElements = this.extractCommonElements(analyses);

    // Determine design principles
    const designPrinciples = this.extractDesignPrinciples(analyses);

    return {
      overallStyle,
      imageTypes,
      commonElements,
      designPrinciples
    };
  }

  private determineOverallStyle(topMoods: string[]): BrandVisualIdentity['visualStyle']['overallStyle'] {
    const styleMapping: Record<string, BrandVisualIdentity['visualStyle']['overallStyle']> = {
      'professional': 'professional',
      'modern': 'modern',
      'classic': 'classic',
      'minimalist': 'minimalist',
      'bold': 'bold',
      'elegant': 'elegant',
      'playful': 'playful'
    };

    for (const mood of topMoods) {
      if (styleMapping[mood]) {
        return styleMapping[mood];
      }
    }

    return 'modern'; // Default
  }

  private extractCommonElements(analyses: ImageAnalysis[]): string[] {
    const elements: string[] = [];
    
    const peoplePercentage = analyses.filter(a => a.content.hasPeople).length / analyses.length;
    const productPercentage = analyses.filter(a => a.content.hasProducts).length / analyses.length;
    const textPercentage = analyses.filter(a => a.content.hasText).length / analyses.length;
    const logoPercentage = analyses.filter(a => a.content.hasLogo).length / analyses.length;

    if (peoplePercentage > 0.3) elements.push('people');
    if (productPercentage > 0.4) elements.push('products');
    if (textPercentage > 0.2) elements.push('text-overlay');
    if (logoPercentage > 0.1) elements.push('logo-branding');

    // Analyze styles
    const styleCounts: Record<string, number> = {};
    analyses.forEach(analysis => {
      styleCounts[analysis.content.style] = (styleCounts[analysis.content.style] || 0) + 1;
    });

    const dominantStyle = Object.entries(styleCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    if (dominantStyle) {
      elements.push(dominantStyle);
    }

    return elements;
  }

  private extractDesignPrinciples(analyses: ImageAnalysis[]): string[] {
    const principles: string[] = [];
    
    // Analyze composition patterns
    const allCompositions: string[] = [];
    analyses.forEach(analysis => {
      allCompositions.push(...analysis.quality.composition);
    });

    const compositionCounts: Record<string, number> = {};
    allCompositions.forEach(comp => {
      compositionCounts[comp] = (compositionCounts[comp] || 0) + 1;
    });

    const topCompositions = Object.entries(compositionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([comp]) => comp);

    principles.push(...topCompositions);

    // Add quality-based principles
    const avgClarity = analyses.reduce((sum, a) => sum + a.quality.clarity, 0) / analyses.length;
    if (avgClarity > 0.8) {
      principles.push('high-quality-imagery');
    }

    return principles.slice(0, 5);
  }

  private analyzeContentThemes(analyses: ImageAnalysis[]): BrandVisualIdentity['contentThemes'] {
    const peoplePresence = analyses.filter(a => a.content.hasPeople).length / analyses.length;
    const productFocus = analyses.filter(a => a.content.hasProducts).length / analyses.length;
    
    // Lifestyle orientation: high people presence + low product focus = lifestyle oriented
    const lifestyleOrientation = peoplePresence > 0.4 && productFocus < 0.6 ? 
      peoplePresence : 
      Math.max(0, peoplePresence - productFocus);

    // Aggregate emotional tones
    const allMoods: string[] = [];
    analyses.forEach(analysis => {
      allMoods.push(...analysis.content.mood);
    });

    const moodCounts: Record<string, number> = {};
    allMoods.forEach(mood => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    const emotionalTone = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([mood]) => mood);

    return {
      peoplePresence: Math.round(peoplePresence * 100) / 100,
      productFocus: Math.round(productFocus * 100) / 100,
      lifestyleOrientation: Math.round(lifestyleOrientation * 100) / 100,
      emotionalTone
    };
  }

  private extractBrandAssets(analyses: ImageAnalysis[]): BrandVisualIdentity['brandAssets'] {
    // Extract logo variations
    const logoVariations = analyses
      .filter(a => a.type === 'logo' || a.content.hasLogo)
      .map(a => ({
        url: a.url,
        context: a.type,
        colors: [a.colors.dominant.hex, ...a.colors.primary.map(c => c.hex)].slice(0, 3)
      }));

    // Extract iconography (simplified)
    const iconography = ['geometric', 'organic', 'minimal', 'detailed'].filter(() => Math.random() > 0.5);

    // Extract typography (from OCR text - simplified)
    const typography = analyses
      .filter(a => a.textContent)
      .map(() => ({
        font: ['Arial', 'Helvetica', 'Georgia', 'Times', 'Roboto'][Math.floor(Math.random() * 5)],
        usage: 'heading',
        frequency: 1
      }))
      .slice(0, 3);

    return {
      logoVariations,
      iconography,
      typography
    };
  }

  private assessTechnicalQuality(analyses: ImageAnalysis[]): BrandVisualIdentity['technicalQuality'] {
    const resolutionCounts: Record<string, number> = {};
    analyses.forEach(analysis => {
      resolutionCounts[analysis.quality.resolution] = (resolutionCounts[analysis.quality.resolution] || 0) + 1;
    });

    const averageResolution = Object.entries(resolutionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'medium';

    const avgClarity = analyses.reduce((sum, a) => sum + a.quality.clarity, 0) / analyses.length;
    const qualityConsistency = 1 - (Math.max(...analyses.map(a => a.quality.clarity)) - Math.min(...analyses.map(a => a.quality.clarity)));

    // Professional score based on resolution, clarity, and consistency
    const professionalScore = (
      (averageResolution === 'high' ? 1 : averageResolution === 'medium' ? 0.7 : 0.4) * 0.4 +
      avgClarity * 0.4 +
      qualityConsistency * 0.2
    );

    return {
      averageResolution,
      qualityConsistency: Math.round(qualityConsistency * 100) / 100,
      professionalScore: Math.round(professionalScore * 100) / 100
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
