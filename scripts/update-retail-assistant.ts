/**
 * Update Retail Assistant with Content-Design Alignment Instructions
 * 
 * This script updates the existing retail assistant in OpenAI with the new
 * content-design alignment instructions to fix validation failures.
 * 
 * Run with: npx tsx scripts/update-retail-assistant.ts
 */

import OpenAI from 'openai';
import { getAssistantConfig } from '../src/ai/assistants/assistant-configs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function updateRetailAssistant() {
  console.log('🔧 [Update Assistant] Starting retail assistant update...\n');

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ [Update Assistant] OPENAI_API_KEY not found in environment');
    process.exit(1);
  }

  // Check for assistant ID
  const assistantId = process.env.OPENAI_ASSISTANT_RETAIL;
  if (!assistantId) {
    console.error('❌ [Update Assistant] OPENAI_ASSISTANT_RETAIL not found in environment');
    console.error('   Please set this in your .env.local file');
    process.exit(1);
  }

  console.log(`📋 [Update Assistant] Assistant ID: ${assistantId}`);

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Get current assistant configuration
    const config = getAssistantConfig('retail');
    if (!config) {
      console.error('❌ [Update Assistant] Could not load retail assistant config');
      process.exit(1);
    }

    console.log(`📝 [Update Assistant] Loaded config for: ${config.name}`);
    console.log(`🎯 [Update Assistant] Model: ${config.model}`);
    console.log(`📏 [Update Assistant] Instructions length: ${config.instructions.length} chars\n`);

    // Retrieve current assistant to check current state
    console.log('🔍 [Update Assistant] Retrieving current assistant state...');
    const currentAssistant = await openai.beta.assistants.retrieve(assistantId);
    console.log(`✅ [Update Assistant] Current assistant: ${currentAssistant.name}`);
    console.log(`📏 [Update Assistant] Current instructions length: ${currentAssistant.instructions?.length || 0} chars\n`);

    // Update the assistant
    console.log('🔄 [Update Assistant] Updating assistant with new instructions...');
    const updatedAssistant = await openai.beta.assistants.update(assistantId, {
      name: config.name,
      instructions: config.instructions,
      model: config.model,
      tools: config.tools || [],
    });

    console.log('\n✅ [Update Assistant] Assistant updated successfully!');
    console.log(`📋 [Update Assistant] Name: ${updatedAssistant.name}`);
    console.log(`🎯 [Update Assistant] Model: ${updatedAssistant.model}`);
    console.log(`📏 [Update Assistant] New instructions length: ${updatedAssistant.instructions?.length || 0} chars`);
    console.log(`🔧 [Update Assistant] Tools: ${updatedAssistant.tools?.map(t => t.type).join(', ') || 'none'}`);

    console.log('\n🎉 [Update Assistant] Update complete!');
    console.log('📝 [Update Assistant] The assistant now includes:');
    console.log('   ✅ Content-Design Alignment rules');
    console.log('   ✅ Unified Narrative Flow requirements');
    console.log('   ✅ Hero-Headline Match validation');
    console.log('   ✅ Scene-Story Alignment checks');
    console.log('   ✅ Mood Consistency enforcement');
    console.log('   ✅ CTA-Tone Alignment rules');
    console.log('   ✅ Common Themes requirements');
    console.log('\n🚀 [Update Assistant] Next generation should pass validation!');

  } catch (error: any) {
    console.error('\n❌ [Update Assistant] Error updating assistant:', error.message);
    if (error.response) {
      console.error('📊 [Update Assistant] Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the update
updateRetailAssistant().catch(console.error);
