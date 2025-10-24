-- Diagnose and fix sm1761a@american.edu login issue
-- Run each section separately in Supabase SQL Editor

-- ============================================
-- SECTION 1: Check user status in auth.users
-- ============================================
SELECT 
  id,
  email,
  email_confirmed_at,
  phone,
  confirmed_at,
  last_sign_in_at,
  created_at,
  deleted_at,
  is_sso_user,
  banned_until
FROM auth.users
WHERE email = 'sm1761a@american.edu';

-- Check for any issues:
-- - email_confirmed_at should NOT be NULL
-- - deleted_at should be NULL
-- - banned_until should be NULL

-- ============================================
-- SECTION 2: Check user_credits table
-- ============================================
SELECT 
  uc.*,
  au.email
FROM public.user_credits uc
JOIN auth.users au ON au.id = uc.user_id
WHERE au.email = 'sm1761a@american.edu';

-- ============================================
-- SECTION 3: Check users table (if it exists)
-- ============================================
SELECT *
FROM public.users
WHERE email = 'sm1761a@american.edu'
   OR user_id IN (SELECT id FROM auth.users WHERE email = 'sm1761a@american.edu');

-- ============================================
-- SECTION 4: Fix - Ensure email is confirmed
-- ============================================
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email = 'sm1761a@american.edu'
  AND email_confirmed_at IS NULL;

-- ============================================
-- SECTION 5: Create users table record if missing
-- ============================================
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'sm1761a@american.edu';
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found in auth.users';
    RETURN;
  END IF;
  
  -- Check if users table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Create users record if missing
    INSERT INTO public.users (
      user_id,
      email,
      subscription_plan,
      subscription_status,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_email,
      'try-free',
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      email = v_email,
      subscription_plan = COALESCE(public.users.subscription_plan, 'try-free'),
      subscription_status = COALESCE(public.users.subscription_status, 'active'),
      updated_at = NOW();
    
    RAISE NOTICE 'Users table record ensured for %', v_email;
  ELSE
    RAISE NOTICE 'Users table does not exist - skipping';
  END IF;
END $$;

-- ============================================
-- SECTION 6: Verify everything is fixed
-- ============================================
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  uc.total_credits,
  uc.remaining_credits
FROM auth.users au
LEFT JOIN public.user_credits uc ON uc.user_id = au.id
WHERE au.email = 'sm1761a@american.edu';

-- Expected result:
-- - email_confirmed_at: should have a timestamp
-- - total_credits: should show credits
-- - remaining_credits: should show credits










