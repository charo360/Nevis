-- Supabase Storage Policies - Run these in your Supabase Dashboard
-- Go to: Storage > Policies in your Supabase dashboard

-- First, remove any existing restrictive policies that might be blocking uploads
-- (You may need to delete these in the dashboard UI if they exist)

-- STORAGE OBJECTS POLICIES
-- These should be created via the Supabase Dashboard UI:

-- Policy 1: Allow service role full access to objects
-- Name: service_role_full_access
-- Operation: ALL
-- Target roles: service_role
-- Policy definition: true

-- Policy 2: Allow authenticated users to upload to nevis-storage
-- Name: authenticated_upload
-- Operation: INSERT  
-- Target roles: authenticated
-- Policy definition: bucket_id = 'nevis-storage'

-- Policy 3: Allow public read access to nevis-storage
-- Name: public_read_access
-- Operation: SELECT
-- Target roles: anon, authenticated
-- Policy definition: bucket_id = 'nevis-storage'

-- Policy 4: Allow users to update their own files
-- Name: user_update_own_files
-- Operation: UPDATE
-- Target roles: authenticated  
-- Policy definition: bucket_id = 'nevis-storage' AND auth.uid()::text = (storage.foldername(name))[1]

-- Policy 5: Allow users to delete their own files
-- Name: user_delete_own_files
-- Operation: DELETE
-- Target roles: authenticated
-- Policy definition: bucket_id = 'nevis-storage' AND auth.uid()::text = (storage.foldername(name))[1]

-- STORAGE BUCKETS POLICIES
-- These should also be created via the dashboard:

-- Policy 1: Allow service role to manage buckets
-- Name: service_role_buckets
-- Operation: ALL
-- Target roles: service_role
-- Policy definition: true

-- Policy 2: Allow authenticated users to view buckets
-- Name: authenticated_view_buckets
-- Operation: SELECT
-- Target roles: authenticated
-- Policy definition: true

-- NOTE: These policies should be created through the Supabase Dashboard UI
-- at: Dashboard > Storage > Policies
-- Do NOT run this as SQL - use the dashboard interface instead!