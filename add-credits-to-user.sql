-- Add maximum credits to sm1761a@american.edu
-- Run this in Supabase SQL Editor

-- Step 1: Find the user ID
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'sm1761a@american.edu';

-- Step 2: After you see the user_id from above, replace USER_ID_HERE below and run:

-- Add 1000 credits (or any amount you want)
DO $$
DECLARE
  v_user_id UUID := 'USER_ID_HERE'; -- Replace with actual user ID from step 1
  v_credits_to_add INTEGER := 1000; -- Change this to desired amount
BEGIN
  -- Add credits to user_credits table
  INSERT INTO public.user_credits (
    user_id, 
    total_credits, 
    remaining_credits, 
    used_credits,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_credits_to_add,
    v_credits_to_add,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_credits = public.user_credits.total_credits + v_credits_to_add,
    remaining_credits = public.user_credits.remaining_credits + v_credits_to_add,
    updated_at = NOW();
  
  -- Record the credit addition as a payment transaction
  INSERT INTO public.payment_transactions (
    user_id,
    plan_id,
    amount,
    status,
    credits_added,
    stripe_session_id,
    created_at
  ) VALUES (
    v_user_id,
    'manual_credit_grant',
    0.00,
    'completed',
    v_credits_to_add,
    'manual_grant_' || v_user_id || '_' || EXTRACT(EPOCH FROM NOW()),
    NOW()
  );
  
  RAISE NOTICE 'Added % credits to user %', v_credits_to_add, v_user_id;
END $$;

-- Step 3: Verify credits were added
SELECT 
  user_id,
  total_credits,
  remaining_credits,
  used_credits,
  updated_at
FROM public.user_credits
WHERE user_id = 'USER_ID_HERE'; -- Replace with actual user ID

-- Check recent transactions
SELECT 
  plan_id,
  credits_added,
  status,
  created_at
FROM public.payment_transactions
WHERE user_id = 'USER_ID_HERE' -- Replace with actual user ID
ORDER BY created_at DESC
LIMIT 5;



