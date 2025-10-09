-- Create user_credits table to track user credit balances
CREATE TABLE IF NOT EXISTS user_credits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_credits integer DEFAULT 0 NOT NULL,
  remaining_credits integer DEFAULT 0 NOT NULL,
  used_credits integer DEFAULT 0 NOT NULL,
  last_payment_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create credit_usage_history table to track individual credit usage events
CREATE TABLE IF NOT EXISTS credit_usage_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits_used integer NOT NULL,
  feature text NOT NULL DEFAULT 'Content Generation',
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_history_user_id ON credit_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_history_created_at ON credit_usage_history(created_at);

-- Update payment_transactions table to include credits_added if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' AND column_name = 'credits_added'
  ) THEN
    ALTER TABLE payment_transactions ADD COLUMN credits_added integer DEFAULT 0;
  END IF;
END $$;

-- Create trigger to update updated_at timestamp for user_credits
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_credits_updated_at 
  BEFORE UPDATE ON user_credits 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_credits
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits" ON user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for credit_usage_history
CREATE POLICY "Users can view their own credit usage" ON credit_usage_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit usage" ON credit_usage_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON user_credits TO authenticated;
GRANT ALL ON credit_usage_history TO authenticated;

-- Create function to add credits to user account (called after successful payment)
CREATE OR REPLACE FUNCTION add_credits_to_user(
  p_user_id uuid,
  p_credits_to_add integer,
  p_payment_amount numeric DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Insert or update user credits
  INSERT INTO user_credits (user_id, total_credits, remaining_credits, used_credits, last_payment_at)
  VALUES (
    p_user_id, 
    p_credits_to_add, 
    p_credits_to_add, 
    0,
    CASE WHEN p_payment_amount IS NOT NULL THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_credits = user_credits.total_credits + p_credits_to_add,
    remaining_credits = user_credits.remaining_credits + p_credits_to_add,
    last_payment_at = CASE 
      WHEN p_payment_amount IS NOT NULL THEN now() 
      ELSE user_credits.last_payment_at 
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create function to use credits (called when user generates content)
CREATE OR REPLACE FUNCTION use_credits(
  p_user_id uuid,
  p_credits_to_use integer,
  p_feature text DEFAULT 'Content Generation',
  p_details jsonb DEFAULT '{}'
)
RETURNS boolean AS $$
DECLARE
  current_credits integer;
BEGIN
  -- Check if user has enough credits
  SELECT remaining_credits INTO current_credits
  FROM user_credits
  WHERE user_id = p_user_id;

  IF current_credits IS NULL OR current_credits < p_credits_to_use THEN
    RETURN false;
  END IF;

  -- Deduct credits
  UPDATE user_credits
  SET 
    remaining_credits = remaining_credits - p_credits_to_use,
    used_credits = used_credits + p_credits_to_use,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Record usage history
  INSERT INTO credit_usage_history (user_id, credits_used, feature, details)
  VALUES (p_user_id, p_credits_to_use, p_feature, p_details);

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION add_credits_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION use_credits TO authenticated;