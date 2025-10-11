-- Check if stripe_payment_intent_id column exists and add it if missing
-- First check current columns
SELECT 'Current payment_transactions columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
ORDER BY ordinal_position;

-- Add the column if it doesn't exist
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment_intent_id 
ON payment_transactions(stripe_payment_intent_id);

-- Verify the column was added
SELECT 'Updated payment_transactions columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
ORDER BY ordinal_position;