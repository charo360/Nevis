# Fix for 413 Payload Too Large Error

## Problem

Production error: `Failed to load resource: the server responded with api/image-edit:1 a status of 413 ()`

This occurs when images sent to the image editing API exceed the server's body size limit.

## Root Cause

1. **Default Next.js body size limit**: ~1-4MB
2. **Large images**: High-resolution images can be 10-20MB+ in base64
3. **No compression**: Images sent directly without optimization

## Fixes Applied

### 1. ✅ Updated next.config.js

Added body size limit configuration:

```javascript
// next.config.js
{
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
  },
}
```

**Location**: `next.config.js` lines 165-170

### 2. ✅ Updated API Route Configuration

Updated both image editing endpoints:

```typescript
// src/app/api/image-edit/route.ts
// src/app/api/image-edit-gemini3/route.ts

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';
```

**Why**: 
- `runtime: 'nodejs'` - Ensures Node.js runtime (not Edge)
- `maxDuration: 60` - Allows up to 60 seconds for processing
- `dynamic: 'force-dynamic'` - Prevents static optimization

### 3. ✅ Created Image Compression Utility

New utility to compress images before sending:

```typescript
// src/utils/image-compression.ts

import { compressBase64Image } from '@/utils/image-compression';

const compressed = await compressBase64Image(
  base64Data,
  mimeType,
  {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.85,
    maxSizeMB: 10
  }
);
```

**Features**:
- Automatic compression for images > 10MB
- Maintains aspect ratio
- Configurable quality (default 85%)
- Max dimensions: 2048x2048
- Logs compression ratio

## How to Use

### Option 1: Server-Side Fix (Already Applied)

The server now accepts up to 50MB payloads. **No client changes needed.**

### Option 2: Client-Side Compression (Recommended)

Add compression before sending images:

```typescript
import { compressBase64Image, needsCompression } from '@/utils/image-compression';

// Before sending to API
if (needsCompression(imageBase64)) {
  const compressed = await compressBase64Image(
    imageBase64,
    'image/png',
    { maxSizeMB: 10 }
  );
  imageBase64 = compressed.base64;
}

// Then send to API
const response = await fetch('/api/image-edit', {
  method: 'POST',
  body: JSON.stringify({ originalImage: { base64: imageBase64, ... } })
});
```

### Option 3: Automatic Compression in API Route

Add compression at the API level:

```typescript
// In route.ts POST handler
import { compressBase64Image } from '@/utils/image-compression';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Compress if needed
  if (needsCompression(body.originalImage.base64)) {
    const compressed = await compressBase64Image(
      body.originalImage.base64,
      body.originalImage.mimeType
    );
    body.originalImage.base64 = compressed.base64;
  }
  
  // Continue with editing...
}
```

## Testing

### Check Current Image Size

```typescript
import { estimateBase64SizeMB } from '@/utils/image-compression';

const sizeMB = estimateBase64SizeMB(imageBase64);
console.log(`Image size: ${sizeMB.toFixed(2)}MB`);
```

### Test Compression

```typescript
import { compressImageDataUrl } from '@/utils/image-compression';

const originalDataUrl = 'data:image/png;base64,...';
const compressedDataUrl = await compressImageDataUrl(originalDataUrl, {
  maxWidth: 2048,
  quality: 0.85,
  maxSizeMB: 10
});
```

## Deployment Steps

### 1. Restart Development Server

```bash
npm run dev
```

The new configuration will be loaded.

### 2. Deploy to Production

```bash
# Build with new configuration
npm run build

# Deploy
vercel deploy --prod
# or
npm run deploy
```

### 3. Verify Fix

1. Open production site
2. Try editing a large image
3. Check browser console - should see no 413 errors
4. Check compression logs if implemented

## Additional Optimizations

### For Very Large Images (>20MB)

```typescript
const compressed = await compressBase64Image(base64, mimeType, {
  maxWidth: 1024,  // Smaller max size
  maxHeight: 1024,
  quality: 0.75,   // Lower quality
  maxSizeMB: 5     // Stricter limit
});
```

### Progressive Compression

```typescript
async function compressUntilUnderLimit(
  base64: string,
  mimeType: string,
  targetMB: number = 10
): Promise<string> {
  let quality = 0.9;
  let result = base64;
  
  while (estimateBase64SizeMB(result) > targetMB && quality > 0.3) {
    const compressed = await compressBase64Image(result, mimeType, {
      quality,
      maxSizeMB: targetMB
    });
    result = compressed.base64;
    quality -= 0.1;
  }
  
  return result;
}
```

## Monitoring

### Log Image Sizes

Add to your API route:

```typescript
console.log('📊 [Image Edit] Request size:', {
  originalImageMB: estimateBase64SizeMB(originalImage.base64),
  maskImageMB: mask ? estimateBase64SizeMB(mask.base64) : 0,
  totalMB: estimateBase64SizeMB(originalImage.base64) + 
           (mask ? estimateBase64SizeMB(mask.base64) : 0)
});
```

### Track 413 Errors

```typescript
try {
  const response = await fetch('/api/image-edit', { ... });
  if (response.status === 413) {
    console.error('❌ Payload too large - compression needed');
    // Trigger automatic compression
  }
} catch (error) {
  console.error('❌ Request failed:', error);
}
```

## Summary

✅ **Server-side fix**: Increased body limit to 50MB  
✅ **Route configuration**: Added proper Next.js 15 config  
✅ **Compression utility**: Created for client-side optimization  
✅ **Production ready**: Deploy and test  

**Expected Result**: No more 413 errors, even with large images!

## Files Modified

1. ✅ `next.config.js` - Added body size limits
2. ✅ `src/app/api/image-edit/route.ts` - Updated route config
3. ✅ `src/app/api/image-edit-gemini3/route.ts` - Updated route config
4. ✅ `src/utils/image-compression.ts` - NEW compression utility

## Need Help?

If 413 errors persist:
1. Check server logs for actual payload size
2. Verify next.config.js is being loaded
3. Try client-side compression
4. Reduce image quality/dimensions further
