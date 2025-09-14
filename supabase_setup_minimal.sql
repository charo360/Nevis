-- Minimal Supabase Setup for Nevis AI - Persistent Post Storage
-- This focuses on just the essential database tables
-- Run this first, then set up storage policies separately if needed

-- Create brand_profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
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
  user_id TEXT NOT NULL,
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
  variants JSONB,
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

-- Success message
SELECT 'Essential tables created successfully! Posts can now be saved persistently.' as setup_status;

-- Next steps:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create a bucket called 'nevis-storage'
-- 3. Set it to public
-- 4. Add storage policies manually if needed