-- Supabase table for scheduled content
CREATE TABLE IF NOT EXISTS scheduled_content (
  id BIGSERIAL PRIMARY KEY,
  brand_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  date DATE NOT NULL,
  content_type TEXT DEFAULT 'post' CHECK (content_type IN ('post', 'story', 'reel', 'ad')),
  platform TEXT DEFAULT 'All' CHECK (platform IN ('All', 'Facebook', 'Instagram', 'LinkedIn', 'Twitter')),
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'generated', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_content_brand_date ON scheduled_content(brand_id, date);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_status ON scheduled_content(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_brand_status ON scheduled_content(brand_id, status);

-- Enable Row Level Security
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to access their own brand data
CREATE POLICY "Users can access their own brand scheduled content" ON scheduled_content
  FOR ALL USING (true); -- Adjust based on your auth setup