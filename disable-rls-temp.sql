-- TEMPORARY FIX: Disable RLS for Storage (Development Only)
-- ⚠️ WARNING: This removes security protection! Only use for development!

-- Disable RLS on storage.buckets
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Disable RLS on storage.objects  
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity, forcerlspolicy
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename IN ('buckets', 'objects');

-- To re-enable later (when you have proper policies):
-- ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;