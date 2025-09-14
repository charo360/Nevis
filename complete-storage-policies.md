# Complete Supabase Storage Policies for Upload Functionality

You need to add these policies in your Supabase Dashboard > Storage > Policies:

## FOR STORAGE.OBJECTS TABLE:

### Policy 1: Allow Service Role ALL Operations
- **Name**: `service_role_all_access`
- **Operation**: `ALL`
- **Target Roles**: `service_role`  
- **Policy Definition**: `true`

### Policy 2: Allow INSERT (Upload) for Everyone
- **Name**: `allow_upload_to_nevis_storage`
- **Operation**: `INSERT`
- **Target Roles**: `anon, authenticated, service_role`
- **Policy Definition**: `bucket_id = 'nevis-storage'`

### Policy 3: Allow SELECT (Read) for Everyone  
- **Name**: `allow_read_from_nevis_storage`
- **Operation**: `SELECT`
- **Target Roles**: `anon, authenticated, service_role`
- **Policy Definition**: `bucket_id = 'nevis-storage'`

## FOR STORAGE.BUCKETS TABLE:

### Policy 1: Allow Service Role ALL Operations
- **Name**: `service_role_buckets_access`
- **Operation**: `ALL`
- **Target Roles**: `service_role`
- **Policy Definition**: `true`

### Policy 2: Allow SELECT (View) Buckets
- **Name**: `allow_view_buckets`
- **Operation**: `SELECT` 
- **Target Roles**: `anon, authenticated, service_role`
- **Policy Definition**: `true`

## IMPORTANT:
1. Make sure to add ALL these policies
2. The INSERT policy is crucial for uploads to work
3. The service_role policies ensure your API can bypass restrictions