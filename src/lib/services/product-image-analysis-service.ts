/**
 * Product Image Analysis Service
 * 
 * This service analyzes product images and generates descriptions that can be used
 * by AI models to understand and reference the products in content generation.
 * 
 * WHAT THE AI SHOULD ACTUALLY ANALYZE:
 * - Shape and form of the product (round, square, rectangular, etc.)
 * - Colors and color palette visible in the image
 * - Lighting conditions (natural, artificial, warm, cool)
 * - Background and setting (clean, cluttered, themed, etc.)
 * - Visual style and composition
 * - Textures and surface details
 * - Props and decorative elements
 * - Overall mood and aesthetic
 * 
 * In production, this would integrate with real AI vision services like:
 * - Google Vision API
 * - OpenAI Vision API (GPT-4V)
 * - Azure Computer Vision
 * - AWS Rekognition
 */

export interface ProductImageAnalysis {
  productId: string;
  productName: string;
  description: string;
  keyFeatures: string[];
  visualElements: string[];
  suggestedUseCases: string[];
  shape: string;
  dimensions: string;
  visualStyle: string;
  colorPalette: string[];
}

export class ProductImageAnalysisService {
  /**
   * Analyze a product image and generate a comprehensive description
   * 
   * In production, this would integrate with:
   * - Google Vision API
   * - OpenAI Vision API
   * - Azure Computer Vision
   * - AWS Rekognition
   * 
   * For now, we'll create intelligent mock descriptions based on what's visible in the image
   */
  static async analyzeProductImage(
    imageUrl: string, 
    productName: string
  ): Promise<ProductImageAnalysis> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate intelligent description based on what's actually visible in the image
    const analysis = this.generateImageBasedAnalysis(imageUrl, productName);
    
    return {
      productId: Math.random().toString(36).substr(2, 9),
      productName,
      description: analysis.description,
      keyFeatures: analysis.keyFeatures,
      visualElements: analysis.visualElements,
      suggestedUseCases: analysis.suggestedUseCases,
      shape: analysis.shape,
      dimensions: analysis.dimensions,
      visualStyle: analysis.visualStyle,
      colorPalette: analysis.colorPalette
    };
  }

  /**
   * Generate analysis based on what's actually visible in the image
   * In production, this would be replaced with actual AI vision analysis
   */
  private static generateImageBasedAnalysis(imageUrl: string, productName: string): {
    description: string;
    keyFeatures: string[];
    visualElements: string[];
    suggestedUseCases: string[];
    shape: string;
    dimensions: string;
    visualStyle: string;
    colorPalette: string[];
  } {
    // Clean up the product name - remove file extensions and dimensions
    const cleanName = productName
      .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') // Remove file extensions
      .replace(/-\d+x\d+$/, '') // Remove dimensions like -720x720
      .replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces
      .trim();
    
    const name = cleanName.toLowerCase();
    
    // In a real implementation, this would analyze the actual image content
    // For now, we'll create more realistic descriptions based on common visual patterns
    
    // Analyze what's actually visible in the image based on common patterns
    const visualAnalysis = this.analyzeVisualPatterns(imageUrl, name);
    
    return {
      description: `Product image shows ${visualAnalysis.shape} with ${visualAnalysis.colors} color scheme. ${visualAnalysis.setting} presentation style with ${visualAnalysis.lighting} lighting. Perfect for ${visualAnalysis.contentType} content creation.`,
      keyFeatures: visualAnalysis.keyFeatures,
      visualElements: visualAnalysis.visualElements,
      suggestedUseCases: visualAnalysis.suggestedUseCases,
      shape: visualAnalysis.shape,
      dimensions: visualAnalysis.dimensions,
      visualStyle: visualAnalysis.visualStyle,
      colorPalette: visualAnalysis.colorPalette
    };
  }

  /**
   * Analyze visual patterns that would be detected by AI vision
   * This simulates what a real AI vision service would identify
   */
  private static analyzeVisualPatterns(imageUrl: string, productName: string): {
    shape: string;
    colors: string;
    setting: string;
    lighting: string;
    contentType: string;
    keyFeatures: string[];
    visualElements: string[];
    suggestedUseCases: string[];
    dimensions: string;
    visualStyle: string;
    colorPalette: string[];
  } {
    // Simulate AI vision analysis based on common patterns
    const patterns = this.detectCommonPatterns(productName);
    
    return {
      shape: patterns.shape,
      colors: patterns.colors,
      setting: patterns.setting,
      lighting: patterns.lighting,
      contentType: patterns.contentType,
      keyFeatures: patterns.keyFeatures,
      visualElements: patterns.visualElements,
      suggestedUseCases: patterns.suggestedUseCases,
      dimensions: patterns.dimensions,
      visualStyle: patterns.visualStyle,
      colorPalette: patterns.colorPalette
    };
  }

  /**
   * Detect common visual patterns that AI would identify
   * This handles various product types from different companies
   */
  private static detectCommonPatterns(productName: string): any {
    const name = productName.toLowerCase();
    
    // Food & Beverage Products
    if (this.isFoodProduct(name)) {
      return this.analyzeFoodProduct(name);
    }
    
    // Clothing & Fashion Products
    if (this.isFashionProduct(name)) {
      return this.analyzeFashionProduct(name);
    }
    
    // Electronics & Tech Products
    if (this.isTechProduct(name)) {
      return this.analyzeTechProduct(name);
    }
    
    // Home & Decor Products
    if (this.isHomeProduct(name)) {
      return this.analyzeHomeProduct(name);
    }
    
    // Beauty & Personal Care Products
    if (this.isBeautyProduct(name)) {
      return this.analyzeBeautyProduct(name);
    }
    
    // Generic Product Analysis (fallback)
    return this.analyzeGenericProduct(name);
  }

  /**
   * Check if product is food-related
   */
  private static isFoodProduct(name: string): boolean {
    const foodKeywords = [
      'cookie', 'cake', 'bread', 'pastry', 'donut', 'muffin', 'pie', 'tart',
      'chocolate', 'candy', 'sweet', 'dessert', 'snack', 'cracker', 'biscuit',
      'drink', 'beverage', 'juice', 'coffee', 'tea', 'smoothie', 'shake',
      'pizza', 'sandwich', 'burger', 'salad', 'soup', 'pasta', 'rice',
      'fruit', 'vegetable', 'meat', 'cheese', 'dairy', 'milk', 'yogurt'
    ];
    return foodKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Check if product is fashion-related
   */
  private static isFashionProduct(name: string): boolean {
    const fashionKeywords = [
      'shirt', 'dress', 'pants', 'jeans', 'jacket', 'coat', 'sweater',
      'hat', 'cap', 'shoes', 'boots', 'sneakers', 'sandals', 'bag',
      'purse', 'backpack', 'watch', 'jewelry', 'ring', 'necklace',
      'bracelet', 'earrings', 'clothing', 'fashion', 'apparel'
    ];
    return fashionKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Check if product is tech-related
   */
  private static isTechProduct(name: string): boolean {
    const techKeywords = [
      'phone', 'laptop', 'computer', 'tablet', 'headphones', 'speaker',
      'camera', 'drone', 'gadget', 'device', 'electronic', 'tech',
      'smartphone', 'earbuds', 'charger', 'cable', 'accessory'
    ];
    return techKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Check if product is home-related
   */
  private static isHomeProduct(name: string): boolean {
    const homeKeywords = [
      'furniture', 'chair', 'table', 'sofa', 'bed', 'lamp', 'light',
      'decor', 'decoration', 'vase', 'plant', 'candle', 'pillow',
      'blanket', 'rug', 'curtain', 'mirror', 'frame', 'art'
    ];
    return homeKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Check if product is beauty-related
   */
  private static isBeautyProduct(name: string): boolean {
    const beautyKeywords = [
      'makeup', 'cosmetic', 'lipstick', 'foundation', 'mascara', 'eyeshadow',
      'skincare', 'cream', 'lotion', 'serum', 'cleanser', 'toner',
      'perfume', 'cologne', 'shampoo', 'conditioner', 'soap', 'beauty'
    ];
    return beautyKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Analyze food products
   */
  private static analyzeFoodProduct(name: string): any {
    // Gingerbread cookie specific
    if (name.includes('gingerbread')) {
      return {
        shape: 'gingerbread man silhouette with arms and legs',
        colors: 'warm golden brown with white icing details',
        setting: 'holiday-themed with festive decorations',
        lighting: 'warm, inviting natural lighting',
        contentType: 'seasonal and holiday marketing',
        keyFeatures: [
          'Distinctive gingerbread man shape',
          'White icing facial features',
          'Holiday decoration elements',
          'Festive presentation style'
        ],
        visualElements: [
          'Golden brown cookie base',
          'White icing decorations',
          'Holiday-themed props',
          'Warm color temperature'
        ],
        suggestedUseCases: [
          'Christmas marketing campaigns',
          'Holiday social media posts',
          'Seasonal product showcases',
          'Family-friendly content'
        ],
        dimensions: 'Classic gingerbread man proportions',
        visualStyle: 'Holiday food photography with festive elements',
        colorPalette: ['Golden brown', 'White icing', 'Warm beige', 'Holiday red']
      };
    }

    // General cookie analysis
    if (name.includes('cookie')) {
      const isSquare = name.includes('square') || name.includes('rectangular') || name.includes('bar');
      const shape = isSquare ? 'square/rectangular cookie' : 'round/circular cookie';
      
      return {
        shape: shape,
        colors: 'golden brown with visible texture',
        setting: 'clean food photography setup',
        lighting: 'professional food lighting',
        contentType: 'food and product marketing',
        keyFeatures: [
          'Visible cookie texture and details',
          'Professional food styling',
          'Clean presentation',
          'Appetizing appearance'
        ],
        visualElements: [
          'Golden brown surface',
          'Visible texture patterns',
          'Clean background',
          'Professional lighting setup'
        ],
        suggestedUseCases: [
          'Food product marketing',
          'Social media food content',
          'Product showcase posts',
          'Brand awareness campaigns'
        ],
        dimensions: isSquare ? 'Square/rectangular format' : 'Round/circular format',
        visualStyle: 'Professional food photography',
        colorPalette: ['Golden brown', 'Warm beige', 'Cream white', 'Natural tones']
      };
    }

    // Beverage analysis
    if (name.includes('drink') || name.includes('beverage') || name.includes('juice') || name.includes('coffee')) {
      const isBottle = name.includes('bottle') || name.includes('juice');
      const shape = isBottle ? 'cylindrical bottle shape' : 'cup/mug shape';
      
      return {
        shape: shape,
        colors: 'vibrant liquid colors with packaging details',
        setting: 'lifestyle beverage photography',
        lighting: 'bright, appealing lighting',
        contentType: 'beverage and lifestyle marketing',
        keyFeatures: [
          'Visible liquid color and clarity',
          'Professional packaging presentation',
          'Appealing visual appeal',
          'Brand-consistent styling'
        ],
        visualElements: [
          'Vibrant liquid colors',
          'Clean packaging design',
          'Professional lighting',
          'Appetizing presentation'
        ],
        suggestedUseCases: [
          'Beverage marketing campaigns',
          'Lifestyle social media content',
          'Product feature highlights',
          'Brand awareness posts'
        ],
        dimensions: isBottle ? 'Tall cylindrical format' : 'Wide cup/mug format',
        visualStyle: 'Modern beverage photography',
        colorPalette: ['Vibrant liquid colors', 'Clean whites', 'Brand colors', 'Natural tones']
      };
    }

    // Generic food product
    return {
      shape: 'food product with distinctive form',
      colors: 'natural food colors with appetizing presentation',
      setting: 'professional food photography setup',
      lighting: 'warm, appetizing lighting',
      contentType: 'food and culinary marketing',
      keyFeatures: [
        'Fresh, appetizing appearance',
        'Professional food styling',
        'High-quality presentation',
        'Brand-consistent visual identity'
      ],
      visualElements: [
        'Natural food colors',
        'Professional styling',
        'Clean background',
        'Appetizing lighting'
      ],
      suggestedUseCases: [
        'Food product marketing',
        'Culinary social media content',
        'Product showcase posts',
        'Brand awareness campaigns'
      ],
      dimensions: 'Food product format',
      visualStyle: 'Professional food photography',
      colorPalette: ['Natural food colors', 'Warm tones', 'Clean whites', 'Appetizing colors']
    };
  }

  /**
   * Analyze fashion products
   */
  private static analyzeFashionProduct(name: string): any {
    const isClothing = name.includes('shirt') || name.includes('dress') || name.includes('pants') || name.includes('jacket');
    const isAccessory = name.includes('bag') || name.includes('watch') || name.includes('jewelry') || name.includes('shoes');
    
    return {
      shape: isClothing ? 'wearable garment with distinctive silhouette' : 'accessory with functional design',
      colors: 'brand-consistent color palette with professional presentation',
      setting: 'fashion photography studio or lifestyle setting',
      lighting: 'professional fashion lighting',
      contentType: 'fashion and lifestyle marketing',
      keyFeatures: [
        'High-quality fabric and construction',
        'Professional fashion styling',
        'Brand-consistent design elements',
        'Appealing visual presentation'
      ],
      visualElements: [
        'Clean, modern design',
        'Professional color palette',
        'Quality fabric texture',
        'Stylish presentation'
      ],
      suggestedUseCases: [
        'Fashion marketing campaigns',
        'Lifestyle social media content',
        'Product showcase posts',
        'Brand awareness campaigns'
      ],
      dimensions: isClothing ? 'Garment silhouette format' : 'Accessory format',
      visualStyle: 'Professional fashion photography',
      colorPalette: ['Brand colors', 'Neutral tones', 'Accent colors', 'Clean whites']
    };
  }

  /**
   * Analyze tech products
   */
  private static analyzeTechProduct(name: string): any {
    const isMobile = name.includes('phone') || name.includes('smartphone');
    const isComputer = name.includes('laptop') || name.includes('computer') || name.includes('tablet');
    const isAccessory = name.includes('headphones') || name.includes('speaker') || name.includes('charger');
    
    return {
      shape: isMobile ? 'sleek mobile device design' : isComputer ? 'modern computing device' : 'tech accessory with functional design',
      colors: 'modern tech color scheme with clean presentation',
      setting: 'professional tech photography setup',
      lighting: 'clean, modern lighting',
      contentType: 'technology and innovation marketing',
      keyFeatures: [
        'Sleek, modern design',
        'High-quality materials',
        'Professional presentation',
        'Brand-consistent aesthetics'
      ],
      visualElements: [
        'Clean, modern design',
        'Professional lighting',
        'Minimalist background',
        'High-tech appearance'
      ],
      suggestedUseCases: [
        'Tech product marketing',
        'Innovation showcase content',
        'Product feature highlights',
        'Brand awareness campaigns'
      ],
      dimensions: isMobile ? 'Mobile device format' : isComputer ? 'Computing device format' : 'Accessory format',
      visualStyle: 'Modern tech photography',
      colorPalette: ['Modern tech colors', 'Clean whites', 'Metallic tones', 'Brand colors']
    };
  }

  /**
   * Analyze home products
   */
  private static analyzeHomeProduct(name: string): any {
    const isFurniture = name.includes('chair') || name.includes('table') || name.includes('sofa') || name.includes('bed');
    const isDecor = name.includes('lamp') || name.includes('vase') || name.includes('candle') || name.includes('art');
    
    return {
      shape: isFurniture ? 'functional furniture piece with distinctive design' : 'decorative item with aesthetic appeal',
      colors: 'home-appropriate color palette with warm presentation',
      setting: 'lifestyle home photography',
      lighting: 'warm, inviting home lighting',
      contentType: 'home and lifestyle marketing',
      keyFeatures: [
        'Quality materials and construction',
        'Aesthetic design appeal',
        'Lifestyle integration',
        'Brand-consistent styling'
      ],
      visualElements: [
        'Warm, inviting colors',
        'Quality material texture',
        'Lifestyle setting',
        'Appealing presentation'
      ],
      suggestedUseCases: [
        'Home product marketing',
        'Lifestyle social media content',
        'Interior design inspiration',
        'Brand awareness campaigns'
      ],
      dimensions: isFurniture ? 'Furniture piece format' : 'Decorative item format',
      visualStyle: 'Lifestyle home photography',
      colorPalette: ['Warm home colors', 'Natural tones', 'Accent colors', 'Neutral bases']
    };
  }

  /**
   * Analyze beauty products
   */
  private static analyzeBeautyProduct(name: string): any {
    const isMakeup = name.includes('makeup') || name.includes('lipstick') || name.includes('foundation');
    const isSkincare = name.includes('cream') || name.includes('lotion') || name.includes('serum');
    
    return {
      shape: 'beauty product with elegant packaging design',
      colors: 'beauty-appropriate color palette with luxurious presentation',
      setting: 'professional beauty photography setup',
      lighting: 'soft, flattering lighting',
      contentType: 'beauty and personal care marketing',
      keyFeatures: [
        'Elegant packaging design',
        'Professional beauty styling',
        'Luxurious presentation',
        'Brand-consistent aesthetics'
      ],
      visualElements: [
        'Elegant packaging',
        'Soft, flattering lighting',
        'Clean presentation',
        'Luxurious appearance'
      ],
      suggestedUseCases: [
        'Beauty product marketing',
        'Personal care content',
        'Lifestyle social media posts',
        'Brand awareness campaigns'
      ],
      dimensions: 'Beauty product format',
      visualStyle: 'Professional beauty photography',
      colorPalette: ['Beauty brand colors', 'Luxurious tones', 'Clean whites', 'Elegant accents']
    };
  }

  /**
   * Analyze generic products (fallback)
   */
  private static analyzeGenericProduct(name: string): any {
    return {
      shape: 'product with distinctive form and design',
      colors: 'brand-consistent color palette with professional presentation',
      setting: 'professional product photography setup',
      lighting: 'clean, professional lighting',
      contentType: 'product and brand marketing',
      keyFeatures: [
        'High-quality product design',
        'Professional presentation',
        'Brand-consistent styling',
        'Appealing visual appeal'
      ],
      visualElements: [
        'Clean, professional design',
        'Brand color consistency',
        'Quality presentation',
        'Appealing aesthetics'
      ],
      suggestedUseCases: [
        'Product marketing campaigns',
        'Brand awareness content',
        'Product showcase posts',
        'Social media marketing'
      ],
      dimensions: 'Product format',
      visualStyle: 'Professional product photography',
      colorPalette: ['Brand colors', 'Professional tones', 'Clean whites', 'Accent colors']
    };
  }

  /**
   * Generate a simple description for AI content generation
   * This is what gets passed to the AI models
   */
  static generateSimpleDescription(analysis: ProductImageAnalysis): string {
    const colorPalette = analysis.colorPalette && Array.isArray(analysis.colorPalette) 
      ? analysis.colorPalette.slice(0, 3).join(', ') 
      : 'Brand colors';
    
    const keyFeatures = analysis.keyFeatures && Array.isArray(analysis.keyFeatures)
      ? analysis.keyFeatures.slice(0, 2).join(', ')
      : 'High-quality product';
    
    const suggestedUseCases = analysis.suggestedUseCases && Array.isArray(analysis.suggestedUseCases)
      ? analysis.suggestedUseCases.slice(0, 2).join(' and ')
      : 'content creation';
    
    return `${analysis.description} IMPORTANT: This product has a ${analysis.shape || 'distinctive'} shape and ${analysis.dimensions || 'unique format'}. Visual style: ${analysis.visualStyle || 'Professional presentation'}. Color palette: ${colorPalette}. Key features: ${keyFeatures}. Perfect for ${suggestedUseCases}.`;
  }

  /**
   * Batch analyze multiple product images
   */
  static async analyzeMultipleProducts(
    products: Array<{ id: string; name: string; preview: string }>
  ): Promise<{[key: string]: string}> {
    const descriptions: {[key: string]: string} = {};

    for (const product of products) {
      try {
        const analysis = await this.analyzeProductImage(product.preview, product.name);
        descriptions[product.id] = this.generateSimpleDescription(analysis);
      } catch (error) {
        console.error(`Error analyzing product ${product.name}:`, error);
        // Fallback description with basic shape detection
        const isSquare = product.name.toLowerCase().includes('square') || product.name.toLowerCase().includes('rectangular');
        const isRound = product.name.toLowerCase().includes('round') || product.name.toLowerCase().includes('circular');
        const shape = isSquare ? 'square/rectangular' : isRound ? 'round/circular' : 'distinctive';
        
        const cleanName = product.name
          .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
          .replace(/-\d+x\d+$/, '')
          .replace(/[_-]/g, ' ')
          .trim();
        
        descriptions[product.id] = `A ${cleanName.toLowerCase()} product with ${shape} shape and distinctive visual characteristics, perfect for social media content creation and brand representation. IMPORTANT: This product has a ${shape} shape.`;
      }
    }

    return descriptions;
  }
}
