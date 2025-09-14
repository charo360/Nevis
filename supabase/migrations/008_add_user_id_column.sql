-- Migration: Add user_id column to users table
-- Date: 2024

DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    -- This is a separate identifier from the primary key 'id'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN user_id TEXT UNIQUE;
        RAISE NOTICE 'Added user_id column to users table';
        
        -- Create an index on user_id for performance
        CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
        RAISE NOTICE 'Created index on user_id column';
    ELSE
        RAISE NOTICE 'user_id column already exists in users table';
    END IF;

    -- Refresh the schema cache
    NOTIFY pgrst, 'reload schema';
    
END $$;