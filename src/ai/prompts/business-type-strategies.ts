/**
 * Business-Type Specific Marketing Strategies for Revo 2.0
 * 
 * This module provides industry-specific marketing approaches, messaging strategies,
 * and content generation rules to ensure each business type gets appropriate,
 * targeted marketing content that matches customer expectations.
 */

export interface BusinessTypeStrategy {
  businessTypes: string[]; // Keywords to match business type
  contentFocus: string; // What content should focus on
  messagingTone: string; // Tone and style of messaging
  visualGuidance: string; // Visual content guidance
  ctaStyle: string; // Call-to-action style
  headlineApproach: string; // How to craft headlines
  captionGuidance: string; // Caption writing guidance
  engagementTactics: string; // Specific engagement strategies for this business type
  emotionalTriggers: string; // Emotional hooks that work for this industry
  urgencyCreation: string; // How to create urgency appropriately for this business
  productDataUsage?: string; // How to use product data (if applicable)
  exampleHeadlines: string[]; // Example headlines for this business type
  exampleCaptions: string[]; // Example captions for this business type
}

/**
 * Comprehensive business-type specific strategies
 */
export const BUSINESS_TYPE_STRATEGIES: BusinessTypeStrategy[] = [
  // RETAIL / E-COMMERCE
  {
    businessTypes: ['retail', 'e-commerce', 'ecommerce', 'shop', 'store', 'boutique', 'marketplace'],
    contentFocus: 'Individual products with specific features, prices, and benefits. Leverage product catalog data to create product-focused ads.',
    messagingTone: 'Value-driven, deal-focused, product-benefit oriented. Emphasize savings, quality, and availability.',
    visualGuidance: 'Show specific products in use, lifestyle shots with products, product features highlighted, price tags visible when relevant.',
    ctaStyle: 'Direct purchase actions: "Shop Now", "Buy Today", "Get Yours", "Order Now", "Add to Cart", "Limited Stock"',
    headlineApproach: 'Lead with product name, key benefit, or deal. Examples: "[Product Name] - [Key Benefit]", "Save [X]% on [Product]", "[Product Feature] You\'ll Love"',
    captionGuidance: 'Focus on ONE specific product per post. Include product benefits, features, pricing (if on sale), and availability. Use product catalog data to rotate through different products.',
    engagementTactics: 'Use scarcity ("Only X left"), social proof ("Best-seller", "Customer favorite"), value emphasis (show savings), product benefits (solve specific problems), lifestyle integration (show product in use)',
    emotionalTriggers: 'Desire for quality, fear of missing out (FOMO), aspiration to upgrade lifestyle, satisfaction of getting a good deal, excitement of new arrivals',
    urgencyCreation: 'Limited stock alerts, flash sales with countdown, seasonal offers, new arrival announcements, exclusive deals, price drops, "while supplies last"',
    productDataUsage: 'CRITICAL: Use productCatalog data from brand profile. Extract product names, prices, features, discounts. Create product-specific ads that showcase individual items with their unique benefits and pricing.',
    exampleHeadlines: [
      'Premium Wireless Headphones - Crystal Clear Sound',
      'Save 30% on Designer Handbags This Week',
      'New Arrival: Smart Home Security System',
      'Limited Edition Sneakers - Only 50 Left'
    ],
    exampleCaptions: [
      'Introducing our best-selling wireless headphones with 40-hour battery life and noise cancellation. Perfect for work, travel, or workouts. Now $79.99 (was $129.99). Shop now while supplies last! 🎧',
      'This designer handbag combines style and functionality. Premium leather, multiple compartments, and a timeless design. Available in 5 colors. Get 30% off this week only! Limited time offer. 👜'
    ]
  },

  // HOSPITALITY (HOTELS, LODGING, ACCOMMODATION)
  {
    businessTypes: ['hotel', 'resort', 'lodge', 'accommodation', 'hospitality', 'inn', 'bed and breakfast', 'b&b', 'vacation rental'],
    contentFocus: 'Guest experience, comfort, amenities, location benefits, and memorable stays. Focus on the feeling and experience.',
    messagingTone: 'Welcoming, relaxing, experience-focused. Emphasize comfort, luxury, and memorable moments.',
    visualGuidance: 'Show beautiful rooms, happy guests enjoying amenities, scenic views, dining experiences, relaxation moments, local attractions.',
    ctaStyle: 'Booking-focused: "Book Your Stay", "Reserve Now", "Check Availability", "Plan Your Getaway", "Experience [Location]"',
    headlineApproach: 'Lead with experience or location benefit. Examples: "Your Perfect [Location] Getaway", "[Amenity] That Exceeds Expectations", "Where Comfort Meets [Unique Feature]"',
    captionGuidance: 'Paint a picture of the guest experience. Highlight unique amenities, location advantages, comfort features, and what makes the stay memorable. Use sensory language.',
    engagementTactics: 'Aspirational imagery (dream vacation), sensory descriptions (sounds, sights, feelings), experience storytelling (imagine yourself here), unique amenity highlights, location benefits',
    emotionalTriggers: 'Desire for escape and relaxation, need for comfort and pampering, aspiration for luxury experiences, anticipation of memorable moments, relief from daily stress',
    urgencyCreation: 'Seasonal availability ("Summer bookings filling fast"), special packages ("Weekend getaway special"), limited rooms ("Only 3 suites left"), early bird discounts, holiday booking windows',
    exampleHeadlines: [
      'Your Beachfront Paradise Awaits',
      'Luxury Rooms with Breathtaking Mountain Views',
      'Where Every Stay Feels Like Home',
      'Experience World-Class Hospitality'
    ],
    exampleCaptions: [
      'Wake up to ocean views, enjoy breakfast on your private balcony, and spend your days exploring pristine beaches. Our beachfront resort offers the perfect blend of relaxation and adventure. Book your escape today! 🌊',
      'Unwind in our spacious suites featuring king-size beds, spa-like bathrooms, and stunning city views. Enjoy our rooftop pool, fitness center, and award-winning restaurant. Your perfect stay starts here. ✨'
    ]
  },

  // RESTAURANTS / FOOD SERVICE
  {
    businessTypes: ['restaurant', 'cafe', 'coffee shop', 'bistro', 'eatery', 'dining', 'food service', 'catering', 'bakery', 'bar', 'pub'],
    contentFocus: 'Food quality, taste, dining experience, ambiance, and culinary expertise. Focus on appetite appeal and social dining.',
    messagingTone: 'Appetizing, sensory-rich, inviting. Use descriptive language that makes people hungry and excited to dine.',
    visualGuidance: 'Show delicious food close-ups, people enjoying meals together, chef expertise, fresh ingredients, dining atmosphere, signature dishes.',
    ctaStyle: 'Dining actions: "Reserve Your Table", "Order Now", "Visit Us Today", "Try Our [Dish]", "Taste the Difference", "Join Us for [Meal]"',
    headlineApproach: 'Lead with food appeal or dining experience. Examples: "[Signature Dish] Made Fresh Daily", "Authentic [Cuisine] in [Location]", "Where [Food Type] Meets Perfection"',
    captionGuidance: 'Make readers hungry! Describe flavors, textures, freshness, and dining atmosphere. Highlight signature dishes, chef specialties, and what makes the food special. Include dining occasions.',
    engagementTactics: 'Appetite appeal (mouth-watering descriptions), sensory language (taste, smell, texture), social dining moments (date night, family gathering), chef expertise, fresh/local ingredients, signature dishes',
    emotionalTriggers: 'Hunger and cravings, desire for indulgence, social connection through food, nostalgia for authentic flavors, excitement for culinary experiences, comfort food satisfaction',
    urgencyCreation: 'Daily specials, limited-time menu items, seasonal dishes, weekend brunch hours, happy hour deals, reservation availability ("Book now for Valentine\'s"), chef\'s special tonight',
    exampleHeadlines: [
      'Wood-Fired Pizza Made with Love',
      'Authentic Italian Cuisine in the Heart of Downtown',
      'Farm-to-Table Freshness Every Day',
      'Where Brunch Dreams Come True'
    ],
    exampleCaptions: [
      'Our wood-fired pizzas are crafted with imported Italian flour, San Marzano tomatoes, and fresh mozzarella. Each pizza is a masterpiece, baked to perfection in our traditional stone oven. Taste the difference tonight! 🍕',
      'Start your weekend right with our legendary brunch menu. Fluffy pancakes, perfectly poached eggs, artisan coffee, and bottomless mimosas. Every Saturday and Sunday, 9am-2pm. Reserve your table now! 🥞'
    ]
  },

  // FINANCE / FINANCIAL SERVICES
  {
    businessTypes: ['finance', 'financial', 'banking', 'fintech', 'investment', 'insurance', 'accounting', 'wealth management', 'credit', 'loan'],
    contentFocus: 'Trust, security, financial benefits, ROI, and peace of mind. Focus on financial outcomes and protection.',
    messagingTone: 'Professional, trustworthy, benefit-focused. Emphasize security, growth, savings, and financial peace of mind.',
    visualGuidance: 'Show real people achieving financial goals, families feeling secure, business growth, savings visualization, professional advisors helping clients.',
    ctaStyle: 'Financial actions: "Start Saving Today", "Get Your Free Quote", "Speak to an Advisor", "Calculate Your Savings", "Secure Your Future", "Apply Now"',
    headlineApproach: 'Lead with financial benefit or outcome. Examples: "Save [X]% on [Financial Product]", "Grow Your Wealth with [Service]", "Financial Security Made Simple"',
    captionGuidance: 'Focus on specific financial outcomes and benefits. Use numbers and concrete results. Emphasize trust, security, and how the service improves financial situations. Avoid jargon.',
    engagementTactics: 'Concrete numbers and ROI, trust signals (security, protection), financial transformation stories, specific savings calculations, peace of mind messaging, expert guidance',
    emotionalTriggers: 'Financial security and peace of mind, fear of financial instability, aspiration for wealth growth, desire to protect family, relief from money stress, confidence in financial decisions',
    urgencyCreation: 'Limited-time rates, enrollment periods, tax deadlines, market opportunities, early application benefits, promotional APY rates, "Lock in this rate today"',
    exampleHeadlines: [
      'Grow Your Savings by 5% APY',
      'Home Loans Approved in 48 Hours',
      'Retirement Planning That Works for You',
      'Protect Your Family\'s Financial Future'
    ],
    exampleCaptions: [
      'Our high-yield savings account offers 5% APY with no minimum balance and no monthly fees. Watch your money grow while keeping it safe and accessible. FDIC insured up to $250,000. Start saving smarter today! 💰',
      'Get the home loan you deserve with our fast approval process. Competitive rates, flexible terms, and personalized service from application to closing. Pre-qualify in minutes with no impact to your credit score. 🏡'
    ]
  },

  // HEALTHCARE / MEDICAL / WELLNESS
  {
    businessTypes: ['healthcare', 'medical', 'clinic', 'hospital', 'dental', 'wellness', 'fitness', 'gym', 'spa', 'therapy', 'health'],
    contentFocus: 'Health outcomes, professional expertise, patient care, wellness benefits, and quality of life improvements.',
    messagingTone: 'Caring, professional, reassuring. Emphasize expertise, patient-centered care, and positive health outcomes.',
    visualGuidance: 'Show caring professionals, happy healthy patients, modern facilities, treatment results, wellness activities, before/after transformations (where appropriate).',
    ctaStyle: 'Health actions: "Book Your Appointment", "Schedule a Consultation", "Start Your Journey", "Get Expert Care", "Join Today", "Call Us Now"',
    headlineApproach: 'Lead with health benefit or outcome. Examples: "Expert [Treatment] for [Condition]", "Your Path to Better Health", "[Service] That Changes Lives"',
    captionGuidance: 'Focus on patient benefits and health outcomes. Highlight professional expertise, quality of care, and how services improve quality of life. Use empathetic, caring language.',
    engagementTactics: 'Patient testimonials, before/after results (where appropriate), expert credentials, caring approach, health transformation stories, preventive care benefits, quality of life improvements',
    emotionalTriggers: 'Desire for better health, relief from pain or discomfort, confidence in appearance, peace of mind about health, aspiration for wellness, trust in professional care',
    urgencyCreation: 'Limited appointment slots, seasonal health concerns (flu season, allergy season), preventive care timing, special treatment packages, new patient offers, "Don\'t wait until it\'s worse"',
    exampleHeadlines: [
      'Smile Brighter with Professional Teeth Whitening',
      'Expert Physical Therapy for Faster Recovery',
      'Your Wellness Journey Starts Here',
      'Comprehensive Care from Doctors Who Listen'
    ],
    exampleCaptions: [
      'Our experienced physical therapists create personalized treatment plans to help you recover faster and prevent future injuries. State-of-the-art facility, one-on-one attention, and proven results. Most insurance accepted. 💪',
      'Transform your smile with our professional teeth whitening service. Safe, effective, and results in just one visit. Our experienced dentists use the latest technology for a brighter, more confident smile. Book your appointment today! 😁'
    ]
  },

  // PROFESSIONAL SERVICES (B2B)
  {
    businessTypes: ['consulting', 'agency', 'marketing', 'legal', 'law', 'professional services', 'b2b', 'business services', 'consulting'],
    contentFocus: 'Business outcomes, ROI, expertise, case studies, and problem-solving capabilities. Focus on results and value.',
    messagingTone: 'Professional, results-oriented, authoritative. Emphasize expertise, proven results, and business value.',
    visualGuidance: 'Show business professionals, team collaboration, data/results visualization, client success stories, professional environments.',
    ctaStyle: 'Business actions: "Schedule a Consultation", "Get Your Free Audit", "Download Our Guide", "Request a Proposal", "Let\'s Talk", "See Case Studies"',
    headlineApproach: 'Lead with business outcome or expertise. Examples: "Increase [Metric] by [X]%", "Expert [Service] for [Industry]", "Results-Driven [Service]"',
    captionGuidance: 'Focus on business results and ROI. Use case studies, statistics, and concrete outcomes. Highlight expertise and proven track record. B2B decision-makers want facts and results.',
    engagementTactics: 'Concrete ROI numbers, case study highlights, industry expertise demonstration, problem-solution framing, data-driven insights, free value offers (audits, guides, consultations)',
    emotionalTriggers: 'Desire for business growth, fear of falling behind competitors, need for expert guidance, aspiration for efficiency, relief from business challenges, confidence in decision-making',
    urgencyCreation: 'Limited consultation slots, market timing opportunities, competitive advantages, quarterly planning cycles, "Act before Q4", industry changes requiring adaptation',
    exampleHeadlines: [
      'Increase Your Revenue by 40% in 6 Months',
      'Expert Legal Counsel for Growing Businesses',
      'Marketing Strategies That Drive Real Results',
      'Transform Your Operations with Our Consulting'
    ],
    exampleCaptions: [
      'We helped 50+ businesses increase their revenue by an average of 40% through data-driven marketing strategies. Our proven process combines market research, targeted campaigns, and continuous optimization. Ready to grow? Let\'s talk. 📈',
      'Our business consulting services have helped companies reduce costs by 25% while improving efficiency. We analyze your operations, identify opportunities, and implement solutions that deliver measurable results. Schedule your free consultation today. 💼'
    ]
  },

  // EDUCATION / TRAINING
  {
    businessTypes: ['education', 'training', 'school', 'academy', 'course', 'learning', 'tutoring', 'coaching', 'university', 'college'],
    contentFocus: 'Learning outcomes, skill development, career advancement, and personal growth. Focus on transformation and achievement.',
    messagingTone: 'Inspiring, empowering, achievement-focused. Emphasize growth, success, and unlocking potential.',
    visualGuidance: 'Show students learning, success stories, skill demonstrations, graduation moments, career achievements, engaged learners.',
    ctaStyle: 'Learning actions: "Enroll Now", "Start Learning Today", "Join Our Next Class", "Download Syllabus", "Book a Trial", "Transform Your Career"',
    headlineApproach: 'Lead with learning outcome or transformation. Examples: "Master [Skill] in [Timeframe]", "Launch Your [Career] Career", "Learn [Subject] from Experts"',
    captionGuidance: 'Focus on what students will achieve and how it transforms their lives or careers. Highlight expert instructors, curriculum quality, and success stories. Make it aspirational.',
    engagementTactics: 'Career transformation stories, skill mastery promises, expert instructor credentials, student success showcases, curriculum highlights, career outcome statistics, learning community',
    emotionalTriggers: 'Aspiration for career advancement, desire for new skills, fear of being left behind, excitement for personal growth, confidence in abilities, pride in achievement',
    urgencyCreation: 'Enrollment deadlines, cohort start dates, early bird pricing, limited class sizes, "Next cohort starts [date]", career market timing, skill demand trends',
    exampleHeadlines: [
      'Master Digital Marketing in 12 Weeks',
      'Launch Your Tech Career with Our Bootcamp',
      'Learn from Industry Experts',
      'Transform Your Skills, Transform Your Life'
    ],
    exampleCaptions: [
      'Our 12-week digital marketing bootcamp has helped 500+ students launch successful careers. Learn SEO, social media, content marketing, and analytics from industry experts. Job placement assistance included. Next cohort starts soon! 🎓',
      'Learn to code with our intensive bootcamp designed for beginners. Expert instructors, hands-on projects, and career support. 95% of our graduates land jobs within 6 months. Start your tech career today! 💻'
    ]
  }
];

/**
 * Get business-type specific strategy based on business type
 */
export function getBusinessTypeStrategy(businessType: string): BusinessTypeStrategy | null {
  const businessLower = businessType.toLowerCase();

  for (const strategy of BUSINESS_TYPE_STRATEGIES) {
    if (strategy.businessTypes.some(type => businessLower.includes(type))) {
      return strategy;
    }
  }

  return null; // No specific strategy found - will use generic approach
}

/**
 * Generate business-type specific prompt instructions
 */
export function generateBusinessTypePromptInstructions(
  businessType: string,
  brandProfile: any
): string {
  const strategy = getBusinessTypeStrategy(businessType);

  if (!strategy) {
    return ''; // No specific strategy - use generic content generation
  }

  let instructions = `\n\n🎯 INDUSTRY-SPECIFIC MARKETING STRATEGY FOR ${businessType.toUpperCase()}:\n\n`;

  instructions += `📋 CONTENT FOCUS:\n${strategy.contentFocus}\n\n`;
  instructions += `🎨 MESSAGING TONE:\n${strategy.messagingTone}\n\n`;
  instructions += `📸 VISUAL GUIDANCE:\n${strategy.visualGuidance}\n\n`;
  instructions += `🔔 CALL-TO-ACTION STYLE:\n${strategy.ctaStyle}\n\n`;
  instructions += `📰 HEADLINE APPROACH:\n${strategy.headlineApproach}\n\n`;
  instructions += `📝 CAPTION GUIDANCE:\n${strategy.captionGuidance}\n\n`;

  // Add engagement-specific guidance
  instructions += `🎯 ENGAGEMENT TACTICS (Use these to maximize interaction):\n${strategy.engagementTactics}\n\n`;
  instructions += `💖 EMOTIONAL TRIGGERS (Connect with these feelings):\n${strategy.emotionalTriggers}\n\n`;
  instructions += `⏰ URGENCY CREATION (When appropriate, use these tactics):\n${strategy.urgencyCreation}\n\n`;

  // Add product data usage instructions for retail/e-commerce
  if (strategy.productDataUsage && brandProfile.productCatalog && brandProfile.productCatalog.length > 0) {
    instructions += `🛍️ PRODUCT DATA USAGE:\n${strategy.productDataUsage}\n\n`;
    instructions += `📦 AVAILABLE PRODUCTS (Use this data to create product-specific ads):\n`;

    // Include up to 5 products from catalog
    const products = brandProfile.productCatalog.slice(0, 5);
    products.forEach((product: any, index: number) => {
      instructions += `\nProduct ${index + 1}: ${product.name}\n`;
      if (product.price) instructions += `- Price: ${product.price}\n`;
      if (product.originalPrice) instructions += `- Original Price: ${product.originalPrice}\n`;
      if (product.discount) instructions += `- Discount: ${product.discount}\n`;
      if (product.features && product.features.length > 0) {
        instructions += `- Features: ${product.features.slice(0, 3).join(', ')}\n`;
      }
      if (product.benefits && product.benefits.length > 0) {
        instructions += `- Benefits: ${product.benefits.slice(0, 2).join(', ')}\n`;
      }
      if (product.stockStatus) instructions += `- Stock: ${product.stockStatus}\n`;
    });

    instructions += `\n⚠️ CRITICAL: Create ads that showcase SPECIFIC PRODUCTS from this list, not generic store promotions.\n`;
  }

  // Add example headlines and captions
  instructions += `\n💡 EXAMPLE HEADLINES FOR THIS INDUSTRY:\n`;
  strategy.exampleHeadlines.forEach((headline, index) => {
    instructions += `${index + 1}. "${headline}"\n`;
  });

  instructions += `\n💡 EXAMPLE CAPTIONS FOR THIS INDUSTRY:\n`;
  strategy.exampleCaptions.forEach((caption, index) => {
    instructions += `${index + 1}. ${caption}\n`;
  });

  instructions += `\n⚠️ CRITICAL: Follow this industry-specific strategy to create content that matches customer expectations and drives the right actions for ${businessType} businesses.\n`;

  return instructions;
}

