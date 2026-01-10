-- Create creative_assets table for persistent image/file storage
CREATE TABLE IF NOT EXISTS creative_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_profile_id TEXT,
  
  -- Asset details
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'product', 'background', 'template', 'other')),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  description TEXT,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  width INTEGER,
  height INTEGER,
  thumbnail_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_creative_assets_user_id ON creative_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_brand_profile_id ON creative_assets(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_creative_assets_asset_type ON creative_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_creative_assets_created_at ON creative_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_assets_usage_count ON creative_assets(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_creative_assets_tags ON creative_assets USING GIN(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_creative_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creative_assets_updated_at
  BEFORE UPDATE ON creative_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_creative_assets_updated_at();

-- Enable Row Level Security
ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own assets"
  ON creative_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets"
  ON creative_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
  ON creative_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON creative_assets FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE creative_assets IS 'Stores user-uploaded creative assets (images, files) for reuse in Creative Studio';
