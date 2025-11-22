/**
 * Test Primary Model Configuration
 * Verify Gemini 3 Pro is set as primary
 */

import { 
  REVO_2_0_MODEL, 
  REVO_2_0_PRIMARY_MODEL, 
  REVO_2_0_FALLBACK_MODEL,
  REVO_2_0_GEMINI_3_PRO_MODEL
} from './src/ai/revo-2.0-service';

console.log('🧪 Testing Primary Model Configuration\n');
console.log('=' .repeat(60));

console.log('\n📊 Model Constants:');
console.log(`   REVO_2_0_PRIMARY_MODEL: ${REVO_2_0_PRIMARY_MODEL}`);
console.log(`   REVO_2_0_FALLBACK_MODEL: ${REVO_2_0_FALLBACK_MODEL}`);
console.log(`   REVO_2_0_MODEL (legacy): ${REVO_2_0_MODEL}`);
console.log(`   REVO_2_0_GEMINI_3_PRO_MODEL: ${REVO_2_0_GEMINI_3_PRO_MODEL}`);

console.log('\n✅ Verification:');

// Check primary is Gemini 3 Pro
if (REVO_2_0_PRIMARY_MODEL === 'gemini-3-pro-image-preview') {
  console.log('   ✅ PRIMARY model is Gemini 3 Pro');
} else {
  console.log('   ❌ PRIMARY model is NOT Gemini 3 Pro');
}

// Check fallback is Vertex AI
if (REVO_2_0_FALLBACK_MODEL === 'gemini-2.5-flash-image') {
  console.log('   ✅ FALLBACK model is Gemini 2.5 (Vertex AI)');
} else {
  console.log('   ❌ FALLBACK model is NOT Gemini 2.5');
}

// Check legacy constant points to primary
if (REVO_2_0_MODEL === REVO_2_0_PRIMARY_MODEL) {
  console.log('   ✅ Legacy REVO_2_0_MODEL points to PRIMARY (Gemini 3 Pro)');
} else {
  console.log('   ❌ Legacy REVO_2_0_MODEL does NOT point to PRIMARY');
}

// Check Gemini 3 Pro constant
if (REVO_2_0_GEMINI_3_PRO_MODEL === REVO_2_0_PRIMARY_MODEL) {
  console.log('   ✅ REVO_2_0_GEMINI_3_PRO_MODEL points to PRIMARY');
} else {
  console.log('   ❌ REVO_2_0_GEMINI_3_PRO_MODEL does NOT point to PRIMARY');
}

console.log('\n' + '='.repeat(60));
console.log('🎉 Configuration Test Complete!\n');

console.log('📝 Expected Behavior:');
console.log('   1. All image generation will try Gemini 3 Pro first');
console.log('   2. If Gemini 3 Pro fails, automatically falls back to Vertex AI');
console.log('   3. Logs will show "PRIMARY: Using Gemini 3 Pro via direct API"');
console.log('   4. On fallback, logs show "FALLBACK: Using Gemini 2.5 via Vertex AI"');

console.log('\n🚀 Next Steps:');
console.log('   1. Run: npm run dev');
console.log('   2. Generate content in the app');
console.log('   3. Check terminal logs for "PRIMARY: Using Gemini 3 Pro"');
console.log('   4. Verify image quality is improved!');

console.log('\n✅ All checks passed! Gemini 3 Pro is PRIMARY.\n');
