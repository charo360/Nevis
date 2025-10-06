/**
 * Advanced Spell Checker for Headlines and Subheadlines
 * Ensures professional quality text before image generation
 */

// Common business spelling corrections
const BUSINESS_CORRECTIONS: Record<string, string> = {
  // Common business misspellings
  'bussiness': 'business',
  'buisness': 'business',
  'busines': 'business',
  'profesional': 'professional',
  'proffesional': 'professional',
  'profesional': 'professional',
  'excelence': 'excellence',
  'excellance': 'excellence',
  'experiance': 'experience',
  'expirience': 'experience',
  'servise': 'service',
  'servises': 'services',
  'qualaty': 'quality',
  'quallity': 'quality',
  'custumer': 'customer',
  'costumer': 'customer',
  'recieve': 'receive',
  'recive': 'receive',
  'seperate': 'separate',
  'definately': 'definitely',
  'definatly': 'definitely',
  'occured': 'occurred',
  'occuring': 'occurring',
  'accomodate': 'accommodate',
  'recomend': 'recommend',
  'recomendation': 'recommendation',
  'managment': 'management',
  'managment': 'management',
  'developement': 'development',
  'enviroment': 'environment',
  'enviromental': 'environmental',
  'sucessful': 'successful',
  'sucess': 'success',
  'achive': 'achieve',
  'acheivement': 'achievement',
  'maintainance': 'maintenance',
  'maintanance': 'maintenance',
  'garantee': 'guarantee',
  'guarentee': 'guarantee',
  'availible': 'available',
  'availabe': 'available',
  'responsable': 'responsible',
  'responsability': 'responsibility',
  'necesary': 'necessary',
  'neccessary': 'necessary',
  'independant': 'independent',
  'independance': 'independence',
  'begining': 'beginning',
  'comming': 'coming',
  'runing': 'running',
  'stoping': 'stopping',
  'geting': 'getting',
  'puting': 'putting',
  'writting': 'writing',
  'planing': 'planning',
  'controling': 'controlling',
  'manageing': 'managing',
  'developping': 'developing',
  'occassion': 'occasion',
  'occassional': 'occasional',
  'adress': 'address',
  'adresses': 'addresses',
  'calender': 'calendar',
  'cemetary': 'cemetery',
  'concious': 'conscious',
  'consciense': 'conscience',
  'desparate': 'desperate',
  'embarass': 'embarrass',
  'embarassing': 'embarrassing',
  'fourty': 'forty',
  'goverment': 'government',
  'harrass': 'harass',
  'harrassment': 'harassment',
  'liason': 'liaison',
  'mispell': 'misspell',
  'noticable': 'noticeable',
  'occassionally': 'occasionally',
  'perseverence': 'perseverance',
  'priviledge': 'privilege',
  'publically': 'publicly',
  'reccomend': 'recommend',
  'rythm': 'rhythm',
  'seperation': 'separation',
  'tommorow': 'tomorrow',
  'truely': 'truly',
  'untill': 'until',
  'wierd': 'weird'
};

// Industry-specific corrections
const INDUSTRY_CORRECTIONS: Record<string, Record<string, string>> = {
  'restaurant': {
    'resturant': 'restaurant',
    'restraunt': 'restaurant',
    'restaraunt': 'restaurant',
    'cusine': 'cuisine',
    'apetizer': 'appetizer',
    'apetizers': 'appetizers',
    'deserts': 'desserts',
    'recipie': 'recipe',
    'recipies': 'recipes',
    'ingrediant': 'ingredient',
    'ingrediants': 'ingredients',
    'delicous': 'delicious',
    'delicous': 'delicious',
    'restraunt': 'restaurant'
  },
  'technology': {
    'technolgy': 'technology',
    'sofware': 'software',
    'hardward': 'hardware',
    'developement': 'development',
    'programing': 'programming',
    'databse': 'database',
    'databses': 'databases',
    'algoritm': 'algorithm',
    'algoritms': 'algorithms',
    'artifical': 'artificial',
    'inteligence': 'intelligence',
    'machien': 'machine',
    'machiens': 'machines',
    'compuer': 'computer',
    'compuers': 'computers',
    'netowrk': 'network',
    'netowrks': 'networks'
  },
  'healthcare': {
    'helth': 'health',
    'helthcare': 'healthcare',
    'medecine': 'medicine',
    'medecal': 'medical',
    'treatement': 'treatment',
    'treatements': 'treatments',
    'patiant': 'patient',
    'patiants': 'patients',
    'symtom': 'symptom',
    'symtoms': 'symptoms',
    'diagnose': 'diagnosis',
    'perscription': 'prescription',
    'perscriptions': 'prescriptions',
    'theraphy': 'therapy',
    'wellnes': 'wellness'
  },
  'finance': {
    'finacial': 'financial',
    'finacne': 'finance',
    'investement': 'investment',
    'investements': 'investments',
    'buget': 'budget',
    'bugets': 'budgets',
    'expence': 'expense',
    'expences': 'expenses',
    'revenu': 'revenue',
    'revenus': 'revenues',
    'intrest': 'interest',
    'mortage': 'mortgage',
    'mortages': 'mortgages',
    'insurence': 'insurance',
    'guarentee': 'guarantee'
  },
  'retail': {
    'purchse': 'purchase',
    'purchses': 'purchases',
    'custumer': 'customer',
    'custumers': 'customers',
    'prodcut': 'product',
    'prodcuts': 'products',
    'merchendise': 'merchandise',
    'inventroy': 'inventory',
    'waranty': 'warranty',
    'waranties': 'warranties',
    'refund': 'refund',
    'refunds': 'refunds',
    'discout': 'discount',
    'discouts': 'discounts',
    'promtion': 'promotion',
    'promtions': 'promotions'
  }
};

// Common word patterns that are often misspelled
const PATTERN_CORRECTIONS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b(\w+)ing\b/g, replacement: (match, word) => {
    // Handle double consonants before -ing
    if (word.endsWith('nn') || word.endsWith('mm') || word.endsWith('pp') || word.endsWith('tt')) {
      return match;
    }
    // Common -ing corrections
    const corrections: Record<string, string> = {
      'runing': 'running',
      'stoping': 'stopping',
      'geting': 'getting',
      'puting': 'putting',
      'writting': 'writing',
      'planing': 'planning',
      'begining': 'beginning',
      'comming': 'coming'
    };
    return corrections[match] || match;
  }},
  { pattern: /\b(\w+)tion\b/g, replacement: (match, word) => {
    // Common -tion corrections
    const corrections: Record<string, string> = {
      'recomendation': 'recommendation',
      'seperation': 'separation',
      'accomodation': 'accommodation'
    };
    return corrections[match] || match;
  }}
];

export interface SpellCheckResult {
  originalText: string;
  correctedText: string;
  corrections: Array<{
    original: string;
    corrected: string;
    position: number;
    type: 'business' | 'industry' | 'pattern' | 'general';
  }>;
  hasErrors: boolean;
  confidence: number;
}

export class SpellChecker {
  /**
   * Check and correct spelling in headlines and subheadlines
   */
  static checkSpelling(text: string, businessType?: string): SpellCheckResult {
    let correctedText = text;
    const corrections: SpellCheckResult['corrections'] = [];
    
    // 1. Apply business-specific corrections
    for (const [wrong, correct] of Object.entries(BUSINESS_CORRECTIONS)) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      const matches = [...text.matchAll(regex)];
      
      for (const match of matches) {
        if (match.index !== undefined) {
          corrections.push({
            original: match[0],
            corrected: correct,
            position: match.index,
            type: 'business'
          });
        }
      }
      
      correctedText = correctedText.replace(regex, correct);
    }
    
    // 2. Apply industry-specific corrections
    if (businessType) {
      const industryKey = this.getIndustryKey(businessType);
      const industryCorrections = INDUSTRY_CORRECTIONS[industryKey];
      
      if (industryCorrections) {
        for (const [wrong, correct] of Object.entries(industryCorrections)) {
          const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
          const matches = [...text.matchAll(regex)];
          
          for (const match of matches) {
            if (match.index !== undefined) {
              corrections.push({
                original: match[0],
                corrected: correct,
                position: match.index,
                type: 'industry'
              });
            }
          }
          
          correctedText = correctedText.replace(regex, correct);
        }
      }
    }
    
    // 3. Apply pattern-based corrections
    for (const { pattern, replacement } of PATTERN_CORRECTIONS) {
      if (typeof replacement === 'function') {
        correctedText = correctedText.replace(pattern, replacement as any);
      } else {
        correctedText = correctedText.replace(pattern, replacement);
      }
    }
    
    // 4. Calculate confidence score
    const confidence = this.calculateConfidence(text, correctedText, corrections);
    
    return {
      originalText: text,
      correctedText,
      corrections,
      hasErrors: corrections.length > 0,
      confidence
    };
  }
  
  /**
   * Quick spell check for headlines specifically
   */
  static checkHeadline(headline: string, businessType?: string): SpellCheckResult {
    return this.checkSpelling(headline, businessType);
  }
  
  /**
   * Quick spell check for subheadlines specifically
   */
  static checkSubheadline(subheadline: string, businessType?: string): SpellCheckResult {
    return this.checkSpelling(subheadline, businessType);
  }
  
  /**
   * Batch check multiple text elements
   */
  static checkMultiple(texts: { text: string; type: 'headline' | 'subheadline' | 'caption' }[], businessType?: string): Record<string, SpellCheckResult> {
    const results: Record<string, SpellCheckResult> = {};
    
    texts.forEach((item, index) => {
      const key = `${item.type}_${index}`;
      results[key] = this.checkSpelling(item.text, businessType);
    });
    
    return results;
  }
  
  /**
   * Get industry key for corrections
   */
  private static getIndustryKey(businessType: string): string {
    const type = businessType.toLowerCase();
    
    if (type.includes('restaurant') || type.includes('food') || type.includes('cafe') || type.includes('dining')) {
      return 'restaurant';
    }
    if (type.includes('tech') || type.includes('software') || type.includes('it') || type.includes('computer')) {
      return 'technology';
    }
    if (type.includes('health') || type.includes('medical') || type.includes('clinic') || type.includes('hospital')) {
      return 'healthcare';
    }
    if (type.includes('finance') || type.includes('bank') || type.includes('investment') || type.includes('accounting')) {
      return 'finance';
    }
    if (type.includes('retail') || type.includes('shop') || type.includes('store') || type.includes('sales')) {
      return 'retail';
    }
    
    return 'general';
  }
  
  /**
   * Calculate confidence score based on corrections made
   */
  private static calculateConfidence(original: string, corrected: string, corrections: SpellCheckResult['corrections']): number {
    if (corrections.length === 0) return 100;
    
    const totalWords = original.split(/\s+/).length;
    const errorRate = corrections.length / totalWords;
    
    // Higher confidence for fewer errors
    const confidence = Math.max(0, 100 - (errorRate * 100));
    
    return Math.round(confidence);
  }
  
  /**
   * Validate that text doesn't contain obvious spelling errors
   */
  static validateText(text: string, businessType?: string): boolean {
    const result = this.checkSpelling(text, businessType);
    return !result.hasErrors || result.confidence > 80;
  }
}
