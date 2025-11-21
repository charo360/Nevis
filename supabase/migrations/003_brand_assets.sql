-- Brand Assets Library Migration
-- Stores logos, product images, and other visual assets extracted from e-commerce sites

-- Create asset_type enum
DO $$ BEGIN
    CREATE TYPE asset_type AS ENUM (
        'logo',
        'product_image',
        'hero_image',
        'banner',
        'icon',
        'favicon',
        'color_palette',
        'font',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create asset_source enum
DO $$ BEGIN
    CREATE TYPE asset_source AS ENUM (
        'ecommerce_scraper',
        'website_analysis',
        'manual_upload',
        'ai_generated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create brand_assets table
CREATE TABLE IF NOT EXISTS brand_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
    
    -- Asset identification
    name VARCHAR(500) NOT NULL,
    type asset_type NOT NULL,
    source asset_source NOT NULL DEFAULT 'manual_upload',
    
    -- File storage
    file_url TEXT NOT NULL, -- Supabase storage URL
    file_path TEXT NOT NULL, -- Storage path
    thumbnail_url TEXT, -- Thumbnail for images
    thumbnail_path TEXT, -- Thumbnail storage path
    
    -- File metadata
    file_size INTEGER, -- Size in bytes
    mime_type VARCHAR(100),
    width INTEGER, -- For images
    height INTEGER, -- For images
    
    -- Asset metadata
    metadata JSONB DEFAULT '{}', -- Additional metadata (alt text, product info, etc.)
    tags TEXT[] DEFAULT '{}', -- Searchable tags
    
    -- Organization
    is_default BOOLEAN DEFAULT false, -- Is this the default asset of its type?
    is_active BOOLEAN DEFAULT true, -- Is this asset active/visible?
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0, -- How many times this asset has been used
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS brand_assets_user_id_idx ON brand_assets(user_id);
CREATE INDEX IF NOT EXISTS brand_assets_brand_profile_id_idx ON brand_assets(brand_profile_id);
CREATE INDEX IF NOT EXISTS brand_assets_type_idx ON brand_assets(type);
CREATE INDEX IF NOT EXISTS brand_assets_source_idx ON brand_assets(source);
CREATE INDEX IF NOT EXISTS brand_assets_is_active_idx ON brand_assets(is_active);
CREATE INDEX IF NOT EXISTS brand_assets_is_default_idx ON brand_assets(is_default);
CREATE INDEX IF NOT EXISTS brand_assets_created_at_idx ON brand_assets(created_at);
CREATE INDEX IF NOT EXISTS brand_assets_tags_idx ON brand_assets USING GIN(tags);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brand_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS brand_assets_updated_at_trigger ON brand_assets;
CREATE TRIGGER brand_assets_updated_at_trigger
    BEFORE UPDATE ON brand_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_brand_assets_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own assets
CREATE POLICY "Users can view their own brand assets"
    ON brand_assets FOR SELECT
    USING (user_id = current_setting('app.current_user_id', TRUE));

-- Policy: Users can insert their own assets
CREATE POLICY "Users can insert their own brand assets"
    ON brand_assets FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', TRUE));

-- Policy: Users can update their own assets
CREATE POLICY "Users can update their own brand assets"
    ON brand_assets FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', TRUE));

-- Policy: Users can delete their own assets
CREATE POLICY "Users can delete their own brand assets"
    ON brand_assets FOR DELETE
    USING (user_id = current_setting('app.current_user_id', TRUE));

-- Create storage bucket for brand assets (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'brand-assets',
    'brand-assets',
    true,
    52428800, -- 50MB
    ARRAY['image/*', 'application/pdf', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for brand-assets bucket
DO $$ BEGIN
    CREATE POLICY "Users can upload brand assets"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'brand-assets');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Anyone can view brand assets"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'brand-assets');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their brand assets"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'brand-assets');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their brand assets"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'brand-assets');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add comment to table
COMMENT ON TABLE brand_assets IS 'Stores brand assets including logos, product images, and other visual assets extracted from e-commerce sites or uploaded manually';
COMMENT ON COLUMN brand_assets.source IS 'Where the asset came from: ecommerce_scraper, website_analysis, manual_upload, or ai_generated';
COMMENT ON COLUMN brand_assets.metadata IS 'Additional metadata like alt text, product info, original URL, etc.';
COMMENT ON COLUMN brand_assets.usage_count IS 'Tracks how many times this asset has been used in content generation';

-- Function to increment asset usage count
CREATE OR REPLACE FUNCTION increment_asset_usage(asset_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE brand_assets
    SET
        usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
