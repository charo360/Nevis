/**
 * Type-Specific Marketing Rules
 * 
 * Modular rule sets that are conditionally loaded based on business type
 * Each module defines specific requirements for that industry
 */

import { BusinessTypeCategory } from './business-type-detector';

export interface TypeSpecificRule {
  id: string;
  name: string;
  description: string;
  requirement: string;
  examples: string[];
}

export interface TypeSpecificModule {
  type: BusinessTypeCategory;
  name: string;
  description: string;
  requiredElements: TypeSpecificRule[];
  contentFocus: string;
  visualRequirements: string;
  ctaGuidance: string;
  toneGuidance: string;
  additionalAngles: string[];
}

/**
 * RETAIL/ECOMMERCE MODULE
 */
export const RETAIL_MODULE: TypeSpecificModule = {
  type: 'retail',
  name: 'Retail/E-commerce Framework',
  description: 'Product-focused marketing with pricing, availability, and transactional CTAs',

  requiredElements: [
    {
      id: 'product_visibility',
      name: 'Product Visibility',
      description: 'Specific product must be visible and identifiable',
      requirement: 'Show or mention specific product by name',
      examples: ['iPhone 15 Pro', 'Nike Air Max', 'Samsung 55" TV']
    },
    {
      id: 'pricing_signals',
      name: 'Pricing Information',
      description: 'Include pricing, discounts, or value indicators',
      requirement: 'Mention price, discount, or savings',
      examples: ['KES 45,000', 'Save 30%', 'Was $199, now $149']
    },
    {
      id: 'stock_status',
      name: 'Stock/Availability Status',
      description: 'Indicate product availability',
      requirement: 'Show stock status or availability',
      examples: ['In Stock', 'Only 5 left', 'Available now', 'Limited stock']
    },
    {
      id: 'trust_signals',
      name: 'Trust Signals',
      description: 'Include authenticity, warranty, or quality indicators',
      requirement: 'Add trust-building elements',
      examples: ['Genuine products', '1-year warranty', 'Authentic', 'Certified']
    },
    {
      id: 'transactional_cta',
      name: 'Transactional CTA',
      description: 'Use purchase-oriented call-to-action',
      requirement: 'CTA must encourage immediate purchase',
      examples: ['Shop Now', 'Buy Today', 'Order Now', 'Add to Cart', 'Get Yours']
    }
  ],

  contentFocus: 'Individual products with specific features, prices, and benefits. Leverage product catalog data.',
  visualRequirements: 'Show specific products in use, lifestyle shots with products, product features highlighted, price tags visible when relevant.',
  ctaGuidance: 'Direct purchase actions: "Shop Now", "Buy Today", "Get Yours", "Order Now", "Add to Cart", "Limited Stock"',
  toneGuidance: 'Value-driven, deal-focused, product-benefit oriented. Emphasize savings, quality, and availability.',
  additionalAngles: [
    'Price-focused angle (highlight savings/deals)',
    'Product launch angle (new arrivals)',
    'Seasonal/sale angle (limited-time offers)',
    'Payment/financing angle (payment options)',
    'Bundle/package angle (product combinations)'
  ]
};

/**
 * SERVICE BUSINESS MODULE
 */
export const SERVICE_MODULE: TypeSpecificModule = {
  type: 'service',
  name: 'Service Business Framework',
  description: 'Expertise-focused marketing with problem-solution approach and consultation CTAs',

  requiredElements: [
    {
      id: 'expertise_credentials',
      name: 'Expertise/Credentials',
      description: 'Highlight professional qualifications or experience',
      requirement: 'Show expertise, certifications, or experience',
      examples: ['15+ years experience', 'Certified professionals', 'Licensed experts', '500+ projects completed']
    },
    {
      id: 'problem_solution_focus',
      name: 'Problem-Solution Focus',
      description: 'Address specific customer pain points',
      requirement: 'Identify problem and present solution',
      examples: ['Leaking roof? We fix it fast', 'Struggling with taxes? We simplify them']
    },
    {
      id: 'consultation_cta',
      name: 'Consultation CTA',
      description: 'Encourage booking or consultation',
      requirement: 'CTA must invite engagement or booking',
      examples: ['Book Consultation', 'Schedule Appointment', 'Call Us', 'Get Free Quote']
    },
    {
      id: 'professional_imagery',
      name: 'Professional Imagery',
      description: 'Show professionals at work or results',
      requirement: 'Include people providing service or results',
      examples: ['Lawyer in office', 'Plumber fixing pipes', 'Before/after results']
    },
    {
      id: 'transformation_results',
      name: 'Transformation/Results',
      description: 'Show outcomes or transformations',
      requirement: 'Demonstrate value through results',
      examples: ['Fixed in 24 hours', 'Saved clients $50K', 'Problem solved']
    }
  ],

  contentFocus: 'Professional expertise, problem-solving capabilities, and customer transformations. Focus on outcomes.',
  visualRequirements: 'Show professionals at work, happy clients, before/after results, service being performed, professional environments.',
  ctaGuidance: 'Consultation actions: "Book Appointment", "Schedule Consultation", "Call Us", "Get Free Quote", "Request Service"',
  toneGuidance: 'Professional, trustworthy, solution-oriented. Emphasize expertise, reliability, and results.',
  additionalAngles: [
    'Expertise/credential angle (highlight qualifications)',
    'Process/methodology angle (how you work)',
    'Specialization angle (niche expertise)',
    'Consultation offer angle (free assessment)',
    'Emergency/urgent service angle (fast response)'
  ]
};

/**
 * SAAS/DIGITAL PRODUCT MODULE
 */
export const SAAS_MODULE: TypeSpecificModule = {
  type: 'saas',
  name: 'SaaS/Digital Product Framework',
  description: 'Feature-benefit marketing with trial CTAs and use-case scenarios',

  requiredElements: [
    {
      id: 'feature_benefits',
      name: 'Feature Benefits',
      description: 'Highlight specific features and their benefits',
      requirement: 'Show what the software does and why it matters',
      examples: ['Automated invoicing saves 10 hours/week', 'Real-time collaboration']
    },
    {
      id: 'interface_showcase',
      name: 'Interface/Screenshots',
      description: 'Show the actual product interface',
      requirement: 'Include app screenshots or interface visuals',
      examples: ['Dashboard view', 'Mobile app screen', 'Feature in action']
    },
    {
      id: 'use_case_scenario',
      name: 'Use-Case Scenario',
      description: 'Show specific situation where product is used',
      requirement: 'Demonstrate practical application',
      examples: ['Managing remote team', 'Tracking expenses', 'Scheduling meetings']
    },
    {
      id: 'trial_cta',
      name: 'Trial/Demo CTA',
      description: 'Encourage free trial or demo',
      requirement: 'Low-friction CTA for trying product',
      examples: ['Try Free', 'Start Free Trial', 'Get Demo', 'Sign Up Free']
    },
    {
      id: 'ease_of_use',
      name: 'Ease of Use Emphasis',
      description: 'Highlight simplicity and user-friendliness',
      requirement: 'Show how easy it is to use',
      examples: ['Set up in 5 minutes', 'No coding required', 'Intuitive interface']
    }
  ],

  contentFocus: 'Software features, benefits, and use cases. Emphasize ease of use, time savings, and productivity gains.',
  visualRequirements: 'Show interface screenshots, people using the app, feature demonstrations, workflow visualizations, integration diagrams.',
  ctaGuidance: 'Trial actions: "Try Free", "Start Free Trial", "Get Demo", "Sign Up", "See How It Works"',
  toneGuidance: 'Innovative, efficiency-focused, user-friendly. Emphasize time savings, productivity, and ease of use.',
  additionalAngles: [
    'Feature comparison angle (vs competitors)',
    'Integration angle (works with other tools)',
    'Automation/time-saving angle (efficiency gains)',
    'Scalability angle (grows with you)',
    'ROI/cost-savings angle (financial benefits)'
  ]
};

/**
 * FOOD & BEVERAGE MODULE
 */
export const FOOD_MODULE: TypeSpecificModule = {
  type: 'food',
  name: 'Food & Beverage Framework',
  description: 'Appetite-appeal marketing with sensory language and dining CTAs',

  requiredElements: [
    {
      id: 'food_imagery_primary',
      name: 'Food Imagery Primary',
      description: 'Food must be the main visual focus',
      requirement: 'Show delicious food prominently',
      examples: ['Close-up of dish', 'Plated meal', 'Fresh ingredients', 'Signature dish']
    },
    {
      id: 'sensory_language',
      name: 'Sensory/Appetite Language',
      description: 'Use descriptive language that triggers appetite',
      requirement: 'Describe taste, texture, aroma, freshness',
      examples: ['Crispy', 'Juicy', 'Fresh-baked', 'Sizzling', 'Aromatic']
    },
    {
      id: 'signature_items',
      name: 'Signature Items Highlighted',
      description: 'Feature specific menu items or specialties',
      requirement: 'Mention specific dishes by name',
      examples: ['Wood-fired pizza', 'Signature burger', 'Chef\'s special pasta']
    },
    {
      id: 'dining_cta',
      name: 'Dining/Ordering CTA',
      description: 'Encourage reservation or ordering',
      requirement: 'CTA for dining or delivery',
      examples: ['Reserve Table', 'Order Now', 'Visit Us', 'Try Our...', 'Taste Today']
    },
    {
      id: 'location_delivery_info',
      name: 'Location/Delivery Info',
      description: 'Include how to access the food',
      requirement: 'Mention location, delivery, or hours',
      examples: ['Downtown location', 'Delivery in 30 min', 'Open till midnight']
    }
  ],

  contentFocus: 'Food quality, taste, dining experience, and culinary expertise. Make people hungry!',
  visualRequirements: 'Show delicious food close-ups, people enjoying meals, chef expertise, fresh ingredients, dining atmosphere.',
  ctaGuidance: 'Dining actions: "Reserve Table", "Order Now", "Visit Us", "Try Our [Dish]", "Taste the Difference"',
  toneGuidance: 'Appetizing, sensory-rich, inviting. Use descriptive language that makes people hungry and excited to dine.',
  additionalAngles: [
    'Signature dish angle (highlight specialty)',
    'Cuisine/style angle (authentic Italian, etc.)',
    'Occasion angle (date night, family dinner)',
    'Dietary accommodation angle (vegan, halal, gluten-free)',
    'Chef/expertise angle (culinary credentials)'
  ]
};

/**
 * FINANCIAL SERVICES MODULE
 */
export const FINANCE_MODULE: TypeSpecificModule = {
  type: 'finance',
  name: 'Financial Services Framework',
  description: 'Trust-focused marketing with security emphasis and transparent pricing',

  requiredElements: [
    {
      id: 'security_trust',
      name: 'Security/Trust Signals',
      description: 'Emphasize safety, security, and trustworthiness',
      requirement: 'Include security or trust indicators',
      examples: ['Bank-level security', 'FDIC insured', 'Encrypted', 'Licensed', 'Regulated']
    },
    {
      id: 'rates_fees_transparent',
      name: 'Rates/Fees Transparency',
      description: 'Show pricing, rates, or fees clearly',
      requirement: 'Be transparent about costs',
      examples: ['5% APY', 'No hidden fees', '0% interest', 'Competitive rates']
    },
    {
      id: 'financial_benefits',
      name: 'Financial Benefits/ROI',
      description: 'Show concrete financial outcomes',
      requirement: 'Quantify savings, growth, or returns',
      examples: ['Save $500/year', 'Grow wealth by 10%', 'Reduce debt faster']
    },
    {
      id: 'low_friction_cta',
      name: 'Low-Friction CTA',
      description: 'Use non-committal CTAs for financial services',
      requirement: 'CTA should be low-pressure',
      examples: ['Learn More', 'Calculate Savings', 'Get Quote', 'Speak to Advisor']
    },
    {
      id: 'regulatory_compliance',
      name: 'Regulatory Compliance Visible',
      description: 'Show licenses, certifications, or regulatory badges',
      requirement: 'Include compliance indicators',
      examples: ['Licensed by CBK', 'FDIC member', 'Regulated entity']
    }
  ],

  contentFocus: 'Trust, security, financial benefits, and peace of mind. Focus on outcomes and protection.',
  visualRequirements: 'Show people achieving financial goals, families feeling secure, professional advisors, security imagery, growth visualizations.',
  ctaGuidance: 'Low-friction actions: "Learn More", "Get Quote", "Calculate Savings", "Speak to Advisor", "Apply Now"',
  toneGuidance: 'Professional, trustworthy, benefit-focused. Emphasize security, growth, and financial peace of mind.',
  additionalAngles: [
    'Security/protection angle (safety first)',
    'ROI/growth angle (wealth building)',
    'Simplification angle (make finance easy)',
    'Speed/convenience angle (fast approval)',
    'Expert guidance angle (professional advice)'
  ]
};

/**
 * HEALTHCARE MODULE
 */
export const HEALTHCARE_MODULE: TypeSpecificModule = {
  type: 'healthcare',
  name: 'Healthcare/Wellness Framework',
  description: 'Care-focused marketing with health outcomes and professional expertise',

  requiredElements: [
    {
      id: 'health_outcomes',
      name: 'Health Outcomes Focus',
      description: 'Emphasize health benefits and improvements',
      requirement: 'Show health results or benefits',
      examples: ['Faster recovery', 'Pain relief', 'Better health', 'Improved wellness']
    },
    {
      id: 'professional_expertise',
      name: 'Professional Expertise',
      description: 'Highlight medical credentials and experience',
      requirement: 'Show qualifications of healthcare providers',
      examples: ['Board-certified', 'Experienced doctors', 'Specialist care', '20+ years']
    },
    {
      id: 'patient_care_emphasis',
      name: 'Patient-Centered Care',
      description: 'Show caring, empathetic approach',
      requirement: 'Emphasize personalized, caring service',
      examples: ['Personalized treatment', 'We listen', 'Compassionate care']
    },
    {
      id: 'appointment_cta',
      name: 'Appointment/Consultation CTA',
      description: 'Encourage booking health services',
      requirement: 'CTA for scheduling or consultation',
      examples: ['Book Appointment', 'Schedule Consultation', 'Call Us', 'Get Care']
    },
    {
      id: 'facility_quality',
      name: 'Facility/Equipment Quality',
      description: 'Highlight modern facilities or technology',
      requirement: 'Mention quality of care environment',
      examples: ['State-of-the-art facility', 'Modern equipment', 'Clean environment']
    }
  ],

  contentFocus: 'Health outcomes, professional expertise, patient care, and quality of life improvements.',
  visualRequirements: 'Show caring professionals, happy healthy patients, modern facilities, treatment results, wellness activities.',
  ctaGuidance: 'Health actions: "Book Appointment", "Schedule Consultation", "Get Expert Care", "Call Us", "Start Your Journey"',
  toneGuidance: 'Caring, professional, reassuring. Emphasize expertise, patient-centered care, and positive outcomes.',
  additionalAngles: [
    'Prevention angle (proactive health)',
    'Expertise angle (specialist care)',
    'Technology angle (advanced treatment)',
    'Comfort angle (stress-free experience)',
    'Results angle (proven outcomes)'
  ]
};

/**
 * Get module for business type
 */
export function getTypeSpecificModule(type: BusinessTypeCategory): TypeSpecificModule | null {
  const modules: Record<BusinessTypeCategory, TypeSpecificModule | null> = {
    retail: RETAIL_MODULE,
    service: SERVICE_MODULE,
    saas: SAAS_MODULE,
    food: FOOD_MODULE,
    finance: FINANCE_MODULE,
    healthcare: HEALTHCARE_MODULE,
    realestate: null, // To be implemented
    education: null, // To be implemented
    b2b: null, // To be implemented
    nonprofit: null // To be implemented
  };

  return modules[type] || null;
}

/**
 * Generate type-specific rules prompt
 */
export function generateTypeSpecificPrompt(module: TypeSpecificModule): string {
  let prompt = `\n\n🎯 TYPE-SPECIFIC RULES FOR ${module.name.toUpperCase()}:\n\n`;
  prompt += `📋 DESCRIPTION: ${module.description}\n\n`;
  prompt += `🎨 CONTENT FOCUS:\n${module.contentFocus}\n\n`;
  prompt += `📸 VISUAL REQUIREMENTS:\n${module.visualRequirements}\n\n`;
  prompt += `🔔 CTA GUIDANCE:\n${module.ctaGuidance}\n\n`;
  prompt += `💬 TONE GUIDANCE:\n${module.toneGuidance}\n\n`;

  prompt += `✅ REQUIRED ELEMENTS (Must include these):\n`;
  module.requiredElements.forEach((rule, index) => {
    prompt += `\n${index + 1}. ${rule.name}\n`;
    prompt += `   Description: ${rule.description}\n`;
    prompt += `   Requirement: ${rule.requirement}\n`;
    prompt += `   Examples: ${rule.examples.join(', ')}\n`;
  });

  prompt += `\n\n🎪 ADDITIONAL MARKETING ANGLES (Use these in addition to universal angles):\n`;
  module.additionalAngles.forEach((angle, index) => {
    prompt += `${index + 1}. ${angle}\n`;
  });

  return prompt;
}

/**
 * Validate content against type-specific rules
 */
export function validateTypeSpecificRules(
  content: any,
  module: TypeSpecificModule
): {
  passed: boolean;
  failedRules: string[];
  passedRules: string[];
} {
  const failedRules: string[] = [];
  const passedRules: string[] = [];

  // Basic validation - check if content addresses the requirements
  // This is a simplified validation - actual implementation would be more sophisticated

  const contentText = `${content.headline} ${content.caption}`.toLowerCase();

  module.requiredElements.forEach(rule => {
    // Check if any example keywords are present (simplified check)
    const hasRelevantContent = rule.examples.some(example =>
      contentText.includes(example.toLowerCase().split(' ')[0])
    );

    if (hasRelevantContent || content[rule.id]) {
      passedRules.push(rule.name);
    } else {
      failedRules.push(`${rule.name}: ${rule.requirement}`);
    }
  });

  return {
    passed: failedRules.length <= 1, // Allow 1 missing element
    failedRules,
    passedRules
  };
}

