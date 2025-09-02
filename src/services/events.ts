// src/services/events.ts
import fetch from 'node-fetch';
import { format, add } from 'date-fns';

const API_KEY = process.env.EVENTBRITE_PRIVATE_TOKEN;
const BASE_URL = 'https://www.eventbriteapi.com/v3/events/search/';

/**
 * Fetches local events for a given location and date using Eventbrite.
 * @param location A string in the format "City, ST" or "City".
 * @param date The date for which to find events.
 * @returns A string summarizing local events, or null if an error occurs.
 */
export async function getEvents(location: string, date: Date): Promise<string | null> {
  if (!API_KEY || API_KEY === 'YOUR_EVENTBRITE_PRIVATE_TOKEN' || API_KEY.length < 10) {
    return null;
  }

  // Eventbrite is more flexible with location strings.
  const city = location.split(',')[0].trim();
  
  // Search for events starting from today up to one week from now to get more results
  const startDate = format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  const endDate = format(add(date, { days: 7 }), "yyyy-MM-dd'T'HH:mm:ss'Z'");

  try {
    const url = `${BASE_URL}?location.address=${city}&start_date.range_start=${startDate}&start_date.range_end=${endDate}&sort_by=date`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Accept': 'application/json',
        }
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      // Return null to allow the flow to continue without event data
      return `Could not retrieve local event information due to an API error (Status: ${response.status}).`;
    }

    const data: any = await response.json();

    if (data.events && data.events.length > 0) {
      const eventNames = data.events.slice(0, 5).map((event: any) => event.name.text);
      return `local events happening soon include: ${eventNames.join(', ')}`;
    } else {
      return 'no major local events found on Eventbrite for the upcoming week';
    }
  } catch (error) {
    return null;
  }
}
