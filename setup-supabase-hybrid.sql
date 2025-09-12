-- Hybrid Supabase setup for Nevis AI (MongoDB + Supabase)
-- Run this in your Supabase SQL Editor to modify existing tables

-- Modify generated_posts table to accept text IDs for hybrid system
ALTER TABLE generated_posts 
DROP CONSTRAINT IF EXISTS generated_posts_user_id_fkey,
DROP CONSTRAINT IF EXISTS generated_posts_brand_profile_id_fkey;

-- Change columns to TEXT to accept MongoDB ObjectIds
ALTER TABLE generated_posts 
ALTER COLUMN user_id TYPE TEXT,
ALTER COLUMN brand_profile_id TYPE TEXT;

-- Update indexes
DROP INDEX IF EXISTS idx_generated_posts_user_id;
DROP INDEX IF EXISTS idx_generated_posts_brand_profile_id;

CREATE INDEX IF NOT EXISTS idx_generated_posts_user_id ON generated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_brand_profile_id ON generated_posts(brand_profile_id);

-- Update RLS policies for text IDs
DROP POLICY IF EXISTS "Users can view own posts" ON generated_posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON generated_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON generated_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON generated_posts;

-- Create new policies that work with text user IDs
CREATE POLICY "Users can view own posts" ON generated_posts FOR SELECT USING (user_id = current_setting('app.current_user_id', true));
CREATE POLICY "Users can insert own posts" ON generated_posts FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));
CREATE POLICY "Users can update own posts" ON generated_posts FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));
CREATE POLICY "Users can delete own posts" ON generated_posts FOR DELETE USING (user_id = current_setting('app.current_user_id', true));

-- For now, disable RLS on generated_posts to allow inserts during migration
ALTER TABLE generated_posts DISABLE ROW LEVEL SECURITY;
