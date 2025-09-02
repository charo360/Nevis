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
      continue; // Skip this duplicate word
    }

    cleanedWords.push(currentWord);
  }

  return cleanedWords.join(' ');
}

// Test cases

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
  const fixed = removeWordRepetitions(testCase);
});

