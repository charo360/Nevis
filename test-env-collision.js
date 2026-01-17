
console.log('Checking environment variables...');
console.log('System OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (ends in ' + process.env.OPENAI_API_KEY.slice(-4) + ')' : 'Not set');

require('dotenv').config({ path: '.env.local' });
console.log('After dotenv(.env.local):', process.env.OPENAI_API_KEY ? 'Set (ends in ' + process.env.OPENAI_API_KEY.slice(-4) + ')' : 'Not set');
