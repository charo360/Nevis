/**
 * Create OpenAI Assistants Script
 * 
 * This script automatically creates OpenAI Assistants for Revo 2.0
 * based on the configurations in src/ai/assistants/assistant-configs.ts
 * 
 * Usage:
 *   npx ts-node scripts/create-assistants.ts
 * 
 * Requirements:
 *   - OPENAI_API_KEY must be set in environment
 *   - Only creates assistants marked as "implemented: true"
 */

const OpenAI = require('openai').default;
const { getImplementedConfigs } = require('../src/ai/assistants/assistant-configs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Main function to create all implemented assistants
 */
async function createAssistants() {
  console.log('🤖 Creating OpenAI Assistants for Revo 2.0\n');
  console.log('='.repeat(60));

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment');
    console.error('Please set OPENAI_API_KEY in your .env.local file');
    process.exit(1);
  }

  // Get implemented configs
  const configs = getImplementedConfigs();

  if (configs.length === 0) {
    console.log('⚠️  No implemented assistants found');
    console.log('Update assistant-configs.ts to mark assistants as implemented');
    process.exit(0);
  }

  console.log(`\n📋 Found ${configs.length} implemented assistant(s):\n`);
  configs.forEach(config => {
    console.log(`   - ${config.name} (${config.type})`);
  });
  console.log('\n' + '='.repeat(60) + '\n');

  // Create each assistant
  const envVars: string[] = [];
  const createdAssistants: Array<{ type: string; id: string; name: string }> = [];

  for (const config of configs) {
    console.log(`\n🔨 Creating assistant: ${config.name}`);
    console.log(`   Type: ${config.type}`);
    console.log(`   Model: ${config.model}`);
    console.log(`   Tools: ${config.tools ? config.tools.map(t => t.type).join(', ') : 'None'}`);

    try {
      const assistant = await openai.beta.assistants.create({
        name: config.name,
        model: config.model,
        instructions: config.instructions,
        tools: config.tools || [],
      });

      console.log(`   ✅ Created successfully!`);
      console.log(`   ID: ${assistant.id}`);

      // Store for summary
      createdAssistants.push({
        type: config.type,
        id: assistant.id,
        name: config.name,
      });

      // Generate env var line
      envVars.push(`${config.envVar}=${assistant.id}`);

    } catch (error) {
      console.error(`   ❌ Failed to create assistant:`, error);
      if (error instanceof Error) {
        console.error(`   Error: ${error.message}`);
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Assistant Creation Complete!\n');

  if (createdAssistants.length > 0) {
    console.log('📊 Summary:');
    console.log(`   Created: ${createdAssistants.length} assistant(s)\n`);

    createdAssistants.forEach(assistant => {
      console.log(`   ✓ ${assistant.name}`);
      console.log(`     Type: ${assistant.type}`);
      console.log(`     ID: ${assistant.id}\n`);
    });

    console.log('='.repeat(60));
    console.log('\n📝 Add these to your .env.local file:\n');
    console.log('# OpenAI Assistants for Revo 2.0');
    envVars.forEach(line => console.log(line));

    console.log('\n# Assistant Rollout Percentages (0-100)');
    createdAssistants.forEach(assistant => {
      console.log(`ASSISTANT_ROLLOUT_${assistant.type.toUpperCase()}=10  # Start with 10%`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n🎯 Next Steps:\n');
    console.log('1. Copy the environment variables above to your .env.local file');
    console.log('2. Adjust rollout percentages as needed (0 = disabled, 100 = all traffic)');
    console.log('3. Restart your development server');
    console.log('4. Test with: npm run test-assistants\n');

  } else {
    console.log('⚠️  No assistants were created');
  }
}

/**
 * Delete all assistants (cleanup function)
 * Uncomment and run to delete all assistants
 */
async function deleteAllAssistants() {
  console.log('🗑️  Deleting all assistants...\n');

  const assistants = await openai.beta.assistants.list();

  for (const assistant of assistants.data) {
    if (assistant.name?.includes('Revo 2.0')) {
      console.log(`Deleting: ${assistant.name} (${assistant.id})`);
      await openai.beta.assistants.delete(assistant.id);
      console.log('   ✅ Deleted\n');
    }
  }

  console.log('✅ Cleanup complete!');
}

/**
 * List all existing assistants
 */
async function listAssistants() {
  console.log('📋 Listing all assistants...\n');

  const assistants = await openai.beta.assistants.list();

  if (assistants.data.length === 0) {
    console.log('No assistants found');
    return;
  }

  console.log(`Found ${assistants.data.length} assistant(s):\n`);

  assistants.data.forEach(assistant => {
    console.log(`Name: ${assistant.name}`);
    console.log(`ID: ${assistant.id}`);
    console.log(`Model: ${assistant.model}`);
    console.log(`Created: ${new Date(assistant.created_at * 1000).toLocaleString()}`);
    console.log('---\n');
  });
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'delete':
    deleteAllAssistants().catch(console.error);
    break;
  case 'list':
    listAssistants().catch(console.error);
    break;
  case 'create':
  default:
    createAssistants().catch(console.error);
    break;
}

