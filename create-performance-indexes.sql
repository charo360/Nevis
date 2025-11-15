-- Performance indexes to fix timeout errors
-- Run these in your Supabase SQL editor

-- Index for calendar queries (brand_id + status + date)
CREATE INDEX IF NOT EXISTS idx_scheduled_content_brand_status_date 
ON scheduled_content(brand_id, status, date DESC);

-- Index for generated_posts queries (user_id + brand_profile_id + created_at)
CREATE INDEX IF NOT EXISTS idx_generated_posts_brand_user_created 
ON generated_posts(user_id, brand_profile_id, created_at DESC);

-- Analyze tables to update statistics
ANALYZE scheduled_content;
ANALYZE generated_posts;

-- Check existing indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('scheduled_content', 'generated_posts')
ORDER BY tablename, indexname;
