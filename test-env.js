// Quick test to check if environment variables are loaded
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Environment Variables:\n');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
console.log('OPENAI_ASSISTANT_RETAIL:', process.env.OPENAI_ASSISTANT_RETAIL || '❌ Not set');
console.log('OPENAI_ASSISTANT_FINANCE:', process.env.OPENAI_ASSISTANT_FINANCE || '❌ Not set');
console.log('ASSISTANT_ROLLOUT_RETAIL:', process.env.ASSISTANT_ROLLOUT_RETAIL || '❌ Not set');
console.log('ASSISTANT_ROLLOUT_FINANCE:', process.env.ASSISTANT_ROLLOUT_FINANCE || '❌ Not set');
console.log('\n✅ If you see the actual values above, environment variables are working!');
