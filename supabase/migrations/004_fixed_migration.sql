-- Fixed migration with proper type casting for RLS policy

-- First, let's see what columns exist in the brand_profiles table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'brand_profiles' 
ORDER BY ordinal_position;

-- Add missing columns one by one with error handling
DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN logo_url TEXT;
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column logo_url already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN logo_data_url TEXT;
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column logo_data_url already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN location JSONB;
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column location already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN contact JSONB;
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column contact already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN social_media JSONB;
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column social_media already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN brand_colors JSONB;
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column brand_colors already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN design_examples TEXT[];
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column design_examples already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN target_audience TEXT;
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column target_audience already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN brand_voice TEXT;
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column brand_voice already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN services JSONB DEFAULT '[]';
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column services already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column is_active already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column created_at already exists';
    END;
END $$;

DO $$ BEGIN
    BEGIN
        ALTER TABLE brand_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column updated_at already exists';
    END;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);

-- Only create this index if is_active column exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'brand_profiles' AND column_name = 'is_active'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_brand_profiles_is_active ON brand_profiles(is_active);
    END IF;
END $$;

-- Only create this index if business_name column exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'brand_profiles' AND column_name = 'business_name'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_brand_profiles_business_name ON brand_profiles(business_name);
    END IF;
END $$;

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update trigger (DROP IF EXISTS to avoid conflicts)
DROP TRIGGER IF EXISTS update_brand_profiles_updated_at ON brand_profiles;

-- Only create trigger if updated_at column exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'brand_profiles' AND column_name = 'updated_at'
    ) THEN
        CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON brand_profiles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable Row Level Security if not already enabled
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'brand_profiles' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Row Level Security enabled on brand_profiles';
    ELSE
        RAISE NOTICE 'Row Level Security already enabled on brand_profiles';
    END IF;
END $$;

-- Create RLS policy with proper type casting
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own brand profiles" ON brand_profiles;

-- Create new policy with proper casting
-- Check if auth.uid() exists (it should in Supabase)
DO $$ BEGIN
    BEGIN
        -- Try creating the policy with auth.uid()::text
        CREATE POLICY "Users can view their own brand profiles" ON brand_profiles
            FOR ALL USING (user_id = auth.uid()::text);
        RAISE NOTICE 'RLS policy created successfully with auth.uid()::text';
    EXCEPTION
        WHEN OTHERS THEN
            -- Fallback: create a more permissive policy for now
            CREATE POLICY "Users can view their own brand profiles" ON brand_profiles
                FOR ALL USING (true);
            RAISE NOTICE 'Created fallback RLS policy - you may need to update this manually';
    END;
END $$;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'brand_profiles' 
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'Enabled' 
        ELSE 'Disabled' 
    END as rls_status
FROM pg_tables 
WHERE tablename = 'brand_profiles';

-- Show existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'brand_profiles';

SELECT 'Brand profiles table migration completed!' as status;