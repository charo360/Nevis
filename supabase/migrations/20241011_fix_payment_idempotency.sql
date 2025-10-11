-- Fix payment idempotency to prevent duplicate records
-- This migration creates the idempotent payment processing function

CREATE OR REPLACE FUNCTION process_payment_with_idempotency(
  p_user_id UUID,
  p_stripe_session_id TEXT,
  p_plan_id TEXT,
  p_amount DECIMAL,
  p_credits_added INTEGER,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  payment_id UUID,
  was_duplicate BOOLEAN,
  credits_updated BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_id UUID;
  v_existing_payment UUID;
  v_was_duplicate BOOLEAN := FALSE;
  v_credits_updated BOOLEAN := FALSE;
BEGIN
  -- Check if payment already exists by session_id or payment_intent_id
  SELECT id INTO v_existing_payment 
  FROM payment_transactions 
  WHERE stripe_session_id = p_stripe_session_id
     OR (p_stripe_payment_intent_id IS NOT NULL AND stripe_payment_intent_id = p_stripe_payment_intent_id);
  
  IF v_existing_payment IS NOT NULL THEN
    -- Payment already exists, check if it's completed
    SELECT id INTO v_payment_id FROM payment_transactions 
    WHERE id = v_existing_payment AND status = 'completed';
    
    IF v_payment_id IS NOT NULL THEN
      -- Already processed successfully, return existing record
      v_was_duplicate := TRUE;
      RETURN QUERY SELECT v_existing_payment, v_was_duplicate, FALSE;
      RETURN;
    ELSE
      -- Update existing pending payment to completed
      UPDATE payment_transactions 
      SET 
        status = 'completed',
        stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
        updated_at = NOW()
      WHERE id = v_existing_payment;
      
      v_payment_id := v_existing_payment;
    END IF;
  ELSE
    -- Create new payment record
    INSERT INTO payment_transactions (
      user_id,
      stripe_session_id,
      stripe_payment_intent_id,
      plan_id,
      amount,
      credits_added,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_stripe_session_id,
      p_stripe_payment_intent_id,
      p_plan_id,
      p_amount,
      p_credits_added,
      'completed',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_payment_id;
  END IF;
  
  -- Update user credits atomically
  -- Check if user_credits record exists
  IF NOT EXISTS (SELECT 1 FROM user_credits WHERE user_id = p_user_id) THEN
    -- Create initial user_credits record
    INSERT INTO user_credits (
      user_id, 
      total_credits, 
      remaining_credits, 
      used_credits,
      last_payment_at,
      created_at,
      updated_at
    ) VALUES (
      p_user_id, 
      p_credits_added, 
      p_credits_added, 
      0,
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    -- Update existing credits
    UPDATE user_credits 
    SET 
      total_credits = total_credits + p_credits_added,
      remaining_credits = remaining_credits + p_credits_added,
      last_payment_at = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  v_credits_updated := TRUE;
  
  RETURN QUERY SELECT v_payment_id, v_was_duplicate, v_credits_updated;
END;
$$;

-- Create index for faster lookups if not exists
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_stripe_session_id 
ON payment_transactions(stripe_session_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_transactions_stripe_payment_intent_id 
ON payment_transactions(stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

-- Add stripe_payment_intent_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' 
    AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE payment_transactions 
    ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;
END $$;