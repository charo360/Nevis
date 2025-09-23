-- Migration to prevent duplicate posts
-- This adds a content hash field and unique constraint to prevent duplicate posts

-- Add content_hash field to generated_posts table
ALTER TABLE generated_posts 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create function to generate content hash
CREATE OR REPLACE FUNCTION generate_content_hash(content_text TEXT, user_id_val TEXT, platform_val TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Generate a hash based on content, user_id, and platform
    -- This ensures the same content by the same user on the same platform is considered duplicate
    RETURN encode(digest(content_text || user_id_val || platform_val, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Update existing posts to have content hashes
UPDATE generated_posts 
SET content_hash = generate_content_hash(content, user_id, platform)
WHERE content_hash IS NULL;

-- Create unique constraint to prevent duplicate posts
-- Allow same content for different users or different platforms
CREATE UNIQUE INDEX IF NOT EXISTS generated_posts_unique_content 
ON generated_posts (user_id, content_hash, platform);

-- Create function to handle duplicate post insertion
CREATE OR REPLACE FUNCTION handle_duplicate_post_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate content hash for new post
    NEW.content_hash = generate_content_hash(NEW.content, NEW.user_id, NEW.platform);
    
    -- Check if a post with the same hash already exists
    IF EXISTS (
        SELECT 1 FROM generated_posts 
        WHERE user_id = NEW.user_id 
        AND content_hash = NEW.content_hash 
        AND platform = NEW.platform
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        -- Instead of failing, we'll update the existing post's updated_at timestamp
        UPDATE generated_posts 
        SET updated_at = NOW()
        WHERE user_id = NEW.user_id 
        AND content_hash = NEW.content_hash 
        AND platform = NEW.platform;
        
        -- Return NULL to prevent the insert
        RETURN NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically handle duplicates
DROP TRIGGER IF EXISTS prevent_duplicate_posts ON generated_posts;
CREATE TRIGGER prevent_duplicate_posts
    BEFORE INSERT ON generated_posts
    FOR EACH ROW
    EXECUTE FUNCTION handle_duplicate_post_insert();

-- Create function to clean up existing duplicates
CREATE OR REPLACE FUNCTION cleanup_duplicate_posts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    duplicate_record RECORD;
BEGIN
    -- Find and remove duplicate posts, keeping the most recent one
    FOR duplicate_record IN
        SELECT user_id, content_hash, platform, COUNT(*) as count
        FROM generated_posts 
        WHERE content_hash IS NOT NULL
        GROUP BY user_id, content_hash, platform
        HAVING COUNT(*) > 1
    LOOP
        -- Delete all but the most recent post for each duplicate group
        DELETE FROM generated_posts 
        WHERE id IN (
            SELECT id FROM generated_posts 
            WHERE user_id = duplicate_record.user_id 
            AND content_hash = duplicate_record.content_hash 
            AND platform = duplicate_record.platform
            ORDER BY created_at DESC 
            OFFSET 1
        );
        
        GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Run the cleanup function to remove existing duplicates
SELECT cleanup_duplicate_posts() as deleted_duplicate_posts;
