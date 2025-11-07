# Update Supabase Storage Bucket to 50MB

## Overview

The file size limit has been increased from 10MB to 50MB to accommodate larger business documents. You need to update your existing Supabase storage bucket configuration.

## Changes Made in Code

✅ Updated all file size limits from 10MB to 50MB:
- `src/components/documents/document-upload-zone.tsx` - Default maxFileSize
- `src/components/cbrand/steps/brand-details-step.tsx` - Component prop
- `src/app/api/documents/upload/route.ts` - API validation
- `src/types/documents.ts` - Default validation rules
- `src/app/api/documents/init-storage/route.ts` - Bucket creation
- `src/lib/services/supabase-service.ts` - Service initialization
- `src/lib/supabase/schema.sql` - Database schema
- Documentation files updated

## Manual Update Required

You need to update your existing Supabase bucket configuration:

### Option 1: Update via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/nrfceylvtiwpqsoxurrv/storage/buckets

2. **Edit the nevis-storage bucket**
   - Click the three dots (•••) next to `nevis-storage` bucket
   - Select "Edit bucket"

3. **Update File Size Limit**
   - Change "File size limit" from `10 MB` to `50 MB`
   - Or enter: `52428800` bytes

4. **Save Changes**
   - Click "Save" or "Update bucket"

### Option 2: Update via SQL (Alternative)

If you have access to the SQL editor in Supabase:

```sql
-- Update the file size limit for nevis-storage bucket
UPDATE storage.buckets 
SET file_size_limit = 52428800 
WHERE id = 'nevis-storage';
```

### Option 3: Recreate Bucket (Last Resort)

If the above options don't work, you can recreate the bucket:

⚠️ **Warning**: This will delete all existing files in the bucket!

1. **Backup existing files** (if any)
2. **Delete the bucket** via Supabase Dashboard
3. **Run the initialization endpoint**:
   ```bash
   curl -X POST http://localhost:3001/api/documents/init-storage
   ```

This will create a new bucket with the 50MB limit.

## Verification

After updating, verify the change:

1. **Test the storage endpoint**:
   ```bash
   curl http://localhost:3001/api/documents/test-storage
   ```

2. **Try uploading a large file**:
   - Upload a document between 10MB and 50MB
   - It should now succeed

3. **Check the bucket settings**:
   - In Supabase Dashboard, verify the file size limit shows 50MB

## File Size Limits Summary

| Component | Old Limit | New Limit |
|-----------|-----------|-----------|
| Supabase Bucket | 10MB | 50MB |
| Upload API | 10MB | 50MB |
| Component Default | 10MB | 50MB |
| OpenAI Service | 50MB | 50MB (unchanged) |

## Benefits

- ✅ Support for larger business documents
- ✅ Accommodate detailed presentations and reports
- ✅ Handle high-resolution product catalogs
- ✅ Accept comprehensive pricing sheets
- ✅ Better alignment with OpenAI's 50MB limit

## Notes

- The 50MB limit is still conservative compared to OpenAI's 512MB maximum
- Larger files will take longer to upload and process
- Consider file compression for very large documents
- Monitor storage usage and costs in Supabase dashboard

## Troubleshooting

### Issue: Upload still fails with "File size exceeds 10MB limit"

**Solution**: 
- Clear browser cache
- Restart the dev server
- Verify bucket settings in Supabase Dashboard

### Issue: Bucket update doesn't save

**Solution**:
- Check your Supabase plan limits
- Verify you have admin permissions
- Try using SQL update method instead

### Issue: Files upload but OpenAI processing fails

**Solution**:
- This is a separate issue from file size
- Check OpenAI API key configuration
- Verify assistant IDs are set
- Check console logs for specific error

## Next Steps

1. ✅ Update Supabase bucket settings (see above)
2. ✅ Test with a 20-30MB document
3. ✅ Verify upload and processing work end-to-end
4. ✅ Monitor performance with larger files

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify Supabase bucket settings
4. Test with smaller files first (5-10MB)
5. Gradually increase file size to identify limits

