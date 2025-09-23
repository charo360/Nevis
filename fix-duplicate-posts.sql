-- SQL script to fix duplicate posts issue
-- Run this in your Supabase SQL Editor

-- Step 1: Add content_hash column if it doesn't exist
ALTER TABLE generated_posts 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Step 2: Create function to generate content hash
CREATE OR REPLACE FUNCTION generate_content_hash(content_text TEXT, user_id_val TEXT, platform_val TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(content_text || user_id_val || platform_val, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update existing posts to have content hashes
UPDATE generated_posts 
SET content_hash = generate_content_hash(content, user_id, platform)
WHERE content_hash IS NULL;

-- Step 4: Remove existing duplicates (keep the most recent one)
WITH duplicates AS (
    SELECT 
        user_id, 
        content, 
        platform,
        COUNT(*) as count,
        MIN(id) as keep_id
    FROM generated_posts 
    GROUP BY user_id, content, platform
    HAVING COUNT(*) > 1
)
DELETE FROM generated_posts 
WHERE id IN (
    SELECT gp.id 
    FROM generated_posts gp
    JOIN duplicates d ON gp.user_id = d.user_id 
        AND gp.content = d.content 
        AND gp.platform = d.platform
    WHERE gp.id != d.keep_id
);

-- Step 5: Create unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS generated_posts_unique_content 
ON generated_posts (user_id, content_hash, platform);

-- Step 6: Create trigger function to handle duplicate insertions
CREATE OR REPLACE FUNCTION handle_duplicate_post_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate content hash for new post
    NEW.content_hash = generate_content_hash(NEW.content, NEW.user_id, NEW.platform);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically generate content hash
DROP TRIGGER IF EXISTS generate_content_hash_trigger ON generated_posts;
CREATE TRIGGER generate_content_hash_trigger
    BEFORE INSERT OR UPDATE ON generated_posts
    FOR EACH ROW
    EXECUTE FUNCTION handle_duplicate_post_insert();

-- Step 8: Show cleanup results
SELECT 
    'Cleanup completed' as status,
    COUNT(*) as total_posts,
    COUNT(DISTINCT (user_id, content_hash, platform)) as unique_posts
FROM generated_posts;
