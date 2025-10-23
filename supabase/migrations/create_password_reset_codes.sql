-- Create password_reset_codes table for managing password reset verification codes
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  
  -- Index for quick lookups
  CONSTRAINT password_reset_codes_email_code_key UNIQUE(email, code)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id ON password_reset_codes(user_id);

-- RLS Policies (allow service role only)
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can manage reset codes (security measure)
CREATE POLICY "Service role can manage reset codes" ON password_reset_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Cleanup function to remove expired codes (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_reset_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

-- Grant necessary permissions
GRANT ALL ON password_reset_codes TO service_role;


