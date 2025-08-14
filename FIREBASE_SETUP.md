# Firebase Setup Guide for Developers

This guide will help you set up Firebase for the Nevis project on your local development environment.

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Access to the Firebase project or ability to create a new one

## Step 1: Firebase Project Setup

### Option A: Join Existing Project
1. Contact the project admin to be added to the Firebase project
2. Get the project ID: `localbuzz-mpkuv` (or current project ID)

### Option B: Create New Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard
4. Enable Authentication, Firestore, and Storage

## Step 2: Environment Configuration

1. **Copy the environment template:**
   ```bash
   cp .env.template .env.local
   ```

2. **Get Firebase Web App Configuration:**
   - Go to Firebase Console → Project Settings → General
   - Scroll to "Your apps" section
   - Click on the web app or create one
   - Copy the config values to `.env.local`

3. **Get Firebase Admin SDK Configuration:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Either:
     - Extract values and add to `.env.local`, OR
     - Save the JSON file securely and set the path in `.env.local`

## Step 3: Firebase Services Setup

### Authentication
1. Go to Firebase Console → Authentication
2. Enable Sign-in methods you want to use:
   - Email/Password
   - Google
   - Anonymous (for testing)

### Firestore Database
1. Go to Firebase Console → Firestore Database
2. Create database in production mode
3. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. Deploy indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Storage
1. Go to Firebase Console → Storage
2. Get started with default settings
3. Deploy storage rules:
   ```bash
   firebase deploy --only storage
   ```

## Step 4: Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Test database connection:**
   - Go to `http://localhost:3000/debug-database`
   - Run the database tests
   - Check browser console for connection status

## Step 5: Firebase CLI Setup

1. **Login to Firebase:**
   ```bash
   firebase login
   ```

2. **Initialize project (if needed):**
   ```bash
   firebase init
   ```
   - Select Firestore, Storage, and Hosting
   - Use existing project
   - Accept default settings

3. **Deploy to Firebase:**
   ```bash
   firebase deploy
   ```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | Yes |
| `FIREBASE_PROJECT_ID` | Server-side Project ID | Yes |
| `FIREBASE_CLIENT_EMAIL` | Service Account Email | Yes |
| `FIREBASE_PRIVATE_KEY` | Service Account Private Key | Yes |

## Security Best Practices

1. **Never commit `.env.local` or service account keys**
2. **Use environment-specific Firebase projects**
3. **Regularly rotate service account keys**
4. **Review Firestore security rules regularly**
5. **Monitor Firebase usage and costs**

## Troubleshooting

### Common Issues

1. **"Permission denied" errors:**
   - Check Firestore security rules
   - Verify user authentication
   - Ensure proper project permissions

2. **"Firebase not initialized" errors:**
   - Verify environment variables are set
   - Check Firebase config in `src/lib/firebase/config.ts`

3. **"Index not found" errors:**
   - Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
   - Wait for indexes to build (can take several minutes)

### Debug Tools

- Visit `/debug-database` for database connection testing
- Check browser console for detailed error messages
- Use Firebase Console to monitor database activity

## Support

For additional help:
1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Review the project's `DATABASE_IMPLEMENTATION.md`
3. Contact the development team
