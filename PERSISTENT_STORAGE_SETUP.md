# Persistent Post Storage Setup

This document explains how to set up persistent post storage so that generated posts remain in the system after refresh and are accessible across devices.

## Current Problem

Right now, when you refresh the page, all generated posts disappear because they're only stored in the browser's localStorage (client-side). This also means posts aren't synced across devices.

## Solution

We've implemented a complete persistent storage solution using Supabase as the database backend:

- **Posts are saved to Supabase database** - No more losing posts on refresh
- **Images are stored in Supabase Storage** - High-quality images persist permanently  
- **Cross-device sync** - Login from any device to see your posts
- **User-scoped storage** - Each user only sees their own posts
- **Brand-scoped organization** - Posts are organized by brand profiles

## Setup Instructions

### 1. Supabase Database Setup

You need to run the SQL setup script in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase_setup.sql` (in the project root)
4. Click **Run** to create the necessary tables and storage policies

The setup creates:
- `generated_posts` table - Stores all post data persistently
- `brand_profiles` table - Stores brand information
- `nevis-storage` bucket - Stores uploaded images
- Proper indexes for optimal performance

### 2. Environment Variables

Make sure your `.env.local` has the correct Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Test the Implementation

1. **Generate a post** - Create a new post using Quick Content
2. **Refresh the page** - Posts should remain visible
3. **Login from different device** - Posts should be accessible
4. **Check Supabase dashboard** - Verify data appears in `generated_posts` table

## How It Works

### Data Flow

1. **Post Generation**: When you generate a post, it's sent to `/api/generated-posts`
2. **Image Upload**: Images are uploaded to Supabase Storage and get permanent URLs
3. **Database Save**: Post data (including image URLs) is saved to `generated_posts` table
4. **Loading**: When loading posts, the app queries both database and localStorage, then combines results
5. **Deduplication**: Duplicate posts are automatically filtered out

### API Endpoints

- `POST /api/generated-posts` - Save new posts to database
- `GET /api/generated-posts` - Load all posts for user
- `GET /api/generated-posts/brand/[brandId]` - Load posts for specific brand

### Client-Side Logic

The client-side code (in `src/app/quick-content/page.tsx`) now:

1. **Loads from database first** - Primary source of truth
2. **Falls back to localStorage** - Backward compatibility
3. **Combines and deduplicates** - Seamless user experience
4. **Saves to database** - All new posts are persisted

## Benefits

✅ **Posts persist after refresh** - Never lose generated content  
✅ **Cross-device sync** - Access posts from any device  
✅ **Image persistence** - High-quality images stored permanently  
✅ **User isolation** - Each user only sees their own posts  
✅ **Brand organization** - Posts organized by brand profiles  
✅ **Backward compatibility** - Existing localStorage posts are preserved  
✅ **Performance optimized** - Database queries are indexed and efficient  

## Troubleshooting

### Posts not saving to database

1. Check Supabase dashboard for any error logs
2. Verify the `generated_posts` table exists
3. Check that `nevis-storage` bucket has proper policies
4. Ensure environment variables are correct

### Images not loading

1. Verify images appear in Supabase Storage bucket
2. Check that storage policies allow public read access
3. Look for CORS issues in browser console

### Authentication issues

1. Verify JWT tokens are valid in localStorage (`nevis_access_token`)
2. Check that user authentication is working properly
3. Ensure user IDs match between auth system and database

## Migration

If you have existing posts in localStorage, they will:

1. Continue to display normally
2. Be combined with database posts
3. Gradually be migrated to database as you generate new content
4. Be deduplicated to avoid showing twice

The migration is seamless and automatic - no user action required.

## Technical Details

### Database Schema

```sql
-- Posts are stored with full content and metadata
generated_posts (
  id: UUID (primary key)
  user_id: TEXT (from custom auth)
  brand_profile_id: UUID (foreign key) 
  content: TEXT (post caption)
  hashtags: TEXT (space-separated hashtags)
  image_url: TEXT (permanent Supabase Storage URL)
  platform: TEXT (instagram, facebook, etc.)
  variants: JSONB (multi-platform variations)
  status: TEXT (generated, edited, posted)
  created_at: TIMESTAMP
  -- ... additional metadata fields
)
```

### Authentication Compatibility

The system is compatible with the existing custom JWT authentication:

- Uses TEXT user_id field (not UUID) for compatibility
- RLS is disabled in favor of API-level authorization
- JWT tokens are verified on each API request
- User isolation is enforced at the application level

## Next Steps

With persistent storage implemented, you can now:

1. **Generate posts without worry** - They'll always be there when you come back
2. **Access from multiple devices** - Login anywhere to see your content  
3. **Build upon saved content** - Edit, reuse, and iterate on previous posts
4. **Track your content history** - See all posts you've ever generated
5. **Organize by brands** - Keep different brand content separate

The foundation is now in place for advanced features like content analytics, scheduling, and collaborative editing.