/**
 * Regional Communication Demo
 * Shows how the AI now understands local communication styles
 */

// Simulated regional communication patterns
const regionalProfiles = {
  kenya: {
    greetings: ['Mambo!', 'Sasa!', 'Karibu!', 'Poa!'],
    excitement: ['Poa kabisa!', 'Sawa sawa!', 'Bomba!', 'Noma!'],
    callToAction: ['Njoo uone!', 'Karibu!', 'Tupatane!', 'Twende!'],
    businessStyle: 'Community-focused, family values, authentic local connection',
    advertisingApproach: 'Emphasize community service and local pride'
  },
  nigeria: {
    greetings: ['How far?', 'Oya!', 'My guy!', 'Wetin dey happen?'],
    excitement: ['E sweet die!', 'This one correct!', 'Na fire!', 'Too much!'],
    callToAction: ['Come try am!', 'Oya come!', 'Make you taste am!', 'No waste time!'],
    businessStyle: 'Bold, confident, quality-focused, value emphasis',
    advertisingApproach: 'Strong confident statements about quality and value'
  },
  south_africa: {
    greetings: ['Howzit!', 'Sharp!', 'Hey!', 'Sawubona!'],
    excitement: ['Lekker!', 'Sharp sharp!', 'Awesome!', 'Cool!'],
    callToAction: ['Come check us out!', 'Pop in!', 'Give us a try!'],
    businessStyle: 'Laid-back, friendly, inclusive, warm',
    advertisingApproach: 'Emphasize local flavor and authentic experience'
  }
};

// Sample businesses for demonstration
const sampleBusinesses = [
  {
    name: 'Samaki Cookies',
    type: 'Bakery',
    location: 'Nairobi, Kenya',
    region: 'kenya'
  },
  {
    name: 'Lagos Spice Kitchen', 
    type: 'Restaurant',
    location: 'Lagos, Nigeria',
    region: 'nigeria'
  },
  {
    name: 'Cape Town Coffee Co',
    type: 'Coffee Shop', 
    location: 'Cape Town, South Africa',
    region: 'south_africa'
  }
];

function generateRegionalContent(business) {
  const profile = regionalProfiles[business.region];
  
  if (!profile) {
    return {
      headline: `Experience the best at ${business.name}`,
      caption: `Welcome to ${business.name}! Visit us today for quality service.`,
      cta: `Visit ${business.name} today!`,
      hashtags: ['#local', '#quality', '#service']
    };
  }

  // Generate authentic regional content
  const greeting = profile.greetings[Math.floor(Math.random() * profile.greetings.length)];
  const excitement = profile.excitement[Math.floor(Math.random() * profile.excitement.length)];
  const cta = profile.callToAction[Math.floor(Math.random() * profile.callToAction.length)];

  let headline, caption, hashtags;

  switch (business.region) {
    case 'kenya':
      headline = `${greeting} ${business.name} - Chakula kizuri, bei nzuri!`;
      caption = `${greeting} 

Serving our Nairobi family with love - that's what ${business.name} is all about! Fresh ingredients sourced locally and we're proud to be part of the community.

${excitement} Come experience the difference for yourself. ${cta}

Asante sana!`;
      hashtags = ['#NairobiEats', '#KenyanFood', '#254Food', '#LocalBusiness', '#CommunityFavorite'];
      break;

    case 'nigeria':
      headline = `${greeting} ${business.name} - Quality wey go shock you!`;
      caption = `${greeting}

Tested and trusted - that's what ${business.name} is all about! Best quality for your money and we no dey disappoint.

${excitement} Come experience the premium taste. ${cta}

We dey wait for you!`;
      hashtags = ['#LagosEats', '#NaijaFood', '#9jaFood', '#QualityFood', '#LagosLife'];
      break;

    case 'south_africa':
      headline = `${greeting} ${business.name} - Proper lekker food, hey!`;
      caption = `${greeting}

Proudly South African - that's what ${business.name} is all about! Lekker food, fair prices and where everyone is welcome.

${excitement} Come experience the authentic Mzansi taste. ${cta}

Sharp!`;
      hashtags = ['#JoziEats', '#SouthAfricanFood', '#MzansiFood', '#LocalBusiness', '#Lekker'];
      break;
  }

  return { headline, caption, cta, hashtags };
}

// Demonstrate the regional communication

sampleBusinesses.forEach(business => {
  
  const profile = regionalProfiles[business.region];
  
  const content = generateRegionalContent(business);
  
  
});

