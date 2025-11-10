/**
 * Advanced Natural Language Command Parser for Image Editing
 * Handles complex parsing of user commands with context awareness
 */

export interface ParsedCommand {
  type: 'replace_text' | 'remove_element' | 'change_color' | 'resize_element' | 'add_text' | 'move_element' | 'change_style';
  target: string;
  replacement?: string;
  color?: string;
  size?: 'bigger' | 'smaller' | 'larger' | 'tiny' | 'huge' | number;
  position?: 'left' | 'right' | 'center' | 'top' | 'bottom';
  style?: string;
  confidence: number; // 0-1 confidence score
}

export interface CommandParsingResult {
  commands: ParsedCommand[];
  originalCommand: string;
  suggestions?: string[];
  warnings?: string[];
}

/**
 * Advanced command parser with NLP-like capabilities
 */
export class AdvancedCommandParser {
  
  // Common synonyms and variations
  private static readonly SYNONYMS = {
    change: ['change', 'modify', 'alter', 'update', 'edit', 'switch'],
    replace: ['replace', 'substitute', 'swap', 'change', 'switch'],
    remove: ['remove', 'delete', 'erase', 'eliminate', 'take out', 'get rid of'],
    add: ['add', 'insert', 'include', 'put in', 'place'],
    make: ['make', 'set', 'turn', 'convert'],
    color: ['color', 'colour', 'hue', 'shade', 'tint'],
    text: ['text', 'word', 'words', 'writing', 'copy', 'content'],
    bigger: ['bigger', 'larger', 'increase', 'enlarge', 'expand', 'grow'],
    smaller: ['smaller', 'reduce', 'shrink', 'decrease', 'minimize']
  };

  // Color name mappings
  private static readonly COLORS = {
    red: ['red', 'crimson', 'scarlet', 'cherry'],
    blue: ['blue', 'navy', 'azure', 'cyan', 'teal'],
    green: ['green', 'lime', 'emerald', 'forest'],
    yellow: ['yellow', 'gold', 'amber', 'lemon'],
    purple: ['purple', 'violet', 'magenta', 'lavender'],
    orange: ['orange', 'tangerine', 'coral'],
    black: ['black', 'dark'],
    white: ['white', 'light'],
    gray: ['gray', 'grey', 'silver'],
    brown: ['brown', 'tan', 'beige']
  };

  /**
   * Parse natural language command with advanced NLP techniques
   */
  static parseCommand(command: string): CommandParsingResult {
    const normalizedCommand = command.toLowerCase().trim();
    const commands: ParsedCommand[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Advanced pattern matching with confidence scoring
    const patterns = this.getAdvancedPatterns();
    
    let bestMatch: { command: ParsedCommand; confidence: number } | null = null;

    // Try each pattern and find the best match
    for (const pattern of patterns) {
      const match = normalizedCommand.match(pattern.regex);
      if (match) {
        const confidence = this.calculateConfidence(match, pattern, normalizedCommand);
        const parsedCommand = this.buildCommand(match, pattern, confidence);
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { command: parsedCommand, confidence };
        }
      }
    }

    if (bestMatch) {
      commands.push(bestMatch.command);
    }

    // Add suggestions for low confidence matches
    if (bestMatch && bestMatch.confidence < 0.7) {
      suggestions.push(this.generateSuggestion(bestMatch.command));
    }

    // Add warnings for potentially problematic commands
    if (this.isDestructiveCommand(normalizedCommand)) {
      warnings.push('This command may remove significant content. Please be specific about what to remove.');
    }

    return {
      commands,
      originalCommand: command,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Get advanced regex patterns for command matching
   */
  private static getAdvancedPatterns() {
    return [
      // Text replacement patterns (high priority)
      {
        regex: /(?:change|replace|substitute|swap)\s+(?:the\s+)?(?:text\s+|word\s+)?["']?([^"']+?)["']?\s+(?:to|with|for)\s+["']?([^"']+?)["']?$/i,
        type: 'replace_text' as const,
        priority: 10
      },
      {
        regex: /(?:change|replace)\s+["']?([^"']+?)["']?\s+(?:to|with)\s+["']?([^"']+?)["']?$/i,
        type: 'replace_text' as const,
        priority: 9
      },
      
      // Color change patterns
      {
        regex: /(?:change|make|set)\s+(?:the\s+)?(?:color\s+of\s+)?["']?([^"']+?)["']?\s+(?:to\s+)?(?:color\s+)?["']?(\w+)["']?$/i,
        type: 'change_color' as const,
        priority: 8
      },
      {
        regex: /(?:make|turn)\s+["']?([^"']+?)["']?\s+(\w+)(?:\s+color)?$/i,
        type: 'change_color' as const,
        priority: 7
      },
      
      // Size change patterns
      {
        regex: /(?:make|set)\s+(?:the\s+)?["']?([^"']+?)["']?\s+(bigger|smaller|larger|huge|tiny|double|half)$/i,
        type: 'resize_element' as const,
        priority: 8
      },
      {
        regex: /(increase|decrease|enlarge|shrink)\s+(?:the\s+)?(?:size\s+of\s+)?["']?([^"']+?)["']?$/i,
        type: 'resize_element' as const,
        priority: 7
      },
      
      // Remove patterns
      {
        regex: /(?:remove|delete|erase|eliminate)\s+(?:the\s+)?["']?([^"']+?)["']?$/i,
        type: 'remove_element' as const,
        priority: 8
      },
      
      // Add text patterns
      {
        regex: /(?:add|insert|include)\s+(?:the\s+)?(?:text\s+)?["']?([^"']+?)["']?(?:\s+(?:at|to|in)\s+(?:the\s+)?(\w+))?$/i,
        type: 'add_text' as const,
        priority: 7
      },
      
      // Move patterns
      {
        regex: /(?:move|relocate)\s+(?:the\s+)?["']?([^"']+?)["']?\s+(?:to\s+)?(?:the\s+)?(left|right|center|top|bottom)$/i,
        type: 'move_element' as const,
        priority: 6
      }
    ];
  }

  /**
   * Calculate confidence score for a match
   */
  private static calculateConfidence(
    match: RegExpMatchArray,
    pattern: any,
    originalCommand: string
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Add confidence based on pattern priority
    confidence += (pattern.priority / 10) * 0.3;
    
    // Add confidence for specific target identification
    if (match[1] && match[1].length > 2) {
      confidence += 0.2;
    }
    
    // Add confidence for clear replacement/action
    if (match[2] && match[2].length > 1) {
      confidence += 0.2;
    }
    
    // Reduce confidence for very short commands
    if (originalCommand.length < 10) {
      confidence -= 0.1;
    }
    
    // Add confidence for common keywords
    const commonKeywords = ['change', 'replace', 'remove', 'make', 'add'];
    if (commonKeywords.some(keyword => originalCommand.includes(keyword))) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, Math.max(0.1, confidence));
  }

  /**
   * Build command object from regex match
   */
  private static buildCommand(
    match: RegExpMatchArray,
    pattern: any,
    confidence: number
  ): ParsedCommand {
    const command: ParsedCommand = {
      type: pattern.type,
      target: match[1]?.trim() || '',
      confidence
    };

    // Add type-specific properties
    switch (pattern.type) {
      case 'replace_text':
        command.replacement = match[2]?.trim();
        break;
      case 'change_color':
        command.color = this.normalizeColor(match[2]?.trim() || '');
        break;
      case 'resize_element':
        const sizeWord = match[2]?.toLowerCase() || match[1]?.toLowerCase() || '';
        command.size = this.normalizeSize(sizeWord);
        break;
      case 'add_text':
        command.position = this.normalizePosition(match[2]?.trim());
        break;
      case 'move_element':
        command.position = this.normalizePosition(match[2]?.trim());
        break;
    }

    return command;
  }

  /**
   * Normalize color names
   */
  private static normalizeColor(color: string): string {
    const lowerColor = color.toLowerCase();
    
    for (const [standardColor, variations] of Object.entries(this.COLORS)) {
      if (variations.includes(lowerColor)) {
        return standardColor;
      }
    }
    
    // Return original if no match found
    return color;
  }

  /**
   * Normalize size descriptors
   */
  private static normalizeSize(size: string): 'bigger' | 'smaller' {
    const lowerSize = size.toLowerCase();
    
    if (this.SYNONYMS.bigger.some(word => lowerSize.includes(word))) {
      return 'bigger';
    }
    
    if (this.SYNONYMS.smaller.some(word => lowerSize.includes(word))) {
      return 'smaller';
    }
    
    return 'bigger'; // Default
  }

  /**
   * Normalize position descriptors
   */
  private static normalizePosition(position?: string): 'left' | 'right' | 'center' | 'top' | 'bottom' | undefined {
    if (!position) return undefined;
    
    const lowerPos = position.toLowerCase();
    const positions = ['left', 'right', 'center', 'top', 'bottom'];
    
    return positions.find(pos => lowerPos.includes(pos)) as any;
  }

  /**
   * Check if command is potentially destructive
   */
  private static isDestructiveCommand(command: string): boolean {
    const destructivePatterns = [
      /remove\s+(?:all|everything|entire)/i,
      /delete\s+(?:all|everything|entire)/i,
      /clear\s+(?:all|everything|entire)/i
    ];
    
    return destructivePatterns.some(pattern => pattern.test(command));
  }

  /**
   * Generate helpful suggestion for low-confidence commands
   */
  private static generateSuggestion(command: ParsedCommand): string {
    switch (command.type) {
      case 'replace_text':
        return `Try: "Change '${command.target}' to '${command.replacement}'"`;
      case 'remove_element':
        return `Try: "Remove the ${command.target}"`;
      case 'change_color':
        return `Try: "Change color of ${command.target} to ${command.color}"`;
      case 'resize_element':
        return `Try: "Make ${command.target} ${command.size}"`;
      default:
        return 'Try being more specific about what you want to change';
    }
  }

  /**
   * Validate parsed commands
   */
  static validateCommands(commands: ParsedCommand[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const command of commands) {
      if (!command.target || command.target.length < 1) {
        errors.push('Target element must be specified');
      }
      
      if (command.type === 'replace_text' && !command.replacement) {
        errors.push('Replacement text must be specified for text replacement');
      }
      
      if (command.type === 'change_color' && !command.color) {
        errors.push('Color must be specified for color changes');
      }
      
      if (command.confidence < 0.3) {
        errors.push('Command is unclear - please be more specific');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
