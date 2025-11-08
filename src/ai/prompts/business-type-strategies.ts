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
    businessTypes: ['retail', 'e-commerce', 'ecommerce', 'shop', 'store', 'boutique', 'marketplace', 'electronics', 'fashion', 'clothing'],
    contentFocus: '🚨 PRODUCT-FIRST MANDATORY: Show specific products with names, prices, features, and brands. NEVER use lifestyle/emotional marketing. Focus on WHAT you sell, HOW MUCH it costs, and WHY customers should buy it. Products must be the STAR of every ad.',
    messagingTone: 'Direct, specific, transactional. Lead with product name, price, and key feature. ZERO abstract emotional language. Answer: What is it? How much? Why buy it?',
    visualGuidance: '🚨 CRITICAL: PRODUCT MUST BE THE STAR (60-80% of image). Large, clear product photography with visible details. Show the ACTUAL product being sold, NOT lifestyle scenes. Include price overlays, feature callouts, brand logos. NO people unless showing product scale/use. Product should be clearly identifiable.',
    ctaStyle: 'Direct purchase actions: "Shop Now", "Buy Today", "Order Online", "Visit Showroom", "Add to Cart", "Get Yours", "Check Price", "See Collection"',
    headlineApproach: '🚨 MANDATORY FORMAT: "[Product Name/Brand] - [Price/Key Feature]" OR "[Category] From KES [Price]" OR "[X]% Off [Specific Product]". NEVER use abstract emotional headlines like "Unlock Your Dreams" or "Love Story". Examples: "Samsung 55" 4K TV - KES 89,999", "Smart Speakers From KES 3,500", "50% Off iPhone Cases", "Google Nest Hub - KES 12,999"',
    captionGuidance: '🚨 MANDATORY STRUCTURE: 1) Specific product name and model (e.g., "Samsung Galaxy S24 Ultra 256GB"), 2) Key features as bullet points (e.g., "200MP camera, S Pen, 5000mAh battery"), 3) Exact price or price range (e.g., "KES 89,999"), 4) Availability (e.g., "In stock now", "New arrival", "Only 5 left"), 5) Where/how to buy (e.g., "Order online or visit showroom"). NEVER use vague language like "range of products" or "smart home devices" - name SPECIFIC items. NO emotional storytelling - focus on product specs and purchase details.',
    engagementTactics: 'Product showcases with prices, feature comparisons with specs, new arrival announcements with product names, stock alerts with quantities, bundle deals with exact pricing, brand partnerships with product lineups, product demos with features, customer reviews mentioning specific products',
    emotionalTriggers: 'Value for money (show savings), fear of missing deals (limited stock), desire for specific branded products, trust in authentic products, quality assurance (warranty/guarantee), convenience of purchase (delivery/pickup)',
    urgencyCreation: 'Limited stock with exact quantities ("Only 3 left"), flash sales with end times ("Sale ends Sunday 6PM"), "First 50 customers get X", "New arrival - limited quantity", "Price increases Monday", specific deadlines',
    productDataUsage: '🚨 CRITICAL MANDATORY: EVERY retail ad MUST use productCatalog data. Extract: 1) Product name/model (exact), 2) Price (exact KES amount), 3) Features (list 2-3 specific ones), 4) Brand name (Samsung, Google, etc.), 5) Discount percentage if any. Create ads showcasing ONE specific product per ad with ALL its details. Rotate through different products - NEVER use vague "range of products" language. If no product data available, use business services data to create product-like ads. NEVER create retail ads without specific product information.',
    exampleHeadlines: [
      'Samsung Galaxy S24 Ultra - KES 89,999',
      'Google Nest Hub (2nd Gen) - KES 12,999',
      'Smart Home Starter Kit - KES 25,000',
      '500+ Smart Devices From KES 3,500'
    ],
    exampleCaptions: [
      'Samsung Galaxy S24 Ultra, 256GB. Features: 200MP camera, S Pen included, 5000mAh battery, titanium frame. KES 89,999. In stock now at all showrooms. 2-year warranty included. Free delivery in Nairobi. Order online or visit us today. 📱',
      'Google Nest Hub (2nd Gen) - 7" smart display with Google Assistant built-in. Control your lights, cameras, and thermostats. Stream Netflix and YouTube. Voice match for personalized responses. KES 12,999. Official Google authorized dealer. Genuine products only. Shop now! 🏠',
      'Smart Home Starter Kit: Includes 3 Philips Hue color smart bulbs + TP-Link smart plug + Amazon Echo Dot (5th Gen). Control everything with your voice or smartphone app. Works with Alexa. Complete kit KES 25,000 (save KES 5,000 vs buying separately). Professional setup available. Limited stock - only 10 kits left! 💡',
      'Browse our collection of 500+ smart home devices. Smart speakers starting from KES 3,500. Smart bulbs from KES 1,200. Security cameras from KES 8,500. Brands we carry: Google Nest, Amazon Echo, Philips Hue, TP-Link, Ring, Arlo. Visit our smart home demo center to try before you buy. Free consultation available. 🛒'
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
  },

  // REAL ESTATE / PROPERTY
  {
    businessTypes: ['real estate', 'property', 'realtor', 'realty', 'housing', 'homes', 'apartments', 'condos', 'property management'],
    contentFocus: 'Property features, location benefits, investment value, lifestyle improvements. Focus on finding the perfect home or investment.',
    messagingTone: 'Aspirational, trustworthy, detail-oriented. Emphasize location, value, and lifestyle benefits.',
    visualGuidance: 'Show beautiful properties, happy homeowners, neighborhood amenities, interior features, outdoor spaces, location highlights.',
    ctaStyle: 'Property actions: "Schedule a Viewing", "See Listings", "Contact Agent", "Get Market Report", "Find Your Home", "Invest Today"',
    headlineApproach: 'Lead with property benefit or location. Examples: "[Bedrooms] Bedroom [Property Type] in [Location]", "Your Dream Home Awaits", "Prime [Location] Investment"',
    captionGuidance: 'Highlight specific property features, location advantages, and lifestyle benefits. Use descriptive language about spaces, amenities, and neighborhood. Include key details like bedrooms, bathrooms, square footage.',
    engagementTactics: 'Virtual tours, property highlights, neighborhood showcases, investment ROI, lifestyle imagery, before/after renovations, market insights, open house announcements',
    emotionalTriggers: 'Aspiration for homeownership, desire for better lifestyle, investment security, pride of ownership, family comfort, neighborhood community, financial growth',
    urgencyCreation: 'Open house dates, "Just listed", "Price reduced", "Multiple offers expected", "Hot market", "Limited inventory", "Interest rates", "Seasonal market timing"',
    exampleHeadlines: [
      'Stunning 3BR Home in Prime Location',
      'Your Dream Home Just Listed',
      'Investment Property with High ROI',
      'Modern Living in the Heart of Downtown'
    ],
    exampleCaptions: [
      'Just listed! This stunning 3-bedroom, 2-bathroom home features an open floor plan, modern kitchen, and beautiful backyard. Located in a family-friendly neighborhood with top-rated schools. Schedule your viewing today! 🏡',
      'Prime investment opportunity in a growing neighborhood. This renovated duplex offers strong rental income potential with 8% ROI. Both units fully occupied with long-term tenants. Don\'t miss this chance! 📈'
    ]
  },

  // AUTOMOTIVE / CAR SALES & SERVICE
  {
    businessTypes: ['automotive', 'car', 'auto', 'vehicle', 'dealership', 'car sales', 'auto repair', 'mechanic', 'car service'],
    contentFocus: 'Vehicle features, performance, reliability, value, and service quality. Focus on specific models, deals, or service benefits.',
    messagingTone: 'Confident, detail-oriented, value-focused. Emphasize quality, reliability, and customer satisfaction.',
    visualGuidance: 'Show vehicles in action, detailed features, happy customers, service quality, before/after repairs, test drives, dealership experience.',
    ctaStyle: 'Auto actions: "Schedule Test Drive", "View Inventory", "Get Quote", "Book Service", "Trade-In Value", "Finance Options", "Shop Now"',
    headlineApproach: 'Lead with vehicle model, deal, or service benefit. Examples: "[Year] [Make] [Model] - [Key Feature]", "Save [Amount] on [Vehicle]", "Expert [Service] You Can Trust"',
    captionGuidance: 'For sales: highlight specific vehicle features, performance specs, safety ratings, and current deals. For service: emphasize expertise, quality parts, warranty, and customer care.',
    engagementTactics: 'Vehicle showcases, feature highlights, customer testimonials, service specials, financing options, trade-in offers, warranty information, maintenance tips',
    emotionalTriggers: 'Desire for new vehicle, pride of ownership, safety concerns, reliability needs, status aspiration, financial value, peace of mind from quality service',
    urgencyCreation: 'Limited inventory, end-of-year sales, seasonal promotions, "Last one in stock", financing deals, service specials, "Book this week", trade-in bonuses',
    exampleHeadlines: [
      '2024 SUV - Advanced Safety Features',
      'Save $5,000 on Select Models',
      'Expert Auto Service You Can Trust',
      'Your Next Adventure Starts Here'
    ],
    exampleCaptions: [
      'The 2024 [Model] combines luxury and performance with advanced safety features, premium interior, and impressive fuel efficiency. Test drive today and get special financing rates. Limited time offer! 🚗',
      'Keep your vehicle running smoothly with our expert maintenance service. ASE-certified technicians, genuine parts, and a 12-month warranty on all repairs. Book your appointment today! 🔧'
    ]
  },

  // BEAUTY / SALON / SPA
  {
    businessTypes: ['beauty', 'salon', 'spa', 'hair', 'nails', 'makeup', 'cosmetics', 'barbershop', 'beauty parlor', 'aesthetics'],
    contentFocus: 'Transformation, self-care, confidence, beauty services, and results. Focus on specific treatments and their benefits.',
    messagingTone: 'Empowering, luxurious, confidence-building. Emphasize transformation, self-care, and feeling beautiful.',
    visualGuidance: 'Show beautiful results, happy clients, relaxing spa environments, skilled professionals at work, before/after transformations, product quality.',
    ctaStyle: 'Beauty actions: "Book Appointment", "Try This Look", "Get Pampered", "Reserve Your Spot", "Transform Today", "Call Now"',
    headlineApproach: 'Lead with service or transformation. Examples: "[Service] That Transforms", "Look Your Best with [Treatment]", "Luxury [Service] Experience"',
    captionGuidance: 'Focus on transformation and confidence. Describe the experience, results, and how clients will feel. Highlight skilled professionals, quality products, and relaxing atmosphere.',
    engagementTactics: 'Before/after photos, service showcases, client testimonials, seasonal looks, product recommendations, self-care messaging, special occasion prep, loyalty programs',
    emotionalTriggers: 'Desire for beauty and confidence, self-care and relaxation, special occasion preparation, transformation aspiration, feeling pampered, social confidence',
    urgencyCreation: 'Special occasion timing (weddings, holidays), seasonal trends, limited appointment slots, new service launches, package deals, "Book this week", first-time client offers',
    exampleHeadlines: [
      'Hair Color That Turns Heads',
      'Luxury Spa Day Awaits You',
      'Bridal Beauty Perfection',
      'Transform Your Look Today'
    ],
    exampleCaptions: [
      'Get ready for the holidays with our signature balayage hair color. Our expert stylists create custom looks that enhance your natural beauty. Book your appointment now and receive 20% off! ✨',
      'Treat yourself to our luxury spa package: massage, facial, and mani-pedi. Relax in our serene environment while our skilled professionals pamper you. You deserve this! 💆‍♀️'
    ]
  },

  // HOME SERVICES / CONTRACTORS
  {
    businessTypes: ['home services', 'contractor', 'plumbing', 'electrical', 'hvac', 'roofing', 'painting', 'renovation', 'handyman', 'landscaping'],
    contentFocus: 'Problem-solving, quality workmanship, reliability, and home improvement results. Focus on specific services and customer satisfaction.',
    messagingTone: 'Trustworthy, professional, solution-oriented. Emphasize expertise, reliability, and quality results.',
    visualGuidance: 'Show professionals at work, quality results, before/after transformations, happy homeowners, equipment and tools, completed projects.',
    ctaStyle: 'Service actions: "Get Free Quote", "Schedule Service", "Call Today", "Book Inspection", "Request Estimate", "Fix It Now"',
    headlineApproach: 'Lead with problem or solution. Examples: "Expert [Service] Solutions", "Fix [Problem] Fast", "Quality [Service] You Can Trust"',
    captionGuidance: 'Focus on solving specific problems and delivering quality results. Highlight expertise, licensing, warranties, and customer satisfaction. Use before/after examples.',
    engagementTactics: 'Before/after photos, problem-solution framing, customer testimonials, emergency services, seasonal maintenance, warranty information, free estimates, licensed/insured messaging',
    emotionalTriggers: 'Relief from home problems, peace of mind, pride in home, protection of investment, family safety, comfort improvement, stress reduction',
    urgencyCreation: 'Emergency services, seasonal needs (winter prep, summer AC), "Call today", limited availability, special pricing, "Before it gets worse", preventive maintenance timing',
    exampleHeadlines: [
      'Expert Plumbing - Fast Response',
      'Transform Your Home with Quality Painting',
      'HVAC Service You Can Trust',
      'Fix It Right the First Time'
    ],
    exampleCaptions: [
      'Leaky faucet? Clogged drain? Our licensed plumbers provide fast, reliable service with upfront pricing. Available 24/7 for emergencies. Call now for a free estimate! 🔧',
      'Transform your home with our professional painting service. Quality materials, skilled painters, and attention to detail. Free color consultation included. Get your quote today! 🎨'
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

