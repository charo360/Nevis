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
  if (!API_KEY || API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
    console.log('OpenWeatherMap API key is not configured.');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}?q=${location}&appid=${API_KEY}&units=imperial`);
    if (!response.ok) {
      throw new Error(`Weather API request failed with status ${response.status}`);
    }
    
    const data: any = await response.json();

    if (data && data.weather && data.main) {
      const description = data.weather[0].description;
      const temp = Math.round(data.main.temp);
      return `${description} with a temperature of ${temp}°F`;
    }
    return null;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}
