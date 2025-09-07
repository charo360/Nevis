# Services

This directory contains backend services for the Nevis application.

## Available Services

- `events.ts` - Event management service
- `rss-feed-service.ts` - RSS feed processing service
- `weather.ts` - Weather data service

## Setup

Services are integrated into the Next.js application and don't require separate setup.

Set environment variable for service URL:
```bash
export TEXT_OVERLAY_SERVICE_URL=http://localhost:5000
```

## Features

- ✅ Clean, readable text every time
- ✅ Automatic font size optimization
- ✅ Platform-specific styling (Instagram, LinkedIn, etc.)
- ✅ Semi-transparent backgrounds for readability
- ✅ Multiple positioning options (center, top, bottom, etc.)
- ✅ Brand color integration
- ✅ Fallback to background-only if service fails

## API Endpoints

### POST /overlay-text
```json
{
  "image_url": "https://example.com/background.jpg",
  "text": "Your text here",
  "options": {
    "font_size": 48,
    "font_color": "#FFFFFF",
    "bg_color": "#000000",
    "bg_opacity": 0.7,
    "position": "center",
    "add_background": true
  }
}
```

### GET /health
Health check endpoint

## Integration

The service is automatically used in:
- `src/ai/flows/generate-post-from-profile.ts`
- Quick Content generation
- Studio design creation

## Benefits

1. **Perfect Text Quality**: No more corrupted or gibberish text
2. **Consistent Rendering**: Same quality every time
3. **Platform Optimization**: Tailored for each social media platform
4. **Brand Consistency**: Uses brand colors and styling
5. **Reliability**: Fallback to background-only if service fails
