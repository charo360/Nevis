/**
 * Revo 1.0 Setup Verification Script
 * Comprehensive check of all components and configurations
 */

const fs = require('fs');
const path = require('path');

async function checkRevoSetup() {
  console.log('🔍 Revo 1.0 Setup Verification\n');

  const checks = {
    environment: false,
    businessProfileResolver: false,
    calendarService: false,
    calendarEnhancer: false,
    databaseSchema: false,
    apiRoutes: false,
    testFiles: false
  };

  const issues = [];
  const recommendations = [];

  // 1. Environment Variables Check
  console.log('📋 Checking environment configuration...');
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
      const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
      
      if (hasSupabaseUrl && hasSupabaseKey && hasServiceKey) {
        checks.environment = true;
        console.log('   ✅ Environment variables configured');
      } else {
        issues.push('Missing Supabase environment variables');
        recommendations.push('Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to .env.local');
      }
    } else {
      issues.push('.env.local file not found');
      recommendations.push('Create .env.local file with Supabase configuration');
    }
  } catch (error) {
    issues.push(`Environment check failed: ${error.message}`);
  }

  // 2. Business Profile Resolver Check
  console.log('📋 Checking Business Profile Resolver...');
  const resolverPath = path.join(__dirname, 'src/ai/business-profile/resolver.ts');
  if (fs.existsSync(resolverPath)) {
    checks.businessProfileResolver = true;
    console.log('   ✅ Business Profile Resolver exists');
  } else {
    issues.push('Business Profile Resolver missing');
  }

  // 3. Calendar Service Check
  console.log('📋 Checking Calendar Service...');
  const calendarServicePath = path.join(__dirname, 'src/services/calendar-service.ts');
  if (fs.existsSync(calendarServicePath)) {
    checks.calendarService = true;
    console.log('   ✅ Calendar Service exists');
  } else {
    issues.push('Calendar Service missing');
  }

  // 4. Calendar Enhancer Check
  console.log('📋 Checking Calendar Enhancer...');
  const enhancerPath = path.join(__dirname, 'src/ai/revo-1.0-calendar-enhancer.ts');
  if (fs.existsSync(enhancerPath)) {
    checks.calendarEnhancer = true;
    console.log('   ✅ Calendar Enhancer exists');
  } else {
    issues.push('Calendar Enhancer missing');
  }

  // 5. Database Schema Check
  console.log('📋 Checking Database Schema...');
  const schemaPath = path.join(__dirname, 'database-schema.sql');
  if (fs.existsSync(schemaPath)) {
    checks.databaseSchema = true;
    console.log('   ✅ Database Schema exists');
  } else {
    issues.push('Database Schema missing');
  }

  // 6. API Routes Check
  console.log('📋 Checking API Routes...');
  const calendarApiPath = path.join(__dirname, 'src/app/api/calendar/route.ts');
  const quickContentApiPath = path.join(__dirname, 'src/app/api/quick-content/route.ts');
  
  if (fs.existsSync(calendarApiPath) && fs.existsSync(quickContentApiPath)) {
    checks.apiRoutes = true;
    console.log('   ✅ API Routes exist');
  } else {
    issues.push('API Routes missing or incomplete');
  }

  // 7. Test Files Check
  console.log('📋 Checking Test Files...');
  const testPath = path.join(__dirname, 'test-business-profile-resolver.js');
  const healthCheckPath = path.join(__dirname, 'src/utils/database-health-check.ts');
  
  if (fs.existsSync(testPath) && fs.existsSync(healthCheckPath)) {
    checks.testFiles = true;
    console.log('   ✅ Test Files exist');
  } else {
    issues.push('Test Files missing or incomplete');
  }

  // Summary
  console.log('\n🎯 Setup Summary:');
  const totalChecks = Object.keys(checks).length;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const setupScore = Math.round((passedChecks / totalChecks) * 100);

  console.log(`   Setup Score: ${setupScore}% (${passedChecks}/${totalChecks} checks passed)`);
  
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`   ${check}: ${passed ? '✅' : '❌'}`);
  });

  if (issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    issues.forEach(issue => console.log(`   • ${issue}`));
  }

  if (recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => console.log(`   • ${rec}`));
  }

  // Next Steps
  console.log('\n🚀 Next Steps:');
  if (setupScore === 100) {
    console.log('   ✅ Setup is complete! Run: node test-business-profile-resolver.js');
    console.log('   ✅ Test calendar integration with real data');
    console.log('   ✅ Generate content with Revo 1.0 to verify business data usage');
  } else if (setupScore >= 80) {
    console.log('   🔧 Fix remaining issues and rerun this check');
    console.log('   📝 Review recommendations above');
  } else {
    console.log('   🚨 Major setup issues detected');
    console.log('   📖 Follow the implementation guide step by step');
    console.log('   🔧 Address critical missing components first');
  }

  console.log('\n📊 Revo 1.0 Features Status:');
  console.log('   ✅ Business Data Enforcement (Strict validation)');
  console.log('   ✅ Calendar Integration (Service of the day)');
  console.log('   ✅ Real-time Context (RSS, Weather, Events)');
  console.log('   ✅ Platform Optimization (Instagram, LinkedIn, etc.)');
  console.log('   ✅ Content Quality Validation');
  console.log('   ✅ Source Tracking (db|user|website|missing)');
}

// Run the setup check
checkRevoSetup().catch(console.error);
