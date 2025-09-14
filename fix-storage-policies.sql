-- Fix Supabase Storage RLS Policies
-- Run this in your Supabase SQL Editor

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_3" ON storage.objects;

-- Create comprehensive storage bucket policies
-- Allow service role full access to buckets
DROP POLICY IF EXISTS "service_role_buckets_all" ON storage.buckets;
CREATE POLICY "service_role_buckets_all" ON storage.buckets
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view buckets
DROP POLICY IF EXISTS "authenticated_buckets_select" ON storage.buckets;
CREATE POLICY "authenticated_buckets_select" ON storage.buckets
FOR SELECT 
TO authenticated
USING (true);

-- Create comprehensive storage object policies
-- Allow service role full access to all objects
DROP POLICY IF EXISTS "service_role_objects_all" ON storage.objects;
CREATE POLICY "service_role_objects_all" ON storage.objects
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to upload to nevis-storage bucket
DROP POLICY IF EXISTS "authenticated_upload_nevis" ON storage.objects;
CREATE POLICY "authenticated_upload_nevis" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'nevis-storage');

-- Allow authenticated users to update their own files in nevis-storage
DROP POLICY IF EXISTS "authenticated_update_nevis" ON storage.objects;
CREATE POLICY "authenticated_update_nevis" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'nevis-storage' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'nevis-storage' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own files in nevis-storage
DROP POLICY IF EXISTS "authenticated_delete_nevis" ON storage.objects;
CREATE POLICY "authenticated_delete_nevis" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'nevis-storage' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to nevis-storage bucket (for generated content)
DROP POLICY IF EXISTS "public_read_nevis" ON storage.objects;
CREATE POLICY "public_read_nevis" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'nevis-storage');

-- Alternative: More permissive policies for development
-- Uncomment these and comment out the above if you need broader access

-- DROP POLICY IF EXISTS "dev_authenticated_objects_all" ON storage.objects;
-- CREATE POLICY "dev_authenticated_objects_all" ON storage.objects
-- FOR ALL 
-- TO authenticated
-- USING (bucket_id = 'nevis-storage')
-- WITH CHECK (bucket_id = 'nevis-storage');

-- DROP POLICY IF EXISTS "dev_anon_objects_select" ON storage.objects;
-- CREATE POLICY "dev_anon_objects_select" ON storage.objects
-- FOR SELECT 
-- TO anon
-- USING (bucket_id = 'nevis-storage');

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname;

-- Show current user context (for debugging)
SELECT 
  auth.uid() as user_id,
  auth.role() as user_role,
  current_user as postgres_user;