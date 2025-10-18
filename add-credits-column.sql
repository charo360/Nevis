-- Add credits column to users table
-- Run this in Supabase SQL Editor

-- Add credits column with default value of 0
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 NOT NULL;

-- Create an index for faster credit lookups
CREATE INDEX IF NOT EXISTS idx_users_credits ON users(credits);

-- Update existing users to have 0 credits if null
UPDATE users 
SET credits = 0 
WHERE credits IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'credits';

-- Show sample data
SELECT user_id, email, credits, subscription_plan
FROM users
LIMIT 5;


