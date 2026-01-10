# Creative Studio Asset Library

## Overview

The Asset Library is a persistent storage system for Creative Studio that allows users to upload, organize, and reuse images across multiple design generations. This eliminates the need to re-upload the same assets repeatedly.

## Features

### ✅ **Persistent Storage**
- All uploaded images are stored in Supabase Storage
- Metadata saved to database for quick retrieval
- Assets remain available across sessions

### ✅ **Easy Access**
- Quick access via folder icon in chat input
- Browse all uploaded assets in organized grid/list view
- Search by filename, description, or tags

### ✅ **Smart Organization**
- **Asset Types**: Logo, Product, Background, Template, Other
- **Tags**: Add custom tags for easy filtering
- **Categories**: Organize by custom categories
- **Recent Assets**: Quick access to recently used images
- **Popular Assets**: See most frequently used assets

### ✅ **Asset Management**
- **Upload**: Multiple images at once
- **Edit**: Update filename, description, type, and tags
- **Delete**: Remove unwanted assets
- **Usage Tracking**: See how many times each asset has been used

### ✅ **Seamless Integration**
- Select assets directly from library
- Assets automatically populate in chat input
- Track usage for analytics

## User Flow

### 1. **Uploading Assets**

**From Chat Input:**
1. Click the folder icon (📁) in the chat input
2. Click "Upload" button in Asset Library
3. Select one or multiple images
4. Assets are automatically uploaded and organized

**Automatic Organization:**
- Files stored in: `assets/{userId}/{brandId}/{assetType}/{filename}`
- Metadata saved to database
- Thumbnails generated automatically

### 2. **Browsing Assets**

**View Modes:**
- **Grid View**: Visual thumbnail grid (default)
- **List View**: Detailed list with metadata

**Tabs:**
- **All Assets**: Complete library with filters
- **Recent**: Last 5 used assets
- **Most Used**: Top 5 frequently used assets

**Filters:**
- **Type**: Filter by asset type (logo, product, etc.)
- **Tags**: Filter by custom tags
- **Search**: Search by filename or description

### 3. **Using Assets**

**Select Asset:**
1. Click on any asset in the library
2. Asset automatically loads into chat input
3. Usage count increments
4. Last used timestamp updates

**In Generation:**
- Asset URL is used as reference image
- Can be combined with text prompts
- Works with all Revo models

### 4. **Managing Assets**

**Edit Asset:**
1. Hover over asset card
2. Click edit icon (✏️)
3. Update filename, description, type, or tags
4. Save changes

**Delete Asset:**
1. Hover over asset card
2. Click delete icon (🗑️)
3. Confirm deletion
4. Asset removed from storage and database

## Technical Architecture

### Database Schema

```sql
CREATE TABLE creative_assets (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  brand_profile_id TEXT,
  
  -- Asset details
  asset_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Organization
  tags TEXT[],
  category TEXT,
  description TEXT,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  
  -- Metadata
  width INTEGER,
  height INTEGER,
  thumbnail_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Storage Structure

```
Supabase Storage: nevis-storage bucket
└── assets/
    └── {userId}/
        └── {brandProfileId}/
            ├── logo/
            │   └── logo_1234567890.png
            ├── product/
            │   └── product_1234567890.jpg
            ├── background/
            │   └── background_1234567890.png
            └── other/
                └── other_1234567890.jpg
```

### Services

**CreativeAssetsService** (`src/lib/services/creative-assets-service.ts`)
- `uploadAsset()` - Upload new asset
- `getAssets()` - Get assets with filters
- `getRecentAssets()` - Get recently used assets
- `getPopularAssets()` - Get most used assets
- `trackAssetUsage()` - Increment usage count
- `updateAsset()` - Update asset metadata
- `deleteAsset()` - Delete asset
- `getUserTags()` - Get all user tags
- `getStorageStats()` - Get storage statistics

### Components

**AssetLibrary** (`src/components/studio/asset-library.tsx`)
- Full-featured asset management UI
- Grid/List view toggle
- Search and filter capabilities
- Upload, edit, delete functionality
- Recent and popular asset tabs

## Usage Examples

### Example 1: Logo Reuse

```typescript
// User uploads company logo once
await creativeAssetsService.uploadAsset({
  file: logoFile,
  userId: user.id,
  brandProfileId: brand.id,
  assetType: 'logo',
  tags: ['logo', 'brand', 'primary']
});

// Logo now available in all future generations
// No need to re-upload
```

### Example 2: Product Catalog

```typescript
// Upload multiple product images
const products = [product1, product2, product3];
await Promise.all(
  products.map(file => 
    creativeAssetsService.uploadAsset({
      file,
      userId: user.id,
      assetType: 'product',
      tags: ['product', 'catalog']
    })
  )
);

// All products available for quick selection
```

### Example 3: Brand Templates

```typescript
// Save frequently used background templates
await creativeAssetsService.uploadAsset({
  file: templateFile,
  userId: user.id,
  assetType: 'template',
  tags: ['template', 'social-media', 'instagram'],
  description: 'Instagram post template with brand colors'
});

// Reuse template across campaigns
```

## Benefits

### For Users
✅ **Save Time**: Upload once, use forever
✅ **Stay Organized**: Tag and categorize assets
✅ **Quick Access**: Find assets instantly with search
✅ **Track Usage**: See which assets work best
✅ **No Limits**: Store unlimited assets (within storage quota)

### For System
✅ **Efficient Storage**: Deduplicated file storage
✅ **Fast Retrieval**: Database-indexed metadata
✅ **Usage Analytics**: Track asset performance
✅ **Scalable**: Handles thousands of assets per user

## Migration

### Running the Migration

```bash
# Apply the database migration
supabase db push

# Or manually run the SQL file
psql -h your-db-host -U postgres -d your-db < supabase/migrations/20250101_creative_assets.sql
```

### Existing Users

Existing users will see an empty asset library initially. They can:
1. Upload new assets to the library
2. Continue uploading images via the paperclip button (one-time use)
3. Gradually build their asset library over time

## Future Enhancements

### Planned Features
- [ ] Bulk upload with drag-and-drop
- [ ] Asset folders/collections
- [ ] Shared assets across team members
- [ ] AI-powered asset tagging
- [ ] Asset version history
- [ ] Export/import asset collections
- [ ] Asset recommendations based on usage
- [ ] Integration with stock photo services

### Performance Optimizations
- [ ] Lazy loading for large libraries
- [ ] Image thumbnail generation
- [ ] CDN integration for faster loading
- [ ] Client-side caching

## Troubleshooting

### Assets Not Appearing
1. Check user authentication
2. Verify Supabase connection
3. Check RLS policies are enabled
4. Verify storage bucket permissions

### Upload Failures
1. Check file size limits
2. Verify file type is supported
3. Check storage quota
4. Review Supabase logs

### Performance Issues
1. Enable pagination for large libraries
2. Implement lazy loading
3. Optimize image sizes before upload
4. Use CDN for asset delivery

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase logs
3. Check browser console for errors
4. Contact support with error details
