# API Keys Configuration - Separate Keys for Each Revo Model

## Overview
This document outlines the implementation of separate API keys for each Revo model version to enable independent usage tracking, billing, and rate limiting.

## Environment Variables

### Current Configuration (.env.local)
```bash
# Google AI API Keys - Separate keys for each Revo model
GEMINI_API_KEY=AIzaSyBQHfRgwzTRlfAXlJk0rF900PH6jq9QoCE  # Revo 1.0 (fallback)
GEMINI_API_KEY_REVO_1_0=AIzaSyBQHfRgwzTRlfAXlJk0rF900PH6jq9QoCE
GEMINI_API_KEY_REVO_1_5=AIzaSyDzXW_pP7e2-Cslr2oYDSVYPQ1Z7fq_6e4
GEMINI_API_KEY_REVO_2_0=AIzaSyCKttVlFvEwe17QkfT5tWRuUrXj2hqvToY
```

## Implementation Details

### Revo 1.0
- **Primary Key**: `GEMINI_API_KEY_REVO_1_0`
- **Fallback**: `GEMINI_API_KEY`
- **Files Updated**:
  - `src/ai/revo-1.0-service.ts`
  - `src/ai/models/versions/revo-1.0/content-generator.ts`
  - `src/ai/models/versions/revo-1.0/design-generator.ts`
  - `src/ai/models/versions/revo-1.0/index.ts`

### Revo 1.5
- **Primary Key**: `GEMINI_API_KEY_REVO_1_5`
- **Fallback**: `GEMINI_API_KEY`
- **Files Updated**:
  - `src/ai/revo-1.5-enhanced-design.ts`
  - `src/ai/models/versions/revo-1.5/content-generator.ts`
  - `src/ai/models/versions/revo-1.5/design-generator.ts`
  - `src/ai/models/versions/revo-1.5/index.ts`

### Revo 2.0
- **Primary Key**: `GEMINI_API_KEY_REVO_2_0`
- **Fallback**: `GEMINI_API_KEY`
- **Files Updated**:
  - `src/ai/revo-2.0-service.ts`

## Key Priority Order

Each model follows this priority order for API key resolution:

1. **Model-specific key** (e.g., `GEMINI_API_KEY_REVO_1_0`)
2. **Generic fallback** (`GEMINI_API_KEY`)
3. **Alternative fallbacks** (`GOOGLE_API_KEY`, `GOOGLE_GENAI_API_KEY`)
4. **Public environment variables** (for client-side usage)

## Error Handling

Each model now provides specific error messages when API keys are missing:

- **Revo 1.0**: "Revo 1.0: No Gemini API key found. Please set GEMINI_API_KEY_REVO_1_0 or GEMINI_API_KEY in your environment variables."
- **Revo 1.5**: "Revo 1.5: No Gemini API key found. Please set GEMINI_API_KEY_REVO_1_5 or GEMINI_API_KEY in your environment variables."
- **Revo 2.0**: "Revo 2.0: No Gemini API key found. Please set GEMINI_API_KEY_REVO_2_0 or GEMINI_API_KEY in your environment variables."

## Benefits

1. **Independent Tracking**: Each model's usage can be tracked separately
2. **Billing Separation**: Different billing accounts/projects for each model
3. **Rate Limiting**: Independent rate limits for each model version
4. **Security**: Ability to revoke/rotate keys per model
5. **Monitoring**: Better monitoring and alerting per model
6. **Fallback Support**: Maintains backward compatibility with existing setup

## Testing

To test the configuration:

1. **Start the development server**: `npm run dev`
2. **Test each model**:
   - Revo 1.0: Navigate to `/quick-content`
   - Revo 1.5: Use the Revo 1.5 interface
   - Revo 2.0: Use the Revo 2.0 interface
3. **Check logs** for API key usage confirmation
4. **Monitor API usage** in Google Cloud Console for each key

## Deployment Notes

For production deployment:

1. **Set environment variables** in your hosting platform
2. **Use secure key management** (e.g., AWS Secrets Manager, Azure Key Vault)
3. **Monitor usage** across all three keys
4. **Set up alerts** for rate limiting or quota issues
5. **Implement key rotation** procedures

## Troubleshooting

### Common Issues:

1. **"No API key found" errors**: Check environment variable names and values
2. **Rate limiting**: Monitor usage across different keys
3. **Quota exceeded**: Check Google Cloud Console for each project
4. **Authentication failures**: Verify key validity and permissions

### Debug Commands:

```bash
# Check environment variables
echo $GEMINI_API_KEY_REVO_1_0
echo $GEMINI_API_KEY_REVO_1_5  
echo $GEMINI_API_KEY_REVO_2_0

# Test API key validity (replace with actual key)
curl -H "Authorization: Bearer YOUR_API_KEY" https://generativelanguage.googleapis.com/v1/models
```

## Future Enhancements

1. **Dynamic key rotation**
2. **Usage analytics dashboard**
3. **Automatic failover between keys**
4. **Cost optimization based on usage patterns**
5. **A/B testing with different API configurations**
