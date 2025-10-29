# Social Media Database Setup

## 🎯 **Current Status**
- ❌ **No database storage** - using temporary JSON files
- ⚠️ **Security risk** - tokens stored in plain text
- ❌ **Not persistent** - data lost on server restart

## 🚀 **Recommended Solution: Supabase Database**

### **Step 1: Create Database Table**

Run this SQL in your Supabase SQL Editor:

```sql
-- Create social_connections table
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  social_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one connection per user per platform
  UNIQUE(user_id, platform)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);

-- Enable Row Level Security
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own connections
CREATE POLICY "Users can manage their own social connections" ON social_connections
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_social_connections_updated_at 
  BEFORE UPDATE ON social_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **Step 2: Update API to Use Database**

Replace the JSON file storage with Supabase database calls:

```typescript
// Example implementation
export async function POST(req: Request) {
  try {
    // ... authentication code ...
    
    const { platform, socialId, accessToken, refreshToken, profile } = await req.json();
    
    // Store in Supabase database
    const { data, error } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        platform,
        social_id: socialId,
        access_token: accessToken, // Consider encrypting this
        refresh_token: refreshToken,
        profile_data: profile,
        expires_at: null, // Set based on token expiry
      })
      .select();
      
    if (error) {
      throw new Error(error.message);
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### **Step 3: Add Token Encryption (Recommended)**

For security, encrypt tokens before storing:

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key';
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## 📋 **Implementation Checklist**

- [ ] Create `social_connections` table in Supabase
- [ ] Set up Row Level Security policies
- [ ] Update `/api/social/connections` to use database
- [ ] Add token encryption for security
- [ ] Test database storage and retrieval
- [ ] Remove JSON file storage code
- [ ] Add proper error handling
- [ ] Test with multiple users

---

## 🔒 **Security Benefits**

1. **Encrypted Storage**: Tokens encrypted before database storage
2. **Row Level Security**: Users can only access their own data
3. **Automatic Cleanup**: Data deleted when user account is deleted
4. **Audit Trail**: Created/updated timestamps for tracking
5. **Scalable**: Handles multiple users and platforms

---

## 🚀 **Next Steps**

1. **Create the database table** (run the SQL above)
2. **Update the API** to use Supabase instead of JSON files
3. **Add encryption** for sensitive data
4. **Test the implementation**
5. **Deploy to production**

Would you like me to implement the database storage solution for you?

