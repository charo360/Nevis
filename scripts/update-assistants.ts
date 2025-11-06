/**
 * Update OpenAI Assistants Script
 *
 * This script updates existing OpenAI Assistants with new instructions
 * from src/ai/assistants/assistant-configs.ts
 *
 * Usage:
 *   node --loader ts-node/esm scripts/update-assistants.ts
 *   OR
 *   tsx scripts/update-assistants.ts
 *
 * Requirements:
 *   - OPENAI_API_KEY must be set in environment
 *   - Assistant IDs must be set in .env.local (OPENAI_ASSISTANT_*)
 */

import OpenAI from 'openai';
import { getImplementedConfigs } from '../src/ai/assistants/assistant-configs.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Main function to update all implemented assistants
 */
async function updateAssistants() {
  console.log('🔄 Updating OpenAI Assistants for Revo 2.0\n');
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

  // Update each assistant
  const updatedAssistants: Array<{ type: string; id: string; name: string; status: string }> = [];

  for (const config of configs) {
    console.log(`\n🔨 Updating assistant: ${config.name}`);
    console.log(`   Type: ${config.type}`);
    console.log(`   Model: ${config.model}`);

    // Get assistant ID from environment
    const assistantId = process.env[config.envVar];

    if (!assistantId) {
      console.log(`   ⚠️  Skipped: ${config.envVar} not found in environment`);
      updatedAssistants.push({
        type: config.type,
        id: 'N/A',
        name: config.name,
        status: 'SKIPPED - No ID in env',
      });
      continue;
    }

    console.log(`   ID: ${assistantId}`);

    try {
      // Update the assistant with new instructions
      const assistant = await openai.beta.assistants.update(assistantId, {
        name: config.name,
        model: config.model,
        instructions: config.instructions,
        tools: config.tools || [],
      });

      console.log(`   ✅ Updated successfully!`);

      updatedAssistants.push({
        type: config.type,
        id: assistant.id,
        name: config.name,
        status: 'UPDATED',
      });

    } catch (error) {
      console.error(`   ❌ Failed to update assistant:`, error);
      if (error instanceof Error) {
        console.error(`   Error: ${error.message}`);
      }
      updatedAssistants.push({
        type: config.type,
        id: assistantId,
        name: config.name,
        status: 'FAILED',
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Assistant Update Complete!\n');

  if (updatedAssistants.length > 0) {
    console.log('📊 Summary:\n');
    updatedAssistants.forEach(assistant => {
      const statusIcon = assistant.status === 'UPDATED' ? '✅' :
        assistant.status === 'FAILED' ? '❌' : '⚠️';
      console.log(`   ${statusIcon} ${assistant.name}`);
      console.log(`      Type: ${assistant.type}`);
      console.log(`      ID: ${assistant.id}`);
      console.log(`      Status: ${assistant.status}\n`);
    });
  }

  const successCount = updatedAssistants.filter(a => a.status === 'UPDATED').length;
  const failedCount = updatedAssistants.filter(a => a.status === 'FAILED').length;
  const skippedCount = updatedAssistants.filter(a => a.status.includes('SKIPPED')).length;

  console.log('='.repeat(60));
  console.log(`\n📈 Results: ${successCount} updated, ${failedCount} failed, ${skippedCount} skipped\n`);

  if (successCount > 0) {
    console.log('✅ All assistants have been updated with new instructions!');
    console.log('   The new caption variety requirements are now active.\n');
  }

  if (failedCount > 0) {
    console.log('⚠️  Some assistants failed to update. Check the errors above.\n');
  }

  if (skippedCount > 0) {
    console.log('⚠️  Some assistants were skipped because their IDs are not in .env.local\n');
  }
}

// Run the script
updateAssistants()
  .then(() => {
    console.log('🎉 Update script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Update script failed:', error);
    process.exit(1);
  });

