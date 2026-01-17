/**
 * AI Pattern Removal
 * Removes common AI-generated patterns to make content sound more human
 * Part of Layer 4: Humanization Layer
 */

export interface HumanizationResult {
  original: string;
  humanized: string;
  changesApplied: string[];
  humanScore: number; // 0-1, higher = more human-sounding
}

// Common AI patterns to remove or replace
const AI_PATTERNS: Array<{
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  description: string;
}> = [
  // Formal transition words
  { pattern: /\bMoreover,?\s*/gi, replacement: 'Also, ', description: 'Removed "Moreover"' },
  { pattern: /\bFurthermore,?\s*/gi, replacement: 'Plus, ', description: 'Removed "Furthermore"' },
  { pattern: /\bAdditionally,?\s*/gi, replacement: 'And ', description: 'Removed "Additionally"' },
  { pattern: /\bConsequently,?\s*/gi, replacement: 'So ', description: 'Removed "Consequently"' },
  { pattern: /\bNevertheless,?\s*/gi, replacement: 'But ', description: 'Removed "Nevertheless"' },
  { pattern: /\bHowever,?\s*/gi, replacement: 'But ', description: 'Simplified "However"' },
  { pattern: /\bTherefore,?\s*/gi, replacement: 'So ', description: 'Simplified "Therefore"' },
  
  // Overused AI phrases
  { pattern: /\bdelve into\b/gi, replacement: 'explore', description: 'Replaced "delve into"' },
  { pattern: /\bdelve\b/gi, replacement: 'look', description: 'Replaced "delve"' },
  { pattern: /\bin today's world\b/gi, replacement: 'today', description: 'Simplified "in today\'s world"' },
  { pattern: /\bin this day and age\b/gi, replacement: 'now', description: 'Simplified "in this day and age"' },
  { pattern: /\bit's important to note that\b/gi, replacement: '', description: 'Removed filler phrase' },
  { pattern: /\bit's worth noting that\b/gi, replacement: '', description: 'Removed filler phrase' },
  { pattern: /\bit goes without saying\b/gi, replacement: '', description: 'Removed filler phrase' },
  { pattern: /\bneedless to say\b/gi, replacement: '', description: 'Removed filler phrase' },
  { pattern: /\bas a matter of fact\b/gi, replacement: 'actually', description: 'Simplified phrase' },
  { pattern: /\bin order to\b/gi, replacement: 'to', description: 'Simplified "in order to"' },
  { pattern: /\bdue to the fact that\b/gi, replacement: 'because', description: 'Simplified phrase' },
  { pattern: /\bfor the purpose of\b/gi, replacement: 'to', description: 'Simplified phrase' },
  { pattern: /\bat the end of the day\b/gi, replacement: 'ultimately', description: 'Simplified cliché' },
  { pattern: /\bwith that being said\b/gi, replacement: 'that said', description: 'Simplified phrase' },
  
  // Overly formal language
  { pattern: /\butilize\b/gi, replacement: 'use', description: 'Simplified "utilize"' },
  { pattern: /\bfacilitate\b/gi, replacement: 'help', description: 'Simplified "facilitate"' },
  { pattern: /\bimplement\b/gi, replacement: 'use', description: 'Simplified "implement"' },
  { pattern: /\bleverage\b/gi, replacement: 'use', description: 'Simplified "leverage"' },
  { pattern: /\boptimize\b/gi, replacement: 'improve', description: 'Simplified "optimize"' },
  { pattern: /\bsynergize\b/gi, replacement: 'combine', description: 'Simplified "synergize"' },
  { pattern: /\bparadigm\b/gi, replacement: 'approach', description: 'Simplified "paradigm"' },
  
  // AI-style openings
  { pattern: /^In conclusion,?\s*/i, replacement: '', description: 'Removed "In conclusion"' },
  { pattern: /^To summarize,?\s*/i, replacement: '', description: 'Removed "To summarize"' },
  { pattern: /^As we can see,?\s*/i, replacement: '', description: 'Removed "As we can see"' },
  { pattern: /^It is evident that\s*/i, replacement: '', description: 'Removed "It is evident that"' },
  
  // Excessive hedging
  { pattern: /\bperhaps\b/gi, replacement: 'maybe', description: 'Simplified "perhaps"' },
  { pattern: /\bquite\b/gi, replacement: '', description: 'Removed filler "quite"' },
  { pattern: /\brather\b/gi, replacement: '', description: 'Removed filler "rather"' },
  { pattern: /\bsomewhat\b/gi, replacement: '', description: 'Removed filler "somewhat"' },
];

// Conversational elements to potentially add
const CONVERSATIONAL_STARTERS = [
  'Honestly, ',
  'Here\'s the thing: ',
  'You know what? ',
  'Real talk: ',
  'Let\'s be real - ',
  'The truth is, ',
  'Look, ',
];

const CONVERSATIONAL_CONNECTORS = [
  'And ',
  'But ',
  'So ',
  'Plus, ',
  'Also, ',
];

/**
 * Remove AI patterns from text
 */
export function removeAIPatterns(text: string): HumanizationResult {
  let humanized = text;
  const changesApplied: string[] = [];

  // Apply pattern replacements
  for (const { pattern, replacement, description } of AI_PATTERNS) {
    const before = humanized;
    if (typeof replacement === 'function') {
      humanized = humanized.replace(pattern, replacement);
    } else {
      humanized = humanized.replace(pattern, replacement);
    }
    if (before !== humanized) {
      changesApplied.push(description);
    }
  }

  // Clean up double spaces
  humanized = humanized.replace(/\s{2,}/g, ' ').trim();

  // Calculate human score
  const humanScore = calculateHumanScore(humanized);

  return {
    original: text,
    humanized,
    changesApplied,
    humanScore,
  };
}

/**
 * Add conversational elements to text
 */
export function addConversationalElements(
  text: string,
  options: {
    addStarter?: boolean;
    probability?: number;
  } = {}
): string {
  const { addStarter = false, probability = 0.3 } = options;

  let result = text;

  // Optionally add a conversational starter
  if (addStarter && Math.random() < probability) {
    const starter = CONVERSATIONAL_STARTERS[
      Math.floor(Math.random() * CONVERSATIONAL_STARTERS.length)
    ];
    // Only add if text doesn't already start with a conversational element
    if (!startsWithConversational(result)) {
      result = starter + result.charAt(0).toLowerCase() + result.slice(1);
    }
  }

  // Replace some sentence starters with conversational connectors
  const sentences = result.split(/(?<=[.!?])\s+/);
  if (sentences.length > 2) {
    for (let i = 1; i < sentences.length; i++) {
      if (Math.random() < probability && !startsWithConversational(sentences[i])) {
        const connector = CONVERSATIONAL_CONNECTORS[
          Math.floor(Math.random() * CONVERSATIONAL_CONNECTORS.length)
        ];
        sentences[i] = connector + sentences[i].charAt(0).toLowerCase() + sentences[i].slice(1);
      }
    }
    result = sentences.join(' ');
  }

  return result;
}

/**
 * Check if text starts with a conversational element
 */
function startsWithConversational(text: string): boolean {
  const conversationalStarts = [
    ...CONVERSATIONAL_STARTERS,
    ...CONVERSATIONAL_CONNECTORS,
    'I ', 'We ', 'You ', 'Hey', 'Hi', 'So,', 'And,', 'But,',
  ];
  const lowerText = text.toLowerCase().trim();
  return conversationalStarts.some(start => lowerText.startsWith(start.toLowerCase()));
}

/**
 * Calculate how human-sounding the text is
 */
function calculateHumanScore(text: string): number {
  let score = 1.0;
  const lowerText = text.toLowerCase();

  // Penalize remaining AI patterns
  const aiIndicators = [
    'moreover', 'furthermore', 'additionally', 'consequently',
    'delve', 'utilize', 'leverage', 'optimize', 'facilitate',
    'it is important to note', 'it goes without saying',
    'in conclusion', 'to summarize', 'as we can see',
  ];

  for (const indicator of aiIndicators) {
    if (lowerText.includes(indicator)) {
      score -= 0.1;
    }
  }

  // Reward conversational elements
  const humanIndicators = [
    'honestly', 'actually', 'you know', 'here\'s the thing',
    'let\'s', 'we\'re', 'you\'re', 'it\'s', 'that\'s',
  ];

  for (const indicator of humanIndicators) {
    if (lowerText.includes(indicator)) {
      score += 0.05;
    }
  }

  // Penalize overly long sentences (AI tends to write long sentences)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
  if (avgSentenceLength > 25) {
    score -= 0.1;
  }

  // Penalize lack of contractions
  const words = text.split(/\s+/).length;
  const contractions = (text.match(/\w+'\w+/g) || []).length;
  if (words > 20 && contractions === 0) {
    score -= 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Add natural imperfections (use sparingly)
 */
export function addNaturalImperfections(
  text: string,
  options: {
    addEllipsis?: boolean;
    addDashes?: boolean;
    probability?: number;
  } = {}
): string {
  const { addEllipsis = false, addDashes = true, probability = 0.2 } = options;

  let result = text;

  // Occasionally add em-dashes for emphasis
  if (addDashes && Math.random() < probability) {
    // Find a comma that could become an em-dash
    const commaMatch = result.match(/,\s+(\w+\s+\w+)/);
    if (commaMatch && Math.random() < 0.5) {
      result = result.replace(commaMatch[0], ` — ${commaMatch[1]}`);
    }
  }

  // Occasionally add ellipsis for trailing thoughts (use very sparingly)
  if (addEllipsis && Math.random() < probability * 0.5) {
    if (result.endsWith('.') && !result.endsWith('...')) {
      result = result.slice(0, -1) + '...';
    }
  }

  return result;
}

/**
 * Expand contractions (for more formal content)
 */
export function expandContractions(text: string): string {
  const contractions: Record<string, string> = {
    "won't": "will not",
    "can't": "cannot",
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "wouldn't": "would not",
    "couldn't": "could not",
    "shouldn't": "should not",
    "it's": "it is",
    "that's": "that is",
    "there's": "there is",
    "here's": "here is",
    "what's": "what is",
    "who's": "who is",
    "let's": "let us",
    "I'm": "I am",
    "you're": "you are",
    "we're": "we are",
    "they're": "they are",
    "I've": "I have",
    "you've": "you have",
    "we've": "we have",
    "they've": "they have",
    "I'll": "I will",
    "you'll": "you will",
    "we'll": "we will",
    "they'll": "they will",
    "I'd": "I would",
    "you'd": "you would",
    "we'd": "we would",
    "they'd": "they would",
  };

  let result = text;
  for (const [contraction, expansion] of Object.entries(contractions)) {
    result = result.replace(new RegExp(contraction, 'gi'), expansion);
  }
  return result;
}

/**
 * Add contractions (for more casual content)
 */
export function addContractions(text: string): string {
  const expansions: Record<string, string> = {
    "will not": "won't",
    "cannot": "can't",
    "do not": "don't",
    "does not": "doesn't",
    "did not": "didn't",
    "is not": "isn't",
    "are not": "aren't",
    "was not": "wasn't",
    "were not": "weren't",
    "have not": "haven't",
    "has not": "hasn't",
    "had not": "hadn't",
    "would not": "wouldn't",
    "could not": "couldn't",
    "should not": "shouldn't",
    "it is": "it's",
    "that is": "that's",
    "there is": "there's",
    "here is": "here's",
    "what is": "what's",
    "who is": "who's",
    "let us": "let's",
    "I am": "I'm",
    "you are": "you're",
    "we are": "we're",
    "they are": "they're",
    "I have": "I've",
    "you have": "you've",
    "we have": "we've",
    "they have": "they've",
    "I will": "I'll",
    "you will": "you'll",
    "we will": "we'll",
    "they will": "they'll",
    "I would": "I'd",
    "you would": "you'd",
    "we would": "we'd",
    "they would": "they'd",
  };

  let result = text;
  for (const [expansion, contraction] of Object.entries(expansions)) {
    result = result.replace(new RegExp(expansion, 'gi'), contraction);
  }
  return result;
}

/**
 * Full humanization pipeline
 */
export function humanizeContent(
  text: string,
  options: {
    removePatterns?: boolean;
    addConversational?: boolean;
    addContractions?: boolean;
    addImperfections?: boolean;
    conversationalProbability?: number;
  } = {}
): HumanizationResult {
  const {
    removePatterns = true,
    addConversational: addConv = true,
    addContractions: addContr = true,
    addImperfections = false,
    conversationalProbability = 0.3,
  } = options;

  let result = text;
  const changesApplied: string[] = [];

  // Step 1: Remove AI patterns
  if (removePatterns) {
    const patternResult = removeAIPatterns(result);
    result = patternResult.humanized;
    changesApplied.push(...patternResult.changesApplied);
  }

  // Step 2: Add contractions
  if (addContr) {
    const before = result;
    result = addContractions(result);
    if (before !== result) {
      changesApplied.push('Added contractions');
    }
  }

  // Step 3: Add conversational elements
  if (addConv) {
    const before = result;
    result = addConversationalElements(result, { probability: conversationalProbability });
    if (before !== result) {
      changesApplied.push('Added conversational elements');
    }
  }

  // Step 4: Add natural imperfections (optional)
  if (addImperfections) {
    const before = result;
    result = addNaturalImperfections(result);
    if (before !== result) {
      changesApplied.push('Added natural imperfections');
    }
  }

  // Calculate final human score
  const humanScore = calculateHumanScore(result);

  return {
    original: text,
    humanized: result,
    changesApplied,
    humanScore,
  };
}

export default {
  removeAIPatterns,
  addConversationalElements,
  addNaturalImperfections,
  expandContractions,
  addContractions,
  humanizeContent,
};
