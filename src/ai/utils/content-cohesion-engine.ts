/**
 * Content Cohesion Engine for Enhanced Revo 1.0 AI Content Generation
 * Ensures thematic consistency across headlines, subheadlines, CTAs, captions, and hashtags
 */

export interface ContentElements {
  headline?: string;
  subheadline?: string;
  callToAction?: string;
  caption?: string;
  hashtags?: string[];
}

export interface CohesionAnalysis {
  cohesionScore: number; // 0-1 scale
  primaryTheme: string;
  emotionalTone: string;
  consistencyIssues: string[];
  suggestions: string[];
  thematicKeywords: string[];
}

/**
 * Analyze content cohesion across all elements
 */
export function analyzeContentCohesion(content: ContentElements): CohesionAnalysis {
  
  // Extract all text content
  const allText = [
    content.headline || '',
    content.subheadline || '',
    content.callToAction || '',
    content.caption || '',
    ...(content.hashtags || [])
  ].join(' ').toLowerCase();
  
  // Identify primary theme
  const primaryTheme = identifyPrimaryTheme(content);
  
  // Analyze emotional tone
  const emotionalTone = analyzeEmotionalTone(allText);
  
  // Check thematic consistency
  const thematicKeywords = extractThematicKeywords(allText);
  
  // Calculate cohesion score
  const cohesionScore = calculateCohesionScore(content, primaryTheme, thematicKeywords);
  
  // Identify consistency issues
  const consistencyIssues = identifyConsistencyIssues(content, primaryTheme, emotionalTone);
  
  // Generate improvement suggestions
  const suggestions = generateCohesionSuggestions(content, consistencyIssues, primaryTheme);
  
  
  return {
    cohesionScore,
    primaryTheme,
    emotionalTone,
    consistencyIssues,
    suggestions,
    thematicKeywords
  };
}

/**
 * Identify the primary theme across all content elements
 */
function identifyPrimaryTheme(content: ContentElements): string {
  const themes = {
    'innovation': ['innovative', 'cutting-edge', 'advanced', 'modern', 'technology', 'future'],
    'quality_service': ['quality', 'professional', 'expert', 'reliable', 'trusted', 'excellence'],
    'community': ['community', 'local', 'together', 'family', 'neighborhood', 'support'],
    'growth': ['growth', 'success', 'achieve', 'progress', 'develop', 'improve'],
    'urgency': ['now', 'today', 'urgent', 'limited', 'hurry', 'immediate'],
    'value': ['affordable', 'value', 'price', 'cost', 'budget', 'save'],
    'experience': ['experience', 'expertise', 'years', 'proven', 'established', 'veteran']
  };
  
  const allText = [
    content.headline || '',
    content.subheadline || '',
    content.callToAction || '',
    content.caption || ''
  ].join(' ').toLowerCase();
  
  let maxScore = 0;
  let primaryTheme = 'general';
  
  Object.entries(themes).forEach(([theme, keywords]) => {
    const score = keywords.filter(keyword => allText.includes(keyword)).length;
    if (score > maxScore) {
      maxScore = score;
      primaryTheme = theme;
    }
  });
  
  return primaryTheme;
}

/**
 * Analyze emotional tone of the content
 */
function analyzeEmotionalTone(text: string): string {
  const tones = {
    'enthusiastic': ['amazing', 'fantastic', 'incredible', 'awesome', 'exciting', 'thrilling'],
    'professional': ['professional', 'expert', 'reliable', 'trusted', 'certified', 'qualified'],
    'urgent': ['now', 'today', 'urgent', 'immediate', 'hurry', 'limited'],
    'friendly': ['welcome', 'hello', 'friendly', 'warm', 'caring', 'personal'],
    'confident': ['guaranteed', 'proven', 'sure', 'confident', 'certain', 'definite'],
    'supportive': ['help', 'support', 'assist', 'guide', 'care', 'understand']
  };
  
  let maxScore = 0;
  let dominantTone = 'neutral';
  
  Object.entries(tones).forEach(([tone, keywords]) => {
    const score = keywords.filter(keyword => text.includes(keyword)).length;
    if (score > maxScore) {
      maxScore = score;
      dominantTone = tone;
    }
  });
  
  return dominantTone;
}

/**
 * Extract thematic keywords from content
 */
function extractThematicKeywords(text: string): string[] {
  const words = text.split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'with'].includes(word.toLowerCase()));
  
  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length > 3) {
      wordCount.set(cleanWord, (wordCount.get(cleanWord) || 0) + 1);
    }
  });
  
  // Return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Calculate overall cohesion score
 */
function calculateCohesionScore(
  content: ContentElements,
  primaryTheme: string,
  thematicKeywords: string[]
): number {
  let score = 0;
  let totalElements = 0;
  
  // Check each element for theme consistency
  const elements = [
    content.headline,
    content.subheadline,
    content.callToAction,
    content.caption
  ];
  
  elements.forEach(element => {
    if (element) {
      totalElements++;
      const elementText = element.toLowerCase();
      
      // Check for thematic keyword presence
      const keywordMatches = thematicKeywords.filter(keyword => 
        elementText.includes(keyword)
      ).length;
      
      score += keywordMatches / Math.max(1, thematicKeywords.length);
    }
  });
  
  // Check hashtag consistency
  if (content.hashtags && content.hashtags.length > 0) {
    totalElements++;
    const hashtagText = content.hashtags.join(' ').toLowerCase();
    const keywordMatches = thematicKeywords.filter(keyword => 
      hashtagText.includes(keyword)
    ).length;
    
    score += keywordMatches / Math.max(1, thematicKeywords.length);
  }
  
  return totalElements > 0 ? score / totalElements : 0;
}

/**
 * Identify consistency issues
 */
function identifyConsistencyIssues(
  content: ContentElements,
  primaryTheme: string,
  emotionalTone: string
): string[] {
  const issues: string[] = [];
  
  // Check for tone mismatches
  const elements = {
    headline: content.headline,
    subheadline: content.subheadline,
    callToAction: content.callToAction,
    caption: content.caption
  };
  
  Object.entries(elements).forEach(([elementName, elementText]) => {
    if (elementText) {
      const elementTone = analyzeEmotionalTone(elementText.toLowerCase());
      if (elementTone !== emotionalTone && elementTone !== 'neutral') {
        issues.push(`${elementName} tone (${elementTone}) differs from overall tone (${emotionalTone})`);
      }
    }
  });
  
  // Check for theme consistency
  const allText = Object.values(elements).filter(Boolean).join(' ').toLowerCase();
  if (!allText.includes(primaryTheme.replace('_', ' '))) {
    issues.push(`Primary theme (${primaryTheme}) not consistently reflected across all elements`);
  }
  
  // Check hashtag relevance
  if (content.hashtags && content.hashtags.length > 0) {
    const hashtagText = content.hashtags.join(' ').toLowerCase();
    const relevantHashtags = content.hashtags.filter(hashtag => 
      allText.includes(hashtag.toLowerCase().replace('#', ''))
    );
    
    if (relevantHashtags.length < content.hashtags.length * 0.5) {
      issues.push('Some hashtags may not be relevant to the main content theme');
    }
  }
  
  return issues;
}

/**
 * Generate suggestions for improving cohesion
 */
function generateCohesionSuggestions(
  content: ContentElements,
  issues: string[],
  primaryTheme: string
): string[] {
  const suggestions: string[] = [];
  
  if (issues.length === 0) {
    suggestions.push('Content shows good thematic consistency');
    return suggestions;
  }
  
  // Theme-specific suggestions
  const themeSuggestions = {
    'innovation': 'Emphasize cutting-edge technology and modern solutions',
    'quality_service': 'Highlight professional expertise and reliability',
    'community': 'Focus on local impact and community benefits',
    'growth': 'Emphasize success stories and achievement potential',
    'urgency': 'Create time-sensitive messaging across all elements',
    'value': 'Consistently highlight cost-effectiveness and savings',
    'experience': 'Showcase expertise and proven track record'
  };
  
  if (themeSuggestions[primaryTheme]) {
    suggestions.push(themeSuggestions[primaryTheme]);
  }
  
  // Issue-specific suggestions
  issues.forEach(issue => {
    if (issue.includes('tone')) {
      suggestions.push('Align emotional tone across all content elements');
    }
    if (issue.includes('theme')) {
      suggestions.push(`Strengthen ${primaryTheme.replace('_', ' ')} theme throughout all elements`);
    }
    if (issue.includes('hashtag')) {
      suggestions.push('Use hashtags that directly relate to your main content themes');
    }
  });
  
  return suggestions;
}

/**
 * Generate thematically consistent hashtags
 */
export function generateThematicHashtags(
  content: ContentElements,
  businessType: string,
  platform: string = 'instagram'
): string[] {
  const analysis = analyzeContentCohesion(content);
  const hashtagLimit = platform.toLowerCase() === 'instagram' ? 5 : 3;
  
  const thematicHashtags: string[] = [];
  
  // Theme-based hashtags
  const themeHashtags = {
    'innovation': ['#Innovation', '#TechSolutions', '#ModernBusiness'],
    'quality_service': ['#QualityService', '#Professional', '#Trusted'],
    'community': ['#Community', '#LocalBusiness', '#Together'],
    'growth': ['#Growth', '#Success', '#Achievement'],
    'urgency': ['#ActNow', '#LimitedTime', '#Today'],
    'value': ['#GreatValue', '#Affordable', '#BestPrice'],
    'experience': ['#Experienced', '#Proven', '#Expert']
  };
  
  const primaryThemeHashtags = themeHashtags[analysis.primaryTheme] || ['#Business', '#Service', '#Quality'];
  thematicHashtags.push(...primaryThemeHashtags.slice(0, 2));
  
  // Business type hashtag
  const businessHashtag = `#${businessType.replace(/\s+/g, '')}`;
  thematicHashtags.push(businessHashtag);
  
  // Ensure we don't exceed the limit
  return thematicHashtags.slice(0, hashtagLimit);
}
