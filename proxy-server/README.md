# Nevis AI Proxy Server

A controlled proxy server for AI model access that prevents unexpected model calls and manages costs with OpenRouter fallback system.

## 🎯 Purpose

This proxy server ensures that:
- ✅ Only specified models are called (no unexpected model invocations)
- ✅ User quotas are enforced (credit-based system)
- ✅ All API calls are logged and monitored
- ✅ Costs are controlled and predictable
- ✅ **OpenRouter fallback system for high availability**
- ✅ Automatic failover when Google API is unavailable

## 🔄 OpenRouter Fallback System

The proxy now includes an intelligent fallback system that automatically switches to OpenRouter when Google API fails:

### Fallback Triggers
- **429 Quota Exceeded**: When Google API quota is exhausted
- **503 Service Unavailable**: When Google services are down
- **500 Internal Server Error**: When Google API has internal issues
- **Timeout Errors**: When Google API doesn't respond in time
- **Connection Errors**: When Google API is unreachable

### Model Mapping
| Google Model | OpenRouter Equivalent |
|--------------|----------------------|
| `gemini-2.5-flash` | `google/gemini-2.5-flash` |
| `gemini-2.5-flash-image-preview` | `google/gemini-2.5-flash-image-preview` |
| `gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` |
| `gemini-1.5-flash` | `google/gemini-1.5-flash` |

### Alternative Models
- **Text Generation**: `anthropic/claude-3.5-sonnet` (high-quality alternative)
- **Image Generation**: Continues with Google models on OpenRouter

## 📊 API Response Format

The proxy maintains consistent response format regardless of which provider is used:

```json
{
  "success": true,
  "data": { /* Google API format response */ },
  "model_used": "gemini-2.5-flash",
  "provider_used": "openrouter",  // "google" or "openrouter"
  "endpoint_used": "openrouter",  // or original Google endpoint
  "user_credits": 95
}
```

## 📝 Logging and Monitoring

The system provides detailed logging for debugging and monitoring:

```
🎯 Attempting Google API for model: gemini-2.5-flash
⚠️ Google API failed for gemini-2.5-flash: 429 - Quota exceeded
🔄 Falling back to OpenRouter for model: gemini-2.5-flash
✅ OpenRouter API successful with model: google/gemini-2.5-flash
```

### Log Levels
- **INFO**: Normal operations, successful requests
- **WARNING**: Fallback triggers, quota warnings
- **ERROR**: Failed requests on both providers

## 🚀 Quick Start

### 1. Environment Setup

Ensure you have the following environment variables configured:

```bash
# Google API Keys (Primary)
GEMINI_API_KEY_REVO_1_0=your_revo_1_0_key
GEMINI_API_KEY_REVO_1_5=your_revo_1_5_key
GEMINI_API_KEY_REVO_2_0=your_revo_2_0_key
GEMINI_API_KEY=your_fallback_key

# OpenRouter API Key (Fallback)
OPENROUTER_API_KEY=your_openrouter_key
```

### 2. Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment file (if using .env)
cp .env.example .env

# Edit .env with your API keys
nano .env

# Run the server
uvicorn main:app --reload --port 8000
```

### 3. Testing the Fallback System

```bash
# Test basic functionality
python test_fallback.py

# Test fallback scenarios
python test_fallback_scenarios.py

# Check health endpoint
curl http://localhost:8000/health
```

### 4. Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f ai-proxy
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
GOOGLE_API_KEY=your-google-api-key-here

# Optional: Separate keys for different Revo models
GOOGLE_API_KEY_REVO_1_0=your-revo-1.0-api-key
GOOGLE_API_KEY_REVO_1_5=your-revo-1.5-api-key
GOOGLE_API_KEY_REVO_2_0=your-revo-2.0-api-key
```

## 📡 API Endpoints

### Generate Image
```bash
POST /generate-image
{
  "prompt": "A beautiful sunset",
  "user_id": "user123",
  "model": "gemini-2.5-flash-image-preview",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

### Generate Text
```bash
POST /generate-text
{
  "prompt": "Write a story about AI",
  "user_id": "user123",
  "model": "gemini-2.5-flash",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

### Check User Quota
```bash
GET /quota/{user_id}
```

### Health Check
```bash
GET /health
```

## 🛡️ Security Features

### Model Validation
- Only allows pre-approved models
- Blocks unauthorized model requests
- Logs all blocked attempts

### Rate Limiting
- 40 requests per month per user
- Automatic quota reset monthly
- Quota tracking and enforcement

### Request Logging
- All requests are logged
- Model usage tracking
- Error monitoring

## 🔌 Integration with Nevis App

### Using the Proxy Client

```typescript
import { aiProxyClient, getUserIdForProxy } from '@/lib/services/ai-proxy-client';

// Generate image through proxy
const result = await aiProxyClient.generateImage({
  prompt: "Professional business design",
  user_id: getUserIdForProxy(),
  model: "gemini-2.5-flash-image-preview"
});

// Check user quota
const quota = await aiProxyClient.getUserQuota(getUserIdForProxy());
console.log(`Usage: ${quota.current_usage}/${quota.monthly_limit}`);
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### User Quota Check
```bash
curl http://localhost:8000/quota/user123
```

### Logs
- All requests are logged with timestamps
- Model usage is tracked
- Errors are logged with details

## 🚀 Deployment Options

### 1. Local Development
- Run with `uvicorn main:app --reload`
- Perfect for testing and development

### 2. Docker Container
- Use provided Dockerfile
- Easy deployment with docker-compose

### 3. Cloud Deployment
- Deploy to any cloud provider
- Set environment variables in your platform
- Ensure port 8000 is accessible

## 🔄 Allowed Models

Current allowed models:
- `gemini-2.5-flash-image-preview` (for image generation)
- `gemini-2.5-flash` (for text generation)
- `gemini-1.5-pro` (for advanced text generation)

To add more models, update the `ALLOWED_MODELS` dictionary in `main.py`.

## 📈 Benefits

✅ **Cost Control**: Prevents unexpected model calls and associated costs
✅ **Quota Management**: Built-in user quotas (40/month)
✅ **Model Validation**: Only approved models can be called
✅ **Request Logging**: Full visibility into API usage
✅ **Error Handling**: Graceful error handling and logging
✅ **Easy Integration**: Simple client library for your app
