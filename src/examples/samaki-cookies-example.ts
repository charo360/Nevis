import { DeepStoryExtractor } from '../services/deep-story-extractor';
import { CompellingCTAGenerator } from '../services/compelling-cta-generator';

const samakiCookiesData = {
  companyName: 'Samaki Cookies',
  industry: 'Food & Nutrition',
  location: 'Kilifi County, Kenya',
  founder: 'Francis Thoya',
  description: 'Fish-based cookies fighting child malnutrition',
  mission: 'Transform child nutrition through delicious fish cookies'
};

export function generateSamakiExample() {
  const story = DeepStoryExtractor.extractCompellingStory(samakiCookiesData);
  const ctas = CompellingCTAGenerator.generateCTAStrategy(samakiCookiesData);
  
  return {
    // BEFORE (Generic): "Boost Health Now"
    // AFTER (Compelling):
    headline: story.emotionalHooks[0], // "Give Your Child What They Need AND Want"
    subheadline: story.customerStories[0], // "My children actually ask for these cookies..."
    cta: ctas.urgency, // "Order Now - Limited Fresh Batches Available"
    
    founderStory: story.founderJourney,
    innovationStory: story.innovationStory,
    locationStory: story.locationStory
  };
}