-- Complete Supabase setup for Nevis AI
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(255),
  location VARCHAR(255),
  description TEXT,
  logo_url TEXT,
  brand_colors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated posts table
CREATE TABLE IF NOT EXISTS generated_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hashtags TEXT,
  image_text TEXT,
  image_url TEXT,
  image_path TEXT,
  image_metadata JSONB,
  platform VARCHAR(50),
  aspect_ratio VARCHAR(20),
  generation_model VARCHAR(100),
  generation_prompt TEXT,
  generation_settings JSONB,
  status VARCHAR(50) DEFAULT 'generated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social connections table (for future use)
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_user_id VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  usage_type VARCHAR(50) NOT NULL,
  upload_type VARCHAR(50) NOT NULL,
  folder_id UUID,
  is_active BOOLEAN DEFAULT true,
  instructions TEXT,
  text_overlay JSONB,
  file_url TEXT,
  file_path TEXT,
  file_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_user_id ON generated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_brand_profile_id ON generated_posts(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_created_at ON generated_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON artifacts(user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_profiles_updated_at ON brand_profiles;
CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON brand_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_generated_posts_updated_at ON generated_posts;
CREATE TRIGGER update_generated_posts_updated_at BEFORE UPDATE ON generated_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_connections_updated_at ON social_connections;
CREATE TRIGGER update_social_connections_updated_at BEFORE UPDATE ON social_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_artifacts_updated_at ON artifacts;
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own brand profiles" ON brand_profiles FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own brand profiles" ON brand_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own brand profiles" ON brand_profiles FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own brand profiles" ON brand_profiles FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own posts" ON generated_posts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own posts" ON generated_posts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own posts" ON generated_posts FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own posts" ON generated_posts FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own connections" ON social_connections FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own connections" ON social_connections FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own connections" ON social_connections FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own connections" ON social_connections FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own artifacts" ON artifacts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own artifacts" ON artifacts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own artifacts" ON artifacts FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own artifacts" ON artifacts FOR DELETE USING (auth.uid()::text = user_id::text);
