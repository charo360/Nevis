/**
 * Test Word Repetition Fix
 * Tests the removeWordRepetitions function to ensure it fixes issues like "buy now now pay later"
 */

// Test the word repetition removal function (updated version)
function removeWordRepetitions(text) {
  // Simple approach: split by spaces and check for consecutive duplicate words
  const words = text.split(/\s+/);
  const cleanedWords = [];

  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    const previousWord = cleanedWords[cleanedWords.length - 1];

    // Skip if current word is the same as previous word (case-insensitive)
    // Only for actual words (not empty strings)
    if (currentWord && previousWord &&
      currentWord.toLowerCase() === previousWord.toLowerCase() &&
      currentWord.trim().length > 0) {
      console.log(`🔧 Removed duplicate word: "${currentWord}"`);
      continue; // Skip this duplicate word
    }

    cleanedWords.push(currentWord);
  }

  return cleanedWords.join(' ');
}

// Test cases
console.log('🧪 Testing Word Repetition Fix...\n');

const testCases = [
  "BUY NOW NOW PAY LATER",
  "Experience the the best service",
  "Visit our our store today",
  "Get get your discount now",
  "The the best cookies in town",
  "Shop now now for amazing deals",
  "Try try our new menu",
  "Book book your appointment",
  "Call call us today",
  "Visit visit our website"
];

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}:`);
  console.log(`Original: "${testCase}"`);
  const fixed = removeWordRepetitions(testCase);
  console.log(`Fixed:    "${fixed}"`);
  console.log(`Status:   ${testCase !== fixed ? '✅ FIXED' : '❌ NO CHANGE NEEDED'}`);
  console.log('');
});

console.log('✅ Word repetition fix testing complete!');
