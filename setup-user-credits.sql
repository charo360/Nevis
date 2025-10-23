-- Setup credits for sm1761a@american.edu
-- Run this in Supabase SQL Editor

-- Step 1: Check if user exists and get their ID
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'sm1761a@american.edu';

-- If no results, user doesn't exist. Sign up first at your app.
-- If email_confirmed_at is NULL, user needs to confirm email.

-- Step 2: Add 9000 credits (replace the UUID below with the ID from Step 1)
DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- REPLACE THIS
  v_credits_to_add INTEGER := 9000;
  v_current_total INTEGER;
  v_current_remaining INTEGER;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'User % does not exist', v_user_id;
  END IF;

  -- Add credits
  INSERT INTO public.user_credits (user_id, total_credits, remaining_credits, used_credits, created_at, updated_at)
  VALUES (v_user_id, v_credits_to_add, v_credits_to_add, 0, NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_credits = public.user_credits.total_credits + v_credits_to_add,
    remaining_credits = public.user_credits.remaining_credits + v_credits_to_add,
    updated_at = NOW()
  RETURNING total_credits, remaining_credits INTO v_current_total, v_current_remaining;
  
  -- If RETURNING didn't work (on conflict), fetch current values
  IF v_current_total IS NULL THEN
    SELECT total_credits, remaining_credits 
    INTO v_current_total, v_current_remaining
    FROM public.user_credits 
    WHERE user_id = v_user_id;
  END IF;
  
  -- Record transaction
  INSERT INTO public.payment_transactions (user_id, plan_id, amount, status, credits_added, stripe_session_id, created_at)
  VALUES (v_user_id, 'admin_grant', 0.00, 'completed', v_credits_to_add, 'admin_' || gen_random_uuid(), NOW());
  
  RAISE NOTICE '✅ Added % credits. New balance: Total=%, Remaining=%', v_credits_to_add, v_current_total, v_current_remaining;
END $$;

-- Step 3: Verify
SELECT 
  uc.user_id,
  au.email,
  uc.total_credits,
  uc.remaining_credits,
  uc.used_credits
FROM public.user_credits uc
JOIN auth.users au ON au.id = uc.user_id
WHERE au.email = 'sm1761a@american.edu';









