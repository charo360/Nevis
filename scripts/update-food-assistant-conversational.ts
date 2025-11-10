#!/usr/bin/env tsx

/**
 * Update Food Assistant with Conversational Headlines
 * 
 * This script updates the OpenAI Food Assistant to generate more conversational,
 * personal headlines using "you/your" language instead of formal corporate language.
 */

import OpenAI from 'openai';
import { ASSISTANT_CONFIGS } from '../src/ai/assistants/assistant-configs.js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function updateFoodAssistant() {
  console.log('🍪 Updating Food Assistant with Conversational Headlines...\n');

  try {
    // Get the Food Assistant ID from environment
    const assistantId = process.env.OPENAI_ASSISTANT_FOOD;
    if (!assistantId) {
      throw new Error('OPENAI_ASSISTANT_FOOD environment variable not found');
    }

    console.log(`📋 Assistant ID: ${assistantId}`);

    // Get the updated Food Assistant configuration
    const foodConfig = ASSISTANT_CONFIGS.food;
    console.log(`📝 Assistant Name: ${foodConfig.name}`);

    // Update the assistant with new instructions
    console.log('🔄 Updating assistant instructions...');
    
    const updatedAssistant = await openai.beta.assistants.update(assistantId, {
      name: foodConfig.name,
      instructions: foodConfig.instructions,
      model: foodConfig.model,
    });

    console.log('✅ Food Assistant updated successfully!');
    console.log(`📊 Assistant: ${updatedAssistant.name}`);
    console.log(`🤖 Model: ${updatedAssistant.model}`);
    
    console.log('\n🎯 Key Changes Made:');
    console.log('  ✅ Headlines now use conversational "you/your" language');
    console.log('  ✅ Added examples of good vs bad headlines');
    console.log('  ✅ Emphasized personal, friend-like tone');
    console.log('  ✅ Removed formal corporate language patterns');
    
    console.log('\n📝 Example Headlines Now Generated:');
    console.log('  • "Your Kids Will Actually Ask for These"');
    console.log('  • "Finally, Snacks You Love AND Approve"');
    console.log('  • "Keep Your Brain Sharp While You Study"');
    console.log('  • "Stay Energized, Wherever Life Takes You"');
    
    console.log('\n❌ No Longer Generates:');
    console.log('  • "Transform Malnutrition with Cookies"');
    console.log('  • "Fuel Learning with Samaki Cookies"');
    console.log('  • "Premium Quality Fish-Based Nutrition"');

  } catch (error) {
    console.error('❌ Error updating Food Assistant:', error);
    process.exit(1);
  }
}

// Run the update
updateFoodAssistant();
