-- Create credit usage history table for detailed tracking
CREATE TABLE IF NOT EXISTS credit_usage_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    model_version VARCHAR(20) NOT NULL, -- 'revo-1.0', 'revo-1.5', 'revo-2.0'
    credits_used INTEGER NOT NULL,
    feature VARCHAR(50) NOT NULL DEFAULT 'design_generation',
    generation_type VARCHAR(30) NOT NULL DEFAULT 'image',
    prompt_text TEXT,
    result_success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_model_version ON credit_usage_history(model_version);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON credit_usage_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_model ON credit_usage_history(user_id, model_version);

-- Create a view for usage analytics
CREATE OR REPLACE VIEW user_credit_analytics AS
SELECT 
    user_id,
    model_version,
    COUNT(*) as total_generations,
    SUM(credits_used) as total_credits_used,
    AVG(credits_used) as avg_credits_per_generation,
    DATE_TRUNC('day', created_at) as usage_date,
    MAX(created_at) as last_used
FROM credit_usage_history 
WHERE result_success = true
GROUP BY user_id, model_version, DATE_TRUNC('day', created_at);

-- Verify tables created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('credit_usage_history', 'user_credit_analytics') 
ORDER BY table_name, ordinal_position;