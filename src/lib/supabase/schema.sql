-- Supabase database schema for Nevis application

-- Create brand_profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Use TEXT for compatibility with custom auth system
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
  documents JSONB, -- Array of uploaded business documents with metadata and extracted data
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_posts table
CREATE TABLE IF NOT EXISTS generated_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Use TEXT for compatibility with custom auth system
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

-- Legacy posts table for compatibility (can be removed later)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Use TEXT for compatibility with custom auth system
  brand_id UUID,
  platform TEXT NOT NULL DEFAULT 'instagram',
  content JSONB NOT NULL DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create images table for tracking uploaded images
CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
-- Brand profiles indexes
CREATE INDEX IF NOT EXISTS brand_profiles_user_id_idx ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS brand_profiles_business_name_idx ON brand_profiles(business_name);
CREATE INDEX IF NOT EXISTS brand_profiles_is_active_idx ON brand_profiles(is_active);
CREATE INDEX IF NOT EXISTS brand_profiles_created_at_idx ON brand_profiles(created_at);

-- Generated posts indexes
CREATE INDEX IF NOT EXISTS generated_posts_user_id_idx ON generated_posts(user_id);
CREATE INDEX IF NOT EXISTS generated_posts_brand_profile_id_idx ON generated_posts(brand_profile_id);
CREATE INDEX IF NOT EXISTS generated_posts_platform_idx ON generated_posts(platform);
CREATE INDEX IF NOT EXISTS generated_posts_status_idx ON generated_posts(status);
CREATE INDEX IF NOT EXISTS generated_posts_created_at_idx ON generated_posts(created_at);

-- Legacy posts indexes
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_brand_id_idx ON posts(brand_id);
CREATE INDEX IF NOT EXISTS posts_platform_idx ON posts(platform);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at);
CREATE INDEX IF NOT EXISTS images_user_id_idx ON images(user_id);

-- Row Level Security (RLS) - Disabled for custom auth compatibility
-- When using custom auth instead of Supabase auth, we disable RLS and handle
-- authorization at the API level using JWT tokens
-- ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create policies for brand_profiles table (disabled RLS for custom auth compatibility)
-- These policies would work with Supabase auth, but we're using custom auth
-- CREATE POLICY IF NOT EXISTS "Users can view their own brand profiles" ON brand_profiles
--   FOR SELECT USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY IF NOT EXISTS "Users can insert their own brand profiles" ON brand_profiles
--   FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- 
-- CREATE POLICY IF NOT EXISTS "Users can update their own brand profiles" ON brand_profiles
--   FOR UPDATE USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY IF NOT EXISTS "Users can delete their own brand profiles" ON brand_profiles
--   FOR DELETE USING (auth.uid()::text = user_id);

-- Create policies for generated_posts table (disabled RLS for custom auth compatibility)
-- These policies would work with Supabase auth, but we're using custom auth
-- CREATE POLICY IF NOT EXISTS "Users can view their own generated posts" ON generated_posts
--   FOR SELECT USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY IF NOT EXISTS "Users can insert their own generated posts" ON generated_posts
--   FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- 
-- CREATE POLICY IF NOT EXISTS "Users can update their own generated posts" ON generated_posts
--   FOR UPDATE USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY IF NOT EXISTS "Users can delete their own generated posts" ON generated_posts
--   FOR DELETE USING (auth.uid()::text = user_id);

-- Legacy policies for posts table (disabled RLS for custom auth compatibility)
-- These policies would work with Supabase auth, but we're using custom auth
-- CREATE POLICY IF NOT EXISTS "Users can view their own posts" ON posts
--   FOR SELECT USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY IF NOT EXISTS "Users can insert their own posts" ON posts
--   FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- 
-- CREATE POLICY IF NOT EXISTS "Users can update their own posts" ON posts
--   FOR UPDATE USING (auth.uid()::text = user_id);
-- 
-- CREATE POLICY IF NOT EXISTS "Users can delete their own posts" ON posts
--   FOR DELETE USING (auth.uid()::text = user_id);

-- Create policies for images table
CREATE POLICY IF NOT EXISTS "Users can view their own images" ON images
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own images" ON images
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create storage bucket for images and generated content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('nevis-storage', 'nevis-storage', true, 10485760, ARRAY['image/*', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Legacy bucket for compatibility
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for nevis-storage bucket
CREATE POLICY IF NOT EXISTS "Users can upload to nevis-storage" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'nevis-storage');

CREATE POLICY IF NOT EXISTS "Anyone can view nevis-storage images" ON storage.objects
  FOR SELECT USING (bucket_id = 'nevis-storage');

CREATE POLICY IF NOT EXISTS "Users can delete their own nevis-storage files" ON storage.objects
  FOR DELETE USING (bucket_id = 'nevis-storage');

-- Legacy storage policies for images bucket
CREATE POLICY IF NOT EXISTS "Users can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can view their own images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Public images are viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');
