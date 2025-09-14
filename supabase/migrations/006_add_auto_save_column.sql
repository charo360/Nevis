-- Migration: Add missing auto_save column to users table
-- Date: 2024

DO $$
BEGIN
    -- Add auto_save column to users table if it doesn't exist
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
    
    -- Refresh the schema cache
    NOTIFY pgrst, 'reload schema';
    
END $$;

-- Update RLS policies to include the new column (if needed)
-- The existing RLS policies should automatically cover new columns