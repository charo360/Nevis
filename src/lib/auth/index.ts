/**
 * Auth configuration stub for compatibility
 * This project uses Supabase Auth, not NextAuth
 * This file exists only for backward compatibility with legacy code
 */

import { NextAuthOptions } from 'next-auth';

// Stub authOptions for compatibility
// Note: This project uses Supabase Auth, not NextAuth
// Any code importing this should be migrated to use Supabase Auth
export const authOptions: NextAuthOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-compatibility',
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};

// Export JWT utilities from the main auth module
export * from './jwt';

