// Brand DNA Extraction Engine with NLP Processing
// Analyzes text content to extract brand personality, tone, and positioning

interface BrandDNA {
  keywords: {
    primary: Array<{ word: string; score: number; frequency: number }>;
    secondary: Array<{ word: string; score: number; frequency: number }>;
    brandSpecific: Array<{ word: string; score: number; context: string }>;
  };
  topics: {
    main: Array<{ topic: string; weight: number; keywords: string[] }>;
    secondary: Array<{ topic: string; weight: number; keywords: string[] }>;
  };
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number; // -1 to 1
    distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    emotionalTone: string[];
  };
  brandLexicon: {
    entities: Array<{ entity: string; type: string; frequency: number }>;
    adjectives: Array<{ adjective: string; frequency: number; context: string[] }>;
    actionWords: Array<{ verb: string; frequency: number; context: string[] }>;
    brandValues: string[];
  };
  contentPatterns: {
    ctaPatterns: Array<{ pattern: string; frequency: number; examples: string[] }>;
    messageStructure: {
      averageLength: number;
      commonStarters: string[];
      commonEnders: string[];
    };
    communicationStyle: {
      formality: 'formal' | 'casual' | 'mixed';
      tone: string[];
      personality: string[];
    };
  };
  brandPersonality: {
    traits: Array<{ trait: string; confidence: number; evidence: string[] }>;
    archetype: string;
    voiceCharacteristics: string[];
  };
}

interface TextCorpus {
  website: string[];
  socialMedia: string[];
  combined: string;
  metadata: {
    totalWords: number;
    uniqueWords: number;
    averageSentenceLength: number;
    readabilityScore: number;
  };
}

export class BrandDNAExtractor {
  private stopWords: Set<string>;
  private brandArchetypes: Record<string, string[]>;
  private personalityTraits: Record<string, string[]>;

  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how',
      'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
    ]);

    this.brandArchetypes = {
      'The Innocent': ['pure', 'simple', 'honest', 'optimistic', 'wholesome', 'natural', 'clean'],
      'The Explorer': ['adventure', 'freedom', 'discovery', 'journey', 'explore', 'pioneer', 'bold'],
      'The Sage': ['wisdom', 'knowledge', 'expert', 'intelligent', 'research', 'learn', 'understand'],
      'The Hero': ['courage', 'determination', 'strength', 'overcome', 'achieve', 'victory', 'champion'],
      'The Outlaw': ['rebel', 'revolution', 'disrupt', 'break', 'change', 'unconventional', 'different'],
      'The Magician': ['transform', 'magic', 'vision', 'dream', 'create', 'imagine', 'possibility'],
      'The Regular Guy': ['authentic', 'down-to-earth', 'friendly', 'reliable', 'honest', 'genuine', 'real'],
      'The Lover': ['passion', 'love', 'beauty', 'romance', 'intimate', 'sensual', 'desire'],
      'The Jester': ['fun', 'humor', 'playful', 'entertaining', 'joy', 'laughter', 'lighthearted'],
      'The Caregiver': ['care', 'nurture', 'protect', 'help', 'support', 'compassion', 'service'],
      'The Creator': ['create', 'artistic', 'innovative', 'original', 'design', 'craft', 'build'],
      'The Ruler': ['control', 'power', 'authority', 'leadership', 'premium', 'luxury', 'exclusive']
    };

    this.personalityTraits = {
      'Professional': ['professional', 'business', 'corporate', 'formal', 'expert', 'industry'],
      'Friendly': ['friendly', 'warm', 'welcoming', 'approachable', 'kind', 'nice'],
      'Innovative': ['innovative', 'cutting-edge', 'advanced', 'modern', 'technology', 'future'],
      'Trustworthy': ['trust', 'reliable', 'dependable', 'secure', 'safe', 'honest'],
      'Energetic': ['energy', 'dynamic', 'active', 'vibrant', 'exciting', 'fast'],
      'Sophisticated': ['sophisticated', 'elegant', 'refined', 'premium', 'luxury', 'quality'],
      'Caring': ['care', 'compassionate', 'helpful', 'support', 'community', 'family'],
      'Bold': ['bold', 'confident', 'strong', 'powerful', 'leader', 'ambitious']
    };
  }

  async extractBrandDNA(corpus: TextCorpus): Promise<BrandDNA> {
    console.log('🧬 Extracting Brand DNA from text corpus...');

    const allText = corpus.combined;
    const words = this.tokenizeText(allText);
    const sentences = this.splitIntoSentences(allText);

    // Extract keywords using TF-IDF-like scoring
    const keywords = this.extractKeywords(words, sentences);

    // Extract topics using simple topic modeling
    const topics = this.extractTopics(sentences, keywords.primary);

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(sentences);

    // Extract brand lexicon
    const brandLexicon = this.extractBrandLexicon(allText, sentences);

    // Analyze content patterns
    const contentPatterns = this.analyzeContentPatterns(sentences, allText);

    // Determine brand personality
    const brandPersonality = this.determineBrandPersonality(allText, keywords.primary);

    return {
      keywords,
      topics,
      sentiment,
      brandLexicon,
      contentPatterns,
      brandPersonality
    };
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  private extractKeywords(words: string[], sentences: string[]): BrandDNA['keywords'] {
    // Calculate word frequencies
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Calculate TF-IDF-like scores
    const totalWords = words.length;
    const keywordScores: Array<{ word: string; score: number; frequency: number }> = [];

    for (const [word, freq] of Object.entries(wordFreq)) {
      if (freq < 2) continue; // Filter out very rare words

      const tf = freq / totalWords;
      const sentencesWithWord = sentences.filter(s => s.toLowerCase().includes(word)).length;
      const idf = Math.log(sentences.length / (sentencesWithWord + 1));
      const score = tf * idf;

      keywordScores.push({ word, score, frequency: freq });
    }

    // Sort by score and separate into primary/secondary
    keywordScores.sort((a, b) => b.score - a.score);

    const primary = keywordScores.slice(0, 20);
    const secondary = keywordScores.slice(20, 50);

    // Extract brand-specific keywords (proper nouns, unique terms)
    const brandSpecific = this.extractBrandSpecificKeywords(sentences);

    return { primary, secondary, brandSpecific };
  }

  private extractBrandSpecificKeywords(sentences: string[]): Array<{ word: string; score: number; context: string }> {
    const brandKeywords: Array<{ word: string; score: number; context: string }> = [];
    
    sentences.forEach(sentence => {
      // Look for capitalized words (potential brand names, products)
      const capitalizedWords = sentence.match(/\b[A-Z][a-zA-Z]+\b/g) || [];
      
      capitalizedWords.forEach(word => {
        if (word.length > 2 && !this.isCommonWord(word.toLowerCase())) {
          const existing = brandKeywords.find(k => k.word.toLowerCase() === word.toLowerCase());
          if (existing) {
            existing.score += 1;
          } else {
            brandKeywords.push({
              word,
              score: 1,
              context: sentence.substring(0, 100) + '...'
            });
          }
        }
      });
    });

    return brandKeywords
      .filter(k => k.score > 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
    return commonWords.includes(word);
  }

  private extractTopics(sentences: string[], primaryKeywords: Array<{ word: string; score: number; frequency: number }>): BrandDNA['topics'] {
    // Simple topic modeling using keyword clustering
    const topicClusters: Record<string, { keywords: string[]; sentences: string[]; weight: number }> = {};

    // Define topic categories based on business domains
    const topicCategories = {
      'Products & Services': ['product', 'service', 'solution', 'offer', 'provide', 'deliver'],
      'Quality & Excellence': ['quality', 'best', 'excellent', 'premium', 'superior', 'top'],
      'Customer Experience': ['customer', 'client', 'experience', 'satisfaction', 'support', 'help'],
      'Innovation & Technology': ['innovation', 'technology', 'advanced', 'modern', 'digital', 'smart'],
      'Trust & Reliability': ['trust', 'reliable', 'secure', 'safe', 'dependable', 'proven'],
      'Growth & Success': ['growth', 'success', 'achieve', 'improve', 'increase', 'better']
    };

    // Assign sentences to topics based on keyword presence
    for (const [topicName, keywords] of Object.entries(topicCategories)) {
      const relevantSentences = sentences.filter(sentence => {
        const sentenceLower = sentence.toLowerCase();
        return keywords.some(keyword => sentenceLower.includes(keyword));
      });

      if (relevantSentences.length > 0) {
        const topicKeywords = primaryKeywords
          .filter(k => keywords.some(keyword => k.word.includes(keyword) || keyword.includes(k.word)))
          .map(k => k.word);

        topicClusters[topicName] = {
          keywords: topicKeywords.slice(0, 8),
          sentences: relevantSentences,
          weight: relevantSentences.length / sentences.length
        };
      }
    }

    // Sort topics by weight
    const sortedTopics = Object.entries(topicClusters)
      .sort(([, a], [, b]) => b.weight - a.weight);

    const main = sortedTopics.slice(0, 3).map(([topic, data]) => ({
      topic,
      weight: Math.round(data.weight * 100) / 100,
      keywords: data.keywords
    }));

    const secondary = sortedTopics.slice(3, 6).map(([topic, data]) => ({
      topic,
      weight: Math.round(data.weight * 100) / 100,
      keywords: data.keywords
    }));

    return { main, secondary };
  }

  private analyzeSentiment(sentences: string[]): BrandDNA['sentiment'] {
    // Simple sentiment analysis using word lists
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'outstanding', 'superior', 'best', 'love', 'perfect', 'awesome', 'brilliant', 'exceptional', 'remarkable', 'incredible', 'magnificent', 'superb', 'terrific', 'marvelous'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointing', 'poor', 'inadequate', 'unsatisfactory', 'deficient', 'inferior', 'substandard', 'unacceptable', 'problematic'];
    const emotionalWords = ['passionate', 'excited', 'enthusiastic', 'confident', 'proud', 'happy', 'joyful', 'optimistic', 'hopeful', 'grateful'];

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    const emotionalTone: string[] = [];

    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      let sentimentScore = 0;

      positiveWords.forEach(word => {
        if (sentenceLower.includes(word)) {
          sentimentScore += 1;
          positiveCount++;
        }
      });

      negativeWords.forEach(word => {
        if (sentenceLower.includes(word)) {
          sentimentScore -= 1;
          negativeCount++;
        }
      });

      emotionalWords.forEach(word => {
        if (sentenceLower.includes(word) && !emotionalTone.includes(word)) {
          emotionalTone.push(word);
        }
      });

      if (sentimentScore === 0) {
        neutralCount++;
      }
    });

    const totalSentiments = positiveCount + negativeCount + neutralCount;
    const overallScore = totalSentiments > 0 ? (positiveCount - negativeCount) / totalSentiments : 0;

    let overall: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (overallScore > 0.1) overall = 'positive';
    else if (overallScore < -0.1) overall = 'negative';

    return {
      overall,
      score: Math.round(overallScore * 100) / 100,
      distribution: {
        positive: Math.round((positiveCount / totalSentiments) * 100) / 100,
        neutral: Math.round((neutralCount / totalSentiments) * 100) / 100,
        negative: Math.round((negativeCount / totalSentiments) * 100) / 100
      },
      emotionalTone: emotionalTone.slice(0, 10)
    };
  }

  private extractBrandLexicon(text: string, sentences: string[]): BrandDNA['brandLexicon'] {
    // Extract entities (simplified - looking for capitalized words and patterns)
    const entities: Array<{ entity: string; type: string; frequency: number }> = [];
    const entityCounts: Record<string, number> = {};

    // Look for potential company names, product names, locations
    const capitalizedPattern = /\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g;
    const matches = text.match(capitalizedPattern) || [];

    matches.forEach(match => {
      if (match.length > 2 && !this.isCommonWord(match.toLowerCase())) {
        entityCounts[match] = (entityCounts[match] || 0) + 1;
      }
    });

    Object.entries(entityCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .forEach(([entity, frequency]) => {
        entities.push({
          entity,
          type: this.classifyEntity(entity),
          frequency
        });
      });

    // Extract adjectives (words that describe qualities)
    const adjectives = this.extractAdjectives(sentences);

    // Extract action words (verbs that indicate what the brand does)
    const actionWords = this.extractActionWords(sentences);

    // Extract brand values (inferred from content themes)
    const brandValues = this.extractBrandValues(text);

    return {
      entities,
      adjectives,
      actionWords,
      brandValues
    };
  }

  private classifyEntity(entity: string): string {
    // Simple entity classification
    if (entity.includes('Inc') || entity.includes('LLC') || entity.includes('Corp')) {
      return 'company';
    }
    if (entity.length < 15 && /^[A-Z][a-z]+$/.test(entity)) {
      return 'brand';
    }
    return 'other';
  }

  private extractAdjectives(sentences: string[]): Array<{ adjective: string; frequency: number; context: string[] }> {
    const commonAdjectives = ['new', 'best', 'great', 'good', 'high', 'small', 'large', 'local', 'professional', 'quality', 'reliable', 'fast', 'easy', 'simple', 'advanced', 'modern', 'innovative', 'secure', 'trusted', 'experienced'];
    const adjectiveCounts: Record<string, { count: number; contexts: string[] }> = {};

    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      commonAdjectives.forEach(adj => {
        if (sentenceLower.includes(adj)) {
          if (!adjectiveCounts[adj]) {
            adjectiveCounts[adj] = { count: 0, contexts: [] };
          }
          adjectiveCounts[adj].count++;
          if (adjectiveCounts[adj].contexts.length < 3) {
            adjectiveCounts[adj].contexts.push(sentence.substring(0, 80) + '...');
          }
        }
      });
    });

    return Object.entries(adjectiveCounts)
      .filter(([, data]) => data.count > 1)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 15)
      .map(([adjective, data]) => ({
        adjective,
        frequency: data.count,
        context: data.contexts
      }));
  }

  private extractActionWords(sentences: string[]): Array<{ verb: string; frequency: number; context: string[] }> {
    const actionVerbs = ['provide', 'deliver', 'create', 'build', 'develop', 'offer', 'help', 'support', 'serve', 'achieve', 'improve', 'ensure', 'guarantee', 'specialize', 'focus', 'design', 'manage', 'solve', 'transform', 'innovate'];
    const verbCounts: Record<string, { count: number; contexts: string[] }> = {};

    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      actionVerbs.forEach(verb => {
        if (sentenceLower.includes(verb)) {
          if (!verbCounts[verb]) {
            verbCounts[verb] = { count: 0, contexts: [] };
          }
          verbCounts[verb].count++;
          if (verbCounts[verb].contexts.length < 3) {
            verbCounts[verb].contexts.push(sentence.substring(0, 80) + '...');
          }
        }
      });
    });

    return Object.entries(verbCounts)
      .filter(([, data]) => data.count > 1)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 12)
      .map(([verb, data]) => ({
        verb,
        frequency: data.count,
        context: data.contexts
      }));
  }

  private extractBrandValues(text: string): string[] {
    const valueKeywords = {
      'Quality': ['quality', 'excellence', 'superior', 'premium', 'best'],
      'Innovation': ['innovation', 'innovative', 'cutting-edge', 'advanced', 'modern'],
      'Trust': ['trust', 'reliable', 'dependable', 'honest', 'integrity'],
      'Customer Focus': ['customer', 'client', 'service', 'satisfaction', 'support'],
      'Expertise': ['expert', 'professional', 'experienced', 'skilled', 'knowledge'],
      'Sustainability': ['sustainable', 'green', 'eco', 'environment', 'responsible'],
      'Community': ['community', 'local', 'together', 'partnership', 'collaboration'],
      'Growth': ['growth', 'success', 'achievement', 'progress', 'development']
    };

    const textLower = text.toLowerCase();
    const values: string[] = [];

    for (const [value, keywords] of Object.entries(valueKeywords)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (textLower.split(keyword).length - 1);
      }, 0);

      if (score > 2) {
        values.push(value);
      }
    }

    return values;
  }

  private analyzeContentPatterns(sentences: string[], text: string): BrandDNA['contentPatterns'] {
    // Extract CTA patterns
    const ctaPatterns = this.extractCTAPatterns(sentences);

    // Analyze message structure
    const messageStructure = this.analyzeMessageStructure(sentences);

    // Determine communication style
    const communicationStyle = this.analyzeCommunicationStyle(text, sentences);

    return {
      ctaPatterns,
      messageStructure,
      communicationStyle
    };
  }

  private extractCTAPatterns(sentences: string[]): Array<{ pattern: string; frequency: number; examples: string[] }> {
    const ctaKeywords = ['contact', 'call', 'visit', 'learn', 'discover', 'get', 'start', 'try', 'buy', 'shop', 'book', 'schedule', 'request', 'download', 'sign up', 'join'];
    const ctaCounts: Record<string, { count: number; examples: string[] }> = {};

    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      ctaKeywords.forEach(cta => {
        if (sentenceLower.includes(cta)) {
          if (!ctaCounts[cta]) {
            ctaCounts[cta] = { count: 0, examples: [] };
          }
          ctaCounts[cta].count++;
          if (ctaCounts[cta].examples.length < 2) {
            ctaCounts[cta].examples.push(sentence.trim());
          }
        }
      });
    });

    return Object.entries(ctaCounts)
      .filter(([, data]) => data.count > 0)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([pattern, data]) => ({
        pattern,
        frequency: data.count,
        examples: data.examples
      }));
  }

  private analyzeMessageStructure(sentences: string[]): BrandDNA['contentPatterns']['messageStructure'] {
    const lengths = sentences.map(s => s.split(' ').length);
    const averageLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

    // Find common sentence starters
    const starters: Record<string, number> = {};
    const enders: Record<string, number> = {};

    sentences.forEach(sentence => {
      const words = sentence.trim().split(' ');
      if (words.length > 2) {
        const starter = words.slice(0, 2).join(' ').toLowerCase();
        const ender = words.slice(-2).join(' ').toLowerCase();
        
        starters[starter] = (starters[starter] || 0) + 1;
        enders[ender] = (enders[ender] || 0) + 1;
      }
    });

    const commonStarters = Object.entries(starters)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([starter]) => starter);

    const commonEnders = Object.entries(enders)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ender]) => ender);

    return {
      averageLength: Math.round(averageLength * 10) / 10,
      commonStarters,
      commonEnders
    };
  }

  private analyzeCommunicationStyle(text: string, sentences: string[]): BrandDNA['contentPatterns']['communicationStyle'] {
    const textLower = text.toLowerCase();

    // Determine formality
    const formalWords = ['furthermore', 'therefore', 'consequently', 'nevertheless', 'moreover', 'however', 'thus', 'hence'];
    const casualWords = ['hey', 'awesome', 'cool', 'great', 'amazing', 'love', 'super', 'really'];

    const formalCount = formalWords.reduce((sum, word) => sum + (textLower.split(word).length - 1), 0);
    const casualCount = casualWords.reduce((sum, word) => sum + (textLower.split(word).length - 1), 0);

    let formality: 'formal' | 'casual' | 'mixed' = 'mixed';
    if (formalCount > casualCount * 2) formality = 'formal';
    else if (casualCount > formalCount * 2) formality = 'casual';

    // Determine tone characteristics
    const toneIndicators = {
      'confident': ['confident', 'sure', 'certain', 'guarantee', 'promise'],
      'helpful': ['help', 'assist', 'support', 'guide', 'advice'],
      'professional': ['professional', 'expert', 'experienced', 'qualified'],
      'friendly': ['friendly', 'welcome', 'warm', 'personal', 'care'],
      'authoritative': ['leading', 'industry', 'authority', 'expert', 'proven'],
      'innovative': ['innovative', 'cutting-edge', 'advanced', 'modern', 'future']
    };

    const tone: string[] = [];
    for (const [toneType, keywords] of Object.entries(toneIndicators)) {
      const score = keywords.reduce((sum, keyword) => sum + (textLower.split(keyword).length - 1), 0);
      if (score > 1) {
        tone.push(toneType);
      }
    }

    // Determine personality traits
    const personality: string[] = [];
    for (const [trait, keywords] of Object.entries(this.personalityTraits)) {
      const score = keywords.reduce((sum, keyword) => sum + (textLower.split(keyword).length - 1), 0);
      if (score > 2) {
        personality.push(trait);
      }
    }

    return {
      formality,
      tone: tone.slice(0, 5),
      personality: personality.slice(0, 4)
    };
  }

  private determineBrandPersonality(text: string, keywords: Array<{ word: string; score: number; frequency: number }>): BrandDNA['brandPersonality'] {
    const textLower = text.toLowerCase();
    const keywordText = keywords.map(k => k.word).join(' ');

    // Determine brand archetype
    let bestArchetype = 'The Regular Guy';
    let maxArchetypeScore = 0;

    for (const [archetype, archetypeKeywords] of Object.entries(this.brandArchetypes)) {
      const score = archetypeKeywords.reduce((sum, keyword) => {
        return sum + (textLower.split(keyword).length - 1) + (keywordText.includes(keyword) ? 2 : 0);
      }, 0);

      if (score > maxArchetypeScore) {
        maxArchetypeScore = score;
        bestArchetype = archetype;
      }
    }

    // Extract personality traits with evidence
    const traits: Array<{ trait: string; confidence: number; evidence: string[] }> = [];

    for (const [trait, traitKeywords] of Object.entries(this.personalityTraits)) {
      const evidence: string[] = [];
      let score = 0;

      traitKeywords.forEach(keyword => {
        const occurrences = textLower.split(keyword).length - 1;
        score += occurrences;
        
        if (occurrences > 0 && evidence.length < 2) {
          // Find sentences containing this keyword
          const sentences = text.split(/[.!?]+/);
          const exampleSentence = sentences.find(s => s.toLowerCase().includes(keyword));
          if (exampleSentence) {
            evidence.push(exampleSentence.trim().substring(0, 100) + '...');
          }
        }
      });

      if (score > 1) {
        traits.push({
          trait,
          confidence: Math.min(score / 5, 1), // Normalize to 0-1
          evidence
        });
      }
    }

    // Sort traits by confidence
    traits.sort((a, b) => b.confidence - a.confidence);

    // Determine voice characteristics
    const voiceCharacteristics = this.extractVoiceCharacteristics(textLower);

    return {
      traits: traits.slice(0, 6),
      archetype: bestArchetype,
      voiceCharacteristics
    };
  }

  private extractVoiceCharacteristics(text: string): string[] {
    const voiceIndicators = {
      'conversational': ['you', 'your', 'we', 'our', 'let\'s', 'together'],
      'authoritative': ['proven', 'established', 'leading', 'industry', 'expert'],
      'empathetic': ['understand', 'care', 'help', 'support', 'feel'],
      'energetic': ['exciting', 'dynamic', 'vibrant', 'active', 'energy'],
      'sophisticated': ['elegant', 'refined', 'premium', 'luxury', 'exclusive'],
      'approachable': ['easy', 'simple', 'friendly', 'accessible', 'straightforward']
    };

    const characteristics: string[] = [];

    for (const [characteristic, keywords] of Object.entries(voiceIndicators)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (text.split(keyword).length - 1);
      }, 0);

      if (score > 2) {
        characteristics.push(characteristic);
      }
    }

    return characteristics.slice(0, 4);
  }

  createTextCorpus(websiteContent: string[], socialMediaContent: string[]): TextCorpus {
    const combined = [...websiteContent, ...socialMediaContent].join(' ');
    const words = this.tokenizeText(combined);
    const sentences = this.splitIntoSentences(combined);

    return {
      website: websiteContent,
      socialMedia: socialMediaContent,
      combined,
      metadata: {
        totalWords: words.length,
        uniqueWords: new Set(words).size,
        averageSentenceLength: words.length / sentences.length,
        readabilityScore: this.calculateReadabilityScore(sentences, words)
      }
    };
  }

  private calculateReadabilityScore(sentences: string[], words: string[]): number {
    // Simplified Flesch Reading Ease score
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = 1.5; // Simplified assumption
    
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
