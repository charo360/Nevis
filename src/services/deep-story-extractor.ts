interface CompellingStory {
  founderName?: string;
  founderJourney: string;
  innovationStory: string;
  locationStory: string;
  impactStory: string;
  customerStories: string[];
  emotionalHooks: string[];
}

export class DeepStoryExtractor {
  private static extractFounderDetails(companyData: any): { name?: string; journey: string } {
    const text = JSON.stringify(companyData).toLowerCase();
    
    // Look for founder names in common patterns
    const namePatterns = [
      /founded by ([a-z\s]+)/i,
      /created by ([a-z\s]+)/i,
      /started by ([a-z\s]+)/i,
      /([a-z\s]+) founded/i
    ];
    
    let founderName: string | undefined;
    for (const pattern of namePatterns) {
      const match = JSON.stringify(companyData).match(pattern);
      if (match) {
        founderName = match[1].trim();
        break;
      }
    }
    
    // Generate compelling founder journey based on industry and context
    const industry = companyData.industry?.toLowerCase() || '';
    let journey = '';
    
    if (industry.includes('food') || industry.includes('nutrition')) {
      journey = founderName ? 
        `${founderName} saw children in their community struggling with malnutrition and decided to create a solution that would change everything` :
        'A passionate entrepreneur from coastal Kenya saw children struggling with malnutrition and created an innovative solution';
    } else if (industry.includes('financial')) {
      journey = founderName ?
        `${founderName} experienced the frustration of slow financial services firsthand and built a platform to serve their community better` :
        'A local entrepreneur frustrated with traditional banking built a solution for their community';
    } else {
      journey = founderName ?
        `${founderName} identified a critical gap in their community and dedicated their life to solving it` :
        'A visionary entrepreneur saw an opportunity to transform their community';
    }
    
    return { name: founderName, journey };
  }

  private static generateInnovationStory(companyData: any): string {
    const industry = companyData.industry?.toLowerCase() || '';
    const companyName = companyData.companyName || 'This company';
    
    if (industry.includes('food') && industry.includes('nutrition')) {
      return `${companyName} discovered how to transform fish into delicious, nutritious cookies - combining local ingredients with innovative processing to create something children actually love eating`;
    } else if (industry.includes('financial')) {
      return `${companyName} revolutionized financial services by combining mobile technology with deep community understanding, reducing loan approval times from weeks to hours`;
    } else if (industry.includes('technology')) {
      return `${companyName} built cutting-edge technology that actually works for local businesses, solving real problems with practical solutions`;
    } else {
      return `${companyName} pioneered an innovative approach that transforms how their industry serves customers`;
    }
  }

  private static generateLocationStory(companyData: any): string {
    const text = JSON.stringify(companyData).toLowerCase();
    
    if (text.includes('kilifi')) {
      return 'Born in Kilifi County, where coastal communities face unique challenges, this solution was built by locals who understand the real needs';
    } else if (text.includes('nairobi')) {
      return 'From the heart of Nairobi, serving communities across Kenya with solutions that work in the real world';
    } else if (text.includes('kenya')) {
      return 'Proudly Kenyan, built by entrepreneurs who understand local challenges and opportunities';
    } else if (text.includes('nigeria')) {
      return 'From Nigeria\'s entrepreneurial spirit, creating solutions that work for African communities';
    } else {
      return 'Built by local entrepreneurs who understand their community\'s unique needs and challenges';
    }
  }

  private static generateImpactStory(companyData: any): string {
    const industry = companyData.industry?.toLowerCase() || '';
    
    if (industry.includes('food') || industry.includes('nutrition')) {
      return 'Transforming child nutrition one cookie at a time - helping families give their children the nutrition they need in a form they actually want';
    } else if (industry.includes('financial')) {
      return 'Empowering thousands of families and small businesses with faster, more accessible financial services that actually work for their lives';
    } else {
      return 'Creating real change in communities by solving problems that matter to real people';
    }
  }

  private static generateCustomerStories(companyData: any): string[] {
    const industry = companyData.industry?.toLowerCase() || '';
    const stories: string[] = [];
    
    if (industry.includes('food') || industry.includes('nutrition')) {
      stories.push('"My children actually ask for these cookies - and I feel good giving them something so nutritious" - Sarah, Mother of 3');
      stories.push('"Finally, a healthy snack my kids love. No more fighting about eating nutritious food" - Grace, Parent');
      stories.push('"These cookies helped my child gain healthy weight while enjoying snack time" - Mary, Concerned Mother');
    } else if (industry.includes('financial')) {
      stories.push('"Got my loan approved in 2 hours instead of 2 weeks - saved my business" - John, Small Business Owner');
      stories.push('"Finally, a financial service that understands how we actually live and work" - Faith, Entrepreneur');
      stories.push('"No more long queues and endless paperwork - just fast, reliable service" - Peter, Farmer');
    } else {
      stories.push('"This solution actually works for people like us - not just big companies" - Local Customer');
      stories.push('"Finally found a service that understands our real needs" - Community Member');
    }
    
    return stories;
  }

  private static generateEmotionalHooks(story: CompellingStory): string[] {
    const hooks: string[] = [];
    
    // Parent/family hooks for food industry
    if (story.impactStory.includes('child') || story.impactStory.includes('nutrition')) {
      hooks.push('Give Your Child What They Need AND Want');
      hooks.push('Finally - Nutrition Your Kids Will Actually Ask For');
      hooks.push('Stop Worrying About Your Child\'s Nutrition');
    }
    
    // Business/financial hooks
    if (story.impactStory.includes('business') || story.impactStory.includes('financial')) {
      hooks.push('Stop Losing Opportunities to Slow Approvals');
      hooks.push('Get the Financial Support Your Business Deserves');
      hooks.push('Why Wait Weeks When You Can Get Results Today?');
    }
    
    // Community/local hooks
    hooks.push('Built by Your Community, For Your Community');
    hooks.push('Local Solutions That Actually Work');
    
    return hooks;
  }

  static extractCompellingStory(companyData: any): CompellingStory {
    if (!companyData) {
      return {
        founderJourney: 'Passionate entrepreneur creating innovative solutions',
        innovationStory: 'Revolutionary approach to business challenges',
        locationStory: 'Local expertise serving the community',
        impactStory: 'Making a real difference in people\'s lives',
        customerStories: ['"This service changed everything for us" - Happy Customer'],
        emotionalHooks: ['Experience the difference', 'Join the success story']
      };
    }
    const founder = this.extractFounderDetails(companyData);
    const innovationStory = this.generateInnovationStory(companyData);
    const locationStory = this.generateLocationStory(companyData);
    const impactStory = this.generateImpactStory(companyData);
    const customerStories = this.generateCustomerStories(companyData);
    
    const story: CompellingStory = {
      founderName: founder.name,
      founderJourney: founder.journey,
      innovationStory,
      locationStory,
      impactStory,
      customerStories,
      emotionalHooks: []
    };
    
    story.emotionalHooks = this.generateEmotionalHooks(story);
    
    return story;
  }

  static generateCompellingContent(story: CompellingStory, contentType: 'headline' | 'subheadline' | 'cta'): string {
    switch (contentType) {
      case 'headline':
        // Use the most compelling emotional hook
        return story.emotionalHooks[0] || story.founderJourney;
        
      case 'subheadline':
        // Use customer story or impact
        if (story.customerStories.length > 0) {
          return story.customerStories[0];
        }
        return story.impactStory;
        
      case 'cta':
        // Create urgency-based CTAs
        if (story.impactStory.includes('child') || story.impactStory.includes('nutrition')) {
          return 'Give Your Child Better Nutrition Today';
        } else if (story.impactStory.includes('business')) {
          return 'Get Your Fast Approval Now';
        } else {
          return 'Join Our Community Today';
        }
        
      default:
        return story.founderJourney;
    }
  }
}