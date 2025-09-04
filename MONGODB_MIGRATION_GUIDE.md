# Firebase to MongoDB Migration Guide

This guide outlines the complete migration from Firebase to MongoDB for the Nevis AI application.

## 🎯 Migration Overview

The migration replaces:
- **Firebase Authentication** → **JWT-based authentication**
- **Firestore Database** → **MongoDB with Mongoose**
- **Firebase Storage** → **GridFS (MongoDB file storage)**
- **Firebase Admin SDK** → **MongoDB native driver**

## 📋 Migration Checklist

### ✅ Completed Components

#### 1. Database Setup
- [x] MongoDB connection configuration (`src/lib/mongodb/config.ts`)
- [x] MongoDB schemas with Mongoose (`src/lib/mongodb/schemas.ts`)
- [x] Database service layer (`src/lib/mongodb/database.ts`)
- [x] GridFS storage service (`src/lib/mongodb/storage.ts`)

#### 2. Authentication System
- [x] JWT authentication utilities (`src/lib/auth/jwt.ts`)
- [x] New authentication hook (`src/hooks/use-auth.ts`)
- [x] Authentication API routes:
  - [x] `/api/auth/register`
  - [x] `/api/auth/login`
  - [x] `/api/auth/anonymous`
  - [x] `/api/auth/verify`
  - [x] `/api/auth/refresh`

#### 3. MongoDB Services
- [x] Brand profile service (`src/lib/mongodb/services/brand-profile-service.ts`)
- [x] Generated post service (`src/lib/mongodb/services/generated-post-service.ts`)
- [x] File serving API (`src/app/api/files/[fileId]/route.ts`)

#### 4. React Components
- [x] MongoDB authentication wrapper (`src/components/auth/auth-wrapper-mongo.tsx`)
- [x] MongoDB brand context (`src/contexts/brand-context-mongo.tsx`)
- [x] MongoDB brand wizard (`src/components/cbrand/cbrand-wizard-mongo.tsx`)
- [x] MongoDB quick content page (`src/app/quick-content-mongo/page.tsx`)
- [x] MongoDB brand profile page (`src/app/brand-profile-mongo/page.tsx`)

#### 5. Updated API Routes
- [x] `/api/auth/check-session` - Updated to use MongoDB
- [x] `/api/auth/heartbeat` - Updated to use MongoDB

### 🔄 Manual Migration Steps Required

#### Step 1: Update Environment Variables
Your `.env.local` already has the MongoDB connection string. Ensure these are set:

```env
# MongoDB Database Connection
DATABASE=mongodb+srv://sam_db_user:charo2020@crevo.2oj6kxb.mongodb.net/?retryWrites=true&w=majority&appName=Crevo

# JWT Authentication Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-nevis-ai-2024
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
```

#### Step 2: Install MongoDB Dependencies
```bash
cd Nevis
npm install mongodb mongoose @types/mongodb jsonwebtoken bcryptjs @types/jsonwebtoken @types/bcryptjs
```

#### Step 3: Update Main Layout
Replace your current `src/app/layout.tsx` with the MongoDB version:

```bash
# Backup current layout
mv src/app/layout.tsx src/app/layout-firebase-backup.tsx

# Use MongoDB layout
mv src/app/layout-mongo.tsx src/app/layout.tsx
```

#### Step 4: Update Component Imports
Update your main pages to use MongoDB components:

1. **Quick Content Page**: Replace imports to use MongoDB services
2. **Brand Profile Page**: Use the MongoDB brand wizard
3. **Dashboard**: Update to use MongoDB brand context

#### Step 5: Update API Routes
The following API routes need to be updated to use MongoDB:

- [ ] `/api/artifacts/route.ts` - Update to use MongoDB storage
- [ ] `/api/social-media-expert/route.ts` - Update to use MongoDB services
- [ ] `/api/brand-profiles/*` - Update all brand profile endpoints
- [ ] `/api/generated-posts/*` - Update all generated post endpoints

#### Step 6: Test the Migration
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test key functionality:
   - [ ] User registration/login
   - [ ] Anonymous user creation
   - [ ] Brand profile creation/editing
   - [ ] Content generation
   - [ ] File uploads
   - [ ] Data persistence

#### Step 7: Clean Up Firebase Dependencies
Run the cleanup script:
```bash
node scripts/remove-firebase-deps.js
npm install  # Update package-lock.json
```

## 🔧 Key Differences

### Authentication
- **Before**: Firebase Auth with ID tokens
- **After**: JWT tokens with refresh token rotation

### Database Operations
- **Before**: Firestore collections and documents
- **After**: MongoDB collections with Mongoose schemas

### File Storage
- **Before**: Firebase Storage with download URLs
- **After**: GridFS with API endpoints (`/api/files/[fileId]`)

### User Sessions
- **Before**: Firebase Auth session management
- **After**: JWT-based sessions with MongoDB storage

## 🚨 Important Notes

1. **Data Migration**: This migration creates a new database structure. You'll need to migrate existing Firebase data to MongoDB if you have production data.

2. **Authentication**: Users will need to re-register or sign in again as the authentication system has changed.

3. **File URLs**: Existing Firebase Storage URLs will no longer work. Files need to be re-uploaded to GridFS.

4. **API Compatibility**: Some API endpoints may have slightly different request/response formats.

## 🔍 Testing Checklist

### Authentication Testing
- [ ] User registration with email/password
- [ ] User login with email/password
- [ ] Anonymous user creation
- [ ] Token refresh functionality
- [ ] Session management and expiration

### Brand Profile Testing
- [ ] Create new brand profile
- [ ] Edit existing brand profile
- [ ] Delete brand profile
- [ ] Brand profile persistence
- [ ] Multiple brand profiles per user

### Content Generation Testing
- [ ] Generate social media posts
- [ ] Save generated content
- [ ] Load generated content history
- [ ] Image generation and storage
- [ ] Content with brand profile integration

### File Storage Testing
- [ ] Upload brand logos
- [ ] Upload design examples
- [ ] Generate and store AI images
- [ ] File serving via API
- [ ] File deletion

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Check your connection string in `.env.local`
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify database user permissions

2. **JWT Token Issues**
   - Ensure `JWT_SECRET` is set in environment variables
   - Check token expiration settings
   - Verify token format in API requests

3. **File Upload Issues**
   - Check GridFS bucket configuration
   - Verify file size limits
   - Ensure proper content-type handling

4. **Schema Validation Errors**
   - Check Mongoose schema definitions
   - Verify required fields are provided
   - Ensure data types match schema

## 📞 Support

If you encounter issues during migration:
1. Check the console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB connection is working
4. Test individual components in isolation

## 🎉 Post-Migration

After successful migration:
1. Update your deployment configuration
2. Set up MongoDB backups
3. Monitor application performance
4. Update documentation for your team
5. Consider implementing data migration scripts for production data
