interface CTAStrategy {
  primary: string;
  urgency: string;
  social: string;
  benefit: string;
  scarcity?: string;
}

export class CompellingCTAGenerator {
  private static generateFoodNutritionCTAs(companyData: any): CTAStrategy {
    return {
      primary: 'Give Your Child Better Nutrition Today',
      urgency: 'Order Now - Limited Fresh Batches Available',
      social: 'Join 1000+ Happy Parents',
      benefit: 'Get Cookies Your Kids Will Love',
      scarcity: 'Only 50 Packs Left This Week'
    };
  }

  private static generateFinancialCTAs(companyData: any): CTAStrategy {
    return {
      primary: 'Get Your Fast Approval Now',
      urgency: 'Apply Today - Get Results Tomorrow',
      social: 'Join 500+ Successful Businesses',
      benefit: 'Stop Waiting, Start Growing',
      scarcity: 'Limited Slots Available This Month'
    };
  }

  private static generateTechnologyCTAs(companyData: any): CTAStrategy {
    return {
      primary: 'Transform Your Business Today',
      urgency: 'Get Started Now - Setup in 24 Hours',
      social: 'Join Leading Companies',
      benefit: 'See Results Immediately',
      scarcity: 'Early Access Ending Soon'
    };
  }

  private static generateGenericCTAs(companyData: any): CTAStrategy {
    return {
      primary: 'Get Started Today',
      urgency: 'Don\'t Wait - Act Now',
      social: 'Join Our Community',
      benefit: 'Experience the Difference',
      scarcity: 'Limited Time Offer'
    };
  }

  static generateCTAStrategy(companyData: any): CTAStrategy {
    if (!companyData) {
      return {
        primary: 'Get Started Today',
        urgency: 'Don\'t Wait - Act Now',
        social: 'Join Our Community',
        benefit: 'Experience the Difference',
        scarcity: 'Limited Time Offer'
      };
    }
    const industry = companyData.industry?.toLowerCase() || '';
    
    if (industry.includes('food') || industry.includes('nutrition')) {
      return this.generateFoodNutritionCTAs(companyData);
    } else if (industry.includes('financial') || industry.includes('fintech')) {
      return this.generateFinancialCTAs(companyData);
    } else if (industry.includes('technology') || industry.includes('software')) {
      return this.generateTechnologyCTAs(companyData);
    } else {
      return this.generateGenericCTAs(companyData);
    }
  }

  static getOptimalCTA(companyData: any, ctaType: 'primary' | 'urgency' | 'social' | 'benefit' | 'scarcity' = 'primary'): string {
    const strategy = this.generateCTAStrategy(companyData);
    
    switch (ctaType) {
      case 'urgency':
        return strategy.urgency;
      case 'social':
        return strategy.social;
      case 'benefit':
        return strategy.benefit;
      case 'scarcity':
        return strategy.scarcity || strategy.urgency;
      default:
        return strategy.primary;
    }
  }

  static generateMultipleCTAOptions(companyData: any): string[] {
    const strategy = this.generateCTAStrategy(companyData);
    
    return [
      strategy.primary,
      strategy.urgency,
      strategy.social,
      strategy.benefit,
      ...(strategy.scarcity ? [strategy.scarcity] : [])
    ];
  }
}