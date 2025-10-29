# Troubleshooting Guide for Social Media Integration

## 🔧 **Issue 1: SQL Trigger Already Exists**

### **Error**: `trigger "update_social_connections_updated_at" for relation "social_connections" already exists`

### **Solution**:
1. **Run the fix script** in Supabase SQL Editor:
   ```sql
   -- Copy and paste this into Supabase SQL Editor
   DROP TRIGGER IF EXISTS update_social_connections_updated_at ON social_connections;
   
   CREATE TRIGGER update_social_connections_updated_at 
     BEFORE UPDATE ON social_connections 
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
   ```

2. **Or run the complete fixed script**: `database/social_connections_table.sql` (updated version)

---

## 🔧 **Issue 2: 307 Redirect Error**

### **Error**: `GET /api/social/oauth/twitter/callback?state=...&code=... 307`

### **Possible Causes**:
1. **Missing userId**: OAuth start not receiving user ID
2. **Invalid state**: OAuth state expired or corrupted
3. **Database connection**: Failed to store connection data
4. **Redirect loop**: Incorrect callback URL configuration

### **Debugging Steps**:

#### **Step 1: Check Browser Console**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for error messages when clicking "Connect Twitter"
4. Check for: `Starting OAuth for provider: twitter User ID: [user_id]`

#### **Step 2: Check Server Logs**
1. Look at your terminal where `npm run dev` is running
2. Look for error messages during OAuth flow
3. Check for: `Storing Twitter connection for user: [user_id]`

#### **Step 3: Verify User Authentication**
1. Make sure you're logged in to Crevo
2. Check that `user.userId` exists in the console
3. If not, try logging out and logging back in

#### **Step 4: Check Database Connection**
1. Verify the `social_connections` table exists
2. Check that your Supabase credentials are correct
3. Ensure the table has the correct structure

---

## 🛠️ **Step-by-Step Fix**

### **1. Fix Database Trigger**
```sql
-- Run this in Supabase SQL Editor
DROP TRIGGER IF EXISTS update_social_connections_updated_at ON social_connections;
CREATE TRIGGER update_social_connections_updated_at 
  BEFORE UPDATE ON social_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **2. Add Encryption Key**
Add to your `.env.local`:
```bash
ENCRYPTION_KEY=your-32-character-secret-key-here
```

### **3. Restart Development Server**
```bash
# Stop the server (Ctrl+C)
npm run dev
# or
yarn dev
```

### **4. Test the Flow**
1. **Navigate to**: `http://localhost:3001/social-connect`
2. **Open Browser Console** (F12)
3. **Click**: "Connect Twitter / X"
4. **Check Console**: Should see "Starting OAuth for provider: twitter User ID: [id]"
5. **Complete OAuth**: Authorize on Twitter
6. **Check Console**: Should see "Successfully stored Twitter connection"

---

## 🔍 **Common Error Messages & Solutions**

### **"No userId provided in OAuth start"**
- **Cause**: User not authenticated or user ID missing
- **Solution**: Log out and log back in, or check authentication

### **"Invalid state"**
- **Cause**: OAuth state expired or corrupted
- **Solution**: Try connecting again, clear browser cache

### **"Failed to store connection"**
- **Cause**: Database error or missing encryption key
- **Solution**: Check database table exists, add encryption key

### **"No valid session"**
- **Cause**: Supabase session expired
- **Solution**: Log out and log back in

### **"Provider not configured"**
- **Cause**: Missing environment variables
- **Solution**: Check `.env.local` has all required API keys

---

## 📋 **Verification Checklist**

- [ ] Database table created successfully
- [ ] Trigger created without errors
- [ ] Encryption key added to `.env.local`
- [ ] All API keys configured
- [ ] User is logged in to Crevo
- [ ] Browser console shows no errors
- [ ] Server logs show successful OAuth flow
- [ ] Connection appears in database
- [ ] UI shows connection as successful

---

## 🚨 **Emergency Reset**

If nothing works, try this complete reset:

### **1. Clear All Data**
```sql
-- Run in Supabase SQL Editor
DROP TABLE IF EXISTS social_connections CASCADE;
```

### **2. Recreate Everything**
1. Run the complete `database/social_connections_table.sql`
2. Add encryption key to `.env.local`
3. Restart development server
4. Test connection

### **3. Check Environment Variables**
Make sure your `.env.local` has:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_KEY=your-32-character-key
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```

---

## 📞 **Still Having Issues?**

If you're still getting errors:

1. **Check the exact error message** in browser console
2. **Check server logs** for detailed error information
3. **Verify all environment variables** are set correctly
4. **Make sure you're logged in** to Crevo
5. **Try the emergency reset** above

**The most common issue is missing environment variables or database setup problems.**

