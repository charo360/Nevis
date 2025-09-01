const fs = require('fs');
const path = require('path');

// Sample business profile for testing
const sampleBusinessProfile = {
  businessName: 'Samaki Cookies',
  businessType: 'restaurant',
  industry: 'Food & Beverage',
  location: 'Nairobi',
  city: 'Nairobi',
  country: 'Kenya',
  description: 'Artisanal cookie bakery specializing in nutritious, locally-sourced ingredients',
  mission: 'To provide healthy, delicious cookies while fighting malnutrition in Kenya',
  vision: 'To be the leading provider of nutritious baked goods in East Africa',
  founded: '2023',
  employeeCount: 15,
  targetAudience: ['Families', 'Health-conscious individuals', 'Children', 'Local businesses'],
  ageGroups: ['Children', 'Young adults', 'Families', 'Seniors'],
  interests: ['Healthy eating', 'Local food', 'Sustainability', 'Community health'],
  lifestyle: ['Health-conscious', 'Community-minded', 'Quality-focused'],
  services: ['Artisanal cookies', 'Custom orders', 'Corporate catering', 'Wholesale distribution'],
  products: ['Nutritious cookies', 'Gluten-free options', 'Seasonal specialties'],
  specialties: ['Malnutrition-fighting cookies', 'Local ingredient sourcing', 'Community health programs'],
  uniqueValue: 'Cookies that taste great AND fight malnutrition',
  competitiveAdvantages: ['Local ingredient sourcing', 'Health-focused recipes', 'Community impact'],
  brandColors: ['#8B4513', '#228B22', '#FFD700'],
  primaryColor: '#8B4513',
  accentColor: '#228B22',
  backgroundColor: '#FFFFFF',
  visualStyle: 'rustic',
  brandVoice: 'friendly',
  brandPersonality: ['Caring', 'Authentic', 'Community-focused', 'Health-conscious'],
  contentThemes: ['Health & nutrition', 'Local community', 'Sustainable business', 'Family values'],
  contentTone: 'educational',
  preferredPostTypes: ['Behind-the-scenes', 'Customer stories', 'Health tips', 'Community events'],
  contentFrequency: 'daily',
  platforms: ['Instagram', 'Facebook', 'LinkedIn'],
  primaryPlatform: 'Instagram',
  socialMediaGoals: ['Brand awareness', 'Community building', 'Education', 'Sales'],
  targetMetrics: ['Engagement', 'Followers', 'Website traffic', 'Conversions'],
  localCulture: ['Kenyan hospitality', 'Community values', 'Traditional food culture'],
  communityInvolvement: ['Local health programs', 'School partnerships', 'Community events'],
  localEvents: ['Nairobi Food Festival', 'Community Health Day', 'Local Markets'],
  seasonalContent: ['Rainy season comfort foods', 'Dry season fresh ingredients', 'Holiday specials'],
  localTrends: ['Health consciousness', 'Local sourcing', 'Community support'],
  competitors: ['International bakeries', 'Local supermarkets', 'Other bakeries'],
  marketPosition: 'Premium health-focused local bakery',
  pricingStrategy: 'Premium pricing for quality and health benefits',
  customerFeedback: ['Love the health focus', 'Great taste', 'Community impact'],
  challenges: ['Cost of local ingredients', 'Education about nutrition', 'Competition from cheaper options'],
  opportunities: ['School partnerships', 'Corporate wellness programs', 'Tourism market'],
  website: 'https://samakicookies.ke',
  phone: '+254-700-123-456',
  email: 'hello@samakicookies.ke',
  address: '123 Uhuru Highway, Nairobi, Kenya',
  socialMediaHandles: {
    instagram: '@samakicookies',
    facebook: 'SamakiCookiesNairobi',
    linkedin: 'samaki-cookies-ltd'
  }
};

// Test the system directly
async function testSocialMediaExpertSystem() {
  console.log('🚀 Testing Social Media Expert System...\n');
  
  try {
    // Import the classes (you'll need to run this with tsx or compile first)
    console.log('📋 Sample Business Profile:');
    console.log(JSON.stringify(sampleBusinessProfile, null, 2));
    
    console.log('\n✅ System is ready for testing!');
    console.log('\nTo test the system:');
    console.log('1. Start your Next.js dev server: npm run dev');
    console.log('2. Use the API endpoint: POST /api/social-media-expert');
    console.log('3. Test with actions: analyze, generate-posts, generate-strategy, generate-calendar, complete-package');
    
    console.log('\n📝 Example API call:');
    console.log('POST http://localhost:3001/api/social-media-expert');
    console.log('Body: {');
    console.log('  "action": "complete-package",');
    console.log('  "businessProfile": sampleBusinessProfile,');
    console.log('  "platform": "Instagram",');
    console.log('  "count": 5');
    console.log('}');
    
  } catch (error) {
    console.error('❌ Error testing system:', error);
  }
}

// Run the test
testSocialMediaExpertSystem();
