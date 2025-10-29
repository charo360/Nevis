-- Social Media Connections Table
-- This table stores user social media account connections with proper user references

-- Create social_connections table
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  social_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one connection per user per platform
  UNIQUE(user_id, platform)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);
CREATE INDEX IF NOT EXISTS idx_social_connections_user_platform ON social_connections(user_id, platform);

-- Enable Row Level Security (RLS)
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own connections
CREATE POLICY "Users can manage their own social connections" ON social_connections
  FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_social_connections_updated_at ON social_connections;

-- Create trigger to automatically update updated_at on every update
CREATE TRIGGER update_social_connections_updated_at 
  BEFORE UPDATE ON social_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE social_connections IS 'Stores user social media account connections';
COMMENT ON COLUMN social_connections.user_id IS 'References auth.users(id) - the user who owns this connection';
COMMENT ON COLUMN social_connections.platform IS 'Social media platform (twitter, facebook, instagram, linkedin)';
COMMENT ON COLUMN social_connections.social_id IS 'User ID on the social media platform';
COMMENT ON COLUMN social_connections.access_token IS 'OAuth access token for API calls';
COMMENT ON COLUMN social_connections.refresh_token IS 'OAuth refresh token for renewing access';
COMMENT ON COLUMN social_connections.profile_data IS 'User profile data from the social platform (JSON)';
