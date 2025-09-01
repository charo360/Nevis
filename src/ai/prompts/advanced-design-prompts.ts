/**
 * Advanced Design Generation Prompts
 * 
 * Professional-grade prompts incorporating design principles, composition rules,
 * typography best practices, color theory, and modern design trends.
 */

export const ADVANCED_DESIGN_PRINCIPLES = `
**COMPOSITION & VISUAL HIERARCHY:**
- Apply the Rule of Thirds: Position key elements along the grid lines or intersections
- Create clear visual hierarchy using size, contrast, and positioning
- Establish a strong focal point that draws the eye immediately
- Use negative space strategically to create breathing room and emphasis
- Balance elements using symmetrical or asymmetrical composition
- Guide the viewer's eye through the design with leading lines and flow

**TYPOGRAPHY EXCELLENCE:**
- Establish clear typographic hierarchy (Primary headline, secondary text, body copy)
- Use maximum 2-3 font families with strong contrast between them
- Ensure text contrast ratio meets accessibility standards (4.5:1 minimum)
- Apply proper letter spacing, line height, and text alignment
- Scale typography appropriately for the platform and viewing distance
- Use typography as a design element, not just information delivery

**COLOR THEORY & HARMONY:**
- Apply color psychology appropriate to the business type and message
- Use complementary colors for high contrast and attention
- Apply analogous colors for harmony and cohesion
- Implement triadic color schemes for vibrant, balanced designs
- Ensure sufficient contrast between text and background
- Use the 60-30-10 rule: 60% dominant color, 30% secondary, 10% accent

**MODERN DESIGN TRENDS:**
- Embrace minimalism with purposeful use of white space
- Use bold, geometric shapes and clean lines
- Apply subtle gradients and depth effects when appropriate
- Incorporate authentic, diverse photography when using people
- Use consistent border radius and spacing throughout
- Apply subtle shadows and depth for modern dimensionality
`;

export const PLATFORM_SPECIFIC_GUIDELINES = {
  instagram: `
**INSTAGRAM OPTIMIZATION:**
- Design for mobile-first viewing with bold, clear elements
- Use high contrast colors that pop on small screens
- Keep text large and readable (minimum 24px equivalent)
- Center important elements for square crop compatibility
- Use Instagram's native color palette trends
- Design for both feed and story formats
- Optimize for thumb-stopping power in fast scroll feeds
- Logo placement: Bottom right corner or integrated naturally into design
- Ensure logo is visible but doesn't overwhelm the main content
`,

  facebook: `
**FACEBOOK OPTIMIZATION:**
- Design for both desktop and mobile viewing
- Use Facebook blue (#1877F2) strategically for CTAs
- Optimize for news feed algorithm preferences
- Include clear value proposition in visual hierarchy
- Design for engagement and shareability
- Use authentic, relatable imagery
- Optimize for both organic and paid placement
- Logo placement: Top left or bottom right corner for brand recognition
- Ensure logo works well in both desktop and mobile formats
`,

  twitter: `
**TWITTER/X OPTIMIZATION:**
- Design for rapid consumption and high engagement
- Use bold, contrasting colors that stand out in timeline
- Keep text minimal and impactful
- Design for retweet and quote tweet functionality
- Use trending visual styles and memes appropriately
- Optimize for both light and dark mode viewing
- Create thumb-stopping visuals for fast-scrolling feeds
- Logo placement: Small, subtle placement that doesn't interfere with content
- Ensure logo is readable in both light and dark modes
`,

  linkedin: `
**LINKEDIN OPTIMIZATION:**
- Use professional, business-appropriate color schemes
- Apply corporate design standards and clean aesthetics
- Include clear value proposition for business audience
- Use professional photography and imagery
- Design for thought leadership and expertise positioning
- Apply subtle, sophisticated design elements
- Optimize for professional networking context
- Logo placement: Prominent placement for brand authority and recognition
- Ensure logo conveys professionalism and trustworthiness
`
};

export const BUSINESS_TYPE_DESIGN_DNA = {
  restaurant: `
**RESTAURANT DESIGN DNA:**
- Use warm, appetizing colors (reds, oranges, warm yellows)
- Include high-quality food photography with proper lighting
- Apply rustic or modern clean aesthetics based on restaurant type
- Use food-focused typography (script for upscale, bold sans for casual)
- Include appetite-triggering visual elements
- Apply golden hour lighting effects for food imagery
- Use complementary colors that enhance food appeal
- Show diverse people enjoying meals in authentic, social settings
- Include cultural food elements that reflect local cuisine traditions
- Display chefs, staff, and customers from the local community
- Use table settings and dining environments that feel culturally authentic
`,

  fitness: `
**FITNESS DESIGN DNA:**
- Use energetic, motivational color schemes (bright blues, oranges, greens)
- Include dynamic action shots and movement
- Apply bold, strong typography with impact
- Use high-contrast designs for motivation and energy
- Include progress and achievement visual metaphors
- Apply athletic and performance-focused imagery
- Use inspiring and empowering visual language
- Show diverse athletes and fitness enthusiasts in action
- Include people of different body types, ages, and fitness levels
- Display authentic workout environments and community settings
- Use culturally relevant sports and fitness activities for the region
`,

  beauty: `
**BEAUTY DESIGN DNA:**
- Use sophisticated, elegant color palettes (pastels, metallics)
- Include high-quality beauty photography with perfect lighting
- Apply clean, minimalist aesthetics with luxury touches
- Use elegant, refined typography
- Include aspirational and transformational imagery
- Apply soft, flattering lighting effects
- Use premium and luxurious visual elements
- Show diverse models representing different skin tones, ages, and beauty standards
- Include authentic beauty routines and self-care moments
- Display culturally relevant beauty practices and aesthetics
- Use inclusive representation that celebrates natural beauty diversity
`,

  tech: `
**TECH DESIGN DNA (CANVA-QUALITY):**
- Use sophisticated, professional color schemes (modern blues, elegant grays, clean whites)
- Include polished, well-designed layouts with strategic geometric elements and refined shapes
- Apply professional business visual metaphors with premium stock photography quality
- Use modern, bold typography with clear hierarchy (multiple font weights and sizes)
- Include high-quality business imagery: professional office spaces, authentic workplace scenarios
- Apply elegant design effects: subtle gradients, refined shadows, tasteful borders
- Use trustworthy and sophisticated visual language that matches premium Canva templates
- Show diverse tech professionals in polished, well-lit business environments
- Include people using technology in professional, aspirational business contexts
- Display modern office spaces, premium remote work setups, and sophisticated business environments
- Use strategic design elements: elegant shapes, professional patterns, refined layouts
- Create designs that look intentionally crafted and professionally designed
- FOCUS: Premium stock photography quality, sophisticated layouts, Canva-level polish
`,

  ecommerce: `
**E-COMMERCE DESIGN DNA:**
- Use conversion-focused color schemes (trust blues, urgency reds, success greens)
- Include high-quality product photography with lifestyle context
- Apply clean, scannable layouts with clear hierarchy
- Use action-oriented typography and compelling CTAs
- Include social proof and trust signals
- Apply mobile-first responsive design principles
- Use persuasive and benefit-focused visual language
- Show diverse customers using products in real-life situations
- Include authentic unboxing and product experience moments
- Display culturally relevant usage scenarios and lifestyle contexts
`,

  healthcare: `
**HEALTHCARE DESIGN DNA:**
- Use calming, trustworthy color palettes (soft blues, greens, whites)
- Include professional medical imagery with human warmth
- Apply clean, accessible design with clear information hierarchy
- Use readable, professional typography
- Include caring and compassionate visual elements
- Apply medical accuracy with approachable aesthetics
- Use reassuring and professional visual language
- Show diverse healthcare professionals and patients
- Include authentic care moments and medical environments
- Display culturally sensitive healthcare interactions and settings
`,

  education: `
**EDUCATION DESIGN DNA:**
- Use inspiring, growth-focused color schemes (blues, greens, warm oranges)
- Include diverse learning environments and educational moments
- Apply organized, structured layouts with clear learning paths
- Use friendly, accessible typography
- Include knowledge and achievement visual metaphors
- Apply bright, optimistic design elements
- Use encouraging and empowering visual language
- Show students and educators from diverse backgrounds
- Include authentic classroom and learning environments
- Display culturally relevant educational practices and settings
`,

  default: `
**UNIVERSAL DESIGN DNA:**
- Use brand-appropriate color psychology
- Include authentic, high-quality imagery
- Apply clean, professional aesthetics
- Use readable, accessible typography
- Include relevant industry visual metaphors
- Apply consistent brand visual language
- Use trustworthy and professional design elements
- Show diverse people in authentic, relevant contexts
- Include culturally appropriate imagery and design elements
- Display real human connections and authentic moments
`
};

export const QUALITY_ENHANCEMENT_INSTRUCTIONS = `
**DESIGN QUALITY STANDARDS:**
- Ensure all text is perfectly readable with sufficient contrast
- Apply consistent spacing and alignment throughout
- Use high-resolution imagery without pixelation or artifacts
- Maintain visual balance and proper proportions
- Ensure brand elements are prominently but naturally integrated
- Apply professional color grading and visual polish
- Create designs that work across different screen sizes
- Ensure accessibility compliance for color contrast and readability

**TECHNICAL EXCELLENCE:**
- Generate crisp, high-resolution images suitable for social media
- Apply proper aspect ratios for platform requirements
- Ensure text overlay is perfectly positioned and readable
- Use consistent visual style throughout the design
- Apply professional lighting and shadow effects
- Ensure logo integration feels natural and branded
- Create designs that maintain quality when compressed for social media
`;
