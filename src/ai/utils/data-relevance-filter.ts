/**
 * Data Relevance Filter for Enhanced Revo 1.0 AI Content Generation
 * Filters and scores contextual data to prevent information overload
 */

export interface RelevanceScore {
  score: number; // 0-1 scale
  category: 'high' | 'medium' | 'low' | 'irrelevant';
  reasoning: string;
}

export interface FilteredContextualData {
  highRelevance: any[];
  mediumRelevance: any[];
  lowRelevance: any[];
  irrelevant: any[];
  summary: {
    totalItems: number;
    highRelevanceCount: number;
    mediumRelevanceCount: number;
    lowRelevanceCount: number;
    irrelevantCount: number;
    averageScore: number;
  };
}

/**
 * Filter contextual data based on relevance to business and content generation needs
 */
export function filterContextualData(
  data: any[],
  businessType: string,
  location: string,
  contentType: 'caption' | 'hashtags' | 'headline' | 'general' = 'general'
): FilteredContextualData {
  console.log(`🔍 [Data Filter] Processing ${data.length} items for ${businessType} in ${location}`);
  
  const scoredData = data.map(item => ({
    item,
    relevance: calculateRelevanceScore(item, businessType, location, contentType)
  }));
  
  // Categorize by relevance score
  const highRelevance = scoredData.filter(d => d.relevance.score >= 0.7).map(d => d.item);
  const mediumRelevance = scoredData.filter(d => d.relevance.score >= 0.4 && d.relevance.score < 0.7).map(d => d.item);
  const lowRelevance = scoredData.filter(d => d.relevance.score >= 0.2 && d.relevance.score < 0.4).map(d => d.item);
  const irrelevant = scoredData.filter(d => d.relevance.score < 0.2).map(d => d.item);
  
  const averageScore = scoredData.reduce((sum, d) => sum + d.relevance.score, 0) / scoredData.length;
  
  const result = {
    highRelevance,
    mediumRelevance,
    lowRelevance,
    irrelevant,
    summary: {
      totalItems: data.length,
      highRelevanceCount: highRelevance.length,
      mediumRelevanceCount: mediumRelevance.length,
      lowRelevanceCount: lowRelevance.length,
      irrelevantCount: irrelevant.length,
      averageScore: isNaN(averageScore) ? 0 : averageScore
    }
  };
  
  console.log(`✅ [Data Filter] Filtered: ${result.summary.highRelevanceCount} high, ${result.summary.mediumRelevanceCount} medium, ${result.summary.lowRelevanceCount} low relevance items`);
  
  return result;
}

/**
 * Calculate relevance score for a data item
 */
function calculateRelevanceScore(
  item: any,
  businessType: string,
  location: string,
  contentType: string
): RelevanceScore {
  let score = 0;
  let reasoning = '';
  
  // Convert item to searchable text
  const itemText = extractTextFromItem(item).toLowerCase();
  const businessKeywords = businessType.toLowerCase().split(' ');
  const locationKeywords = location.toLowerCase().split(' ');
  
  // Business type relevance (40% weight)
  const businessMatches = businessKeywords.filter(keyword => 
    itemText.includes(keyword)
  ).length;
  const businessRelevance = businessMatches / businessKeywords.length;
  score += businessRelevance * 0.4;
  
  if (businessMatches > 0) {
    reasoning += `Business match (${businessMatches}/${businessKeywords.length}); `;
  }
  
  // Location relevance (25% weight)
  const locationMatches = locationKeywords.filter(keyword =>
    itemText.includes(keyword)
  ).length;
  const locationRelevance = locationMatches / locationKeywords.length;
  score += locationRelevance * 0.25;
  
  if (locationMatches > 0) {
    reasoning += `Location match (${locationMatches}/${locationKeywords.length}); `;
  }
  
  // Content type specific relevance (20% weight)
  const contentTypeRelevance = calculateContentTypeRelevance(item, contentType, itemText);
  score += contentTypeRelevance * 0.2;
  
  if (contentTypeRelevance > 0) {
    reasoning += `Content type relevance (${contentTypeRelevance.toFixed(2)}); `;
  }
  
  // Freshness/recency (10% weight)
  const recencyScore = calculateRecencyScore(item);
  score += recencyScore * 0.1;
  
  if (recencyScore > 0) {
    reasoning += `Recency bonus (${recencyScore.toFixed(2)}); `;
  }
  
  // Quality indicators (5% weight)
  const qualityScore = calculateQualityScore(item, itemText);
  score += qualityScore * 0.05;
  
  if (qualityScore > 0) {
    reasoning += `Quality indicators (${qualityScore.toFixed(2)}); `;
  }
  
  // Determine category
  let category: 'high' | 'medium' | 'low' | 'irrelevant';
  if (score >= 0.7) category = 'high';
  else if (score >= 0.4) category = 'medium';
  else if (score >= 0.2) category = 'low';
  else category = 'irrelevant';
  
  return {
    score: Math.min(1, score),
    category,
    reasoning: reasoning || 'No specific relevance indicators found'
  };
}

/**
 * Extract searchable text from various item types
 */
function extractTextFromItem(item: any): string {
  if (typeof item === 'string') return item;
  
  let text = '';
  
  // RSS article
  if (item.title && item.description) {
    text += `${item.title} ${item.description}`;
  }
  
  // Event data
  if (item.name && item.description) {
    text += `${item.name} ${item.description}`;
  }
  
  // Weather data
  if (item.condition && item.temperature) {
    text += `${item.condition} ${item.temperature}`;
  }
  
  // Service data
  if (item.serviceName && item.description) {
    text += `${item.serviceName} ${item.description}`;
  }
  
  // Generic object - extract all string values
  if (typeof item === 'object') {
    Object.values(item).forEach(value => {
      if (typeof value === 'string') {
        text += ` ${value}`;
      }
    });
  }
  
  return text;
}

/**
 * Calculate content type specific relevance
 */
function calculateContentTypeRelevance(item: any, contentType: string, itemText: string): number {
  const contentTypeKeywords = {
    caption: ['story', 'narrative', 'experience', 'journey', 'customer', 'testimonial'],
    hashtags: ['trending', 'popular', 'viral', 'tag', 'social', 'community'],
    headline: ['breaking', 'news', 'announcement', 'launch', 'update', 'alert'],
    general: ['business', 'service', 'product', 'customer', 'quality', 'professional']
  };
  
  const keywords = contentTypeKeywords[contentType] || contentTypeKeywords.general;
  const matches = keywords.filter(keyword => itemText.includes(keyword)).length;
  
  return matches / keywords.length;
}

/**
 * Calculate recency score based on timestamps
 */
function calculateRecencyScore(item: any): number {
  // Look for common timestamp fields
  const timestampFields = ['pubDate', 'createdAt', 'updatedAt', 'date', 'timestamp'];
  
  for (const field of timestampFields) {
    if (item[field]) {
      try {
        const itemDate = new Date(item[field]);
        const now = new Date();
        const hoursDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
        
        // Score decreases over time (1.0 for current hour, 0.0 after 7 days)
        return Math.max(0, 1 - (hoursDiff / (7 * 24)));
      } catch (error) {
        // Invalid date format
        continue;
      }
    }
  }
  
  return 0; // No timestamp found
}

/**
 * Calculate quality score based on content indicators
 */
function calculateQualityScore(item: any, itemText: string): number {
  let score = 0;
  
  // Length indicators (not too short, not too long)
  const textLength = itemText.length;
  if (textLength >= 50 && textLength <= 500) {
    score += 0.3;
  }
  
  // Professional language indicators
  const professionalKeywords = ['professional', 'quality', 'expert', 'certified', 'experienced', 'reliable'];
  const professionalMatches = professionalKeywords.filter(keyword => 
    itemText.includes(keyword)
  ).length;
  score += (professionalMatches / professionalKeywords.length) * 0.4;
  
  // Completeness indicators
  if (typeof item === 'object') {
    const fieldCount = Object.keys(item).length;
    if (fieldCount >= 3) {
      score += 0.3;
    }
  }
  
  return Math.min(1, score);
}

/**
 * Get filtered data for content generation (only high and medium relevance)
 */
export function getRelevantDataForGeneration(filteredData: FilteredContextualData): any[] {
  return [...filteredData.highRelevance, ...filteredData.mediumRelevance];
}

/**
 * Generate insights about the filtered data
 */
export function generateFilteringInsights(filteredData: FilteredContextualData): string[] {
  const insights: string[] = [];
  const { summary } = filteredData;
  
  if (summary.totalItems === 0) {
    insights.push('No contextual data available for filtering');
    return insights;
  }
  
  insights.push(`Processed ${summary.totalItems} contextual data items`);
  
  if (summary.highRelevanceCount > 0) {
    insights.push(`${summary.highRelevanceCount} high-relevance items identified for priority use`);
  }
  
  if (summary.mediumRelevanceCount > 0) {
    insights.push(`${summary.mediumRelevanceCount} medium-relevance items available as supporting context`);
  }
  
  if (summary.irrelevantCount > summary.totalItems * 0.5) {
    insights.push(`Filtered out ${summary.irrelevantCount} irrelevant items to prevent information overload`);
  }
  
  insights.push(`Average relevance score: ${(summary.averageScore * 100).toFixed(1)}%`);
  
  return insights;
}
