-- Migration: Fix foreign key constraint issues on users table
-- Date: 2024

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Check and drop any problematic foreign key constraints on users table
    FOR constraint_record IN 
        SELECT constraint_name, table_name 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND (constraint_name LIKE '%users_id_fkey%' OR table_name = 'users')
    LOOP
        EXECUTE 'ALTER TABLE ' || constraint_record.table_name || ' DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint % from table %', constraint_record.constraint_name, constraint_record.table_name;
    END LOOP;

    -- Check if users table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- Create users table if it doesn't exist
        CREATE TABLE public.users (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            user_id TEXT UNIQUE,
            display_name TEXT DEFAULT '',
            photo_url TEXT DEFAULT '',
            theme TEXT DEFAULT 'system',
            notifications BOOLEAN DEFAULT true,
            auto_save BOOLEAN DEFAULT true,
            subscription_plan TEXT DEFAULT 'free',
            subscription_status TEXT DEFAULT 'active',
            subscription_expires_at TIMESTAMPTZ,
            hashed_password TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
        
        RAISE NOTICE 'Created users table with proper structure';
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;

    -- Enable Row Level Security
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policy for users
    DROP POLICY IF EXISTS "Users can manage their own data" ON users;
    CREATE POLICY "Users can manage their own data" ON users
        FOR ALL USING (auth.uid()::text = id::text OR auth.uid()::text = user_id);

    -- Refresh the schema cache
    NOTIFY pgrst, 'reload schema';
    
END $$;