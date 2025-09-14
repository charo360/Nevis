-- Migration: Fix foreign key constraint and user_id column type
-- Date: 2024

DO $$
BEGIN
    -- Check if brand_profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_profiles' AND table_schema = 'public') THEN
        
        -- First, drop the problematic foreign key constraint
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'brand_profiles_user_id_fkey' 
            AND table_name = 'brand_profiles'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.brand_profiles DROP CONSTRAINT brand_profiles_user_id_fkey;
            RAISE NOTICE 'Dropped foreign key constraint brand_profiles_user_id_fkey';
        END IF;
        
        -- Now change the user_id column type to TEXT
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'brand_profiles' 
            AND column_name = 'user_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.brand_profiles ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed user_id column type to TEXT in brand_profiles table';
        ELSE
            -- Add user_id column as TEXT if it doesn't exist
            ALTER TABLE public.brand_profiles ADD COLUMN user_id TEXT;
            RAISE NOTICE 'Added user_id column as TEXT to brand_profiles table';
        END IF;
        
        -- Create or recreate index on user_id
        DROP INDEX IF EXISTS idx_brand_profiles_user_id;
        CREATE INDEX idx_brand_profiles_user_id ON public.brand_profiles(user_id);
        RAISE NOTICE 'Created/recreated index on user_id column';
        
        -- Create a new foreign key constraint that references the users.user_id column (TEXT)
        -- instead of users.id column (UUID)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'user_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.brand_profiles 
            ADD CONSTRAINT brand_profiles_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.users(user_id);
            RAISE NOTICE 'Created new foreign key constraint referencing users.user_id';
        ELSE
            RAISE NOTICE 'users.user_id column does not exist, skipping foreign key creation';
        END IF;
        
    ELSE
        RAISE NOTICE 'brand_profiles table does not exist';
    END IF;

    -- Refresh the schema cache
    NOTIFY pgrst, 'reload schema';
    
END $$;