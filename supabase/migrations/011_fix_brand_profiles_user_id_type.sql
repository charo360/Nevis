-- Migration: Fix user_id column type in brand_profiles table
-- Date: 2024

DO $$
BEGIN
    -- Check if brand_profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_profiles' AND table_schema = 'public') THEN
        
        -- Check the current type of user_id column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'brand_profiles' 
            AND column_name = 'user_id'
            AND table_schema = 'public'
        ) THEN
            -- Change user_id column from UUID to TEXT to match our custom user IDs
            ALTER TABLE public.brand_profiles ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed user_id column from UUID to TEXT in brand_profiles table';
        ELSE
            -- Add user_id column as TEXT if it doesn't exist
            ALTER TABLE public.brand_profiles ADD COLUMN user_id TEXT;
            RAISE NOTICE 'Added user_id column as TEXT to brand_profiles table';
        END IF;
        
        -- Create or recreate index on user_id
        DROP INDEX IF EXISTS idx_brand_profiles_user_id;
        CREATE INDEX idx_brand_profiles_user_id ON public.brand_profiles(user_id);
        RAISE NOTICE 'Created/recreated index on user_id column';
        
    ELSE
        RAISE NOTICE 'brand_profiles table does not exist';
    END IF;

    -- Refresh the schema cache
    NOTIFY pgrst, 'reload schema';
    
END $$;