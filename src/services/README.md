# Text Overlay Service

This service provides clean, professional text overlay on background images using PIL/Pillow, solving the corrupted text issue from AI image generation models.

## Problem Solved

Previously, the system was asking AI models (Gemini 2.5 Flash Image Preview, GPT-Image 1) to generate text directly in images, which resulted in:
- Corrupted, unreadable text
- Gibberish characters
- Poor font rendering
- Inconsistent text quality

## Solution

**Two-Step Process:**
1. **Background Generation**: AI models generate clean backgrounds with NO text
2. **Text Overlay**: Python PIL/Pillow service adds clean, readable text

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Model      │    │  Text Overlay    │    │  Final Image    │
│  (Background)   │───▶│   Service        │───▶│  (With Text)    │
│   NO TEXT       │    │  (PIL/Pillow)    │    │  Clean & Clear  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Files

- `text-overlay-service.py` - Python Flask service using PIL/Pillow
- `text-overlay-client.ts` - TypeScript client for the service
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container setup
- `start-text-overlay-service.sh` - Development startup script

## Setup

### Option 1: Local Development
```bash
cd src/services
pip install -r requirements.txt
python text-overlay-service.py
```

### Option 2: Docker
```bash
cd src/services
docker build -t text-overlay-service .
docker run -p 5000:5000 text-overlay-service
```

## Usage

The service automatically integrates with the image generation flow:

1. AI generates background image (NO TEXT)
2. System calls text overlay service
3. Service returns image with clean text overlay

## Configuration

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
