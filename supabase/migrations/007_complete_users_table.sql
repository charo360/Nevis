-- Migration: Add all missing columns to users table
-- Date: 2024

DO $$
BEGIN
    -- Add display_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'display_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN display_name TEXT DEFAULT '';
        RAISE NOTICE 'Added display_name column to users table';
    ELSE
        RAISE NOTICE 'display_name column already exists in users table';
    END IF;

    -- Add photo_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'photo_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN photo_url TEXT DEFAULT '';
        RAISE NOTICE 'Added photo_url column to users table';
    ELSE
        RAISE NOTICE 'photo_url column already exists in users table';
    END IF;

    -- Add theme column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'theme'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN theme TEXT DEFAULT 'system';
        RAISE NOTICE 'Added theme column to users table';
    ELSE
        RAISE NOTICE 'theme column already exists in users table';
    END IF;

    -- Add notifications column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'notifications'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added notifications column to users table';
    ELSE
        RAISE NOTICE 'notifications column already exists in users table';
    END IF;

    -- Add auto_save column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'auto_save'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN auto_save BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added auto_save column to users table';
    ELSE
        RAISE NOTICE 'auto_save column already exists in users table';
    END IF;

    -- Add subscription_plan column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'subscription_plan'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN subscription_plan TEXT DEFAULT 'free';
        RAISE NOTICE 'Added subscription_plan column to users table';
    ELSE
        RAISE NOTICE 'subscription_plan column already exists in users table';
    END IF;

    -- Add subscription_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'subscription_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN subscription_status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added subscription_status column to users table';
    ELSE
        RAISE NOTICE 'subscription_status column already exists in users table';
    END IF;

    -- Add subscription_expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'subscription_expires_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN subscription_expires_at TIMESTAMPTZ;
        RAISE NOTICE 'Added subscription_expires_at column to users table';
    ELSE
        RAISE NOTICE 'subscription_expires_at column already exists in users table';
    END IF;

    -- Add hashed_password column if it doesn't exist (for authentication)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'hashed_password'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN hashed_password TEXT;
        RAISE NOTICE 'Added hashed_password column to users table';
    ELSE
        RAISE NOTICE 'hashed_password column already exists in users table';
    END IF;

    -- Refresh the schema cache
    NOTIFY pgrst, 'reload schema';
    
END $$;