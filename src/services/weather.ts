// src/services/weather.ts
import fetch from 'node-fetch';

const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetches the current weather for a given location.
 * @param location A string in the format "City, ST" or "City, Country".
 * @returns A human-readable weather description string, or null if an error occurs.
 */
export async function getWeather(location: string): Promise<string | null> {
  if (!API_KEY || API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY' || API_KEY.length < 20) {
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}?q=${location}&appid=${API_KEY}&units=imperial`);
    if (!response.ok) {
      // Return null to allow the flow to continue without weather data
      return `Could not retrieve weather information due to an API error (Status: ${response.status})`;
    }
    
    const data: any = await response.json();

    if (data && data.weather && data.main) {
      const description = data.weather[0].description;
      const temp = Math.round(data.main.temp);
      return `${description} with a temperature of ${temp}°F`;
    }
    return null;
  } catch (error) {
    return null;
  }
}
