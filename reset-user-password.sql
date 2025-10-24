-- Reset password for sm1761a@american.edu
-- Run this in Supabase SQL Editor

-- Option 1: Send password reset email (Recommended)
-- Go to Supabase Dashboard → Authentication → Users
-- Find sm1761a@american.edu → Click → "Send Password Recovery Email"

-- Option 2: Manually update password via SQL (Advanced)
-- Note: Supabase uses bcrypt hashing, you cannot set plain text passwords
-- You must use the Supabase Auth API or Dashboard

-- Instead, let's verify the user can receive a magic link login:

-- Check user's current auth status
SELECT 
  id,
  email,
  email_confirmed_at,
  encrypted_password IS NOT NULL as has_password,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE email = 'sm1761a@american.edu';

-- Ensure email is confirmed (required for login)
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'sm1761a@american.edu'
RETURNING id, email, email_confirmed_at;

-- Alternative: Use magic link login instead of password
-- In your app, implement "Sign in with Magic Link" option
-- User enters email → receives login link → clicks to login (no password needed)











