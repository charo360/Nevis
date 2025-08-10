// src/services/events.ts
import fetch from 'node-fetch';
import { format } from 'date-fns';

const API_KEY = process.env.TICKETMASTER_API_KEY;
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

/**
 * Fetches local events for a given location and date.
 * @param location A string in the format "City, ST" or "City".
 * @param date The date for which to find events.
 * @returns A string summarizing local events, or null if an error occurs.
 */
export async function getEvents(location: string, date: Date): Promise<string | null> {
  if (!API_KEY || API_KEY === 'YOUR_TICKETMASTER_API_KEY') {
    console.log('Ticketmaster API key is not configured.');
    return null;
  }

  // Ticketmaster expects city name only
  const city = location.split(',')[0].trim();
  const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'");

  try {
    const url = `${BASE_URL}?apikey=${API_KEY}&city=${city}&startDateTime=${formattedDate}&sort=date,asc&size=5`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API request failed with status ${response.status}`);
    }

    const data: any = await response.json();

    if (data._embedded && data._embedded.events && data._embedded.events.length > 0) {
      const eventNames = data._embedded.events.map((event: any) => event.name);
      return `local events happening soon include: ${eventNames.join(', ')}`;
    } else {
      return 'no major local events found on Ticketmaster for today';
    }
  } catch (error) {
    console.error('Error fetching event data:', error);
    return null;
  }
}
