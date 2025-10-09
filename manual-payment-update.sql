-- SQL to manually update the pending payment to completed
-- Run this in your Supabase SQL editor to test the complete flow

UPDATE payment_transactions 
SET 
  status = 'completed',
  credits_added = 1000
WHERE 
  stripe_session_id = 'cs_test_b11cmiTpxUnxLZ4JWYDZvIhcixPPnha9ByzPSExjiaRFGxWQto4eWzt7fa'
  AND status = 'pending';

-- Also update user credits
UPDATE users 
SET 
  total_credits = COALESCE(total_credits, 0) + 1000,
  remaining_credits = COALESCE(remaining_credits, 0) + 1000,
  last_payment_at = NOW()
WHERE 
  user_id = '7a151a69-cd3d-4976-918d-6e6eb6548b71';

-- Verify the updates
SELECT * FROM payment_transactions 
WHERE stripe_session_id = 'cs_test_b11cmiTpxUnxLZ4JWYDZvIhcixPPnha9ByzPSExjiaRFGxWQto4eWzt7fa';

SELECT user_id, total_credits, remaining_credits, last_payment_at 
FROM users 
WHERE user_id = '7a151a69-cd3d-4976-918d-6e6eb6548b71';