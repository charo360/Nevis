-- Mixpost Integration Database Schema
-- Run this migration in Supabase SQL Editor

-- ============================================================================
-- 1. Add Mixpost columns to brand_profiles table
-- ============================================================================

ALTER TABLE brand_profiles 
ADD COLUMN IF NOT EXISTS mixpost_workspace_id TEXT,
ADD COLUMN IF NOT EXISTS mixpost_connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS connected_accounts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS posting_schedule JSONB DEFAULT '{
  "timezone": "Africa/Nairobi",
  "preferredDays": [1, 2, 3, 4, 5, 6],
  "preferredHours": [9, 12, 17, 19],
  "maxPostsPerDay": 2,
  "minHoursBetweenPosts": 4
}'::jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_profiles_mixpost_workspace 
ON brand_profiles(mixpost_workspace_id) 
WHERE mixpost_workspace_id IS NOT NULL;

-- ============================================================================
-- 2. Create scheduled_posts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  workspace_id TEXT NOT NULL,
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  mixpost_post_id TEXT,
  
  -- Content
  content TEXT NOT NULL,
  headline TEXT,
  subheadline TEXT,
  image_url TEXT,
  hashtags TEXT[],
  
  -- Scheduling
  platform TEXT NOT NULL DEFAULT 'instagram',
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  error_message TEXT,
  failed_at TIMESTAMPTZ,
  
  -- Mixpost response data
  mixpost_response JSONB,
  
  -- Analytics
  analytics JSONB,
  analytics_updated_at TIMESTAMPTZ,
  
  -- Metadata
  content_type TEXT, -- e.g., 'promotional', 'educational', 'engagement'
  marketing_angle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_workspace ON scheduled_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_brand ON scheduled_posts(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_mixpost_id ON scheduled_posts(mixpost_post_id);

-- ============================================================================
-- 3. Create trend_research table (for Research Layer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trend_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope
  industry TEXT NOT NULL,
  location TEXT,
  platform TEXT DEFAULT 'instagram',
  
  -- Research data
  trends JSONB NOT NULL DEFAULT '[]'::jsonb,
  hashtags JSONB DEFAULT '[]'::jsonb,
  competitor_insights JSONB DEFAULT '{}'::jsonb,
  seasonal_events JSONB DEFAULT '[]'::jsonb,
  
  -- Validity
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Metadata
  source TEXT DEFAULT 'web_search',
  confidence_score FLOAT DEFAULT 0.7
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trend_research_industry ON trend_research(industry);
CREATE INDEX IF NOT EXISTS idx_trend_research_expires ON trend_research(expires_at);

-- Unique constraint to prevent duplicate research
CREATE UNIQUE INDEX IF NOT EXISTS idx_trend_research_unique 
ON trend_research(industry, COALESCE(location, ''), platform);

-- ============================================================================
-- 4. Create user_edits table (for Learning Layer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  user_id UUID,
  
  -- Edit details
  original_content JSONB NOT NULL,
  edited_content JSONB NOT NULL,
  edit_type TEXT NOT NULL CHECK (edit_type IN ('headline', 'caption', 'hashtags', 'full', 'image')),
  
  -- Analysis
  changes_summary TEXT,
  patterns_detected JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_edits_brand ON user_edits(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_edits_type ON user_edits(edit_type);

-- ============================================================================
-- 5. Create performance_insights table (for Learning Layer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope
  workspace_id TEXT NOT NULL UNIQUE,
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  
  -- Patterns
  successful_patterns JSONB DEFAULT '[]'::jsonb,
  underperforming_patterns JSONB DEFAULT '[]'::jsonb,
  
  -- Learned preferences
  preferred_posting_times JSONB DEFAULT '[]'::jsonb,
  preferred_content_types JSONB DEFAULT '[]'::jsonb,
  preferred_hashtags JSONB DEFAULT '[]'::jsonb,
  
  -- Statistics
  total_posts_analyzed INTEGER DEFAULT 0,
  average_engagement_rate FLOAT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_performance_insights_brand ON performance_insights(brand_profile_id);

-- ============================================================================
-- 6. Create content_pillars table (for Planning Layer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  
  -- Pillar definition
  name TEXT NOT NULL,
  description TEXT,
  percentage INTEGER DEFAULT 20 CHECK (percentage >= 0 AND percentage <= 100),
  
  -- Content guidance
  example_topics JSONB DEFAULT '[]'::jsonb,
  tone_guidelines TEXT,
  visual_style TEXT,
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_pillars_brand ON content_pillars(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_content_pillars_active ON content_pillars(brand_profile_id, is_active);

-- ============================================================================
-- 7. Create content_calendar table (for Planning Layer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  content_pillar_id UUID REFERENCES content_pillars(id) ON DELETE SET NULL,
  scheduled_post_id UUID REFERENCES scheduled_posts(id) ON DELETE SET NULL,
  
  -- Calendar slot
  planned_date DATE NOT NULL,
  planned_time TIME,
  platform TEXT NOT NULL DEFAULT 'instagram',
  
  -- Content plan
  content_type TEXT, -- 'promotional', 'educational', 'engagement', 'behind-the-scenes'
  marketing_angle TEXT,
  topic_suggestion TEXT,
  
  -- Status
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'content_generated', 'scheduled', 'published', 'skipped')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_calendar_brand ON content_calendar(brand_profile_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(planned_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);

-- ============================================================================
-- 8. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- Policies for scheduled_posts
CREATE POLICY "Users can view their own scheduled posts" ON scheduled_posts
  FOR SELECT USING (
    brand_profile_id IN (
      SELECT id FROM brand_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own scheduled posts" ON scheduled_posts
  FOR INSERT WITH CHECK (
    brand_profile_id IN (
      SELECT id FROM brand_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own scheduled posts" ON scheduled_posts
  FOR UPDATE USING (
    brand_profile_id IN (
      SELECT id FROM brand_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own scheduled posts" ON scheduled_posts
  FOR DELETE USING (
    brand_profile_id IN (
      SELECT id FROM brand_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies for trend_research (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view trend research" ON trend_research
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for user_edits
CREATE POLICY "Users can view their own edits" ON user_edits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own edits" ON user_edits
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies for performance_insights
CREATE POLICY "Users can view their own insights" ON performance_insights
  FOR SELECT USING (
    brand_profile_id IN (
      SELECT id FROM brand_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies for content_pillars
CREATE POLICY "Users can manage their own content pillars" ON content_pillars
  FOR ALL USING (
    brand_profile_id IN (
      SELECT id FROM brand_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies for content_calendar
CREATE POLICY "Users can manage their own content calendar" ON content_calendar
  FOR ALL USING (
    brand_profile_id IN (
      SELECT id FROM brand_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. Triggers for updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_insights_updated_at
  BEFORE UPDATE ON performance_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pillars_updated_at
  BEFORE UPDATE ON content_pillars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_calendar_updated_at
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. Service role bypass for API routes
-- ============================================================================

-- Allow service role to bypass RLS (for API routes using service key)
CREATE POLICY "Service role has full access to scheduled_posts" ON scheduled_posts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to trend_research" ON trend_research
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to user_edits" ON user_edits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to performance_insights" ON performance_insights
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to content_pillars" ON content_pillars
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to content_calendar" ON content_calendar
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
