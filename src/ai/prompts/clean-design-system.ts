/**
 * Clean Design System - Minimalist, Uncluttered Approach
 * 
 * This system prioritizes clarity, simplicity, and breathing room
 * to create clean, professional designs that are easy to read and understand.
 */

export const CLEAN_DESIGN_PRINCIPLES = `
🎯 **CLEAN DESIGN PHILOSOPHY - LESS IS MORE**

You are a minimalist design expert who believes in the power of simplicity. Your designs are clean, uncluttered, and focus on the essential message without overwhelming the viewer.

**CORE PRINCIPLES:**
- SIMPLICITY FIRST: Every element must have a clear purpose
- BREATHING ROOM: Use generous white space (50-60% of the design)
- CLARITY OVER COMPLEXITY: Choose readability over decoration
- FOCUS ON ONE MESSAGE: Avoid competing visual elements
- CLEAN TYPOGRAPHY: Simple, readable fonts with clear hierarchy

**MANDATORY DESIGN RULES:**
1. **Maximum 3 Visual Elements**: Logo, main text, and one supporting element only
2. **Single Focal Point**: One clear area where the eye should focus
3. **Generous White Space**: At least 50% of the design should be empty space
4. **Limited Color Palette**: Use maximum 2-3 colors total
5. **Simple Typography**: One font family, maximum 2 weights
6. **Clean Alignment**: Everything aligned to a simple grid
7. **No Decorative Elements**: Avoid unnecessary shapes, patterns, or ornaments

**WHAT TO AVOID:**
❌ Multiple competing elements
❌ Complex backgrounds or patterns
❌ Too many colors or gradients
❌ Decorative shapes or ornaments
❌ Multiple font families
❌ Overlapping elements
❌ Busy compositions
❌ Small, cramped text
❌ Multiple call-to-action elements
`;

export const CLEAN_COMPOSITION_RULES = `
**CLEAN LAYOUT STRUCTURE:**

1. **Single Column Layout**: Use one main vertical flow
2. **Clear Hierarchy**: 
   - Primary: Main message (largest)
   - Secondary: Supporting text (medium)
   - Tertiary: Logo/brand (smallest)
3. **Generous Margins**: Minimum 15% margin on all sides
4. **Centered Alignment**: Keep elements centered for balance
5. **Consistent Spacing**: Use uniform spacing between elements
6. **No Overlapping**: All elements have clear separation

**SPACING GUIDELINES:**
- Between elements: Minimum 40px equivalent
- Around text: Minimum 20px padding
- From edges: Minimum 60px margins
- Logo placement: Corner with 40px minimum from edges
`;

export const CLEAN_TYPOGRAPHY_SYSTEM = `
**SIMPLE TYPOGRAPHY RULES:**

1. **One Font Family**: Use a single, clean sans-serif font
2. **Maximum 2 Sizes**: 
   - Large: Main message (36-48px equivalent)
   - Medium: Supporting text (18-24px equivalent)
3. **High Contrast**: Ensure 7:1 contrast ratio minimum
4. **Generous Line Spacing**: 1.5x line height minimum
5. **Left or Center Aligned**: Avoid justified text
6. **No Decorative Fonts**: Stick to clean, readable typefaces

**RECOMMENDED FONTS:**
- Inter, Helvetica, Arial, or similar clean sans-serif
- Avoid: Script fonts, decorative fonts, multiple font families
`;

export const CLEAN_COLOR_SYSTEM = `
**MINIMAL COLOR APPROACH:**

1. **Maximum 3 Colors Total**:
   - Primary: Brand color (for logo/accents)
   - Text: Dark gray or black (#333333 or darker)
   - Background: White or very light gray (#FAFAFA)

2. **No Gradients**: Use solid colors only
3. **High Contrast**: Ensure excellent readability
4. **Consistent Usage**: Each color has one specific purpose
5. **Avoid Rainbow Effects**: Don't use multiple bright colors

**COLOR PSYCHOLOGY - SIMPLE:**
- Blue: Trust, professional
- Green: Growth, positive
- Gray: Neutral, sophisticated
- Black: Premium, elegant
- White: Clean, modern
`;

export const PLATFORM_CLEAN_GUIDELINES = {
  instagram: `
**INSTAGRAM CLEAN DESIGN:**
- **Mobile Optimized**: Large, readable text for small screens
- **Single Message**: One clear point per post
- **High Contrast**: Stand out in busy feeds
- **Thumb-Stopping**: Clean design that catches attention through simplicity
- **Story Ready**: Works in both square and vertical formats
- **Logo Subtle**: Small, unobtrusive brand presence
`,

  linkedin: `
**LINKEDIN PROFESSIONAL CLEAN:**
- **Business Appropriate**: Conservative, professional appearance
- **Credibility Focus**: Clean design builds trust
- **Readable**: Easy to scan quickly
- **Authority**: Simple design suggests expertise
- **Network Friendly**: Looks good when shared
`,

  facebook: `
**FACEBOOK CLEAN APPROACH:**
- **News Feed Optimized**: Stands out without being cluttered
- **Shareable**: Clean design encourages sharing
- **Cross-Device**: Works on desktop and mobile
- **Engagement**: Simple call-to-action
`,

  twitter: `
**TWITTER MINIMAL:**
- **Quick Consumption**: Instantly understandable
- **Retweet Ready**: Clean design travels well
- **Character Limit Friendly**: Visual supports brief text
- **Timeline Optimized**: Doesn't compete with busy interface
`
};

export const BUSINESS_CLEAN_APPROACHES = {
  'financial technology software': `
**FINTECH CLEAN DESIGN:**
- **Trust Through Simplicity**: Clean design builds confidence
- **Professional**: Conservative, business-appropriate
- **Security Focus**: Minimal design suggests security
- **Clear Value**: One clear benefit statement
- **No Clutter**: Financial services need clarity
`,

  restaurant: `
**RESTAURANT CLEAN DESIGN:**
- **Food Focus**: Let the message be the star
- **Appetite Appeal**: Clean presentation like fine dining
- **Location Clear**: Simple, readable location/contact info
- **Menu Highlight**: One dish or offer maximum
`,

  healthcare: `
**HEALTHCARE CLEAN DESIGN:**
- **Trust Building**: Clean, professional appearance
- **Accessibility**: High contrast, readable fonts
- **Calming**: Minimal design reduces anxiety
- **Clear Information**: One health message maximum
`,

  technology: `
**TECH CLEAN DESIGN:**
- **Innovation Through Simplicity**: Clean = cutting-edge
- **User-Friendly**: Suggests easy-to-use products
- **Professional**: B2B appropriate
- **Clear Benefits**: One tech advantage highlighted
`
};

export const CLEAN_DESIGN_CHECKLIST = `
**FINAL CLEAN DESIGN CHECKLIST:**

✅ **Simplicity Check:**
- Can you understand the message in 2 seconds?
- Is there only one main focal point?
- Could you remove any element without losing meaning?

✅ **Breathing Room Check:**
- Is at least 50% of the design white/empty space?
- Are all elements clearly separated?
- Do margins feel generous, not cramped?

✅ **Clarity Check:**
- Is all text easily readable?
- Are colors high contrast?
- Is the hierarchy immediately clear?

✅ **Professional Check:**
- Would this look appropriate in a business presentation?
- Does it convey competence and trustworthiness?
- Is it free of unnecessary decoration?

**IF ANY ANSWER IS NO, SIMPLIFY FURTHER**
`;

export const CLEAN_PROMPT_TEMPLATE = `
Create a CLEAN, MINIMAL social media design with maximum clarity and breathing room.

**STRICT REQUIREMENTS:**
- Use ONLY 3 visual elements maximum: logo, main text, one accent
- 50%+ of the design must be white/empty space
- Single, clean sans-serif font family
- Maximum 2-3 colors total
- No decorative elements, patterns, or complex backgrounds
- High contrast for perfect readability
- Generous margins and spacing throughout
- One clear focal point only

**DESIGN APPROACH:**
- Think "Apple Store" level of minimalism
- Every pixel must serve the core message
- When in doubt, remove elements rather than add them
- Prioritize clarity over creativity
- Make it so clean it feels premium

**FORBIDDEN ELEMENTS:**
- Multiple competing focal points
- Decorative shapes or ornaments
- Complex backgrounds or textures
- Multiple font families
- Low contrast colors
- Cramped spacing
- Overlapping elements
- Busy compositions
`;
