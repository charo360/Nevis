-- Minimal migration to add missing columns to existing brand_profiles table

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
CREATE INDEX IF NOT EXISTS idx_brand_profiles_is_active ON brand_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_business_name ON brand_profiles(business_name);

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
CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON brand_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security if not already enabled
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'brand_profiles' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policy (DROP IF EXISTS to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own brand profiles" ON brand_profiles;
CREATE POLICY "Users can view their own brand profiles" ON brand_profiles
    FOR ALL USING (user_id = auth.uid()::text);

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'brand_profiles' 
ORDER BY ordinal_position;

SELECT 'Brand profiles table updated successfully! Logo columns added.' as status;