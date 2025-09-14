-- Supabase Setup for Nevis AI - Persistent Post Storage
-- Run this SQL in your Supabase SQL Editor to enable persistent post storage

-- Create brand_profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Compatible with custom auth system
  business_name TEXT NOT NULL,
  business_type TEXT,
  location TEXT,
  website_url TEXT,
  description TEXT,
  target_audience TEXT,
  services TEXT,
  logo_url TEXT,
  logo_data JSONB,
  brand_colors JSONB,
  contact_info JSONB,
  social_handles JSONB,
  website_analysis JSONB,
  brand_voice JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_posts table (this is where posts will be stored persistently)
CREATE TABLE IF NOT EXISTS generated_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Compatible with custom auth system
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hashtags TEXT,
  image_text TEXT,
  image_url TEXT,
  image_path TEXT,
  image_metadata JSONB,
  platform TEXT DEFAULT 'instagram',
  aspect_ratio TEXT,
  generation_model TEXT,
  generation_prompt TEXT,
  generation_settings JSONB,
  variants JSONB, -- For multi-platform posts
  catchy_words TEXT,
  subheadline TEXT,
  call_to_action TEXT,
  video_url TEXT,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'edited', 'posted', 'archived')),
  engagement_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS brand_profiles_user_id_idx ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS brand_profiles_business_name_idx ON brand_profiles(business_name);
CREATE INDEX IF NOT EXISTS brand_profiles_is_active_idx ON brand_profiles(is_active);
CREATE INDEX IF NOT EXISTS brand_profiles_created_at_idx ON brand_profiles(created_at);

CREATE INDEX IF NOT EXISTS generated_posts_user_id_idx ON generated_posts(user_id);
CREATE INDEX IF NOT EXISTS generated_posts_brand_profile_id_idx ON generated_posts(brand_profile_id);
CREATE INDEX IF NOT EXISTS generated_posts_platform_idx ON generated_posts(platform);
CREATE INDEX IF NOT EXISTS generated_posts_status_idx ON generated_posts(status);
CREATE INDEX IF NOT EXISTS generated_posts_created_at_idx ON generated_posts(created_at);

-- Create storage bucket for images and generated content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('nevis-storage', 'nevis-storage', true, 10485760, ARRAY['image/*', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Create permissive storage policies (for development - restrict in production)
-- Note: Run these manually if they fail due to existing policies

-- Drop existing policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Allow all uploads to nevis-storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from nevis-storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from nevis-storage" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow all uploads to nevis-storage" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'nevis-storage');

CREATE POLICY "Allow all reads from nevis-storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'nevis-storage');

CREATE POLICY "Allow all deletes from nevis-storage" ON storage.objects
    FOR DELETE USING (bucket_id = 'nevis-storage');

-- Note: RLS is disabled on tables for custom auth compatibility
-- Authorization is handled at the API level using JWT tokens

-- Test the setup by creating a sample brand profile (replace 'your-user-id' with your actual user ID)
-- INSERT INTO brand_profiles (user_id, business_name, business_type, location, description) 
-- VALUES ('your-user-id', 'Test Brand', 'Technology', 'San Francisco, CA', 'A test brand for development');

-- Success message
SELECT 'Supabase setup completed successfully! You can now save and load posts persistently.' as setup_status;