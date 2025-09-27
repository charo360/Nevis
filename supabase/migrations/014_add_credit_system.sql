-- Migration: Add credit system to users table and create payment/transaction tables
-- Date: 2024

DO $$
BEGIN
    -- Add credit columns to users table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'total_credits'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN total_credits INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_credits column to users table';
    ELSE
        RAISE NOTICE 'total_credits column already exists in users table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'used_credits'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN used_credits INTEGER DEFAULT 0;
        RAISE NOTICE 'Added used_credits column to users table';
    ELSE
        RAISE NOTICE 'used_credits column already exists in users table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'remaining_credits'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN remaining_credits INTEGER DEFAULT 0;
        RAISE NOTICE 'Added remaining_credits column to users table';
    ELSE
        RAISE NOTICE 'remaining_credits column already exists in users table';
    END IF;

    -- Give existing users 10 free credits if they don't have any
    UPDATE public.users 
    SET total_credits = 10, remaining_credits = 10 
    WHERE total_credits = 0 AND remaining_credits = 0;
    RAISE NOTICE 'Gave existing users 10 free credits';

END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    stripe_session_id TEXT UNIQUE NOT NULL,
    plan_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    credits_added INTEGER NOT NULL,
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credit_transactions table for tracking credit usage
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('addition', 'deduction')),
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id ON public.payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for payments table
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own credit transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid()::text = user_id);

-- Create function to process payment transactions atomically
CREATE OR REPLACE FUNCTION process_payment_transaction(
    p_user_id TEXT,
    p_stripe_session_id TEXT,
    p_plan_id TEXT,
    p_amount DECIMAL(10,2),
    p_currency TEXT,
    p_credits_added INTEGER,
    p_payment_method TEXT,
    p_new_total_credits INTEGER,
    p_new_remaining_credits INTEGER,
    p_balance_before INTEGER
) RETURNS VOID AS $$
BEGIN
    -- Insert payment record
    INSERT INTO public.payments (
        user_id, stripe_session_id, plan_id, amount, currency,
        credits_added, payment_method, status
    ) VALUES (
        p_user_id, p_stripe_session_id, p_plan_id, p_amount, p_currency,
        p_credits_added, p_payment_method, 'completed'
    );

    -- Update user credits
    UPDATE public.users
    SET
        total_credits = p_new_total_credits,
        remaining_credits = p_new_remaining_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log credit transaction
    INSERT INTO public.credit_transactions (
        user_id, type, amount, balance_before, balance_after, reason, metadata
    ) VALUES (
        p_user_id, 'addition', p_credits_added, p_balance_before,
        p_new_remaining_credits, 'payment',
        jsonb_build_object(
            'stripe_session_id', p_stripe_session_id,
            'plan_id', p_plan_id,
            'amount_paid', p_amount,
            'currency', p_currency
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
