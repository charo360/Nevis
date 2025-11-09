# Crevo - AI-Powered Social Media Content Generator

Crevo is an advanced AI-powered platform for generating high-quality social media content with mongodb backend integration.

## 🚀 Quick Start for Developers

### 1. Environment Setup
```bash
# Copy environment template
cp .env.template .env.local

# Fill in your Firebase configuration in .env.local
```

### 2. Firebase Setup
See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase configuration instructions.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Test Database Connection
Visit `http://localhost:3000/debug-database` to test your Firebase setup.

## 📁 Key Files for Setup

- `.env.template` - Environment variables template
- `FIREBASE_SETUP.md` - Complete Firebase setup guide
- `DATABASE_IMPLEMENTATION.md` - Database architecture documentation

## 🔥 Features

- AI-powered content generation
- Firebase Authentication
- Firestore database with real-time sync
- Cloud storage for media files
- Data migration from localStorage
- Multi-platform content optimization

## 🛠️ Tech Stack

- Next.js 14
- Firebase/Firestore
- TypeScript
- Tailwind CSS
- AI Integration (OpenAI/Google AI)
