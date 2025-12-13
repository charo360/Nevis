-- Knowledge Base Schema for LlamaIndex Integration
-- Stores: Past Posts, Brand Guidelines, Cultural Context, Competitor Analysis

-- ============================================
-- 1. PAST POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base_posts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  headline TEXT NOT NULL,
  caption TEXT NOT NULL,
  selling_angle TEXT,
  emotional_tone TEXT,
  target_audience TEXT,
  performance_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for fast queries
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_business_id ON knowledge_base_posts(business_id);
CREATE INDEX idx_posts_created_at ON knowledge_base_posts(created_at DESC);
CREATE INDEX idx_posts_platform ON knowledge_base_posts(platform);
CREATE INDEX idx_posts_selling_angle ON knowledge_base_posts(selling_angle);

-- ============================================
-- 2. BRAND GUIDELINES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base_guidelines (
  business_id TEXT PRIMARY KEY,
  brand_voice TEXT NOT NULL,
  prohibited_words TEXT[] DEFAULT '{}',
  preferred_phrases TEXT[] DEFAULT '{}',
  color_palette TEXT[] DEFAULT '{}',
  logo_usage_rules TEXT,
  target_audience TEXT,
  competitive_advantages TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_business_guidelines FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_guidelines_business_id ON knowledge_base_guidelines(business_id);

-- ============================================
-- 3. CULTURAL CONTEXT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base_cultural (
  country TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  local_phrases JSONB DEFAULT '[]',
  cultural_norms TEXT[] DEFAULT '{}',
  avoid_topics TEXT[] DEFAULT '{}',
  preferred_imagery TEXT[] DEFAULT '{}',
  business_etiquette TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cultural_country ON knowledge_base_cultural(country);
CREATE INDEX idx_cultural_language ON knowledge_base_cultural(language);

-- ============================================
-- 4. COMPETITOR ANALYSIS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  content_approaches TEXT[] DEFAULT '{}',
  differentiation_opportunities TEXT[] DEFAULT '{}',
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_business_competitors FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_competitors_business_id ON knowledge_base_competitors(business_id);
CREATE INDEX idx_competitors_analyzed_at ON knowledge_base_competitors(analyzed_at DESC);

-- ============================================
-- 5. SEED CULTURAL CONTEXT DATA
-- ============================================

-- Kenya
INSERT INTO knowledge_base_cultural (country, language, local_phrases, cultural_norms, avoid_topics, preferred_imagery, business_etiquette)
VALUES (
  'Kenya',
  'Swahili',
  '[
    {"phrase": "Karibu", "meaning": "Welcome", "usage": "Greetings, invitations"},
    {"phrase": "Haraka", "meaning": "Fast/Quick", "usage": "Speed emphasis"},
    {"phrase": "Pesa", "meaning": "Money", "usage": "Financial context"},
    {"phrase": "Hakuna matata", "meaning": "No worries", "usage": "Reassurance"},
    {"phrase": "Twende", "meaning": "Let''s go", "usage": "Call to action"}
  ]'::jsonb,
  ARRAY['Respect for elders', 'Community-focused', 'Mobile-first culture', 'Entrepreneurial spirit'],
  ARRAY['Political topics', 'Tribal divisions'],
  ARRAY['Local markets (Gikomba, Eastleigh)', 'Matatu culture', 'Mobile money (M-Pesa)', 'Nairobi CBD'],
  ARRAY['Greet before business', 'Build relationships first', 'Respect hierarchy', 'Time flexibility expected'],
  NOW()
) ON CONFLICT (country) DO UPDATE SET
  local_phrases = EXCLUDED.local_phrases,
  cultural_norms = EXCLUDED.cultural_norms,
  updated_at = NOW();

-- Nigeria
INSERT INTO knowledge_base_cultural (country, language, local_phrases, cultural_norms, avoid_topics, preferred_imagery, business_etiquette)
VALUES (
  'Nigeria',
  'Pidgin English',
  '[
    {"phrase": "How far", "meaning": "How are you", "usage": "Casual greeting"},
    {"phrase": "No wahala", "meaning": "No problem", "usage": "Reassurance"},
    {"phrase": "Sharp sharp", "meaning": "Quickly", "usage": "Speed emphasis"},
    {"phrase": "Make we go", "meaning": "Let''s go", "usage": "Call to action"}
  ]'::jsonb,
  ARRAY['Respect for elders', 'Extended family importance', 'Religious diversity', 'Hustle culture'],
  ARRAY['Religious conflicts', 'Regional tensions'],
  ARRAY['Lagos markets (Victoria Island, Lekki)', 'Danfo buses', 'Mobile banking', 'Street vendors'],
  ARRAY['Titles important (Chief, Alhaji)', 'Relationship building crucial', 'Bargaining expected'],
  NOW()
) ON CONFLICT (country) DO UPDATE SET
  local_phrases = EXCLUDED.local_phrases,
  cultural_norms = EXCLUDED.cultural_norms,
  updated_at = NOW();

-- India
INSERT INTO knowledge_base_cultural (country, language, local_phrases, cultural_norms, avoid_topics, preferred_imagery, business_etiquette)
VALUES (
  'India',
  'Hindi',
  '[
    {"phrase": "Namaste", "meaning": "Hello/Greetings", "usage": "Formal greeting"},
    {"phrase": "Dhanyawad", "meaning": "Thank you", "usage": "Gratitude"},
    {"phrase": "Bahut accha", "meaning": "Very good", "usage": "Approval"},
    {"phrase": "Chalo", "meaning": "Let''s go", "usage": "Call to action"}
  ]'::jsonb,
  ARRAY['Respect for hierarchy', 'Family-oriented', 'Festival celebrations', 'Value for money'],
  ARRAY['Caste system', 'Religious sensitivities'],
  ARRAY['Local markets (Connaught Place, Bandra)', 'Auto rickshaws', 'Street food', 'Festivals'],
  ARRAY['Formal titles important', 'Build trust first', 'Negotiation expected', 'Punctuality varies'],
  NOW()
) ON CONFLICT (country) DO UPDATE SET
  local_phrases = EXCLUDED.local_phrases,
  cultural_norms = EXCLUDED.cultural_norms,
  updated_at = NOW();

-- ============================================
-- 6. FUNCTIONS FOR KNOWLEDGE RETRIEVAL
-- ============================================

-- Get recent posts for a business
CREATE OR REPLACE FUNCTION get_recent_posts(
  p_business_id TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  headline TEXT,
  caption TEXT,
  selling_angle TEXT,
  emotional_tone TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kbp.id,
    kbp.headline,
    kbp.caption,
    kbp.selling_angle,
    kbp.emotional_tone,
    kbp.created_at
  FROM knowledge_base_posts kbp
  WHERE kbp.business_id = p_business_id
  ORDER BY kbp.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get content variety statistics
CREATE OR REPLACE FUNCTION get_content_variety_stats(
  p_business_id TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  selling_angle TEXT,
  count BIGINT,
  percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH total AS (
    SELECT COUNT(*) as total_count
    FROM knowledge_base_posts
    WHERE business_id = p_business_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  )
  SELECT 
    kbp.selling_angle,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / total.total_count), 2) as percentage
  FROM knowledge_base_posts kbp, total
  WHERE kbp.business_id = p_business_id
  AND kbp.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY kbp.selling_angle, total.total_count
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE knowledge_base_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_cultural ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_competitors ENABLE ROW LEVEL SECURITY;

-- Policies for posts
CREATE POLICY "Users can view their own business posts"
  ON knowledge_base_posts FOR SELECT
  USING (business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert posts for their businesses"
  ON knowledge_base_posts FOR INSERT
  WITH CHECK (business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  ));

-- Policies for guidelines
CREATE POLICY "Users can view their own business guidelines"
  ON knowledge_base_guidelines FOR SELECT
  USING (business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their business guidelines"
  ON knowledge_base_guidelines FOR ALL
  USING (business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  ));

-- Cultural context is public (read-only for users)
CREATE POLICY "Anyone can view cultural context"
  ON knowledge_base_cultural FOR SELECT
  TO authenticated
  USING (true);

-- Policies for competitors
CREATE POLICY "Users can view their own competitor analysis"
  ON knowledge_base_competitors FOR SELECT
  USING (business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their competitor analysis"
  ON knowledge_base_competitors FOR ALL
  USING (business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  ));

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON TABLE knowledge_base_posts IS 'Stores past successful posts to avoid repetition and learn from performance';
COMMENT ON TABLE knowledge_base_guidelines IS 'Stores brand guidelines per business for consistent content generation';
COMMENT ON TABLE knowledge_base_cultural IS 'Stores cultural context for different markets to ensure culturally appropriate content';
COMMENT ON TABLE knowledge_base_competitors IS 'Stores competitor analysis to identify differentiation opportunities';
