// Test script to demonstrate enhanced sales-focused content generation
// This shows how the AI now prioritizes product specifications and generates sales-oriented content

const testBusinessWithProductSpecs = {
  businessName: "Zentech Electronics",
  businessType: "electronics",
  location: "Nairobi",
  platform: "instagram",
  writingTone: "professional",
  targetAudience: "tech enthusiasts and smartphone buyers",
  
  // Scheduled service with detailed product specifications
  scheduledServices: [
    {
      serviceName: "iPhone 15 Pro Sales",
      description: "iPhone 15 Pro with 128GB storage, A17 Pro chip, 48MP Pro camera system, titanium design. Available in Natural Titanium, Blue Titanium, White Titanium, and Black Titanium. Starting at $999. Free shipping and trade-in available.",
      isToday: true,
      isUpcoming: false
    }
  ]
};

const testBusinessWithoutProductSpecs = {
  businessName: "Zentech Electronics",
  businessType: "electronics", 
  location: "Nairobi",
  platform: "instagram",
  writingTone: "professional",
  targetAudience: "tech enthusiasts",
  
  // General service without specific product details
  scheduledServices: [
    {
      serviceName: "Electronics Repair",
      description: "Professional electronics repair services",
      isToday: true,
      isUpcoming: false
    }
  ]
};

console.log('🧪 TESTING ENHANCED SALES-FOCUSED CONTENT GENERATION');
console.log('====================================================');

console.log('\n📱 TEST 1: Business WITH Product Specifications');
console.log('Expected: Sales-focused content with product specs, pricing, and direct purchase CTAs');
console.log('Service Description:', testBusinessWithProductSpecs.scheduledServices[0].description);

console.log('\n🔧 TEST 2: Business WITHOUT Product Specifications');  
console.log('Expected: General awareness content focused on business promotion');
console.log('Service Description:', testBusinessWithoutProductSpecs.scheduledServices[0].description);

console.log('\n🎯 KEY IMPROVEMENTS IMPLEMENTED:');
console.log('✅ Product specification detection and extraction');
console.log('✅ Dynamic content goal switching (awareness → conversion)');
console.log('✅ Sales-focused prompt enhancements');
console.log('✅ Product-specific headline, subheadline, and caption generation');
console.log('✅ Balanced local context (strategic, not overwhelming)');
console.log('✅ Direct purchase-oriented CTAs');

console.log('\n📊 EXPECTED CONTENT DIFFERENCES:');

console.log('\n📱 WITH PRODUCT SPECS (Conversion Mode):');
console.log('Headline: "iPhone 15 Pro 128GB - $999 Today"');
console.log('Subheadline: "A17 Pro chip meets 48MP Pro camera"');
console.log('Caption: "The iPhone 15 Pro with 128GB storage gives you room for everything while the A17 Pro chip delivers incredible performance. Capture life in stunning detail with the 48MP Pro camera system. Choose from 4 titanium colors. Starting at $999 with free shipping! 📱✨"');
console.log('CTA: "Get 128GB iPhone 15 Pro - $999"');

console.log('\n🔧 WITHOUT PRODUCT SPECS (Awareness Mode):');
console.log('Headline: "Nairobi Tech Repair Experts"');
console.log('Subheadline: "Professional electronics repair services"');
console.log('Caption: "When your electronics need expert care, trust Zentech Electronics in Nairobi. Our professional repair services get your devices back to perfect working condition. Experience the difference with our technical expertise and commitment to quality."');
console.log('CTA: "Contact us for repair services"');

console.log('\n🚀 TO TEST IN THE APP:');
console.log('1. Go to Content Calendar');
console.log('2. Schedule a service with detailed product specs (like the iPhone example)');
console.log('3. Generate content and observe sales-focused output');
console.log('4. Compare with general service descriptions');

console.log('\n✨ ENHANCED FEATURES:');
console.log('• Automatic product specification extraction');
console.log('• Dynamic content mode switching');
console.log('• Sales psychology integration');
console.log('• Balanced local context usage');
console.log('• Purchase-driven language patterns');
console.log('• Technical specification prominence');
