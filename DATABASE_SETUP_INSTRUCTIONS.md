# Database Setup Instructions for Social Media Connections

## 🎯 **What We've Implemented**

✅ **Database Storage**: Social media connections now stored in Supabase database  
✅ **User References**: Properly linked to user accounts via `user_id`  
✅ **Token Encryption**: Access tokens encrypted before storage  
✅ **Row Level Security**: Users can only access their own connections  
✅ **Automatic Cleanup**: Data deleted when user account is deleted  

---

## 🗄️ **Step 1: Create Database Table**

### **Option A: Using Supabase Dashboard (Recommended)**

1. **Go to your Supabase project dashboard**
2. **Navigate to**: SQL Editor
3. **Copy and paste** the contents of `database/social_connections_table.sql`
4. **Click "Run"** to execute the SQL

### **Option B: Using Supabase CLI**

```bash
# If you have Supabase CLI installed
supabase db reset
# Then run the SQL file
```

---

## 🔐 **Step 2: Add Encryption Key**

Add this to your `.env.local` file:

```bash
# Add this line to your .env.local
ENCRYPTION_KEY=your-32-character-secret-key-here-change-this
```

**Generate a secure key:**
```bash
# Generate a random 32-character key
openssl rand -hex 16
# or
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 🧪 **Step 3: Test the Implementation**

### **Test Database Connection**
1. **Start your dev server**: `npm run dev`
2. **Navigate to**: `http://localhost:3001/social-connect`
3. **Connect Twitter**: Click "Connect Twitter / X"
4. **Authorize**: Complete Twitter OAuth flow
5. **Verify**: Check that connection appears in UI

### **Verify Database Storage**
1. **Go to Supabase Dashboard**
2. **Navigate to**: Table Editor
3. **Select**: `social_connections` table
4. **Check**: Your connection data should be there
5. **Verify**: Tokens are encrypted (not plain text)

---

## 📊 **Database Schema**

The `social_connections` table has these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users(id)` |
| `platform` | VARCHAR(50) | Platform name (twitter, facebook, etc.) |
| `social_id` | VARCHAR(255) | User ID on social platform |
| `access_token` | TEXT | Encrypted OAuth access token |
| `refresh_token` | TEXT | Encrypted OAuth refresh token |
| `expires_at` | TIMESTAMP | Token expiration (if applicable) |
| `profile_data` | JSONB | User profile data from platform |
| `created_at` | TIMESTAMP | When connection was created |
| `updated_at` | TIMESTAMP | When connection was last updated |

---

## 🔒 **Security Features**

### **1. Row Level Security (RLS)**
- Users can only access their own connections
- Automatic data isolation between users
- No cross-user data leakage possible

### **2. Token Encryption**
- Access tokens encrypted with AES-256-GCM
- Refresh tokens encrypted before storage
- Encryption key stored in environment variables

### **3. Automatic Cleanup**
- Data deleted when user account is deleted
- Foreign key constraint ensures data integrity
- No orphaned records left behind

---

## 🚀 **What Happens Now**

### **When User Connects Twitter:**
1. ✅ OAuth flow completes successfully
2. ✅ Connection data saved to database
3. ✅ Tokens encrypted before storage
4. ✅ User ID properly linked
5. ✅ UI shows connection status

### **When User Disconnects:**
1. ✅ Connection removed from database
2. ✅ UI updates immediately
3. ✅ No data left behind

### **When User Deletes Account:**
1. ✅ All social connections automatically deleted
2. ✅ No orphaned data in database
3. ✅ Complete data cleanup

---

## 🐛 **Troubleshooting**

### **Issue**: "Table doesn't exist"
**Solution**: Run the SQL script in Supabase SQL Editor

### **Issue**: "Encryption key too short"
**Solution**: Generate a 32-character key and add to `.env.local`

### **Issue**: "Failed to save connection"
**Solution**: Check Supabase service role key is correct

### **Issue**: "Unauthorized" errors
**Solution**: Verify user authentication is working

---

## 📈 **Benefits of Database Storage**

1. **Persistent**: Data survives server restarts
2. **Scalable**: Works with multiple server instances
3. **Secure**: Encrypted tokens + RLS protection
4. **Reliable**: ACID transactions and data integrity
5. **Queryable**: Easy to search and filter connections
6. **Backup**: Automatic backups with Supabase
7. **Audit**: Track when connections were created/updated

---

## ✅ **Verification Checklist**

- [ ] Database table created successfully
- [ ] Encryption key added to `.env.local`
- [ ] Twitter connection works end-to-end
- [ ] Data appears in Supabase table
- [ ] Tokens are encrypted (not plain text)
- [ ] Disconnect functionality works
- [ ] No errors in browser console
- [ ] No errors in server logs

---

## 🎉 **You're All Set!**

Your social media connections are now:
- ✅ **Stored in database** (not temporary files)
- ✅ **Linked to user accounts** (proper foreign keys)
- ✅ **Encrypted and secure** (AES-256 encryption)
- ✅ **Production ready** (scalable and reliable)

**Test it out by connecting your Twitter account!** 🚀

