/**
 * Seasonal Events
 * Provides upcoming events and holidays for content planning
 * Part of Layer 1: Research Layer
 */

export interface SeasonalEvent {
  name: string;
  date: string; // ISO date string
  type: 'holiday' | 'shopping' | 'awareness' | 'cultural' | 'industry';
  relevance: number; // 0-1 score for content relevance
  industries: string[]; // Which industries this is relevant for
  contentIdeas: string[];
  hashtags: string[];
  daysUntil?: number;
}

export interface EventCalendar {
  upcoming: SeasonalEvent[];
  thisWeek: SeasonalEvent[];
  thisMonth: SeasonalEvent[];
  nextMonth: SeasonalEvent[];
}

// Global events (applicable worldwide)
const GLOBAL_EVENTS: Omit<SeasonalEvent, 'daysUntil'>[] = [
  // January
  {
    name: "New Year's Day",
    date: '01-01',
    type: 'holiday',
    relevance: 0.95,
    industries: ['retail', 'food', 'finance', 'healthcare', 'service', 'saas', 'education'],
    contentIdeas: ['New year resolutions', 'Fresh start', 'Year goals', 'New beginnings'],
    hashtags: ['#newyear', '#2025', '#freshstart', '#newyeargoals'],
  },
  // February
  {
    name: "Valentine's Day",
    date: '02-14',
    type: 'holiday',
    relevance: 0.9,
    industries: ['retail', 'food', 'service'],
    contentIdeas: ['Gift ideas', 'Special offers', 'Love-themed content', 'Couples deals'],
    hashtags: ['#valentines', '#love', '#valentinesday', '#giftideas'],
  },
  // March
  {
    name: "International Women's Day",
    date: '03-08',
    type: 'awareness',
    relevance: 0.85,
    industries: ['retail', 'healthcare', 'education', 'nonprofit', 'service'],
    contentIdeas: ['Women empowerment', 'Female leaders', 'Women in business', 'Celebrate women'],
    hashtags: ['#internationalwomensday', '#iwd', '#womenempowerment', '#womeninbusiness'],
  },
  // April
  {
    name: 'Earth Day',
    date: '04-22',
    type: 'awareness',
    relevance: 0.8,
    industries: ['retail', 'food', 'nonprofit'],
    contentIdeas: ['Sustainability', 'Eco-friendly practices', 'Green initiatives', 'Environmental tips'],
    hashtags: ['#earthday', '#sustainability', '#ecofriendly', '#gogreen'],
  },
  // May
  {
    name: "Mother's Day",
    date: '05-12', // Second Sunday of May (approximate)
    type: 'holiday',
    relevance: 0.9,
    industries: ['retail', 'food', 'healthcare', 'service'],
    contentIdeas: ['Gift guide for moms', 'Thank you mom', 'Mother appreciation', 'Special treats'],
    hashtags: ['#mothersday', '#mom', '#thanksmom', '#motherlove'],
  },
  // June
  {
    name: "Father's Day",
    date: '06-16', // Third Sunday of June (approximate)
    type: 'holiday',
    relevance: 0.85,
    industries: ['retail', 'food', 'service'],
    contentIdeas: ['Gift guide for dads', 'Dad appreciation', 'Father-child moments'],
    hashtags: ['#fathersday', '#dad', '#thanksdad', '#fatherlove'],
  },
  // July
  {
    name: 'World Social Media Day',
    date: '06-30',
    type: 'industry',
    relevance: 0.7,
    industries: ['saas', 'service', 'retail', 'education'],
    contentIdeas: ['Social media tips', 'Platform updates', 'Community appreciation'],
    hashtags: ['#socialmediaday', '#socialmedia', '#digitalmarketing'],
  },
  // August
  {
    name: 'Back to School',
    date: '08-15', // Approximate start
    type: 'shopping',
    relevance: 0.9,
    industries: ['retail', 'education', 'saas'],
    contentIdeas: ['School supplies', 'Student deals', 'Learning tools', 'Education tips'],
    hashtags: ['#backtoschool', '#school', '#education', '#students'],
  },
  // September
  {
    name: 'World Tourism Day',
    date: '09-27',
    type: 'awareness',
    relevance: 0.7,
    industries: ['food', 'service', 'retail'],
    contentIdeas: ['Travel tips', 'Local tourism', 'Explore local', 'Tourism support'],
    hashtags: ['#worldtourismday', '#travel', '#tourism', '#explore'],
  },
  // October
  {
    name: 'World Mental Health Day',
    date: '10-10',
    type: 'awareness',
    relevance: 0.85,
    industries: ['healthcare', 'nonprofit', 'education', 'service'],
    contentIdeas: ['Mental health tips', 'Self-care', 'Wellness', 'Support resources'],
    hashtags: ['#mentalhealthday', '#mentalhealth', '#selfcare', '#wellness'],
  },
  {
    name: 'Halloween',
    date: '10-31',
    type: 'holiday',
    relevance: 0.8,
    industries: ['retail', 'food'],
    contentIdeas: ['Spooky deals', 'Halloween specials', 'Costume ideas', 'Themed content'],
    hashtags: ['#halloween', '#spooky', '#trickortreat', '#halloweendeals'],
  },
  // November
  {
    name: 'Black Friday',
    date: '11-29', // Fourth Friday of November
    type: 'shopping',
    relevance: 0.98,
    industries: ['retail', 'saas', 'service', 'food'],
    contentIdeas: ['Biggest sale', 'Deal countdown', 'Early access', 'Flash sales'],
    hashtags: ['#blackfriday', '#blackfridaydeals', '#sale', '#deals'],
  },
  {
    name: 'Cyber Monday',
    date: '12-02', // Monday after Black Friday
    type: 'shopping',
    relevance: 0.95,
    industries: ['retail', 'saas', 'service'],
    contentIdeas: ['Online deals', 'Digital discounts', 'Tech sales', 'Extended offers'],
    hashtags: ['#cybermonday', '#cybermondaydeals', '#onlinesale', '#techdeals'],
  },
  // December
  {
    name: 'Christmas',
    date: '12-25',
    type: 'holiday',
    relevance: 0.98,
    industries: ['retail', 'food', 'service', 'nonprofit'],
    contentIdeas: ['Gift guide', 'Holiday specials', 'Festive content', 'Year-end celebration'],
    hashtags: ['#christmas', '#holiday', '#giftguide', '#festive'],
  },
  {
    name: "New Year's Eve",
    date: '12-31',
    type: 'holiday',
    relevance: 0.9,
    industries: ['retail', 'food', 'service'],
    contentIdeas: ['Year in review', 'Countdown', 'Celebration', 'Thank you customers'],
    hashtags: ['#newyearseve', '#goodbye2024', '#celebration', '#yearinreview'],
  },
];

// Kenya-specific events
const KENYA_EVENTS: Omit<SeasonalEvent, 'daysUntil'>[] = [
  {
    name: 'Madaraka Day',
    date: '06-01',
    type: 'cultural',
    relevance: 0.85,
    industries: ['retail', 'food', 'service', 'finance', 'nonprofit'],
    contentIdeas: ['Self-governance celebration', 'Kenyan achievements', 'National pride'],
    hashtags: ['#madarakaday', '#kenya', '#kenyanpride', '#selfgovernance'],
  },
  {
    name: 'Mashujaa Day',
    date: '10-20',
    type: 'cultural',
    relevance: 0.85,
    industries: ['retail', 'food', 'service', 'nonprofit'],
    contentIdeas: ['Heroes celebration', 'Kenyan heroes', 'Community stories', 'Local heroes'],
    hashtags: ['#mashujaaday', '#kenyaheroes', '#heroes', '#kenya'],
  },
  {
    name: 'Jamhuri Day',
    date: '12-12',
    type: 'cultural',
    relevance: 0.9,
    industries: ['retail', 'food', 'service', 'finance', 'nonprofit'],
    contentIdeas: ['Independence celebration', 'Kenyan pride', 'National heritage', 'Kenya 60+'],
    hashtags: ['#jamhuriday', '#kenyaindependence', '#kenya', '#kenyanpride'],
  },
  {
    name: 'Eid al-Fitr',
    date: '04-10', // Approximate - varies by lunar calendar
    type: 'cultural',
    relevance: 0.85,
    industries: ['retail', 'food', 'service'],
    contentIdeas: ['Eid celebrations', 'Family gatherings', 'Special offers', 'Festive meals'],
    hashtags: ['#eidmubarak', '#eid', '#eidalfitr', '#celebration'],
  },
  {
    name: 'Eid al-Adha',
    date: '06-17', // Approximate - varies by lunar calendar
    type: 'cultural',
    relevance: 0.85,
    industries: ['retail', 'food', 'service'],
    contentIdeas: ['Eid celebrations', 'Family time', 'Special offers', 'Community'],
    hashtags: ['#eidaladha', '#eidmubarak', '#celebration', '#family'],
  },
];

// Nigeria-specific events
const NIGERIA_EVENTS: Omit<SeasonalEvent, 'daysUntil'>[] = [
  {
    name: 'Nigeria Independence Day',
    date: '10-01',
    type: 'cultural',
    relevance: 0.9,
    industries: ['retail', 'food', 'service', 'finance', 'nonprofit'],
    contentIdeas: ['Independence celebration', 'Nigerian pride', 'National heritage'],
    hashtags: ['#nigeriaindependence', '#nigeria', '#naija', '#proudlynigerian'],
  },
  {
    name: 'Democracy Day',
    date: '06-12',
    type: 'cultural',
    relevance: 0.8,
    industries: ['retail', 'service', 'nonprofit'],
    contentIdeas: ['Democracy celebration', 'Nigerian democracy', 'Civic engagement'],
    hashtags: ['#democracyday', '#nigeria', '#democracy'],
  },
];

// South Africa-specific events
const SOUTH_AFRICA_EVENTS: Omit<SeasonalEvent, 'daysUntil'>[] = [
  {
    name: 'Freedom Day',
    date: '04-27',
    type: 'cultural',
    relevance: 0.9,
    industries: ['retail', 'food', 'service', 'nonprofit'],
    contentIdeas: ['Freedom celebration', 'South African heritage', 'Unity'],
    hashtags: ['#freedomday', '#southafrica', '#mzansi', '#freedom'],
  },
  {
    name: 'Heritage Day',
    date: '09-24',
    type: 'cultural',
    relevance: 0.85,
    industries: ['retail', 'food', 'service'],
    contentIdeas: ['Cultural heritage', 'Braai Day', 'South African culture', 'Traditions'],
    hashtags: ['#heritageday', '#braaiday', '#southafrica', '#culture'],
  },
];

/**
 * Get upcoming events for a location and industry
 */
export function getUpcomingEvents(
  options: {
    location?: string;
    industry?: string;
    daysAhead?: number;
  } = {}
): EventCalendar {
  const { location, industry, daysAhead = 90 } = options;

  const now = new Date();
  const currentYear = now.getFullYear();

  // Combine global and location-specific events
  let allEvents = [...GLOBAL_EVENTS];

  if (location) {
    const loc = location.toLowerCase();
    if (loc.includes('kenya')) {
      allEvents = [...allEvents, ...KENYA_EVENTS];
    } else if (loc.includes('nigeria')) {
      allEvents = [...allEvents, ...NIGERIA_EVENTS];
    } else if (loc.includes('south africa')) {
      allEvents = [...allEvents, ...SOUTH_AFRICA_EVENTS];
    }
  }

  // Convert to full dates and calculate days until
  const eventsWithDates: SeasonalEvent[] = allEvents.map(event => {
    const [month, day] = event.date.split('-').map(Number);
    let eventDate = new Date(currentYear, month - 1, day);

    // If event has passed this year, use next year
    if (eventDate < now) {
      eventDate = new Date(currentYear + 1, month - 1, day);
    }

    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...event,
      date: eventDate.toISOString().split('T')[0],
      daysUntil,
    };
  });

  // Filter by industry if specified
  let filteredEvents = eventsWithDates;
  if (industry) {
    filteredEvents = eventsWithDates.filter(
      event => event.industries.includes(industry) || event.industries.includes('all')
    );
  }

  // Filter by days ahead
  filteredEvents = filteredEvents.filter(event => (event.daysUntil || 0) <= daysAhead);

  // Sort by date
  filteredEvents.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));

  // Categorize
  const thisWeek = filteredEvents.filter(e => (e.daysUntil || 0) <= 7);
  const thisMonth = filteredEvents.filter(e => (e.daysUntil || 0) <= 30);
  const nextMonth = filteredEvents.filter(e => (e.daysUntil || 0) > 30 && (e.daysUntil || 0) <= 60);

  return {
    upcoming: filteredEvents,
    thisWeek,
    thisMonth,
    nextMonth,
  };
}

/**
 * Get content ideas for an upcoming event
 */
export function getEventContentIdeas(event: SeasonalEvent): {
  preEvent: string[];
  dayOf: string[];
  postEvent: string[];
} {
  return {
    preEvent: [
      `Countdown to ${event.name}`,
      `Get ready for ${event.name}`,
      `${event.name} is coming - here's what you need`,
      ...event.contentIdeas.slice(0, 2),
    ],
    dayOf: [
      `Happy ${event.name}!`,
      `Celebrating ${event.name} with you`,
      `${event.name} special offer`,
      ...event.contentIdeas.slice(0, 2),
    ],
    postEvent: [
      `Hope you had a great ${event.name}`,
      `${event.name} recap`,
      `Thank you for celebrating with us`,
    ],
  };
}

/**
 * Format events for AI assistant
 */
export function formatEventsForAssistant(calendar: EventCalendar): string {
  if (calendar.upcoming.length === 0) {
    return 'No major events in the next 90 days.';
  }

  let formatted = '📅 UPCOMING EVENTS:\n\n';

  if (calendar.thisWeek.length > 0) {
    formatted += '🔥 THIS WEEK:\n';
    calendar.thisWeek.forEach(event => {
      formatted += `- ${event.name} (${event.date}) - ${event.daysUntil} days\n`;
      formatted += `  Ideas: ${event.contentIdeas.slice(0, 2).join(', ')}\n`;
    });
    formatted += '\n';
  }

  if (calendar.thisMonth.length > 0) {
    formatted += '📆 THIS MONTH:\n';
    calendar.thisMonth.slice(0, 5).forEach(event => {
      formatted += `- ${event.name} (${event.date})\n`;
    });
    formatted += '\n';
  }

  if (calendar.nextMonth.length > 0) {
    formatted += '🗓️ NEXT MONTH:\n';
    calendar.nextMonth.slice(0, 3).forEach(event => {
      formatted += `- ${event.name} (${event.date})\n`;
    });
  }

  return formatted;
}

/**
 * Check if today is a special event
 */
export function getTodaysEvents(location?: string): SeasonalEvent[] {
  const calendar = getUpcomingEvents({ location, daysAhead: 1 });
  return calendar.upcoming.filter(e => e.daysUntil === 0);
}

/**
 * Get events for content planning
 */
export function getEventsForPlanning(
  location?: string,
  industry?: string,
  weeks: number = 4
): SeasonalEvent[] {
  const daysAhead = weeks * 7;
  const calendar = getUpcomingEvents({ location, industry, daysAhead });
  return calendar.upcoming;
}

export default {
  getUpcomingEvents,
  getEventContentIdeas,
  formatEventsForAssistant,
  getTodaysEvents,
  getEventsForPlanning,
};
