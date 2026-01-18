-- Social Media Integration Tables
-- Run this migration after 001_mixpost_tables.sql

-- OAuth state storage for CSRF protection
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT UNIQUE NOT NULL,
  brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for quick state lookups
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- Cleanup expired states automatically (run periodically)
-- DELETE FROM oauth_states WHERE expires_at < NOW();

-- Social tokens storage (encrypted in production)
CREATE TABLE IF NOT EXISTS social_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_id TEXT NOT NULL,
  access_token TEXT NOT NULL, -- Encrypt in production!
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT DEFAULT 'bearer',
  scope TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint per brand/platform/account
  UNIQUE(brand_profile_id, platform, account_id)
);

-- Indexes for token lookups
CREATE INDEX IF NOT EXISTS idx_social_tokens_brand ON social_tokens(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_social_tokens_platform ON social_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_social_tokens_expires ON social_tokens(expires_at);

-- Add connected_accounts column to brand_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brand_profiles' AND column_name = 'connected_accounts'
  ) THEN
    ALTER TABLE brand_profiles ADD COLUMN connected_accounts JSONB DEFAULT '[]';
  END IF;
END $$;

-- Published posts tracking (for analytics sync)
CREATE TABLE IF NOT EXISTS published_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  content_id UUID, -- Reference to original generated content
  caption TEXT,
  image_url TEXT,
  permalink TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  analytics JSONB DEFAULT '{}',
  last_analytics_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per platform post
  UNIQUE(platform, platform_post_id)
);

-- Indexes for published posts
CREATE INDEX IF NOT EXISTS idx_published_posts_brand ON published_posts(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_published_posts_platform ON published_posts(platform);
CREATE INDEX IF NOT EXISTS idx_published_posts_date ON published_posts(published_at);

-- RLS Policies
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_posts ENABLE ROW LEVEL SECURITY;

-- Service role can access all
CREATE POLICY "Service role access oauth_states" ON oauth_states
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access social_tokens" ON social_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access published_posts" ON published_posts
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_social_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_tokens_updated_at
  BEFORE UPDATE ON social_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_social_tokens_updated_at();
