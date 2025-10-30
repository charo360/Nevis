-- Fix NULL password for sm1761a@american.edu
-- The user exists but has no password hash set

-- ============================================
-- SOLUTION: Use Supabase Auth Admin API
-- ============================================
-- SQL cannot directly set bcrypt password hashes
-- We must use Supabase's auth admin functions

-- Step 1: Check current state
SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at
FROM auth.users
WHERE email = 'sm1761a@american.edu';

-- Step 2: Update user to have a password using Supabase Admin API
-- Run this in your terminal (not SQL Editor):

-- node -e "
-- import { createClient } from '@supabase/supabase-js';
-- const supabase = createClient(
--   'https://nrfceylvtiwpqsoxurrv.supabase.co',
--   'YOUR_SERVICE_ROLE_KEY'
-- );
-- 
-- const result = await supabase.auth.admin.updateUserById(
--   'dd9f93dc-08c2-4086-9359-687fa6c5897d',
--   { password: 'Crevo119988' }
-- );
-- console.log('Password updated:', result);
-- "

-- Or use the SQL approach below (simpler):

-- ============================================
-- ALTERNATIVE: Delete and recreate user
-- ============================================
-- This is the cleanest approach when password is NULL

-- Step A: Save current credits
CREATE TEMP TABLE temp_user_backup AS
SELECT * FROM public.user_credits 
WHERE user_id = 'dd9f93dc-08c2-4086-9359-687fa6c5897d';

-- Step B: Delete auth.users entry (this will cascade)
DELETE FROM auth.users WHERE id = 'dd9f93dc-08c2-4086-9359-687fa6c5897d';

-- Step C: User must sign up again at your app with:
-- Email: sm1761a@american.edu
-- Password: Crevo119988

-- Step D: After signup, restore credits
-- Get new user ID and run:
-- UPDATE public.user_credits 
-- SET 
--   total_credits = (SELECT total_credits FROM temp_user_backup),
--   remaining_credits = (SELECT remaining_credits FROM temp_user_backup)
-- WHERE user_id = 'NEW_USER_ID_HERE';

-- ============================================
-- RECOMMENDED: Just use sam@crevo.app
-- ============================================
-- sm1761a@american.edu has a broken auth state
-- Easier to just add 9000 credits to sam@crevo.app which works perfectly

















