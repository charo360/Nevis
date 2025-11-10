/**
 * Test file for the text-based image editing command parser
 * Run this to verify the parsing logic works correctly
 */

import { AdvancedCommandParser } from './command-parser';
import { TextBasedImageEditor } from './text-based-editor';

// Test commands to verify parsing
const testCommands = [
  // Text replacement commands
  'Change "Special Offer" to "Limited Deal"',
  'Replace "Buy Now" with "Shop Today"',
  'change the word hello to goodbye',
  'substitute "Old Text" for "New Text"',
  
  // Remove commands
  'Remove the background text',
  'Delete the phone number',
  'eliminate the watermark',
  'get rid of the logo',
  
  // Color change commands
  'Change color of title to blue',
  'Make the headline red',
  'Turn the button green',
  'Set the text color to purple',
  
  // Size change commands
  'Make the logo bigger',
  'Make title smaller',
  'Increase the button size',
  'Shrink the image',
  'enlarge the text',
  
  // Add text commands
  'Add "New Product" text',
  'Insert "Coming Soon"',
  'include the text "Limited Time"',
  
  // Move commands
  'Move the logo to the left',
  'relocate the button to center',
  
  // Complex/ambiguous commands
  'change everything to blue',
  'make it better',
  'fix the design',
  'update the content',
  
  // Edge cases
  '',
  'a',
  'change',
  'remove all text and make everything red and bigger'
];

/**
 * Test the command parser with various inputs
 */
export function testCommandParser() {
  console.log('🧪 Testing Text-Based Image Editing Command Parser\n');
  
  testCommands.forEach((command, index) => {
    console.log(`\n--- Test ${index + 1} ---`);
    console.log(`Command: "${command}"`);
    
    try {
      // Test advanced parser
      const parsingResult = AdvancedCommandParser.parseCommand(command);
      console.log(`Parsed Commands: ${parsingResult.commands.length}`);
      
      parsingResult.commands.forEach((cmd, cmdIndex) => {
        console.log(`  ${cmdIndex + 1}. Type: ${cmd.type}`);
        console.log(`     Target: "${cmd.target}"`);
        if (cmd.replacement) console.log(`     Replacement: "${cmd.replacement}"`);
        if (cmd.color) console.log(`     Color: "${cmd.color}"`);
        if (cmd.size) console.log(`     Size: "${cmd.size}"`);
        if (cmd.position) console.log(`     Position: "${cmd.position}"`);
        console.log(`     Confidence: ${(cmd.confidence * 100).toFixed(1)}%`);
      });
      
      if (parsingResult.suggestions) {
        console.log(`Suggestions: ${parsingResult.suggestions.join(', ')}`);
      }
      
      if (parsingResult.warnings) {
        console.log(`⚠️  Warnings: ${parsingResult.warnings.join(', ')}`);
      }
      
      // Test validation
      const validation = AdvancedCommandParser.validateCommands(parsingResult.commands);
      if (!validation.valid) {
        console.log(`❌ Validation Errors: ${validation.errors.join(', ')}`);
      } else {
        console.log(`✅ Validation: Passed`);
      }
      
      // Test legacy parser for comparison
      const { commands: legacyCommands } = TextBasedImageEditor.parseEditCommand(command);
      console.log(`Legacy Parser: ${legacyCommands.length} commands`);
      
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  console.log('\n🎉 Command Parser Testing Complete!');
}

/**
 * Test command validation
 */
export function testCommandValidation() {
  console.log('\n🔍 Testing Command Validation\n');
  
  const validationTests = [
    { command: 'Change hello to goodbye', shouldPass: true },
    { command: '', shouldPass: false },
    { command: 'delete all text and remove everything', shouldPass: false },
    { command: 'a'.repeat(600), shouldPass: false },
    { command: 'Make logo bigger', shouldPass: true },
    { command: 'destroy the image', shouldPass: false }
  ];
  
  validationTests.forEach((test, index) => {
    console.log(`Test ${index + 1}: "${test.command.substring(0, 50)}${test.command.length > 50 ? '...' : ''}"`);
    
    const validation = TextBasedImageEditor.validateEditCommand(test.command);
    const passed = validation.valid === test.shouldPass;
    
    console.log(`Expected: ${test.shouldPass ? 'PASS' : 'FAIL'}`);
    console.log(`Actual: ${validation.valid ? 'PASS' : 'FAIL'}`);
    console.log(`Result: ${passed ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    if (!validation.valid && validation.error) {
      console.log(`Error: ${validation.error}`);
    }
    
    console.log('');
  });
}

/**
 * Test color and size normalization
 */
export function testNormalization() {
  console.log('\n🎨 Testing Color and Size Normalization\n');
  
  const colorTests = [
    'red', 'crimson', 'blue', 'navy', 'green', 'lime', 
    'yellow', 'gold', 'purple', 'violet', 'orange', 'black', 'white'
  ];
  
  const sizeTests = [
    'bigger', 'larger', 'huge', 'increase', 'enlarge',
    'smaller', 'tiny', 'reduce', 'shrink', 'decrease'
  ];
  
  console.log('Color Normalization:');
  colorTests.forEach(color => {
    const result = AdvancedCommandParser.parseCommand(`make text ${color}`);
    if (result.commands.length > 0) {
      console.log(`  "${color}" → "${result.commands[0].color}"`);
    }
  });
  
  console.log('\nSize Normalization:');
  sizeTests.forEach(size => {
    const result = AdvancedCommandParser.parseCommand(`make logo ${size}`);
    if (result.commands.length > 0) {
      console.log(`  "${size}" → "${result.commands[0].size}"`);
    }
  });
}

// Export test runner
export function runAllTests() {
  console.log('🚀 Running All Text-Based Image Editor Tests\n');
  console.log('='.repeat(60));
  
  testCommandParser();
  testCommandValidation();
  testNormalization();
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ All Tests Complete!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runAllTests();
}
