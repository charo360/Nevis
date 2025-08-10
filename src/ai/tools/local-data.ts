'use server';

/**
 * @fileOverview Defines Genkit tools for fetching local weather and event data.
 * This allows the AI to dynamically decide when to pull in local information
 * to make social media posts more relevant and timely.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getWeather } from '@/services/weather';
import { getEvents } from '@/services/events';

export const getWeatherTool = ai.defineTool(
  {
    name: 'getWeather',
    description: 'Gets the current weather for a specific location. Use this to make posts more relevant to the current conditions.',
    inputSchema: z.object({
      location: z.string().describe('The city and state, e.g., "San Francisco, CA"'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const weather = await getWeather(input.location);
    return weather || 'Could not retrieve weather information.';
  }
);

export const getEventsTool = ai.defineTool(
  {
    name: 'getEvents',
    description: 'Finds local events happening on or after the current date for a specific location. Use this to create timely posts about local happenings.',
    inputSchema: z.object({
        location: z.string().describe('The city and state, e.g., "San Francisco, CA"'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // Tools will always be called with the current date
    const events = await getEvents(input.location, new Date());
    return events || 'Could not retrieve local event information.';
  }
);
