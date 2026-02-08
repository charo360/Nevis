-- Create social_connections table for storing OAuth connections
CREATE TABLE IF NOT EXISTS social_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    platform TEXT NOT NULL,
    social_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one connection per platform per user
    UNIQUE(user_id, platform)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);

-- Enable Row Level Security
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access only their own connections
CREATE POLICY "Users can access own connections" ON social_connections
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON social_connections TO authenticated;
GRANT ALL ON social_connections TO anon;
