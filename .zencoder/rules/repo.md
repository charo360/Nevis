---
description: Repository Information Overview
alwaysApply: true
---

# Nevis AI Information

## Summary
Nevis is an advanced AI-powered platform for generating high-quality social media content with Firebase/Firestore backend integration. It uses AI models to create content and designs optimized for various social media platforms.

## Structure
- **Nevis/**: Main Next.js application with Firebase integration
- **src/**: Root source directory containing components and services
  - **src/ai/**: AI models and services for content generation
  - **src/app/**: Next.js application routes and pages
  - **src/components/**: UI components
  - **src/services/**: Backend services including text overlay service

## Language & Runtime
**Language**: TypeScript
**Version**: ES2017 target
**Build System**: Next.js
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- Next.js 15.3.3
- React 18.3.1
- Firebase/Firestore 12.1.0
- GenKit AI 1.14.1
- Google Generative AI 0.24.1
- OpenAI 5.12.2
- Tailwind CSS 3.4.1
- Radix UI components

**Development Dependencies**:
- TypeScript 5
- GenKit CLI 1.14.1
- PostCSS 8

## Build & Installation
```bash
# Copy environment template
cp .env.template .env.local

# Fill in Firebase configuration
# Add AIML_API_KEY to .env.local for Revo 2.0 functionality

# Install dependencies
npm install

# Run development server
npm run dev
```

## Docker
**Dockerfile**: src/services/Dockerfile
**Image**: Python 3.11 slim
**Configuration**: Flask-based text overlay service with Gunicorn
**Python Dependencies**:
- Flask 2.3.3
- Flask-CORS 4.0.0
- Pillow 10.0.1
- Gunicorn 21.2.0

## AI Services
**Models**:
- Revo 2.0: FLUX Kontext Max integration for image generation
- GenKit AI: Integration with Google AI models
- OpenAI: Integration for content generation

**Key Features**:
- Design generation with platform-specific optimizations
- Content generation with brand consistency
- Multi-platform support (Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest)
- Image text overlay service

## Issue Analysis: Revo 2.0 Image Display
The issue with Revo 2.0 image design not displaying is likely related to:

1. Missing AIML API key in environment variables
2. API response handling issues in the design generator
3. Image data format inconsistency between base64 and URL formats

**Fix Recommendations**:
1. Ensure AIML_API_KEY is properly set in .env.local
2. Check the response format in AimlApiService.generateImage()
3. Verify image data handling in Revo20DesignGenerator.generateDesign()
4. Debug the API response with console logs to identify the exact issue