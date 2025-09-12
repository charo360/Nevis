-- Create missing tables for Nevis AI
-- Run this in your Supabase SQL Editor

-- Brand profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(255),
  location VARCHAR(255),
  website_url TEXT,
  description TEXT,
  target_audience TEXT,
  services TEXT,
  
  -- Logo and branding
  logo_url TEXT,
  logo_data JSONB,
  brand_colors JSONB,
  
  -- Contact information
  contact_info JSONB,
  
  -- Social media
  social_handles JSONB,
  
  -- AI analysis data
  website_analysis JSONB,
  brand_voice JSONB,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated posts table
CREATE TABLE IF NOT EXISTS generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  hashtags TEXT,
  image_text TEXT,
  
  -- Image data (this will fix the broken images!)
  image_url TEXT,
  image_path TEXT,
  image_metadata JSONB,
  
  -- Generation metadata
  platform VARCHAR(50),
  aspect_ratio VARCHAR(20),
  generation_model VARCHAR(100),
  generation_prompt TEXT,
  generation_settings JSONB,
  
  -- Status and metrics
  status VARCHAR(50) DEFAULT 'generated',
  engagement_metrics JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Social connections table (for future Make.com integration)
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  
  platform VARCHAR(50) NOT NULL,
  platform_user_id VARCHAR(255),
  username VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Connection metadata
  connection_data JSONB,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, brand_profile_id, platform)
);

-- Artifacts table (for design assets)
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  
  -- File data
  file_url TEXT,
  file_path TEXT,
  file_metadata JSONB,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_active ON brand_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_generated_posts_user_id ON generated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_brand_id ON generated_posts(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_created_at ON generated_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_connections_user_brand ON social_connections(user_id, brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_user_brand ON artifacts(user_id, brand_profile_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_brand_profiles_updated_at ON brand_profiles;
DROP TRIGGER IF EXISTS update_generated_posts_updated_at ON generated_posts;
DROP TRIGGER IF EXISTS update_social_connections_updated_at ON social_connections;
DROP TRIGGER IF EXISTS update_artifacts_updated_at ON artifacts;

-- Create new triggers
CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON brand_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_posts_updated_at BEFORE UPDATE ON generated_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_connections_updated_at BEFORE UPDATE ON social_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
