/**
 * Business Type Detection Module
 * 
 * Intelligently detects business type(s) from brand profile data
 * Supports primary and secondary type detection for hybrid businesses
 */

export type BusinessTypeCategory =
  | 'retail'
  | 'service'
  | 'saas'
  | 'food'
  | 'finance'
  | 'healthcare'
  | 'realestate'
  | 'education'
  | 'b2b'
  | 'nonprofit';

export interface BusinessTypeDetection {
  primaryType: BusinessTypeCategory;
  secondaryType?: BusinessTypeCategory;
  confidence: number; // 0-100
  detectionSignals: string[];
  isHybrid: boolean;
}

interface DetectionKeywords {
  type: BusinessTypeCategory;
  keywords: string[];
  weight: number; // Higher weight = stronger signal
}

// Detection keyword patterns with weights
const DETECTION_PATTERNS: DetectionKeywords[] = [
  // RETAIL/ECOMMERCE
  {
    type: 'retail',
    keywords: [
      'shop', 'store', 'boutique', 'marketplace', 'ecommerce', 'e-commerce',
      'retail', 'products', 'inventory', 'stock', 'buy', 'purchase',
      'clothing', 'electronics', 'furniture', 'accessories', 'goods',
      'shopping', 'cart', 'checkout', 'shipping', 'delivery'
    ],
    weight: 1.0
  },

  // SERVICE BUSINESS
  {
    type: 'service',
    keywords: [
      'service', 'services', 'consultation', 'consulting', 'appointment',
      'booking', 'professional', 'expert', 'specialist', 'agency',
      'repair', 'maintenance', 'cleaning', 'plumbing', 'electrical',
      'legal', 'law', 'attorney', 'accounting', 'marketing', 'design',
      'photography', 'event', 'catering', 'salon', 'spa', 'barber'
    ],
    weight: 1.0
  },

  // SAAS/DIGITAL PRODUCT
  {
    type: 'saas',
    keywords: [
      'saas', 'software', 'app', 'application', 'platform', 'digital',
      'subscription', 'cloud', 'api', 'integration', 'automation',
      'dashboard', 'analytics', 'crm', 'erp', 'tool', 'solution',
      'technology', 'tech', 'system', 'online platform', 'web app'
    ],
    weight: 1.0
  },

  // FOOD & BEVERAGE
  {
    type: 'food',
    keywords: [
      'restaurant', 'cafe', 'coffee', 'bistro', 'eatery', 'dining',
      'food', 'menu', 'cuisine', 'chef', 'kitchen', 'bakery',
      'bar', 'pub', 'grill', 'pizzeria', 'deli', 'catering',
      'delivery', 'takeout', 'dine-in', 'reservation', 'table',
      'cookies', 'pastry', 'pastries', 'bread', 'baked goods',
      'dessert', 'desserts', 'cake', 'cakes', 'snack', 'snacks',
      'beverage', 'beverages', 'drink', 'drinks', 'meal', 'meals'
    ],
    weight: 1.5  // Higher weight to prioritize food over retail
  },

  // FINANCIAL SERVICES
  {
    type: 'finance',
    keywords: [
      'bank', 'banking', 'finance', 'financial', 'loan', 'credit',
      'payment', 'transfer', 'account', 'savings', 'investment',
      'insurance', 'mortgage', 'fintech', 'wallet', 'money',
      'interest', 'rate', 'apr', 'lending', 'borrowing'
    ],
    weight: 1.0
  },

  // HEALTHCARE
  {
    type: 'healthcare',
    keywords: [
      'health', 'healthcare', 'medical', 'clinic', 'hospital', 'doctor',
      'dental', 'dentist', 'pharmacy', 'medicine', 'treatment',
      'therapy', 'wellness', 'fitness', 'gym', 'yoga', 'nutrition',
      'patient', 'diagnosis', 'care', 'physiotherapy'
    ],
    weight: 1.0
  },

  // REAL ESTATE
  {
    type: 'realestate',
    keywords: [
      'real estate', 'property', 'properties', 'housing', 'apartment',
      'rental', 'lease', 'landlord', 'tenant', 'mortgage', 'home',
      'house', 'condo', 'commercial property', 'land', 'plot',
      'developer', 'construction', 'building', 'estate agent'
    ],
    weight: 1.0
  },

  // EDUCATION
  {
    type: 'education',
    keywords: [
      'education', 'school', 'academy', 'university', 'college', 'course',
      'training', 'learning', 'tutor', 'tutoring', 'teaching', 'class',
      'student', 'instructor', 'curriculum', 'certification', 'degree',
      'bootcamp', 'workshop', 'seminar', 'e-learning', 'online course'
    ],
    weight: 1.0
  },

  // B2B/ENTERPRISE
  {
    type: 'b2b',
    keywords: [
      'b2b', 'enterprise', 'business solutions', 'corporate', 'wholesale',
      'supplier', 'distributor', 'manufacturer', 'industrial', 'commercial',
      'procurement', 'vendor', 'partnership', 'enterprise software',
      'business services', 'professional services', 'consulting'
    ],
    weight: 1.0
  },

  // NONPROFIT/ADVOCACY
  {
    type: 'nonprofit',
    keywords: [
      'nonprofit', 'non-profit', 'ngo', 'charity', 'foundation', 'cause',
      'advocacy', 'awareness', 'campaign', 'donation', 'volunteer',
      'community', 'social impact', 'humanitarian', 'relief', 'aid',
      'mission', 'organization', 'movement', 'initiative'
    ],
    weight: 1.0
  }
];

/**
 * Detect business type from brand profile
 */
export function detectBusinessType(brandProfile: any): BusinessTypeDetection {
  const scores = new Map<BusinessTypeCategory, number>();
  const signals = new Map<BusinessTypeCategory, string[]>();

  // Initialize scores
  DETECTION_PATTERNS.forEach(pattern => {
    scores.set(pattern.type, 0);
    signals.set(pattern.type, []);
  });

  // Helper function to safely convert to string
  const toStringArray = (value: any): string => {
    if (!value) return '';
    if (Array.isArray(value)) return value.join(' ');
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Collect text to analyze
  const textToAnalyze = [
    brandProfile.businessType || '',
    brandProfile.businessName || '',
    brandProfile.description || '',
    brandProfile.tagline || '',
    toStringArray(brandProfile.services),
    toStringArray(brandProfile.products),
    brandProfile.websiteContent || ''
  ].join(' ').toLowerCase();

  // Score each business type based on keyword matches
  DETECTION_PATTERNS.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      if (textToAnalyze.includes(keyword.toLowerCase())) {
        const currentScore = scores.get(pattern.type) || 0;
        scores.set(pattern.type, currentScore + pattern.weight);

        const currentSignals = signals.get(pattern.type) || [];
        if (!currentSignals.includes(keyword)) {
          currentSignals.push(keyword);
          signals.set(pattern.type, currentSignals);
        }
      }
    });
  });

  // Sort by score
  const sortedTypes = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0);

  if (sortedTypes.length === 0) {
    // Default to service if no clear type detected
    return {
      primaryType: 'service',
      confidence: 50,
      detectionSignals: ['default fallback'],
      isHybrid: false
    };
  }

  const [primaryType, primaryScore] = sortedTypes[0];
  const totalScore = Array.from(scores.values()).reduce((sum, score) => sum + score, 0);
  const primaryConfidence = Math.min(100, Math.round((primaryScore / Math.max(totalScore, 1)) * 100));

  // Check for secondary type (hybrid business)
  let secondaryType: BusinessTypeCategory | undefined;
  let isHybrid = false;

  if (sortedTypes.length > 1) {
    const [secondType, secondScore] = sortedTypes[1];
    // If second type has at least 30% of primary score, consider it a hybrid
    if (secondScore >= primaryScore * 0.3) {
      secondaryType = secondType;
      isHybrid = true;
    }
  }

  return {
    primaryType,
    secondaryType,
    confidence: primaryConfidence,
    detectionSignals: signals.get(primaryType) || [],
    isHybrid
  };
}

/**
 * Get human-readable business type name
 */
export function getBusinessTypeName(type: BusinessTypeCategory): string {
  const names: Record<BusinessTypeCategory, string> = {
    retail: 'Retail/E-commerce',
    service: 'Service Business',
    saas: 'SaaS/Digital Product',
    food: 'Food & Beverage',
    finance: 'Financial Services',
    healthcare: 'Healthcare/Wellness',
    realestate: 'Real Estate',
    education: 'Education/Training',
    b2b: 'B2B/Enterprise',
    nonprofit: 'Nonprofit/Advocacy'
  };

  return names[type] || type;
}

/**
 * Log business type detection results
 */
export function logBusinessTypeDetection(detection: BusinessTypeDetection): void {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 BUSINESS TYPE DETECTION');
  console.log('='.repeat(80));
  console.log(`\n📊 Primary Type: ${getBusinessTypeName(detection.primaryType)}`);

  if (detection.secondaryType) {
    console.log(`📊 Secondary Type: ${getBusinessTypeName(detection.secondaryType)}`);
    console.log(`🔀 Hybrid Business: Yes`);
  } else {
    console.log(`🔀 Hybrid Business: No`);
  }

  console.log(`✅ Confidence: ${detection.confidence}%`);
  console.log(`🎯 Detection Signals: ${detection.detectionSignals.slice(0, 5).join(', ')}${detection.detectionSignals.length > 5 ? '...' : ''}`);
  console.log('='.repeat(80) + '\n');
}

