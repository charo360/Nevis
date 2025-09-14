# Fix Storage RLS Policy - Step by Step

## IMMEDIATE SOLUTION:

### Step 1: Delete All Existing Policies
Go to your Supabase Dashboard > Storage > Policies and:
1. Click on "nevis-storage" bucket
2. Delete ALL existing policies (all the "Give anon users access..." ones)

### Step 2: Create ONE Simple Policy
Create a new policy with these exact settings:

**Policy Name:** `allow_all_operations`
**Operation:** `ALL`
**Target Roles:** `anon, authenticated, service_role`
**Policy Definition:** `true`

### Step 3: Apply to Both Tables
Make sure to create this same policy for:
- storage.objects 
- storage.buckets

### Step 4: Alternative - Create via SQL Editor
If the UI doesn't work, go to SQL Editor and run:

```sql
-- Drop all existing policies first
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ix4wqf_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ix4wqf_1" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ix4wqf_2" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ix4wqf_3" ON storage.objects;

-- Create simple permissive policy
CREATE POLICY "allow_all_operations" ON storage.objects
FOR ALL TO anon, authenticated, service_role
USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_bucket_operations" ON storage.buckets  
FOR ALL TO anon, authenticated, service_role
USING (true) WITH CHECK (true);
```

This will allow all operations for everyone - perfect for development.