// Marketing Knowledge Base - Frameworks, Formulas, and Copywriting Principles

import type { MarketingKnowledge } from './types'

export class MarketingKnowledgeBase {
  
  /**
   * Get comprehensive knowledge for a specific framework
   */
  async getRelevantKnowledge(framework: string): Promise<MarketingKnowledge> {
    const frameworkData = this.getFrameworkData(framework)
    
    return {
      frameworkTemplate: frameworkData.template,
      frameworkReasoning: frameworkData.reasoning,
      frameworkSteps: frameworkData.steps,
      headlineFormulas: this.getHeadlineFormulas(),
      hookPatterns: this.getHookPatterns(),
      bannedPhrases: this.getBannedPhrases(),
      emotionalTriggerGuidance: this.getEmotionalTriggerGuidance()
    }
  }
  
  /**
   * Get framework-specific data
   */
  private getFrameworkData(framework: string) {
    const frameworks = {
      PAS: {
        template: `Problem → Agitate → Solution`,
        reasoning: `PAS works when the audience has a clear pain point that needs addressing. It's emotionally engaging and direct.`,
        steps: [
          {
            name: 'Problem',
            description: 'Identify the specific problem your audience faces',
            requirements: [
              'Be specific - not generic pain',
              'Use language they would use',
              'Make them say "yes, that\'s me!"',
              '2-3 sentences maximum'
            ]
          },
          {
            name: 'Agitate',
            description: 'Make the problem feel urgent and painful',
            requirements: [
              'Expand on consequences of not solving it',
              'Use sensory details and emotional language',
              'Stack multiple pain points if relevant',
              'Show what they\'re missing out on'
            ]
          },
          {
            name: 'Solution',
            description: 'Present your offer as the clear answer',
            requirements: [
              'Position as the relief/answer',
              'Explain HOW it solves the problem',
              'Include social proof if possible',
              'End with clear, compelling CTA'
            ]
          }
        ]
      },
      
      AIDA: {
        template: `Attention → Interest → Desire → Action`,
        reasoning: `AIDA is perfect for awareness-stage content where you need to educate and build interest before conversion.`,
        steps: [
          {
            name: 'Attention',
            description: 'Hook them immediately with an attention-grabbing opening',
            requirements: [
              'Use curiosity, shocking stat, or bold claim',
              'Must stop the scroll in 2 seconds',
              'Relevant to their situation',
              'Creates "I need to read this" feeling'
            ]
          },
          {
            name: 'Interest',
            description: 'Build interest by expanding on the hook',
            requirements: [
              'Provide context or explanation',
              'Use storytelling elements',
              'Make it relevant to THEM',
              'Keep them reading'
            ]
          },
          {
            name: 'Desire',
            description: 'Create desire for your solution',
            requirements: [
              'Paint picture of transformation',
              'Show specific benefits',
              'Use social proof',
              'Make them WANT it'
            ]
          },
          {
            name: 'Action',
            description: 'Tell them exactly what to do next',
            requirements: [
              'Clear, specific CTA',
              'Remove friction',
              'Add urgency if appropriate',
              'Make it easy to act'
            ]
          }
        ]
      },
      
      BAB: {
        template: `Before → After → Bridge`,
        reasoning: `BAB excels when you can show a clear transformation. Perfect for service businesses and results-focused offers.`,
        steps: [
          {
            name: 'Before',
            description: 'Paint a vivid picture of life before your solution',
            requirements: [
              'Use sensory, specific details',
              'Make it relatable',
              'Show the struggle/pain',
              'Use "you" language'
            ]
          },
          {
            name: 'After',
            description: 'Show the transformed state',
            requirements: [
              'Contrast sharply with "before"',
              'Be specific about outcomes',
              'Appeal to desires, not just logic',
              'Make them SEE and FEEL it'
            ]
          },
          {
            name: 'Bridge',
            description: 'Explain how to get from before to after',
            requirements: [
              'Position your offer as the bridge',
              'Explain your unique method/approach',
              'Handle objections',
              'Strong CTA'
            ]
          }
        ]
      },
      
      PASTOR: {
        template: `Problem → Amplify → Story → Testimony → Offer → Response`,
        reasoning: `PASTOR is best for high-ticket, complex services where trust and credibility are essential. It's longer but highly effective.`,
        steps: [
          {
            name: 'Problem',
            description: 'Identify the core problem',
            requirements: [
              'Be specific and relatable',
              'Use their language',
              'Make them nod in agreement'
            ]
          },
          {
            name: 'Amplify',
            description: 'Amplify the cost of not solving it',
            requirements: [
              'Show consequences',
              'Create urgency',
              'Emotional + practical costs'
            ]
          },
          {
            name: 'Story',
            description: 'Share a relevant story',
            requirements: [
              'Can be customer story or your own',
              'Show the journey',
              'Make it relatable'
            ]
          },
          {
            name: 'Testimony',
            description: 'Provide social proof',
            requirements: [
              'Real results from real people',
              'Specific outcomes',
              'Builds credibility'
            ]
          },
          {
            name: 'Offer',
            description: 'Present your solution clearly',
            requirements: [
              'What they get',
              'Why it works',
              'What makes it unique'
            ]
          },
          {
            name: 'Response',
            description: 'Clear call to action',
            requirements: [
              'Specific next step',
              'Address remaining objections',
              'Create urgency'
            ]
          }
        ]
      },
      
      FAB: {
        template: `Features → Advantages → Benefits`,
        reasoning: `FAB works for product-focused businesses and logical buyers. Bridges features to emotional benefits.`,
        steps: [
          {
            name: 'Features',
            description: 'List the tangible features',
            requirements: [
              'Be specific and concrete',
              'What you actually provide',
              'Keep it brief'
            ]
          },
          {
            name: 'Advantages',
            description: 'Explain why those features matter',
            requirements: [
              'How features create advantages',
              'Compared to alternatives',
              'Practical benefits'
            ]
          },
          {
            name: 'Benefits',
            description: 'Show emotional/life benefits',
            requirements: [
              'How it improves their life',
              'Emotional transformation',
              'Why they should care'
            ]
          }
        ]
      },
      
      '4Ps': {
        template: `Picture → Promise → Prove → Push`,
        reasoning: `4Ps is excellent for results-driven campaigns where you need to establish credibility quickly.`,
        steps: [
          {
            name: 'Picture',
            description: 'Paint picture of problem or desired outcome',
            requirements: [
              'Vivid imagery',
              'Relatable scenario',
              'Emotional connection'
            ]
          },
          {
            name: 'Promise',
            description: 'Make a specific promise',
            requirements: [
              'Clear outcome they\'ll get',
              'Specific and measurable',
              'Compelling value'
            ]
          },
          {
            name: 'Prove',
            description: 'Prove you can deliver',
            requirements: [
              'Social proof',
              'Data/results',
              'Testimonials',
              'Credentials'
            ]
          },
          {
            name: 'Push',
            description: 'Push them to action',
            requirements: [
              'Strong CTA',
              'Urgency/scarcity',
              'Risk reversal'
            ]
          }
        ]
      }
    }
    
    return frameworks[framework] || frameworks.PAS
  }
  
  /**
   * Get proven headline formulas
   */
  private getHeadlineFormulas() {
    return [
      {
        formula: 'How to [Desirable Outcome] Without [Common Obstacle]',
        example: 'How to Get Fit Without Spending Hours at the Gym'
      },
      {
        formula: '[Do Something] Like [World Class Example]',
        example: 'Write Copy Like a $10M Copywriter'
      },
      {
        formula: 'The Secret to [Desirable Outcome]',
        example: 'The Secret to Authentic Italian Pasta at Home'
      },
      {
        formula: '[Number] Ways to [Solve Problem/Achieve Goal]',
        example: '7 Ways to Cut Your Marketing Costs in Half'
      },
      {
        formula: 'What [Expert/Successful Person] Knows About [Topic] That You Don\'t',
        example: 'What Top Chefs Know About Kitchen Knives That You Don\'t'
      },
      {
        formula: 'Are You [Making This Mistake]?',
        example: 'Are You Sabotaging Your Instagram Growth?'
      },
      {
        formula: 'Warning: [Avoid This Common Mistake]',
        example: 'Warning: These 3 Exercises Are Destroying Your Knees'
      },
      {
        formula: 'Discover How to [Achieve Goal] in [Timeframe]',
        example: 'Discover How to Learn Italian in 90 Days'
      },
      {
        formula: '[Curious Statement] (And Why It Matters)',
        example: 'Your Gym Is Lying to You (And Why It Matters)'
      },
      {
        formula: 'Stop [Doing X] and Start [Doing Y]',
        example: 'Stop Counting Calories and Start Eating Real Food'
      }
    ]
  }
  
  /**
   * Get proven hook patterns
   */
  private getHookPatterns() {
    return [
      {
        pattern: 'Problem Question',
        example: 'Tired of posting every day with zero engagement?'
      },
      {
        pattern: 'Relatable Pain Statement',
        example: 'You spend 2 hours writing a post. You get 3 likes. Sound familiar?'
      },
      {
        pattern: 'Curiosity Gap',
        example: 'I discovered something about Instagram that changed everything...'
      },
      {
        pattern: 'Surprising Stat/Fact',
        example: '87% of restaurants fail in their first year. Here\'s why ours didn\'t.'
      },
      {
        pattern: 'Bold Claim',
        example: 'Most fitness advice is completely backward. Here\'s what actually works.'
      },
      {
        pattern: 'Story Opening',
        example: 'Three months ago, I couldn\'t do a single push-up. Today...'
      },
      {
        pattern: 'Challenge Common Belief',
        example: 'Everything you know about marketing is wrong. Let me explain.'
      },
      {
        pattern: 'Direct Address',
        example: 'If you\'re a small business owner struggling with social media, read this.'
      },
      {
        pattern: 'Before/After Tease',
        example: 'From 0 to 10K followers in 60 days. No ads. No bots. Here\'s how:'
      },
      {
        pattern: 'Urgent Warning',
        example: 'Stop! Before you hire another marketing agency, read this.'
      }
    ]
  }
  
  /**
   * Get banned AI-detection phrases
   */
  private getBannedPhrases() {
    return [
      'Dive into',
      'Dive deep',
      'Game changer',
      'Unlock the power',
      'Unlock your potential',
      'Revolutionary',
      'Cutting-edge solution',
      'Take your [X] to the next level',
      'Elevate your',
      'Transform your journey',
      'Embark on',
      'Seamless',
      'Robust',
      'Leverage',
      'Synergy',
      'Holistic approach',
      'End-to-end solution',
      'Best-in-class',
      'World-class',
      'Industry-leading',
      'Innovative solution',
      'Paradigm shift',
      'It\'s important to note',
      'It\'s worth noting',
      'At the end of the day',
      'Delve into',
      'Realm',
      'Landscape',
      'Tapestry',
      'Multifaceted'
    ]
  }
  
  /**
   * Get emotional trigger guidance
   */
  private getEmotionalTriggerGuidance(): Record<string, string> {
    return {
      fear: 'Use fear of missing out, falling behind, or making mistakes. Be specific about what they might lose. Example: "While you're stuck using outdated methods, your competitors are 3x-ing their results."',
      
      desire: 'Appeal to what they deeply want - not surface level. Go beyond "better results" to "feeling confident in your skin" or "finally proving everyone wrong." Make them FEEL the outcome.',
      
      urgency: 'Create time-based pressure with deadlines, limited spots, seasonal opportunities. Must be genuine. Example: "Summer bookings close Friday" not fake "Only 24 hours left!" every day.',
      
      trust: 'Build through social proof (testimonials, numbers), authority (credentials, media), or guarantees. Be specific: "87 local businesses" not "many happy customers."',
      
      curiosity: 'Create information gaps. Tease a secret, method, or insight. Example: "The one ingredient that changes everything" then deliver on the promise.',
      
      belonging: 'Make them part of a tribe/community. Use "us vs them" language carefully. Example: "For dog owners who refuse to settle for stressed groomers."',
      
      pride: 'Appeal to their identity and values. Example: "For professionals who value their time" or "You\'re not the type to cut corners."',
      
      relief: 'Promise to end frustration or pain. Example: "No more [specific annoying thing]" - be concrete about what stress they can drop.',
      
      excitement: 'Create anticipation for something new, different, or better. Use sensory language. Example: "Imagine walking in and everyone knowing your name..."',
      
      validation: 'Confirm their feelings are valid and they\'re not alone. Example: "You\'re right to be frustrated with cookie-cutter programs that ignore your body."'
    }
  }
  
  /**
   * Get power words for different emotions
   */
  getPowerWords(emotion: string): string[] {
    const powerWords = {
      urgency: ['now', 'today', 'limited', 'exclusive', 'deadline', 'last chance', 'ending soon', 'while supplies last', 'before it\'s gone'],
      trust: ['guaranteed', 'proven', 'certified', 'verified', 'authentic', 'backed', 'tested', 'approved', 'official'],
      curiosity: ['secret', 'revealed', 'hidden', 'forbidden', 'confidential', 'insider', 'behind-the-scenes', 'little-known'],
      desire: ['imagine', 'picture', 'dream', 'ultimate', 'perfect', 'ideal', 'finally', 'achieve', 'transform'],
      fear: ['warning', 'danger', 'risk', 'mistake', 'avoid', 'prevent', 'protect', 'don\'t miss', 'losing out']
    }
    
    return powerWords[emotion] || []
  }
}

// Singleton instance
let knowledgeBaseInstance: MarketingKnowledgeBase | null = null

export function getMarketingKnowledge(): MarketingKnowledgeBase {
  if (!knowledgeBaseInstance) {
    knowledgeBaseInstance = new MarketingKnowledgeBase()
  }
  return knowledgeBaseInstance
}
