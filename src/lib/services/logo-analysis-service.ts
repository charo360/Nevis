/**
 * Logo Analysis Service
 * Analyzes logo images to extract characteristics for text-based AI models
 */

export interface LogoCharacteristics {
  colors: string[];
  shape: string;
  style: string;
  text?: string;
  elements: string[];
  description: string;
}

export class LogoAnalysisService {
  /**
   * Analyze logo image and extract characteristics for text prompts
   */
  static async analyzeLogo(logoDataUrl: string, brandName?: string): Promise<LogoCharacteristics> {
    try {
      
      // For now, we'll use basic analysis based on common logo patterns
      // In the future, this could be enhanced with AI vision models
      
      const characteristics = await this.extractBasicCharacteristics(logoDataUrl, brandName);
      
      return characteristics;
      
    } catch (error) {
      
      // Return generic characteristics as fallback
      return this.getGenericLogoCharacteristics(brandName);
    }
  }

  /**
   * Extract basic characteristics from logo data URL
   */
  private static async extractBasicCharacteristics(
    logoDataUrl: string, 
    brandName?: string
  ): Promise<LogoCharacteristics> {
    
    // Analyze file type and basic properties
    const mimeType = logoDataUrl.split(';')[0].split(':')[1];
    const isVector = mimeType === 'image/svg+xml';
    
    // Basic shape analysis based on common patterns
    let shape = 'rectangular';
    let style = 'modern';
    let elements: string[] = [];
    
    // If it's an SVG, we might be able to extract more info
    if (isVector) {
      try {
        const svgContent = atob(logoDataUrl.split(',')[1]);
        
        // Look for common SVG elements
        if (svgContent.includes('<circle')) {
          shape = 'circular';
          elements.push('circle');
        }
        if (svgContent.includes('<rect')) {
          shape = 'rectangular';
          elements.push('rectangle');
        }
        if (svgContent.includes('<path')) {
          elements.push('custom shape');
        }
        if (svgContent.includes('<text')) {
          elements.push('text');
        }
        
        // Extract colors from SVG
        const colorMatches = svgContent.match(/fill="([^"]+)"/g) || [];
        const colors = colorMatches
          .map(match => match.replace('fill="', '').replace('"', ''))
          .filter(color => color !== 'none' && color !== 'transparent')
          .slice(0, 3); // Limit to 3 main colors
        
        return {
          colors: colors.length > 0 ? colors : ['#000000'],
          shape,
          style: 'vector-based',
          elements,
          description: this.buildLogoDescription({
            colors: colors.length > 0 ? colors : ['#000000'],
            shape,
            style: 'vector-based',
            elements,
            brandName
          })
        };
        
      } catch (error) {
      }
    }
    
    // For non-SVG or failed SVG parsing, use generic analysis
    return this.getGenericLogoCharacteristics(brandName);
  }

  /**
   * Get generic logo characteristics as fallback
   */
  private static getGenericLogoCharacteristics(brandName?: string): LogoCharacteristics {
    const characteristics = {
      colors: ['#000000', '#ffffff'],
      shape: 'rectangular',
      style: 'modern',
      elements: ['text', 'geometric shape'],
      brandName
    };

    return {
      ...characteristics,
      description: this.buildLogoDescription(characteristics)
    };
  }

  /**
   * Build descriptive text for logo characteristics
   */
  private static buildLogoDescription(params: {
    colors: string[];
    shape: string;
    style: string;
    elements: string[];
    brandName?: string;
  }): string {
    const { colors, shape, style, elements, brandName } = params;
    
    let description = `${style} logo design`;
    
    if (brandName) {
      description += ` for ${brandName}`;
    }
    
    // Add shape description
    description += `, ${shape} layout`;
    
    // Add color description
    if (colors.length > 0) {
      const colorDescriptions = colors.map(color => {
        // Convert hex to color names for better AI understanding
        return this.getColorName(color);
      }).filter(Boolean);
      
      if (colorDescriptions.length > 0) {
        description += `, using ${colorDescriptions.join(' and ')} colors`;
      }
    }
    
    // Add elements description
    if (elements.length > 0) {
      description += `, featuring ${elements.join(', ')}`;
    }
    
    // Add integration instructions
    description += ', seamlessly integrated into the design composition';
    
    return description;
  }

  /**
   * Convert hex color to descriptive name
   */
  private static getColorName(hexColor: string): string {
    const color = hexColor.toLowerCase();
    
    const colorMap: Record<string, string> = {
      '#000000': 'black',
      '#ffffff': 'white',
      '#ff0000': 'red',
      '#00ff00': 'green',
      '#0000ff': 'blue',
      '#ffff00': 'yellow',
      '#ff00ff': 'magenta',
      '#00ffff': 'cyan',
      '#ffa500': 'orange',
      '#800080': 'purple',
      '#ffc0cb': 'pink',
      '#a52a2a': 'brown',
      '#808080': 'gray',
      '#c0c0c0': 'silver',
      '#ffd700': 'gold'
    };
    
    // Check for exact matches
    if (colorMap[color]) {
      return colorMap[color];
    }
    
    // Basic color range detection
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    if (r > 200 && g > 200 && b > 200) return 'light';
    if (r < 50 && g < 50 && b < 50) return 'dark';
    if (r > g && r > b) return 'red-toned';
    if (g > r && g > b) return 'green-toned';
    if (b > r && b > g) return 'blue-toned';
    
    return 'colored';
  }

  /**
   * Generate logo integration prompt for FLUX
   */
  static generateLogoPrompt(characteristics: LogoCharacteristics): string {
    return `incorporate a ${characteristics.description} naturally into the design, `;
  }
}
