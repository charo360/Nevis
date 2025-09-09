-- Temporary fix for RLS policy
-- Run this in your Supabase SQL Editor

-- Drop existing INSERT policy for users
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a more permissive INSERT policy that allows service role
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        auth.jwt() ->> 'role' = 'service_role' OR
        current_setting('role') = 'service_role'
    );

-- Alternative: Temporarily disable RLS for users table (NOT recommended for production)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
