/**
 * Debug why Revo 1.0 is falling back to template content
 */

console.log('🔍 Debugging Revo 1.0 Validation Failure...\n');

// Simulate the validation logic from Revo 1.0
function debugValidation(content) {
  console.log('📝 Testing content:', JSON.stringify(content, null, 2));
  
  // Basic validation checks
  const headlineValid = content.headline && content.headline.length <= 50;
  const subheadlineValid = content.subheadline && content.subheadline.length <= 150;
  const captionValid = content.caption && content.caption.length >= 20 && content.caption.length <= 500;
  const ctaValid = content.cta && content.cta.length <= 30;
  const hashtagsValid = Array.isArray(content.hashtags) && content.hashtags.length > 0;

  // Banned patterns check (simplified)
  const bannedPatterns = [
    /dreams.*blossom/i,
    /dreams.*bloom/i,
    /dreams.*flourish/i,
    /serenades/i,
    /rhythms.*success/i
  ];
  
  const headlineHasBannedPatterns = bannedPatterns.some(pattern => pattern.test(content.headline));
  const captionHasBannedPatterns = bannedPatterns.some(pattern => pattern.test(content.caption));

  // Similarity check (simplified - assume not similar for now)
  const headlineTooSimilar = false;
  const captionTooSimilar = false;

  // Generic check (simplified)
  const genericPatterns = [
    /unlock.*potential/i,
    /take.*next.*step/i,
    /discover.*difference/i
  ];
  
  const headlineIsGeneric = genericPatterns.some(pattern => pattern.test(content.headline));
  const captionIsGeneric = genericPatterns.some(pattern => pattern.test(content.caption));

  // Coherence validation
  const headlineWords = (content.headline || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const captionWords = content.caption.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  console.log(`🔍 Headline words (>3 chars): ${headlineWords.join(', ')}`);
  console.log(`🔍 Caption words (>3 chars): ${captionWords.slice(0, 10).join(', ')}`);
  
  const hasCommonWords = headlineWords.some(headlineWord => 
    captionWords.some(captionWord => {
      // Exact match
      if (headlineWord === captionWord) return true;
      
      // Financial Technology specific semantic matches
      if (headlineWord === 'finance' && ['financial', 'money', 'payment', 'banking', 'cash', 'paya'].includes(captionWord)) return true;
      if (headlineWord === 'financial' && ['finance', 'money', 'payment', 'banking', 'cash', 'paya'].includes(captionWord)) return true;
      if (headlineWord === 'technology' && ['tech', 'digital', 'mobile', 'app', 'system', 'solution'].includes(captionWord)) return true;
      if (headlineWord === 'paya' && ['finance', 'financial', 'money', 'payment', 'banking'].includes(captionWord)) return true;
      
      // General business semantic matches
      if (headlineWord === 'banking' && ['bank', 'money', 'payment', 'finance', 'financial', 'paya'].includes(captionWord)) return true;
      if (headlineWord === 'payment' && ['pay', 'money', 'banking', 'finance', 'financial', 'paya'].includes(captionWord)) return true;
      if (headlineWord === 'secure' && ['security', 'safe', 'protection', 'protect', 'trust'].includes(captionWord)) return true;
      if (headlineWord === 'daily' && ['every', 'everyday', 'routine', 'regular'].includes(captionWord)) return true;
      if (headlineWord === 'business' && ['company', 'shop', 'enterprise', 'commercial', 'work'].includes(captionWord)) return true;
      if (headlineWord === 'money' && ['cash', 'payment', 'finance', 'financial', 'banking', 'paya'].includes(captionWord)) return true;
      if (headlineWord === 'smart' && ['intelligent', 'clever', 'advanced', 'modern', 'tech'].includes(captionWord)) return true;
      
      // Root word matching
      if (headlineWord.length > 4 && captionWord.length > 4) {
        const headlineRoot = headlineWord.substring(0, Math.min(5, headlineWord.length));
        const captionRoot = captionWord.substring(0, Math.min(5, captionWord.length));
        if (headlineRoot === captionRoot) return true;
      }
      return false;
    })
  );
  
  const captionDisconnected = !hasCommonWords && content.caption.length > 80;

  // Log all validation results
  console.log('\n🔍 VALIDATION RESULTS:');
  console.log(`   📏 headlineValid: ${headlineValid} (length: ${content.headline?.length})`);
  console.log(`   📏 subheadlineValid: ${subheadlineValid} (length: ${content.subheadline?.length})`);
  console.log(`   📏 captionValid: ${captionValid} (length: ${content.caption?.length})`);
  console.log(`   📏 ctaValid: ${ctaValid} (length: ${content.cta?.length})`);
  console.log(`   📏 hashtagsValid: ${hashtagsValid} (count: ${content.hashtags?.length})`);
  console.log(`   🚫 headlineHasBannedPatterns: ${headlineHasBannedPatterns}`);
  console.log(`   🚫 captionHasBannedPatterns: ${captionHasBannedPatterns}`);
  console.log(`   🔄 headlineTooSimilar: ${headlineTooSimilar}`);
  console.log(`   🔄 captionTooSimilar: ${captionTooSimilar}`);
  console.log(`   📝 headlineIsGeneric: ${headlineIsGeneric}`);
  console.log(`   📝 captionIsGeneric: ${captionIsGeneric}`);
  console.log(`   🔗 hasCommonWords: ${hasCommonWords}`);
  console.log(`   🔗 captionDisconnected: ${captionDisconnected}`);

  const passes = headlineValid && subheadlineValid && captionValid && ctaValid && hashtagsValid &&
    !headlineHasBannedPatterns && !captionHasBannedPatterns &&
    !headlineTooSimilar && !captionTooSimilar &&
    !headlineIsGeneric && !captionIsGeneric && !captionDisconnected;

  console.log(`\n🎯 OVERALL VALIDATION: ${passes ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!passes) {
    const failures = [];
    if (!headlineValid) failures.push('invalid headline');
    if (!subheadlineValid) failures.push('invalid subheadline');
    if (!captionValid) failures.push('invalid caption');
    if (!ctaValid) failures.push('invalid CTA');
    if (!hashtagsValid) failures.push('invalid hashtags');
    if (headlineHasBannedPatterns) failures.push('headline banned patterns');
    if (captionHasBannedPatterns) failures.push('caption banned patterns');
    if (headlineTooSimilar) failures.push('headline too similar');
    if (captionTooSimilar) failures.push('caption too similar');
    if (headlineIsGeneric) failures.push('headline generic');
    if (captionIsGeneric) failures.push('caption generic');
    if (captionDisconnected) failures.push('caption disconnected');
    
    console.log(`❌ FAILURE REASONS: ${failures.join(', ')}`);
  }
  
  return passes;
}

// Test with typical AI-generated content for Paya Finance
const testContent1 = {
  headline: "SMART FINANCE TECH",
  subheadline: "Revolutionary financial technology solutions for modern businesses",
  caption: "Paya Finance transforms how businesses handle money. Our advanced technology platform makes payments, transfers, and financial management simple and secure. Join thousands of businesses already using our smart financial solutions.",
  cta: "Get Started",
  hashtags: ["#PayaFinance", "#FinTech", "#SmartPayments", "#BusinessFinance", "#KE"]
};

const testContent2 = {
  headline: "SECURE PAYMENTS",
  subheadline: "Advanced security for all your business transactions",
  caption: "Your business deserves payment solutions that work as hard as you do. Paya Finance combines cutting-edge security with user-friendly design to deliver financial technology that actually makes sense for your business.",
  cta: "Learn More",
  hashtags: ["#PayaFinance", "#SecurePayments", "#BusinessTech", "#FinancialSecurity", "#KE"]
};

const testContent3 = {
  headline: "DAILY BUSINESS GROWTH",
  subheadline: "Financial tools that grow with your business every day",
  caption: "Every day brings new opportunities for your business. Paya Finance provides the financial technology infrastructure you need to seize those opportunities, manage cash flow, and scale your operations efficiently.",
  cta: "Try Today",
  hashtags: ["#PayaFinance", "#BusinessGrowth", "#DailyFinance", "#ScaleUp", "#KE"]
};

console.log('='.repeat(80));
console.log('TEST 1: Smart Finance Tech');
console.log('='.repeat(80));
debugValidation(testContent1);

console.log('\n' + '='.repeat(80));
console.log('TEST 2: Secure Payments');
console.log('='.repeat(80));
debugValidation(testContent2);

console.log('\n' + '='.repeat(80));
console.log('TEST 3: Daily Business Growth');
console.log('='.repeat(80));
debugValidation(testContent3);

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log('If all tests PASS, then the validation logic is working correctly.');
console.log('If tests FAIL, we need to adjust the validation rules.');
console.log('The goal is to accept good AI content and reject only truly bad content.');
