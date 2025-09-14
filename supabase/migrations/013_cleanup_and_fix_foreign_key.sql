-- Migration: Clean up orphaned records and fix foreign key constraint
-- Date: 2024

DO $$
BEGIN
    -- Check if brand_profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_profiles' AND table_schema = 'public') THEN
        
        -- First, drop the problematic foreign key constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'brand_profiles_user_id_fkey' 
            AND table_name = 'brand_profiles'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.brand_profiles DROP CONSTRAINT brand_profiles_user_id_fkey;
            RAISE NOTICE 'Dropped foreign key constraint brand_profiles_user_id_fkey';
        END IF;
        
        -- Change the user_id column type to TEXT (if it's not already)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'brand_profiles' 
            AND column_name = 'user_id'
            AND table_schema = 'public'
            AND data_type != 'text'
        ) THEN
            ALTER TABLE public.brand_profiles ALTER COLUMN user_id TYPE TEXT;
            RAISE NOTICE 'Changed user_id column type to TEXT in brand_profiles table';
        END IF;
        
        -- Clean up orphaned brand_profiles records that don't have corresponding users
        -- First, let's see how many orphaned records we have
        DECLARE
            orphaned_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO orphaned_count
            FROM public.brand_profiles bp
            WHERE bp.user_id IS NOT NULL 
            AND NOT EXISTS (
                SELECT 1 FROM public.users u 
                WHERE u.user_id = bp.user_id
            );
            
            RAISE NOTICE 'Found % orphaned brand profile records', orphaned_count;
            
            -- Delete orphaned records
            IF orphaned_count > 0 THEN
                DELETE FROM public.brand_profiles 
                WHERE user_id IS NOT NULL 
                AND NOT EXISTS (
                    SELECT 1 FROM public.users u 
                    WHERE u.user_id = brand_profiles.user_id
                );
                RAISE NOTICE 'Deleted % orphaned brand profile records', orphaned_count;
            END IF;
        END;
        
        -- Create or recreate index on user_id
        DROP INDEX IF EXISTS idx_brand_profiles_user_id;
        CREATE INDEX idx_brand_profiles_user_id ON public.brand_profiles(user_id);
        RAISE NOTICE 'Created/recreated index on user_id column';
        
        -- Now try to create the foreign key constraint (only if users.user_id exists)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'user_id'
            AND table_schema = 'public'
        ) THEN
            -- Check if there are still any orphaned records before creating constraint
            DECLARE
                remaining_orphans INTEGER;
            BEGIN
                SELECT COUNT(*) INTO remaining_orphans
                FROM public.brand_profiles bp
                WHERE bp.user_id IS NOT NULL 
                AND NOT EXISTS (
                    SELECT 1 FROM public.users u 
                    WHERE u.user_id = bp.user_id
                );
                
                IF remaining_orphans = 0 THEN
                    ALTER TABLE public.brand_profiles 
                    ADD CONSTRAINT brand_profiles_user_id_fkey 
                    FOREIGN KEY (user_id) REFERENCES public.users(user_id);
                    RAISE NOTICE 'Created foreign key constraint referencing users.user_id';
                ELSE
                    RAISE NOTICE 'Still have % orphaned records, skipping foreign key creation', remaining_orphans;
                END IF;
            END;
        ELSE
            RAISE NOTICE 'users.user_id column does not exist, skipping foreign key creation';
        END IF;
        
    ELSE
        RAISE NOTICE 'brand_profiles table does not exist';
    END IF;

    -- Refresh the schema cache
    NOTIFY pgrst, 'reload schema';
    
END $$;