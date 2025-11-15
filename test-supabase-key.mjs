import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Service Role Key...');
console.log('═'.repeat(60));
console.log('URL:', url);
console.log('Service Key exists:', !!serviceKey);
console.log('Service Key length:', serviceKey?.length);
console.log('Service Key starts with:', serviceKey?.substring(0, 30) + '...');

if (!url || !serviceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

// Test the connection
const supabase = createClient(url, serviceKey);

console.log('\n🧪 Testing connection by querying brand_profiles...');
try {
  const { data, error } = await supabase
    .from('brand_profiles')
    .select('id, business_name, user_id')
    .limit(5);

  if (error) {
    console.error('❌ Query failed:', error);
    console.error('   Message:', error.message);
    console.error('   Hint:', error.hint);
    console.error('   Code:', error.code);
  } else {
    console.log('✅ Connection successful!');
    console.log('   Found', data?.length || 0, 'brands');
    if (data && data.length > 0) {
      data.forEach(b => console.log('   -', b.business_name));
    }
  }
} catch (err) {
  console.error('❌ Exception:', err);
}
