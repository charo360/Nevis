/**
 * Enhanced Text Readability Prompts
 * Prevents corrupted text generation and ensures readable output
 */

export const ANTI_CORRUPTION_PROMPT = `
🚨 CRITICAL TEXT GENERATION RULES - ZERO TOLERANCE FOR CORRUPTION 🚨

ABSOLUTE REQUIREMENTS:
1. ALL TEXT MUST BE IN CLEAR, READABLE ENGLISH
2. NO GARBLED, CORRUPTED, OR NONSENSICAL CHARACTER SEQUENCES
3. NO RANDOM LETTER COMBINATIONS LIKE "AUTTENG", "BAMALE", "COMEASUE"
4. NO BROKEN WORDS OR FRAGMENTED TEXT
5. NO ENCODING ERRORS OR CHARACTER CORRUPTION

FORBIDDEN TEXT PATTERNS:
❌ "AUTTENG" - NEVER generate corrupted words
❌ "BAMALE" - NEVER generate broken text
❌ "COMEASUE" - NEVER generate garbled sequences
❌ "repairent tyaathfcoligetrick" - NEVER generate nonsense
❌ "marchtstrg, areadnr, gaod" - NEVER generate corrupted words
❌ Any text that looks like encoding errors
❌ Any text with random character combinations
❌ Any text that is not proper English words

REQUIRED TEXT QUALITY:
✅ Use ONLY proper English words from standard dictionary
✅ Ensure every word is spelled correctly
✅ Use clear, professional business language
✅ Make text large, bold, and highly readable
✅ Apply high contrast between text and background
✅ Use clean, modern typography
✅ Ensure text is the focal point of the design

TEXT VALIDATION CHECKLIST:
- Is every word a real English word? ✅
- Can the text be read clearly? ✅
- Does the text make business sense? ✅
- Is the spelling perfect? ✅
- Are there any corrupted characters? ❌
- Are there any nonsense sequences? ❌
`;

export const READABLE_TEXT_INSTRUCTIONS = `
📝 TEXT READABILITY REQUIREMENTS:

TYPOGRAPHY STANDARDS:
- Font size: Large and bold (minimum 24pt equivalent)
- Font family: Clean, modern sans-serif (Arial, Helvetica, Roboto)
- Font weight: Bold or semi-bold for maximum readability
- Letter spacing: Optimal spacing for clarity
- Line height: 1.2-1.4 for multi-line text

CONTRAST REQUIREMENTS:
- Minimum contrast ratio: 4.5:1 (WCAG AA standard)
- Preferred contrast ratio: 7:1 (WCAG AAA standard)
- Use dark text on light backgrounds OR light text on dark backgrounds
- Add text shadows or outlines if needed for visibility
- Apply semi-transparent backgrounds behind text if necessary

POSITIONING GUIDELINES:
- Place text in high-visibility areas
- Use rule of thirds for optimal placement
- Ensure text doesn't overlap with busy background elements
- Leave adequate white space around text
- Center important text for maximum impact

COLOR COMBINATIONS (HIGH CONTRAST):
✅ Black text on white background
✅ White text on dark blue background
✅ Dark navy text on light gray background
✅ White text on black background
✅ Dark text on yellow/bright background
❌ Light gray text on white background
❌ Dark blue text on black background
❌ Red text on green background
❌ Any low-contrast combinations
`;

export const TEXT_GENERATION_SAFEGUARDS = `
🛡️ TEXT GENERATION SAFEGUARDS:

LANGUAGE VALIDATION:
1. Generate text in proper English only
2. Use business-appropriate vocabulary
3. Ensure grammatical correctness
4. Avoid slang, jargon, or technical terms
5. Use clear, concise messaging

CORRUPTION PREVENTION:
1. Never generate random character sequences
2. Always use complete, real words
3. Ensure proper word spacing
4. Maintain consistent capitalization
5. Use standard punctuation only

QUALITY ASSURANCE:
1. Every word must pass spell-check
2. Text must make logical business sense
3. Avoid repetitive or redundant phrases
4. Use action-oriented language
5. Ensure professional tone throughout

FALLBACK PROTOCOLS:
If uncertain about text generation:
- Use simple, clear business terms
- Default to "Professional Services"
- Avoid complex or unusual words
- Keep messages short and direct
- Prioritize clarity over creativity
`;

export const ENHANCED_PROMPT_TEMPLATE = (imageText: string) => `
${ANTI_CORRUPTION_PROMPT}

TARGET TEXT TO DISPLAY: "${imageText}"

${READABLE_TEXT_INSTRUCTIONS}

${TEXT_GENERATION_SAFEGUARDS}

FINAL VALIDATION:
- Verify the text "${imageText}" is displayed exactly as provided
- Ensure no corruption or alteration of the original text
- Confirm text is large, bold, and highly readable
- Check that contrast meets accessibility standards
- Validate that text integrates well with the design

CRITICAL SUCCESS CRITERIA:
✅ Text is identical to provided input: "${imageText}"
✅ Text is completely readable and clear
✅ No corrupted or garbled characters
✅ Professional typography and layout
✅ High contrast and visibility
✅ Proper English spelling and grammar
`;

export const NEGATIVE_PROMPT_ADDITIONS = `
blurry text, unreadable text, distorted text, pixelated text, corrupted text, 
garbled text, nonsense text, random characters, encoding errors, broken words, 
fragmented text, illegible text, poor typography, low contrast text, 
microscopic text, overlapping text, cut-off text, partial text, 
"AUTTENG", "BAMALE", "COMEASUE", corrupted character sequences,
random letter combinations, broken English, gibberish, malformed text,
character corruption, encoding issues, text artifacts, scrambled letters
`;
