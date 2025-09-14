# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Nevis** is an advanced AI-powered platform for generating high-quality social media content. It's a Next.js 15 application with MongoDB/Firebase dual backend support, featuring sophisticated AI content generation using multiple AI models (OpenAI, Google AI, Gemini).

## Development Commands

### Environment Setup
```bash
# Copy environment template and configure
cp .env.template .env.local
# Required: GEMINI_API_KEY, OPENAI_API_KEY, AIML_API_KEY (for Revo 2.0)
```

### Development Server
```bash
# Start development server with Turbopack (recommended)
npm run dev

# Alternative development server without Turbopack
npm run dev-webpack

# Start AI model development server
npm run genkit:dev

# Watch mode for AI development
npm run genkit:watch
```

### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Database Operations
```bash
# Check Supabase table structure
node check-supabase-tables.mjs

# Create missing database tables
psql -f create-missing-tables.sql

# Migrate data to Supabase
node migrate-to-supabase.mjs

# Force rebuild with clean dependencies
./force-rebuild.sh
```

### Testing and Development
- Visit `/debug-database` to test database connections
- Use `/test-*` routes for component and feature testing
- AI model testing available at `/social-media-expert-demo` and `/trending-demo`

## High-Level Architecture

### Core Technology Stack
- **Frontend**: Next.js 15.3.3, React 18.3.1, TypeScript 5
- **Styling**: Tailwind CSS 3.4.1 + Radix UI components
- **Database**: Dual support for MongoDB and Firebase/Firestore
- **AI Models**: OpenAI GPT-4, Google Gemini 2.5, GenKit AI integration
- **Image Processing**: FLUX Kontext Max (Revo 2.0), Gemini 2.5 Flash Image Preview

### Application Structure

#### `/src/app/` - Next.js App Router
- **Core Pages**: Dashboard, brand profiles, content generation, calendar
- **Demo/Testing Pages**: Various `/test-*` and `/demo-*` routes for feature testing
- **API Integration**: Server actions in `actions.ts` and `actions/`

#### `/src/ai/` - AI Content Generation System
**Multi-Model Architecture**: The system supports 4+ different AI model versions:
- **Revo 1.0**: Basic content generation with Gemini
- **Revo 1.5**: Enhanced with artifact support and multi-platform optimization
- **Revo 2.0**: Advanced features with FLUX integration and video generation
- **Imagen 4**: Premium quality image generation

**Key Components**:
- `flows/`: Generation workflows and business logic
- `prompts/`: Advanced prompt engineering with psychological triggers
- `models/`: Model registry, factory pattern, and service abstractions
- `utils/`: Trending topics, hashtag strategy, human-like content generation

#### `/src/lib/` - Shared Libraries
- **Database Services**: MongoDB and Firebase/Firestore abstractions
- **Type Definitions**: TypeScript interfaces for business entities
- **Utility Functions**: Common helpers and configurations

#### `/src/components/` - React Components
- **UI Components**: Radix-based design system
- **App Routes**: Route-specific component organization

### Database Architecture

**Dual Database Support**: The application supports both MongoDB and Firebase backends with identical APIs.

**Core Entities**:
- **Users**: Authentication and preferences
- **Brand Profiles**: Business information, brand colors, services
- **Generated Posts**: AI-generated content with variants and analytics
- **Artifacts**: User-uploaded reference materials and exact-use content
- **Content Calendar**: Scheduled content planning

**MongoDB Schema** (`/src/lib/mongodb/schemas.ts`):
- Uses Mongoose with comprehensive document schemas
- Supports multi-platform content variants
- Includes analytics and performance tracking
- Full-text search capabilities

### AI Model System

**Service-Oriented Architecture**: The AI system uses a sophisticated service pattern:

1. **Model Registry**: Central registry of all available AI models
2. **Model Factory**: Creates and manages model instances
3. **Generation Services**: Unified interfaces for content and design generation
4. **Selection Service**: Intelligent model selection based on criteria

**Advanced Features**:
- **Multi-Platform Optimization**: Content tailored for Instagram, LinkedIn, Twitter, Facebook, TikTok
- **Cultural Awareness**: Location-specific content adaptation
- **Trending Integration**: Real-time trend analysis and incorporation
- **Brand Consistency**: Automated brand voice and visual consistency
- **A/B Testing**: Multiple content variants with performance rationale

## Development Guidelines

### AI Model Development
- Models are version-controlled with semantic versioning (Revo 1.0, 1.5, 2.0)
- All models implement standardized interfaces for consistency
- New models should extend base classes in `/src/ai/models/`
- Test model availability before using: use model health checks and fallback strategies

### Database Development
- **Use the unified service layer** - both MongoDB and Firebase services provide identical APIs
- **Prefer MongoDB for new features** - it's the primary database with richer querying
- **Maintain dual compatibility** - ensure changes work with both database backends
- **Use proper TypeScript interfaces** - defined in schemas and service files

### Content Generation Best Practices
- **Platform Optimization**: Always generate platform-specific variants (Instagram vs LinkedIn requires different content styles)
- **Brand Consistency**: Utilize brand profile data for colors, voice, and messaging
- **Quality Standards**: Implement quality scoring and validation for generated content
- **Performance Tracking**: Include analytics metadata for learning and optimization

### API and Environment Configuration
- **Required API Keys**: GEMINI_API_KEY, OPENAI_API_KEY, AIML_API_KEY (Revo 2.0)
- **Database Configuration**: Set up either MongoDB or Firebase connection strings
- **Image Storage**: Configure Supabase for image storage and CDN
- **Development vs Production**: Use `.env.local` for development, proper environment variables for production

### Testing and Debugging
- Use `/debug-database` route to verify database connections
- Test AI models individually at `/test-openai`, `/social-media-expert-demo`
- Use browser developer tools - the app includes extensive console logging for AI operations
- Monitor generation performance through built-in analytics and quality scoring

### Code Organization Principles
- **Separation of Concerns**: AI logic, database operations, and UI components are clearly separated
- **Service Pattern**: Business logic is encapsulated in service classes with dependency injection
- **Type Safety**: Comprehensive TypeScript coverage with proper interface definitions
- **Error Handling**: Graceful degradation and user-friendly error messages throughout

### Performance Considerations
- **Lazy Loading**: AI clients and heavy dependencies are loaded on-demand
- **Caching**: Generated content includes caching strategies and performance metadata
- **Webpack Optimization**: Complex configuration excludes server-side modules from client bundles
- **Image Optimization**: Next.js image optimization configured for multiple CDN sources

## Key Implementation Notes

### Multi-Platform Content Strategy
All platforms use **1:1 aspect ratio** for maximum quality and consistency. The system automatically handles platform-specific optimizations while maintaining visual consistency.

### AI Model Selection
The system includes intelligent model selection based on:
- Budget constraints and credit usage
- Quality requirements
- Platform-specific needs
- User experience level
- Required features (video, artifacts, etc.)

### Brand Profile Integration
Brand profiles are central to content generation:
- Colors, logos, and visual identity are automatically applied
- Business type influences content tone and style
- Location data enables cultural adaptation
- Service information drives content themes

### Error Handling and Fallbacks
- Graceful degradation when AI APIs are unavailable
- Fallback content generation for system resilience
- User-friendly error messages with actionable guidance
- Comprehensive logging for debugging and monitoring

This architecture enables rapid development of AI-powered social media content while maintaining high quality, brand consistency, and platform optimization.