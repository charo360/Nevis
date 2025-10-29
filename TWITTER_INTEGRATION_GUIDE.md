# Twitter Integration Guide for Crevo

## ✅ **What's Been Implemented**

### 1. **Social Connect Page** (`/social-connect`)
- Professional UI matching the Brands page layout
- Real-time connection status
- Connect/Disconnect/Reconnect functionality
- Stats dashboard showing connected accounts
- Security & privacy information

### 2. **OAuth 2.0 Flow**
- **Start Route**: `/api/social/oauth/twitter/start`
- **Callback Route**: `/api/social/oauth/twitter/callback`
- **Connections API**: `/api/social/connections` (GET, POST, DELETE)

### 3. **Features**
- ✅ Secure OAuth 2.0 authentication with PKCE
- ✅ Token storage (encrypted in local JSON store)
- ✅ Connection management (connect, disconnect, reconnect)
- ✅ Real-time status updates
- ✅ Error handling and user feedback
- ✅ Responsive design (mobile, tablet, desktop)

---

## 🔐 **Required Environment Variables**

Add these to your `.env.local` file:

```bash
# Twitter/X API Credentials
TWITTER_CLIENT_ID=bUwxbjBHMFFlSms5aFVfZ2s1SU06MTpjaQ
TWITTER_CLIENT_SECRET=your_client_secret_here

# Optional but recommended
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_key_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## 🚀 **How to Test Twitter Integration**

### **Step 1: Ensure Twitter App is Configured**

Go to: https://developer.twitter.com/en/portal/dashboard

**Required Settings:**
1. **App Permissions**: Read and write
2. **Type of App**: Web App, Automated App or Bot (Confidential client)
3. **Callback URLs**:
   - `https://crevo.app/api/social/oauth/twitter/callback`
   - `http://localhost:3001/api/social/oauth/twitter/callback`
4. **Website URL**: `https://crevo.app` or `http://localhost:3001`

### **Step 2: Start Your Development Server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Server should be running at: `http://localhost:3001`

### **Step 3: Navigate to Social Connect Page**

1. Open your browser
2. Go to: `http://localhost:3001/social-connect`
3. You should see the Social Connect dashboard

### **Step 4: Connect Twitter Account**

1. Click the "Connect Twitter / X" button
2. You'll be redirected to Twitter's authorization page
3. Log in to Twitter (if not already logged in)
4. Review the permissions requested
5. Click "Authorize app"
6. You'll be redirected back to `/social-connect` with success message
7. Your Twitter account should now show as "Connected"

### **Step 5: Verify Connection**

Check that:
- ✅ Green "Connected" badge appears on Twitter card
- ✅ Your Twitter username is displayed (e.g., `@your_username`)
- ✅ "Reconnect" and "Disconnect" buttons are visible
- ✅ Success toast notification appeared

### **Step 6: Test Disconnect**

1. Click "Disconnect" button
2. Confirm you want to disconnect
3. Connection should be removed
4. Card should return to "Connect" state

---

## 📂 **File Structure**

```
src/
├── app/
│   ├── social-connect/
│   │   └── page.tsx                    # Main Social Connect UI
│   └── api/
│       └── social/
│           ├── providers/
│           │   └── route.ts            # Check which providers are configured
│           ├── connections/
│           │   └── route.ts            # Manage user connections (GET, POST, DELETE)
│           └── oauth/
│               └── twitter/
│                   ├── start/
│                   │   └── route.ts    # Initiate Twitter OAuth
│                   └── callback/
│                       └── route.ts    # Handle Twitter OAuth callback
└── components/
    └── layout/
        ├── app-sidebar.tsx             # Updated to enable Social Connect link
        ├── mobile-sidebar-trigger.tsx  # Mobile menu button
        └── desktop-sidebar-trigger.tsx # Desktop collapse button
```

---

## 🔧 **Temporary Storage**

The OAuth states and connections are stored in:
- `tmp/oauth-states.json` - OAuth states during authentication flow
- `tmp/social-connections.json` - User social media connections

**Note**: These are temporary files for development. In production, you should:
1. Use a proper database (PostgreSQL, MongoDB, etc.)
2. Encrypt tokens before storage
3. Implement token refresh logic
4. Add proper error handling and logging

---

## 🐛 **Troubleshooting**

### **Issue**: "Invalid callback URL"
**Solution**: 
- Verify callback URLs in Twitter Developer Portal match exactly
- Check `NEXT_PUBLIC_APP_URL` environment variable
- Ensure no trailing slashes in URLs

### **Issue**: "Invalid state"
**Solution**:
- The OAuth state might have expired
- Try connecting again
- Check if `tmp/oauth-states.json` exists and is writable

### **Issue**: "Unauthorized"
**Solution**:
- Verify `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are correct
- Check Twitter app has "Read and write" permissions
- Ensure user is logged into Crevo

### **Issue**: Connection not showing after authorization
**Solution**:
- Check browser console for errors
- Verify `/api/social/connections` endpoint is working
- Check if `tmp/social-connections.json` is being created

### **Issue**: "Failed to store connection"
**Solution**:
- Check if `tmp` directory exists and is writable
- Verify filesystem permissions
- Check server logs for detailed error messages

---

## 📝 **API Endpoints**

### **1. GET `/api/social/providers`**
Returns which social media providers are configured.

**Response:**
```json
{
  "providers": {
    "twitter": true,
    "facebook": false,
    "instagram": false,
    "linkedin": false
  }
}
```

### **2. GET `/api/social/oauth/twitter/start?userId={userId}`**
Initiates Twitter OAuth flow. Redirects to Twitter authorization page.

### **3. GET `/api/social/oauth/twitter/callback?code={code}&state={state}`**
Handles Twitter OAuth callback. Exchanges code for access token.

### **4. GET `/api/social/connections`**
Returns user's connected social media accounts.

**Headers:**
- `Authorization: Bearer {userId}`

**Response:**
```json
{
  "connections": [
    {
      "userId": "user_123",
      "platform": "twitter",
      "socialId": "1234567890",
      "profile": {
        "id": "1234567890",
        "name": "John Doe",
        "username": "johndoe"
      },
      "createdAt": "2025-10-29T12:00:00Z"
    }
  ]
}
```

### **5. POST `/api/social/connections`**
Creates or updates a social media connection.

**Headers:**
- `Authorization: Bearer {userId}`
- `Content-Type: application/json`

**Body:**
```json
{
  "platform": "twitter",
  "socialId": "1234567890",
  "accessToken": "encrypted_token",
  "refreshToken": "encrypted_refresh_token",
  "profile": {
    "id": "1234567890",
    "name": "John Doe",
    "username": "johndoe"
  }
}
```

### **6. DELETE `/api/social/connections?platform=twitter`**
Disconnects a social media account.

**Headers:**
- `Authorization: Bearer {userId}`

---

## 🎯 **Next Steps**

### **Phase 1: Complete (Twitter Connection)** ✅
- ✅ OAuth 2.0 implementation
- ✅ Connection management UI
- ✅ Token storage
- ✅ Error handling

### **Phase 2: Publishing (Next)**
- [ ] Create `/api/social/post` endpoint
- [ ] Add Twitter posting functionality
- [ ] Handle media uploads (images, videos)
- [ ] Implement error handling and retry logic

### **Phase 3: Integration with Existing Features**
- [ ] Add "Post to Twitter" button in Quick Content
- [ ] Add "Schedule to Twitter" in Content Calendar
- [ ] Implement multi-platform posting
- [ ] Add analytics dashboard

### **Phase 4: Additional Platforms**
- [ ] Facebook integration
- [ ] Instagram integration
- [ ] LinkedIn integration

---

## 🔒 **Security Considerations**

1. **Token Encryption**: Tokens should be encrypted before storage
2. **Token Refresh**: Implement refresh token logic for expired tokens
3. **Rate Limiting**: Add rate limiting to prevent API abuse
4. **Input Validation**: Validate all user inputs
5. **HTTPS Only**: Use HTTPS in production
6. **Secure Storage**: Move from JSON files to proper database
7. **Access Control**: Ensure users can only access their own connections

---

## 📊 **Testing Checklist**

- [ ] User can navigate to `/social-connect` page
- [ ] Twitter card shows "Connect" button
- [ ] Clicking "Connect" redirects to Twitter
- [ ] After authorizing, redirected back to Crevo
- [ ] Success message appears
- [ ] Twitter account shows as connected
- [ ] Username is displayed correctly
- [ ] "Reconnect" button works
- [ ] "Disconnect" button works
- [ ] Connection persists after page refresh
- [ ] Error messages display correctly
- [ ] Mobile layout works correctly
- [ ] Desktop layout works correctly

---

## 🆘 **Support**

If you encounter any issues:

1. Check the console for error messages
2. Verify all environment variables are set
3. Check Twitter Developer Portal settings
4. Review the troubleshooting section above
5. Check server logs in terminal

---

## 📚 **Resources**

- [Twitter API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)

---

**Built with ❤️ for Crevo** 🚀


