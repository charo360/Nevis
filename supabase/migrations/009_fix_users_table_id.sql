-- Migration: Fix users table primary key and UUID generation
-- Date: 2024

DO $$
BEGIN
    -- Enable the uuid-ossp extension for UUID generation
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Check if users table exists and has proper structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        
        -- Check if id column exists and is properly configured
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'id'
            AND table_schema = 'public'
        ) THEN
            -- Update the id column to have UUID default
            ALTER TABLE public.users ALTER COLUMN id SET DEFAULT uuid_generate_v4();
            RAISE NOTICE 'Updated id column to have UUID default';
        ELSE
            -- Add id column with UUID default and make it primary key
            ALTER TABLE public.users ADD COLUMN id UUID DEFAULT uuid_generate_v4() PRIMARY KEY;
            RAISE NOTICE 'Added id column with UUID default and primary key';
        END IF;
        
        -- Ensure created_at and updated_at have proper defaults
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'created_at'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.users ALTER COLUMN created_at SET DEFAULT NOW();
        ELSE
            ALTER TABLE public.users ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'updated_at'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.users ALTER COLUMN updated_at SET DEFAULT NOW();
        ELSE
            ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
    END IF;

    -- Refresh the schema cache
    NOTIFY pgrst, 'reload schema';
    
END $$;

-- Create update trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at();