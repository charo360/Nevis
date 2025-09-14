-- Add authentication column to users table

-- Add hashed_password column to users table
DO $$ BEGIN
    BEGIN
        ALTER TABLE users ADD COLUMN hashed_password TEXT;
    EXCEPTION
        WHEN duplicate_column THEN 
            RAISE NOTICE 'Column hashed_password already exists';
    END;
END $$;

-- Show updated table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT 'Users table updated with authentication column!' as status;