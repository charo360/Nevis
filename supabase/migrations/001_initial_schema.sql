-- Supabase Migration: Replace MongoDB with PostgreSQL
-- This creates all necessary tables to replace MongoDB collections

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_theme AS ENUM ('light', 'dark', 'system');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'power');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
CREATE TYPE post_platform AS ENUM ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok');
CREATE TYPE post_type AS ENUM ('post', 'story', 'reel', 'advertisement');
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE artifact_type AS ENUM ('image', 'video', 'document', 'text');
CREATE TYPE artifact_category AS ENUM ('exact-use', 'reference');
CREATE TYPE artifact_usage_type AS ENUM ('exact', 'reference');
CREATE TYPE artifact_upload_type AS ENUM ('file', 'text', 'url');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE calendar_status AS ENUM ('planned', 'in-progress', 'completed', 'cancelled');

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL, -- External auth user ID (Supabase Auth)
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    
    -- Preferences (JSON fields)
    theme user_theme DEFAULT 'system',
    notifications BOOLEAN DEFAULT true,
    auto_save BOOLEAN DEFAULT true,
    
    -- Subscription info
    subscription_plan subscription_plan DEFAULT 'free',
    subscription_status subscription_status DEFAULT 'active',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand profiles table
CREATE TABLE brand_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Location (JSON field)
    location JSONB,
    
    -- Contact info (JSON field)
    contact JSONB,
    
    -- Social media (JSON field)
    social_media JSONB,
    
    -- Brand colors (JSON field)
    brand_colors JSONB,
    
    -- Logo URLs
    logo_url TEXT, -- Supabase storage URL
    logo_data_url TEXT, -- Base64 fallback
    
    -- Design examples
    design_examples TEXT[],
    
    target_audience TEXT,
    brand_voice TEXT,
    
    -- Services (JSON array)
    services JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated posts table
CREATE TABLE generated_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    platform post_platform NOT NULL,
    post_type post_type NOT NULL,
    
    -- Post content (JSON field)
    content JSONB NOT NULL,
    
    -- Platform variants (JSON array)
    variants JSONB DEFAULT '[]',
    
    -- Legacy fields for backward compatibility
    image_url TEXT,
    catchy_words TEXT,
    subheadline TEXT,
    call_to_action TEXT,
    
    -- Metadata (JSON field)
    metadata JSONB DEFAULT '{}',
    
    -- Analytics (JSON field)
    analytics JSONB DEFAULT '{}',
    
    status post_status DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artifacts table (for Creative Studio assets)
CREATE TABLE artifacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type artifact_type NOT NULL,
    category artifact_category NOT NULL,
    usage_type artifact_usage_type NOT NULL,
    upload_type artifact_upload_type NOT NULL,
    folder_id UUID, -- Self-referencing for folder structure
    is_active BOOLEAN DEFAULT true,
    instructions TEXT,
    
    -- Text overlay (JSON field)
    text_overlay JSONB,
    
    -- File paths and URLs
    file_path TEXT,
    thumbnail_path TEXT,
    file_url TEXT,
    thumbnail_url TEXT,
    
    -- File metadata (JSON field)
    metadata JSONB DEFAULT '{}',
    
    -- Tags array
    tags TEXT[] DEFAULT '{}',
    
    -- Usage tracking (JSON field)
    usage JSONB DEFAULT '{"usage_count": 0, "used_in_contexts": []}',
    
    -- Discount info (JSON field)
    discount_info JSONB DEFAULT '{"has_discount": false}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Design analytics table
CREATE TABLE design_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    design_id VARCHAR(255) NOT NULL,
    business_type VARCHAR(255) NOT NULL,
    platform VARCHAR(255) NOT NULL,
    visual_style VARCHAR(255) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Metrics (JSON field)
    metrics JSONB NOT NULL,
    
    -- Design elements (JSON field)
    design_elements JSONB NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content calendar table
CREATE TABLE content_calendar (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Services (JSON array)
    services JSONB DEFAULT '[]',
    
    -- Generated post IDs (array)
    generated_post_ids UUID[] DEFAULT '{}',
    
    notes TEXT,
    status calendar_status DEFAULT 'planned',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);
CREATE INDEX idx_brand_profiles_is_active ON brand_profiles(is_active);
CREATE INDEX idx_brand_profiles_business_name ON brand_profiles(business_name);

CREATE INDEX idx_generated_posts_user_id ON generated_posts(user_id);
CREATE INDEX idx_generated_posts_brand_profile_id ON generated_posts(brand_profile_id);
CREATE INDEX idx_generated_posts_platform ON generated_posts(platform);
CREATE INDEX idx_generated_posts_status ON generated_posts(status);
CREATE INDEX idx_generated_posts_created_at ON generated_posts(created_at);

CREATE INDEX idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX idx_artifacts_type ON artifacts(type);
CREATE INDEX idx_artifacts_category ON artifacts(category);
CREATE INDEX idx_artifacts_is_active ON artifacts(is_active);

CREATE INDEX idx_design_analytics_user_id ON design_analytics(user_id);
CREATE INDEX idx_design_analytics_design_id ON design_analytics(design_id);
CREATE INDEX idx_design_analytics_generated_at ON design_analytics(generated_at);

CREATE INDEX idx_content_calendar_user_id ON content_calendar(user_id);
CREATE INDEX idx_content_calendar_brand_profile_id ON content_calendar(brand_profile_id);
CREATE INDEX idx_content_calendar_date ON content_calendar(date);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON brand_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_posts_updated_at BEFORE UPDATE ON generated_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_design_analytics_updated_at BEFORE UPDATE ON design_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_calendar_updated_at BEFORE UPDATE ON content_calendar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view their own data" ON users
    FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own brand profiles" ON brand_profiles
    FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own generated posts" ON generated_posts
    FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own artifacts" ON artifacts
    FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own design analytics" ON design_analytics
    FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own content calendar" ON content_calendar
    FOR ALL USING (user_id = auth.uid()::text);